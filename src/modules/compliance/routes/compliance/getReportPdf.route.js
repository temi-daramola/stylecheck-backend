import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { checkIdValidation } from '@modules/compliance/dto/compliance.dto.js';

const { asyncHandler, authMiddleware } = common.middleware;

const PDF_CONTENT_TYPE = 'application/pdf';

export function getReportPdfRoute(router, { complianceController }) {
  router.get(
    ComplianceConstants.API.PDF,
    authMiddleware,
    checkIdValidation,
    asyncHandler(async (req, res) => {
      const { buffer, fileName } = await complianceController.getReportPdf(req.params.id, req.user.id);
      res.setHeader('Content-Type', PDF_CONTENT_TYPE);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    })
  );
}
