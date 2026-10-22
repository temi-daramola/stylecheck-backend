import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';
import { uploadManualValidation } from '@modules/style-manual/dto/uploadManual.dto.js';

const { asyncHandler, authMiddleware } = common.middleware;

export function uploadManualRoute(router, { styleManualController }) {
  router.post(
    StyleManualConstants.API.ROOT,
    authMiddleware,
    uploadManualValidation,
    asyncHandler(async (req, res) => {
      const { fileName, fileType, fileSize, extractedText } = req.body;
      res.json(await styleManualController.uploadManual(req.user.id, { fileName, fileType, fileSize, extractedText }));
    })
  );
}
