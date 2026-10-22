import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { asyncHandler, authMiddleware } = common.middleware;
const { ValidationError } = common.errors;
const { Layer } = common.constants;

const uploadDir = path.resolve('uploads/style-manuals');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `manual-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: StyleManualConstants.MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (StyleManualConstants.ALLOWED_MIME_TYPES.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|doc)$/i)) {
      cb(null, true);
    } else {
      cb(new ValidationError(StyleManualConstants.MESSAGES.INVALID_FORMAT, { layer: Layer.VALIDATION }));
    }
  },
});

export function createStyleManualRoutes({ getActiveManualController, uploadManualController }) {
  const router = express.Router();

  router.get(
    '/active',
    authMiddleware,
    asyncHandler(async (req, res) => {
      const result = await getActiveManualController.execute();
      res.json(result);
    })
  );

  router.post(
    '/upload',
    authMiddleware,
    upload.single('file'),
    asyncHandler(async (req, res) => {
      if (!req.file) {
        throw new ValidationError(StyleManualConstants.MESSAGES.FILE_REQUIRED, {
          layer: Layer.VALIDATION,
        });
      }
      const result = await uploadManualController.execute(req.file);
      res.json(result);
    })
  );

  return router;
}
