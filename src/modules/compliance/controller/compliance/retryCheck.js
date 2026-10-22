import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { utils } from '@modules/compliance/utils/_index.js';
import { requireReadyManual } from '@modules/compliance/controller/compliance/requireReadyManual.util.js';
import { analyseCheck, withPendingReference } from '@modules/compliance/controller/compliance/analyseCheck.util.js';

const { ResponseUtils } = common.utilities;
const { AppError, NotFoundError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = ComplianceConstants;
const { toCheckDetailDto } = utils.report;

/** Runs the AI step again on a saved check whose earlier attempt failed. No document upload needed. */
export async function retryCheck(id, supervisorId) {
  try {
    const manual = await requireReadyManual.call(this, supervisorId);

    const pending = await this.checkDAO.findPendingForSupervisor(id, supervisorId);
    if (!pending) {
      throw new NotFoundError(MESSAGES.RETRY_NOT_FOUND, { layer: Layer.CONTROLLER });
    }

    let analysis;
    try {
      analysis = await analyseCheck.call(this, pending, manual);
    } catch (error) {
      throw withPendingReference(error, pending._id);
    }

    this.notifySupervisor(supervisorId, analysis.completed);
    return ResponseUtils.success(MESSAGES.CHECK_SUCCESS, toCheckDetailDto(analysis.completed, analysis.ruleResults));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.CHECK_FAILED, {
      code: CODES.CHECK_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
