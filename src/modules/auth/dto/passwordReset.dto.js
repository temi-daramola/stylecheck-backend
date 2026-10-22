import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { body } = common.utilities.validation;
const { validateRequest } = common.middleware;
const { MESSAGES, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = AuthConstants;

export const forgotPasswordValidation = [
  body('email')
    .isString().withMessage(MESSAGES.EMAIL_REQUIRED).bail()
    .trim().notEmpty().withMessage(MESSAGES.EMAIL_REQUIRED).bail()
    .isEmail().withMessage(MESSAGES.EMAIL_INVALID),
  validateRequest,
];

export const resetPasswordValidation = [
  body('token').isString().withMessage(MESSAGES.TOKEN_REQUIRED).bail().notEmpty().withMessage(MESSAGES.TOKEN_REQUIRED),
  body('password')
    .isString().withMessage(MESSAGES.PASSWORD_REQUIRED).bail()
    .isLength({ min: MIN_PASSWORD_LENGTH }).withMessage(MESSAGES.PASSWORD_TOO_SHORT).bail()
    .isLength({ max: MAX_PASSWORD_LENGTH }).withMessage(MESSAGES.PASSWORD_TOO_LONG),
  validateRequest,
];
