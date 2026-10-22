import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ComplianceCheck } = db.models;
const { translateDbError } = common.errors;

/** Always scoped to the owning supervisor: another supervisor's check is indistinguishable from a missing one. */
export async function findByIdForSupervisor(id, supervisorId) {
  try {
    return await ComplianceCheck.findOne({ _id: id, supervisorId, status: { $ne: 'pending' } });
  } catch (error) {
    throw translateDbError(error, { operation: 'read', resource: ComplianceConstants.RESOURCE });
  }
}
