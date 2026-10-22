import { body, validationResult } from 'express-validator';
import { common } from '@common/_index.js';

const { ValidationError } = common.errors;
const { Layer } = common.constants;

export const loginValidation = [
  body('email').notEmpty().withMessage('Email is required').bail().isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', { layer: Layer.VALIDATION }, errors.array());
    }
    next();
  },
];
