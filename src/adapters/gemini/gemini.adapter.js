import { env } from '@common/constants/env.constants.js';
import { Layer } from '@common/constants/layer.constants.js';
import { http } from '@common/constants/http.constants.js';
import { ExternalServiceError } from '@common/errors/subclasses.js';
import { GeminiConstants } from '@adapters/gemini/gemini.constants.js';

const { MESSAGES } = GeminiConstants;

const buildUrl = () =>
  `${GeminiConstants.API_BASE_URL}/models/${env.GEMINI_MODEL}${GeminiConstants.GENERATE_PATH_SUFFIX}`;

const buildBody = (prompt) => ({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: GeminiConstants.TEMPERATURE,
    responseMimeType: GeminiConstants.RESPONSE_MIME_TYPE,
  },
});

const externalError = (message, statusCode, cause) =>
  new ExternalServiceError(message, { layer: Layer.EXTERNAL_API, statusCode, cause });

const sendRequest = async (prompt) => {
  try {
    return await fetch(buildUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [GeminiConstants.API_KEY_HEADER]: env.GEMINI_API_KEY,
      },
      body: JSON.stringify(buildBody(prompt)),
      signal: AbortSignal.timeout(GeminiConstants.REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw externalError(
      isTimeout ? MESSAGES.TIMEOUT : MESSAGES.REQUEST_FAILED,
      http.STATUS_CODES.SERVICE_UNAVAILABLE,
      error
    );
  }
};

export const geminiAdapter = Object.freeze({
  /**
   * Sends a prompt and returns the model's response parsed as JSON.
   * Throws ExternalServiceError on any transport, status, or parsing failure.
   */
  generateJson: async (prompt) => {
    const response = await sendRequest(prompt);

    if (!response.ok) {
      const isBusy = response.status === GeminiConstants.HTTP_TOO_MANY_REQUESTS;
      throw externalError(
        isBusy ? MESSAGES.BUSY : MESSAGES.REQUEST_FAILED,
        isBusy ? http.STATUS_CODES.SERVICE_UNAVAILABLE : http.STATUS_CODES.BAD_GATEWAY,
        new Error(`Gemini responded with HTTP ${response.status}`)
      );
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw externalError(MESSAGES.EMPTY_RESPONSE, http.STATUS_CODES.BAD_GATEWAY, null);
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw externalError(MESSAGES.INVALID_JSON, http.STATUS_CODES.BAD_GATEWAY, error);
    }
  },
});
