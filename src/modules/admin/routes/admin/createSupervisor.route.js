import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { createSupervisorValidation } from '@modules/admin/dto/admin.dto.js';

const { asyncHandler } = common.middleware;
const { http } = common.constants;
const { rateLimitAdapter } = adapters.rateLimit;

export function createSupervisorRoute(router, { adminController }, guards) {
  const limiter = rateLimitAdapter.createLimiter({ ...AdminConstants.RATE_LIMITS.INVITE, keyBy: (req) => req.user.id });

  router.post(
    AdminConstants.API.SUPERVISORS,
    ...guards,
    limiter,
    createSupervisorValidation,
    asyncHandler(async (req, res) => {
      const { name, email } = req.body;
      res.status(http.STATUS_CODES.CREATED).json(await adminController.createSupervisor({ name, email }));
    })
  );
}
