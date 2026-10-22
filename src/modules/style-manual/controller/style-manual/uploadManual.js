import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';
import { utils } from '@modules/style-manual/utils/_index.js';
import { extractRules } from '@modules/style-manual/controller/style-manual/extractRules.util.js';

const { ResponseUtils } = common.utilities;
const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = StyleManualConstants;

/**
 * One ordinary request, two steps: (1) save the uploaded text so it is never lost, (2) ask the AI for
 * the rules. If step 2 fails the manual stays saved as 'uploaded' and the error is returned; the user
 * can then process it again without uploading the file again.
 */
export async function uploadManual(supervisorId, { fileName, fileType, fileSize, extractedText }) {
  try {
    await this.styleManualDAO.saveUpload(supervisorId, { fileName: fileName.trim(), fileType, fileSize, extractedText });

    const rules = await extractRules.call(this, extractedText);
    const manual = await this.styleManualDAO.applyRules(supervisorId, rules);

    return ResponseUtils.success(MESSAGES.UPLOAD_SUCCESS, utils.toManualDto(manual));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.UPLOAD_FAILED, {
      code: CODES.UPLOAD_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
