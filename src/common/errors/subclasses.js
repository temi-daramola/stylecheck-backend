import { AppError } from '@common/errors/AppError.js';
import { http } from '@common/constants/http.constants.js';

const { STATUS_CODES, CODES } = http;

export class NotFoundError extends AppError {
  constructor(resource, opts = {}) {
    super(`${resource} not found`, { ...opts, statusCode: STATUS_CODES.NOT_FOUND, code: CODES.NOT_FOUND });
  }
}

export class ValidationError extends AppError {
  constructor(message, opts = {}, details = null) {
    super(message, { ...opts, statusCode: STATUS_CODES.BAD_REQUEST, code: CODES.VALIDATION_ERROR });
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message, opts = {}) {
    super(message, { ...opts, statusCode: STATUS_CODES.UNAUTHORIZED, code: CODES.UNAUTHORIZED });
  }
}

export class ForbiddenError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: CODES.FORBIDDEN, ...opts, statusCode: STATUS_CODES.FORBIDDEN });
  }
}

export class ConflictError extends AppError {
  constructor(message, opts = {}) {
    super(message, { ...opts, statusCode: STATUS_CODES.CONFLICT, code: CODES.CONFLICT });
  }
}

export class ExternalServiceError extends AppError {
  constructor(message, opts = {}) {
    super(message, {
      statusCode: STATUS_CODES.BAD_GATEWAY,
      code: CODES.EXTERNAL_SERVICE_ERROR,
      ...opts,
    });
  }
}
