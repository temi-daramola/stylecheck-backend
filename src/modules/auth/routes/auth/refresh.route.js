import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { asyncHandler } = common.middleware;

export function refreshRoute(router, { authController }) {
  router.post(
    AuthConstants.API.REFRESH,
    asyncHandler(async (req, res) => {
      res.json(await authController.refresh(req, res));
    })
  );
}
