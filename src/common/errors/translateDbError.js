import { AppError } from '@common/errors/AppError.js';
import { ConflictError, ValidationError } from '@common/errors/subclasses.js';
import { Layer } from '@common/constants/layer.constants.js';
import { http } from '@common/constants/http.constants.js';

const MONGO_DUPLICATE_KEY = 11000;

const KNOWN_DB_ERRORS = [
  {
    matches: (err) => err.code === MONGO_DUPLICATE_KEY,
    translate: (err, { resource }) =>
      new ConflictError(`${resource} already exists`, { layer: Layer.DATABASE, cause: err }),
  },
  {
    matches: (err) => err.name === 'CastError',
    translate: (err, { resource }) =>
      new ValidationError(`Invalid identifier for ${resource}`, { layer: Layer.DATABASE, cause: err }),
  },
  {
    matches: (err) => err.name === 'ValidationError',
    translate: (err, { resource }) =>
      new ValidationError(`Invalid ${resource} data`, { layer: Layer.DATABASE, cause: err }),
  },
];

export const translateDbError = (err, { operation, resource }) => {
  const known = KNOWN_DB_ERRORS.find((entry) => entry.matches(err));
  if (known) return known.translate(err, { resource });

  return new AppError(`Could not ${operation} ${resource}`, {
    statusCode: http.STATUS_CODES.INTERNAL_SERVER_ERROR,
    code: http.CODES.DB_OPERATION_FAILED,
    isOperational: false,
    layer: Layer.DATABASE,
    cause: err,
  });
};
