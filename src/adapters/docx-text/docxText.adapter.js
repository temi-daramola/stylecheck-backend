import mammoth from 'mammoth';
import { Layer } from '@common/constants/layer.constants.js';
import { ValidationError } from '@common/errors/subclasses.js';
import { logger } from '@adapters/logging/pino.logger.js';

const NOT_A_DOCX_MESSAGE =
  'This file could not be read as a Word (.docx) document. Make sure it is a real .docx, not an older .doc file renamed.';
const LOG_MESSAGE = 'Text extraction failed';

export const docxTextAdapter = Object.freeze({
  /** Extracts the plain text content of a .docx file (formatting is discarded). */
  extractText: async (filePath) => {
    try {
      const { value } = await mammoth.extractRawText({ path: filePath });
      return value;
    } catch (error) {
      logger.warn({ message: error?.message }, LOG_MESSAGE);
      throw new ValidationError(NOT_A_DOCX_MESSAGE, { layer: Layer.ADAPTER, cause: error });
    }
  },
});
