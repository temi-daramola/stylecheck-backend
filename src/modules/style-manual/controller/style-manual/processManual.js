import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';
import { utils } from '@modules/style-manual/utils/_index.js';
import { extractRules } from '@modules/style-manual/controller/style-manual/extractRules.util.js';

const { ResponseUtils } = common.utilities;
const { AppError, ValidationError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES, STATUS } = StyleManualConstants;

/** Processes the saved manual again (after a failed attempt) without any new upload. */
export async function processManual(supervisorId) {
  try {
    const saved = await this.styleManualDAO.findForProcessing(supervisorId);

    // What is waiting: a pending replacement, or a first manual that never got its rules.
    const text = saved?.pending?.extractedText ?? (saved?.status === STATUS.UPLOADED ? saved.extractedText : null);
    if (!text) {
      throw new ValidationError(MESSAGES.NOTHING_TO_PROCESS, { layer: Layer.CONTROLLER, code: CODES.NOTHING_TO_PROCESS });
    }

    const rules = await extractRules.call(this, text);
    const manual = await this.styleManualDAO.applyRules(supervisorId, rules);

    return ResponseUtils.success(MESSAGES.PROCESS_SUCCESS, utils.toManualDto(manual));
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
