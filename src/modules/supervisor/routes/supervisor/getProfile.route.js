import { common } from '@common/_index.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { asyncHandler, authMiddleware } = common.middleware;

export function getProfileRoute(router, { supervisorController }) {
  router.get(
    SupervisorConstants.API.ME,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.json(await supervisorController.getProfile(req.user.id));
    })
  );
}
