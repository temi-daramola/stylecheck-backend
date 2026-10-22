import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { checkIdValidation } from '@modules/compliance/dto/compliance.dto.js';

const { asyncHandler, authMiddleware } = common.middleware;
const { rateLimitAdapter } = adapters.rateLimit;

export function retryCheckRoute(router, { complianceController }) {
  const limiter = rateLimitAdapter.createLimiter({
    ...ComplianceConstants.RATE_LIMITS.CREATE_CHECK,
    keyBy: (req) => req.user.id,
  });

  router.post(
    ComplianceConstants.API.RETRY,
    authMiddleware,
    limiter,
    checkIdValidation,
    asyncHandler(async (req, res) => {
      res.json(await complianceController.retryCheck(req.params.id, req.user.id));
    })
  );
}
