import { validationResult } from 'express-validator';
import { ValidationError } from '@common/errors/subclasses.js';
import { Layer } from '@common/constants/layer.constants.js';
import { messages } from '@common/constants/messages.constants.js';

export const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map(({ path, msg }) => ({ field: path, message: msg }));
    throw new ValidationError(messages.COMMON.VALIDATION_FAILED, { layer: Layer.VALIDATION }, details);
  }
  next();
};
