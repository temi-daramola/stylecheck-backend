import { AppError } from '../errors/AppError.js';
import { currentReqId } from '../context/requestContext.js';

export const centralErrorMiddleware = (err, req, res, next) => {
  const reqId = req.headers['x-request-id'] || currentReqId();

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      data: err.details || null,
      code: err.code,
      requestId: reqId,
    });
  }

  // Non-operational or untrusted error
  console.error('[Unhandled Error]', {
    requestId: reqId,
    layer: err?.layer || 'unknown',
    message: err?.message,
    stack: err?.stack,
  });

  return res.status(500).json({
    status: 'error',
    message: 'An internal error occurred. Please try again.',
    data: null,
    code: 'INTERNAL_ERROR',
    requestId: reqId,
  });
};
