import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { createCheckValidation } from '@modules/compliance/dto/compliance.dto.js';
import { uploadDocumentMiddleware } from '@modules/compliance/utils/upload/uploadDocument.middleware.js';

const { asyncHandler, authMiddleware } = common.middleware;
const { http } = common.constants;
const { rateLimitAdapter } = adapters.rateLimit;

export function createCheckRoute(router, { complianceController }) {
  // Limited per supervisor (not per IP): the limiter runs after authentication so it can key on the user.
  const limiter = rateLimitAdapter.createLimiter({
    ...ComplianceConstants.RATE_LIMITS.CREATE_CHECK,
    keyBy: (req) => req.user.id,
  });

  // Order matters: authenticate before accepting a file, and parse the multipart body before validating it.
  router.post(
    ComplianceConstants.API.ROOT,
    authMiddleware,
    limiter,
    uploadDocumentMiddleware,
    createCheckValidation,
    asyncHandler(async (req, res) => {
      const { studentName, chapterSection } = req.body;
      const result = await complianceController.createCheck(req.user.id, {
        studentName,
        chapterSection,
        file: req.file,
      });
      res.status(http.STATUS_CODES.CREATED).json(result);
    })
  );
}
