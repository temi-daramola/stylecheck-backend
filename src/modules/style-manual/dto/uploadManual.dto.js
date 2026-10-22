import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { body } = common.utilities.validation;
const { validateRequest } = common.middleware;
const { env } = common.constants;
const { MESSAGES, FILE_TYPES, MAX_FILE_NAME_LENGTH, MIN_EXTRACTED_TEXT_LENGTH } = StyleManualConstants;

export const uploadManualValidation = [
  body('fileName')
    .isString().withMessage(MESSAGES.FILE_NAME_REQUIRED).bail()
    .trim().notEmpty().withMessage(MESSAGES.FILE_NAME_REQUIRED).bail()
    .isLength({ max: MAX_FILE_NAME_LENGTH }).withMessage(MESSAGES.FILE_NAME_TOO_LONG),
  body('fileType').isIn(FILE_TYPES).withMessage(MESSAGES.FILE_TYPE_INVALID),
  body('fileSize').isInt({ min: 0 }).withMessage(MESSAGES.FILE_SIZE_INVALID).toInt(),
  body('extractedText')
    .isString().withMessage(MESSAGES.TEXT_REQUIRED).bail()
    .custom((value) => value.trim().length >= MIN_EXTRACTED_TEXT_LENGTH)
    .withMessage(MESSAGES.TEXT_TOO_SHORT).bail()
    .isLength({ max: env.MAX_MANUAL_TEXT_LENGTH }).withMessage(MESSAGES.TEXT_TOO_LONG),
  validateRequest,
];
