import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { asyncHandler, authMiddleware } = common.middleware;

export function processManualRoute(router, { styleManualController }) {
  router.post(
    StyleManualConstants.API.PROCESS,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.json(await styleManualController.processManual(req.user.id));
    })
  );
}
