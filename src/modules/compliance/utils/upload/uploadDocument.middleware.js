import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { removeFile } from '@modules/compliance/utils/upload/removeFile.util.js';

const { env, Layer } = common.constants;
const { ValidationError } = common.errors;
const { UPLOAD_FIELD, DOCX_EXTENSION, DOCX_MIME_TYPES, BYTES_PER_MB, MESSAGES } = ComplianceConstants;

const uploadDir = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  // Never trust the original name for a path: use a random one and keep only the fixed extension.
  filename: (req, file, cb) => cb(null, `${randomUUID()}${DOCX_EXTENSION}`),
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_DOC_SIZE_MB * BYTES_PER_MB, files: 1 },
  fileFilter: (req, file, cb) => {
    const isDocx =
      path.extname(file.originalname).toLowerCase() === DOCX_EXTENSION && DOCX_MIME_TYPES.includes(file.mimetype);
    if (isDocx) return cb(null, true);
    return cb(new ValidationError(MESSAGES.FILE_TYPE_INVALID, { layer: Layer.VALIDATION }));
  },
}).single(UPLOAD_FIELD);

const translateUploadError = (error) => {
  if (error instanceof ValidationError) return error;
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? MESSAGES.FILE_TOO_LARGE : MESSAGES.UPLOAD_FAILED;
    return new ValidationError(message, { layer: Layer.VALIDATION, cause: error });
  }
  return error;
};

/**
 * Receives the student .docx and guarantees the temporary file is removed once the response
 * is finished or the client disconnects, whatever path the request took.
 */
export const uploadDocumentMiddleware = (req, res, next) => {
  res.on('close', () => {
    removeFile(req.file?.path).catch(() => {});
  });

  upload(req, res, (error) => (error ? next(translateUploadError(error)) : next()));
};
