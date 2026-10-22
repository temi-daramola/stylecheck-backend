import { common } from '@common/_index.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';
import { updatePreferencesValidation } from '@modules/supervisor/dto/updatePreferences.dto.js';

const { asyncHandler, authMiddleware } = common.middleware;

export function updatePreferencesRoute(router, { supervisorController }) {
  router.patch(
    SupervisorConstants.API.ME_PREFERENCES,
    authMiddleware,
    updatePreferencesValidation,
    asyncHandler(async (req, res) => {
      res.json(await supervisorController.updatePreferences(req.user.id, req.body));
    })
  );
}
