import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { ResponseUtils } = common.utilities;
const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = StyleManualConstants;

export async function getMyManual(supervisorId) {
  try {
    // "No manual yet" is a valid state, not an error: return success with null data.
    const manual = await this.styleManualDAO.findBySupervisorId(supervisorId);
    return ResponseUtils.success(MESSAGES.FETCH_SUCCESS, manual);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.GET_FAILED, {
      code: CODES.GET_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
