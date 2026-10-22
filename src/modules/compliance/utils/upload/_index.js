import { removeFile } from '@modules/compliance/utils/upload/removeFile.util.js';
import { uploadDocumentMiddleware } from '@modules/compliance/utils/upload/uploadDocument.middleware.js';

export const upload = Object.freeze({
  removeFile,
  uploadDocumentMiddleware,
});
