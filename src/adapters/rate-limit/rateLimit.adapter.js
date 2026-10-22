import rateLimit from 'express-rate-limit';
import { currentReqId } from '@common/context/requestContext.js';
import { http } from '@common/constants/http.constants.js';

const TOO_MANY_REQUESTS = 429;
const RATE_LIMITED_CODE = 'RATE_LIMITED';
const MS_PER_MINUTE = 60 * 1000;

export const rateLimitAdapter = Object.freeze({
  /**
   * Builds a per-key request limiter that answers with the standard five-field error envelope.
   * `keyBy` lets a route limit per authenticated supervisor instead of per IP.
   */
  createLimiter: ({ windowMinutes, max, message, keyBy }) =>
    rateLimit({
      windowMs: windowMinutes * MS_PER_MINUTE,
      limit: max,
      standardHeaders: true,
      legacyHeaders: false,
      ...(keyBy && { keyGenerator: keyBy }),
      handler: (req, res) =>
        res.status(TOO_MANY_REQUESTS).json({
          status: http.STATUS.ERROR,
          message,
          data: null,
          code: RATE_LIMITED_CODE,
          requestId: currentReqId(),
        }),
    }),
});
