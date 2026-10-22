import mammoth from 'mammoth';
import { Layer } from '@common/constants/layer.constants.js';
import { ValidationError } from '@common/errors/subclasses.js';

const UNREADABLE_DOCX_MESSAGE = 'This file could not be read as a .docx document.';

export const docxTextAdapter = Object.freeze({
  /** Extracts the plain text content of a .docx file (formatting is discarded). */
  extractText: async (filePath) => {
    try {
      const { value } = await mammoth.extractRawText({ path: filePath });
      return value;
    } catch (error) {
      throw new ValidationError(UNREADABLE_DOCX_MESSAGE, { layer: Layer.ADAPTER, cause: error });
    }
  },
});
