import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { body } = common.utilities.validation;
const { validateRequest } = common.middleware;
const { MESSAGES } = AuthConstants;

export const loginValidation = [
  body('email')
    .notEmpty().withMessage(MESSAGES.EMAIL_REQUIRED).bail()
    .isEmail().withMessage(MESSAGES.EMAIL_INVALID),
  body('password').notEmpty().withMessage(MESSAGES.PASSWORD_REQUIRED),
  validateRequest,
];
