import { AppError } from '@common/errors/AppError.js';
import { Layer } from '@common/constants/layer.constants.js';

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', opts = {}) {
    super(`${resource} not found`, {
      statusCode: 404,
      code: 'NOT_FOUND',
      layer: opts.layer || Layer.CONTROLLER,
      ...opts,
    });
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', opts = {}, details = null) {
    super(message, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      layer: opts.layer || Layer.VALIDATION,
      ...opts,
    });
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', opts = {}) {
    super(message, {
      statusCode: 401,
      code: 'UNAUTHORIZED',
      layer: opts.layer || Layer.AUTH,
      ...opts,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', opts = {}) {
    super(message, {
      statusCode: 403,
      code: 'FORBIDDEN',
      layer: opts.layer || Layer.AUTH,
      ...opts,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', opts = {}) {
    super(message, {
      statusCode: 409,
      code: 'CONFLICT',
      layer: opts.layer || Layer.DATABASE,
      ...opts,
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', opts = {}) {
    super(message, {
      statusCode: 500,
      code: 'DATABASE_ERROR',
      layer: opts.layer || Layer.DATABASE,
      ...opts,
    });
  }
}
