import { Layer } from '../constants/layer.constants.js';

export class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true, layer = Layer.SERVICE, cause = null } = {}) {
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
