import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { asyncHandler, authMiddleware } = common.middleware;

export function listChecksRoute(router, { complianceController }) {
  router.get(
    ComplianceConstants.API.ROOT,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.json(await complianceController.listChecks(req.user.id, req.query));
    })
  );
}
