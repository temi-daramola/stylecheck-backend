import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { asyncHandler, authMiddleware } = common.middleware;

export function getMyManualRoute(router, { styleManualController }) {
  router.get(
    StyleManualConstants.API.ME,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.json(await styleManualController.getMyManual(req.user.id));
    })
  );
}
