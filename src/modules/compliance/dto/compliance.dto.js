import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { body, param } = common.utilities.validation;
const { validateRequest } = common.middleware;
const { MESSAGES, CHAPTERS, MAX_STUDENT_NAME_LENGTH, MAX_SHARE_MESSAGE_LENGTH } = ComplianceConstants;

export const createCheckValidation = [
  body('studentName')
    .isString().withMessage(MESSAGES.STUDENT_NAME_REQUIRED).bail()
    .trim().notEmpty().withMessage(MESSAGES.STUDENT_NAME_REQUIRED).bail()
    .isLength({ max: MAX_STUDENT_NAME_LENGTH }).withMessage(MESSAGES.STUDENT_NAME_TOO_LONG),
  body('chapterSection').isIn(CHAPTERS).withMessage(MESSAGES.CHAPTER_INVALID),
  validateRequest,
];

export const checkIdValidation = [
  param('id').isMongoId().withMessage(MESSAGES.ID_INVALID),
  validateRequest,
];

export const shareCheckValidation = [
  param('id').isMongoId().withMessage(MESSAGES.ID_INVALID),
  body('studentEmail').isString().bail().trim().isEmail().withMessage(MESSAGES.EMAIL_INVALID),
  body('message')
    .optional({ values: 'falsy' })
    .isString().bail()
    .isLength({ max: MAX_SHARE_MESSAGE_LENGTH }).withMessage(MESSAGES.MESSAGE_TOO_LONG),
  validateRequest,
];
