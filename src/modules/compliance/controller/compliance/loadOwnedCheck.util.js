import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { NotFoundError } = common.errors;
const { Layer } = common.constants;

/** Loads a check and its rule results, scoped to the supervisor. A foreign check reads as not found. */
export async function loadOwnedCheck(checkDAO, ruleResultDAO, id, supervisorId) {
  const check = await checkDAO.findByIdForSupervisor(id, supervisorId);
  if (!check) {
    throw new NotFoundError(ComplianceConstants.MESSAGES.NOT_FOUND_RESOURCE, { layer: Layer.CONTROLLER });
  }
  const ruleResults = await ruleResultDAO.findByCheckId(check._id);
  return { check, ruleResults };
}
