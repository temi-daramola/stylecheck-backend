export const GeminiConstants = Object.freeze({
  API_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  GENERATE_PATH_SUFFIX: ':generateContent',
  API_KEY_HEADER: 'x-goog-api-key',
  TEMPERATURE: 0.1,
  RESPONSE_MIME_TYPE: 'application/json',
  REQUEST_TIMEOUT_MS: 60000,
  HTTP_TOO_MANY_REQUESTS: 429,
  MESSAGES: Object.freeze({
    BUSY: 'The AI service is busy right now. Please try again in a moment.',
    REQUEST_FAILED: 'The AI service could not process the request.',
    TIMEOUT: 'The AI service took too long to respond. Please try again.',
    EMPTY_RESPONSE: 'The AI service returned an empty response.',
    INVALID_JSON: 'The AI service returned a response that could not be read.',
  }),
});
