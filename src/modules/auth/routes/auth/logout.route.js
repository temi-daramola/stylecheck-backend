import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { asyncHandler } = common.middleware;

export function logoutRoute(router, { authController }) {
  router.post(
    AuthConstants.API.LOGOUT,
    asyncHandler(async (req, res) => {
      res.json(await authController.logout(req, res));
    })
  );
}
