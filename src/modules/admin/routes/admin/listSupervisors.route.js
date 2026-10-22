import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';

const { asyncHandler } = common.middleware;

export function listSupervisorsRoute(router, { adminController }, guards) {
  router.get(
    AdminConstants.API.SUPERVISORS,
    ...guards,
    asyncHandler(async (req, res) => {
      res.json(await adminController.listSupervisors());
    })
  );
}
