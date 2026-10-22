import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { utils } from '@modules/compliance/utils/_index.js';
import { loadOwnedCheck } from '@modules/compliance/controller/compliance/loadOwnedCheck.util.js';

const { ResponseUtils } = common.utilities;
const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = ComplianceConstants;
const { toCheckDetailDto } = utils.report;

export async function getCheck(id, supervisorId) {
  try {
    const { check, ruleResults } = await loadOwnedCheck(this.checkDAO, this.ruleResultDAO, id, supervisorId);
    return ResponseUtils.success(MESSAGES.DETAIL_SUCCESS, toCheckDetailDto(check, ruleResults));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.DETAIL_FAILED, {
      code: CODES.DETAIL_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
