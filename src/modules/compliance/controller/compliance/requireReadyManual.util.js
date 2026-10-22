import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ForbiddenError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = ComplianceConstants;

/**
 * Server-side gate (the dashboard lock is advisory, this is the authority): a check needs a style
 * manual whose rules have been extracted. Called with the controller as `this`.
 */
export async function requireReadyManual(supervisorId) {
  const manual = await this.styleManualDAO.findBySupervisorId(supervisorId);

  if (!manual) {
    throw new ForbiddenError(MESSAGES.MANUAL_REQUIRED, { layer: Layer.CONTROLLER, code: CODES.MANUAL_REQUIRED });
  }
  if (manual.status !== ComplianceConstants.MANUAL_READY_STATUS || manual.rules.length === 0) {
    throw new ForbiddenError(MESSAGES.MANUAL_NOT_READY, { layer: Layer.CONTROLLER, code: CODES.MANUAL_NOT_READY });
  }
  return manual;
}
