import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';
import { resetPasswordValidation } from '@modules/auth/dto/passwordReset.dto.js';

const { asyncHandler } = common.middleware;
const { rateLimitAdapter } = adapters.rateLimit;

export function resetPasswordRoute(router, { authController }) {
  const limiter = rateLimitAdapter.createLimiter(AuthConstants.RATE_LIMITS.RESET);

  router.post(
    AuthConstants.API.RESET_PASSWORD,
    limiter,
    resetPasswordValidation,
    asyncHandler(async (req, res) => {
      const { token, password } = req.body;
      res.json(await authController.resetPassword(token, password));
    })
  );
}
