import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { asyncHandler, authMiddleware } = common.middleware;

const uploadDir = path.resolve('uploads/student-documents');
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
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: ComplianceConstants.MAX_FILE_SIZE_BYTES },
});

export function createComplianceRoutes({
  createCheckController,
  getRecentChecksController,
  getCheckByIdController,
  shareReportController,
}) {
  const router = express.Router();

  router.post(
    '/check',
    authMiddleware,
    upload.single('file'),
    asyncHandler(async (req, res) => {
      const { studentName, chapter } = req.body;
      const result = await createCheckController.execute({
        studentName,
        chapter,
        file: req.file,
        userId: req.user?.id,
      });
      res.status(201).json(result);
    })
  );

  router.get(
    '/recent',
    authMiddleware,
    asyncHandler(async (req, res) => {
      const result = await getRecentChecksController.execute();
      res.json(result);
    })
  );

  router.get(
    '/checks/:id',
    authMiddleware,
    asyncHandler(async (req, res) => {
      const result = await getCheckByIdController.execute(req.params.id);
      res.json(result);
    })
  );

  router.post(
    '/checks/:id/share',
    authMiddleware,
    asyncHandler(async (req, res) => {
      const { studentEmail, additionalMessage } = req.body;
      const result = await shareReportController.execute(req.params.id, {
        studentEmail,
        additionalMessage,
      });
      res.json(result);
    })
  );

  return router;
}
