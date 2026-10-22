import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { checkIdValidation } from '@modules/compliance/dto/compliance.dto.js';

const { asyncHandler, authMiddleware } = common.middleware;

export function getCheckRoute(router, { complianceController }) {
  router.get(
    ComplianceConstants.API.BY_ID,
    authMiddleware,
    checkIdValidation,
    asyncHandler(async (req, res) => {
      res.json(await complianceController.getCheck(req.params.id, req.user.id));
    })
  );
}
