import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';
import { forgotPasswordValidation } from '@modules/auth/dto/passwordReset.dto.js';

const { asyncHandler } = common.middleware;
const { rateLimitAdapter } = adapters.rateLimit;

export function forgotPasswordRoute(router, { authController }) {
  const limiter = rateLimitAdapter.createLimiter(AuthConstants.RATE_LIMITS.FORGOT);

  router.post(
    AuthConstants.API.FORGOT_PASSWORD,
    limiter,
    forgotPasswordValidation,
    asyncHandler(async (req, res) => {
      res.json(await authController.forgotPassword(req.body.email));
    })
  );
}
