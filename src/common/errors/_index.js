import { AppError } from './AppError.js';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ExternalServiceError,
} from './subclasses.js';
import { translateDbError } from './translateDbError.js';

export const errors = Object.freeze({
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ExternalServiceError,
  translateDbError,
});
