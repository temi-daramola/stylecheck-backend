import { env } from '@common/constants/env.constants.js';
import { Layer } from '@common/constants/layer.constants.js';
import { http } from '@common/constants/http.constants.js';
import { ExternalServiceError } from '@common/errors/subclasses.js';
import { GeminiConstants } from '@adapters/gemini/gemini.constants.js';
import { logger } from '@adapters/logging/pino.logger.js';

const { MESSAGES, RETRYABLE_STATUSES, QUOTA_STATUS, BUSY_STATUS, RETRY_DELAY_MS, MAX_QUOTA_WAIT_MS, RETRY_HINT_PATTERN } = GeminiConstants;
const MS_PER_SECOND = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildUrl = (model) => `${GeminiConstants.API_BASE_URL}/models/${model}${GeminiConstants.GENERATE_PATH_SUFFIX}`;

const buildBody = (prompt) => ({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: GeminiConstants.TEMPERATURE,
    responseMimeType: GeminiConstants.RESPONSE_MIME_TYPE,
    ...(env.GEMINI_THINKING_LEVEL && { thinkingConfig: { thinkingLevel: env.GEMINI_THINKING_LEVEL } }),
  },
});

/** One failed attempt: the safe error for the client, whether trying again could help, and any wait Google asked for. */
const failure = ({ message, statusCode, causeMessage, retryable, waitMs = 0 }) => ({
  retryable,
  waitMs,
  causeMessage,
  error: new ExternalServiceError(message, { layer: Layer.EXTERNAL_API, statusCode, cause: new Error(causeMessage) }),
});

const messageForStatus = (status) => {
  if (status === QUOTA_STATUS) return { message: MESSAGES.QUOTA, statusCode: http.STATUS_CODES.SERVICE_UNAVAILABLE };
  if (status === BUSY_STATUS) return { message: MESSAGES.BUSY, statusCode: http.STATUS_CODES.SERVICE_UNAVAILABLE };
  return { message: MESSAGES.REQUEST_FAILED, statusCode: http.STATUS_CODES.BAD_GATEWAY };
};

const attempt = async (prompt, model) => {
  let response;
  try {
    response = await fetch(buildUrl(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [GeminiConstants.API_KEY_HEADER]: env.GEMINI_API_KEY },
      body: JSON.stringify(buildBody(prompt)),
      signal: AbortSignal.timeout(GeminiConstants.REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw failure({
      message: isTimeout ? MESSAGES.TIMEOUT : MESSAGES.REQUEST_FAILED,
      statusCode: http.STATUS_CODES.SERVICE_UNAVAILABLE,
      causeMessage: `Network error (${model}): ${error?.name}: ${error?.message}`,
      retryable: true,
    });
  }

  if (!response.ok) {
    // Keep Google's own explanation for the logs; the client only ever sees our safe message.
    const body = await response.json().catch(() => ({}));
    const upstream = `${body?.error?.status ?? ''} ${body?.error?.message ?? ''}`.trim();
    const hint = RETRY_HINT_PATTERN.exec(upstream);
    throw failure({
      ...messageForStatus(response.status),
      causeMessage: `Gemini HTTP ${response.status} (${model}): ${upstream}`,
      retryable: RETRYABLE_STATUSES.includes(response.status),
      waitMs: hint ? Math.min(Math.ceil(Number(hint[1]) * MS_PER_SECOND) + MS_PER_SECOND, MAX_QUOTA_WAIT_MS) : 0,
    });
  }

  const payload = await response.json();
  const finishReason = payload?.candidates?.[0]?.finishReason;
  // Skip any "thought" parts a thinking model may include; take the actual answer.
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.find((part) => part.text && !part.thought)?.text;
  if (!text) {
    throw failure({
      message: MESSAGES.EMPTY_RESPONSE,
      statusCode: http.STATUS_CODES.BAD_GATEWAY,
      causeMessage: `Empty Gemini response (${model}, finishReason=${finishReason})`,
      retryable: true,
    });
  }

  try {
    return JSON.parse(text);
  } catch {
    throw failure({
      message: MESSAGES.INVALID_JSON,
      statusCode: http.STATUS_CODES.BAD_GATEWAY,
      causeMessage: `Gemini returned invalid JSON (${model}, finishReason=${finishReason}, ${text.length} chars)`,
      retryable: true,
    });
  }
};

// Primary model, the primary again after a pause, then the fallback (its quota is separate).
const planAttempts = () => {
  const plan = [env.GEMINI_MODEL, env.GEMINI_MODEL];
  if (env.GEMINI_FALLBACK_MODEL && env.GEMINI_FALLBACK_MODEL !== env.GEMINI_MODEL) plan.push(env.GEMINI_FALLBACK_MODEL);
  return plan;
};

export const geminiAdapter = Object.freeze({
  /**
   * Sends a prompt and returns the model's response parsed as JSON. Transient failures (rate limit,
   * overload, network, unreadable output) are retried, then the fallback model is tried. Every failed
   * attempt is logged with Google's real explanation. Throws ExternalServiceError when out of attempts.
   */
  generateJson: async (prompt) => {
    const plan = planAttempts();
    let last;

    for (let index = 0; index < plan.length; index += 1) {
      try {
        return await attempt(prompt, plan[index]);
      } catch (caught) {
        if (!caught?.error) throw caught;
        last = caught;
        const isLast = index === plan.length - 1;
        logger.warn(
          { attempt: index + 1, of: plan.length, model: plan[index], cause: caught.causeMessage, willRetry: !isLast },
          MESSAGES.ATTEMPT_FAILED_LOG
        );
        if (isLast) break;
        // Same model again: wait (as long as Google asked for, within a cap). A different model needs no wait.
        const sameModelNext = plan[index + 1] === plan[index];
        if (sameModelNext) await sleep(caught.waitMs || RETRY_DELAY_MS);
      }
    }
    throw last.error;
  },
});
