import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';
import { loginValidation } from '@modules/auth/dto/login.dto.js';

const { asyncHandler } = common.middleware;
const { rateLimitAdapter } = adapters.rateLimit;

export function loginRoute(router, { authController }) {
  const limiter = rateLimitAdapter.createLimiter(AuthConstants.RATE_LIMITS.LOGIN);

  router.post(
    AuthConstants.API.LOGIN,
    limiter,
    loginValidation,
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      res.json(await authController.login(email, password, res));
    })
  );
}
