import { AppError } from './AppError.js';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
} from './subclasses.js';

export const errors = Object.freeze({
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
});
