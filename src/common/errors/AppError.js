import { http } from '@common/constants/http.constants.js';

export class AppError extends Error {
  constructor(
    message,
    {
      statusCode = http.STATUS_CODES.INTERNAL_SERVER_ERROR,
      code = http.CODES.INTERNAL_ERROR,
      isOperational = true,
      layer,
      cause = null,
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.layer = layer;
    this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }
}
