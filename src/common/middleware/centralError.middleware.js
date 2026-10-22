import { AppError } from '@common/errors/AppError.js';
import { currentReqId } from '@common/context/requestContext.js';
import { http } from '@common/constants/http.constants.js';
import { messages } from '@common/constants/messages.constants.js';
import { adapters } from '@adapters/_index.js';

const { logger } = adapters.logging;
const SERVER_ERROR_FLOOR = 500;

export const centralErrorMiddleware = (err, req, res, next) => {
  const requestId = currentReqId();

  if (err instanceof AppError && err.isOperational) {
    // Client mistakes (4xx) are routine. A 5xx the client cannot fix (for example an upstream AI
    // failure) must leave a trace with its real cause, or nobody can tell what went wrong.
    if (err.statusCode >= SERVER_ERROR_FLOOR) {
      logger.warn(
        { requestId, method: req.method, path: req.originalUrl, layer: err.layer, code: err.code, status: err.statusCode, cause: err.cause?.message },
        messages.COMMON.REQUEST_FAILED_LOG
      );
    }
    return res.status(err.statusCode).json({
      status: http.STATUS.ERROR,
      message: err.message,
      data: err.details || null,
      code: err.code,
      requestId,
    });
  }

  logger.error(
    {
      requestId,
      layer: err?.layer || 'unknown',
      code: err?.code,
      stack: err?.stack,
      cause: err?.cause?.message,
    },
    messages.COMMON.UNHANDLED_ERROR_LOG
  );

  return res.status(http.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    status: http.STATUS.ERROR,
    message: messages.COMMON.SERVER_ERROR,
    data: null,
    code: http.CODES.INTERNAL_ERROR,
    requestId,
  });
};
