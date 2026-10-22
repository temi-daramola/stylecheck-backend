import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { setActiveValidation } from '@modules/admin/dto/admin.dto.js';

const { asyncHandler } = common.middleware;

export function setSupervisorActiveRoute(router, { adminController }, guards) {
  router.patch(
    AdminConstants.API.ACTIVE,
    ...guards,
    setActiveValidation,
    asyncHandler(async (req, res) => {
      res.json(await adminController.setSupervisorActive(req.params.id, req.body.isActive, req.user.id));
    })
  );
}
