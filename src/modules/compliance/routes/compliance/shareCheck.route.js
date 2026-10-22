import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { shareCheckValidation } from '@modules/compliance/dto/compliance.dto.js';

const { asyncHandler, authMiddleware } = common.middleware;
const { rateLimitAdapter } = adapters.rateLimit;

export function shareCheckRoute(router, { complianceController }) {
  const limiter = rateLimitAdapter.createLimiter({
    ...ComplianceConstants.RATE_LIMITS.SHARE,
    keyBy: (req) => req.user.id,
  });

  router.post(
    ComplianceConstants.API.SHARE,
    authMiddleware,
    limiter,
    shareCheckValidation,
    asyncHandler(async (req, res) => {
      const { studentEmail, message } = req.body;
      res.json(await complianceController.shareCheck(req.params.id, req.user.id, { studentEmail, message }));
    })
  );
}
