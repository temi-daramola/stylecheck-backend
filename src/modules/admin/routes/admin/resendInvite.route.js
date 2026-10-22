import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { supervisorIdValidation } from '@modules/admin/dto/admin.dto.js';

const { asyncHandler } = common.middleware;
const { rateLimitAdapter } = adapters.rateLimit;

export function resendInviteRoute(router, { adminController }, guards) {
  const limiter = rateLimitAdapter.createLimiter({ ...AdminConstants.RATE_LIMITS.INVITE, keyBy: (req) => req.user.id });

  router.post(
    AdminConstants.API.INVITE,
    ...guards,
    limiter,
    supervisorIdValidation,
    asyncHandler(async (req, res) => {
      res.json(await adminController.resendInvite(req.params.id));
    })
  );
}
