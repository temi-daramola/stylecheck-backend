import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { ResponseUtils } = common.utilities;

export class GetActiveManualController {
  constructor(styleManualDAO) {
    this.styleManualDAO = styleManualDAO;
  }

  async execute() {
    const activeManual = await this.styleManualDAO.findActive();
    return ResponseUtils.success(StyleManualConstants.MESSAGES.FETCH_SUCCESS, activeManual);
  }
}

export class UploadManualController {
  constructor(styleManualDAO) {
    this.styleManualDAO = styleManualDAO;
  }

  async execute(file) {
    await this.styleManualDAO.deactivateAll();

    const created = await this.styleManualDAO.create({
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
      isActive: true,
    });

    return ResponseUtils.success(StyleManualConstants.MESSAGES.UPLOAD_SUCCESS, created);
  }
}
