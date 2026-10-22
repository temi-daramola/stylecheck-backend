import { AppError } from '@common/errors/AppError.js';
import { currentReqId } from '@common/context/requestContext.js';
import { http } from '@common/constants/http.constants.js';
import { messages } from '@common/constants/messages.constants.js';
import { adapters } from '@adapters/_index.js';

const { logger } = adapters.logging;

export const centralErrorMiddleware = (err, req, res, next) => {
  const requestId = currentReqId();

  if (err instanceof AppError && err.isOperational) {
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
