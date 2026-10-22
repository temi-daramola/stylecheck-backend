import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';

const { body, param } = common.utilities.validation;
const { validateRequest } = common.middleware;
const { MESSAGES, MAX_NAME_LENGTH } = AdminConstants;

export const createSupervisorValidation = [
  body('name')
    .isString().withMessage(MESSAGES.NAME_REQUIRED).bail()
    .trim().notEmpty().withMessage(MESSAGES.NAME_REQUIRED).bail()
    .isLength({ max: MAX_NAME_LENGTH }).withMessage(MESSAGES.NAME_TOO_LONG),
  body('email')
    .isString().withMessage(MESSAGES.EMAIL_REQUIRED).bail()
    .trim().notEmpty().withMessage(MESSAGES.EMAIL_REQUIRED).bail()
    .isEmail().withMessage(MESSAGES.EMAIL_INVALID),
  validateRequest,
];

export const supervisorIdValidation = [param('id').isMongoId().withMessage(MESSAGES.ID_INVALID), validateRequest];

export const setActiveValidation = [
  param('id').isMongoId().withMessage(MESSAGES.ID_INVALID),
  body('isActive').isBoolean({ strict: true }).withMessage(MESSAGES.ACTIVE_MUST_BE_BOOLEAN),
  validateRequest,
];
