import { env } from '@common/constants/env.constants.js';
import { Layer } from '@common/constants/layer.constants.js';
import { http } from '@common/constants/http.constants.js';
import { ExternalServiceError } from '@common/errors/subclasses.js';

const SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const API_KEY_HEADER = 'api-key';
const TIMEOUT_MS = 30000;
const BASE64 = 'base64';
const MESSAGES = Object.freeze({
  SEND_FAILED: 'The email could not be sent. Please try again.',
  TIMEOUT: 'The email service took too long to respond. Please try again.',
});

const externalError = (message, statusCode, cause) =>
  new ExternalServiceError(message, { layer: Layer.EXTERNAL_API, statusCode, cause });

export const brevoAdapter = Object.freeze({
  /**
   * Sends one transactional email. `attachment` is optional: { name, content: Buffer }.
   */
  sendEmail: async ({ to, subject, htmlContent, attachment }) => {
    const body = {
      sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent,
      ...(attachment && {
        attachment: [{ name: attachment.name, content: attachment.content.toString(BASE64) }],
      }),
    };

    let response;
    try {
      response = await fetch(SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [API_KEY_HEADER]: env.BREVO_API_KEY },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
      throw externalError(
        isTimeout ? MESSAGES.TIMEOUT : MESSAGES.SEND_FAILED,
        http.STATUS_CODES.SERVICE_UNAVAILABLE,
        error
      );
    }

    if (!response.ok) {
      throw externalError(
        MESSAGES.SEND_FAILED,
        http.STATUS_CODES.BAD_GATEWAY,
        new Error(`Brevo responded with HTTP ${response.status}`)
      );
    }
  },
});
