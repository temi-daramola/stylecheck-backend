export const GeminiConstants = Object.freeze({
  API_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  GENERATE_PATH_SUFFIX: ':generateContent',
  API_KEY_HEADER: 'x-goog-api-key',
  TEMPERATURE: 0.1,
  RESPONSE_MIME_TYPE: 'application/json',
  // The model can take 10 to 40 seconds, so a single attempt gets a generous limit.
  REQUEST_TIMEOUT_MS: 90000,
  // Same model, retried once after a pause; then one try on the fallback model (separate quota).
  RETRY_DELAY_MS: 2000,
  MAX_QUOTA_WAIT_MS: 25000,
  RETRYABLE_STATUSES: Object.freeze([429, 500, 503]),
  QUOTA_STATUS: 429,
  BUSY_STATUS: 503,
  RETRY_HINT_PATTERN: /retry in ([\d.]+)s/i,
  MESSAGES: Object.freeze({
    BUSY: 'The AI service is busy right now. Please try again in a moment.',
    QUOTA: 'The AI service usage limit was reached. Please wait about a minute and try again.',
    REQUEST_FAILED: 'The AI service could not process the request.',
    TIMEOUT: 'The AI service took too long to respond. Please try again.',
    EMPTY_RESPONSE: 'The AI service returned an empty response.',
    INVALID_JSON: 'The AI service returned a response that could not be read.',
    ATTEMPT_FAILED_LOG: 'Gemini request attempt failed',
  }),
});
