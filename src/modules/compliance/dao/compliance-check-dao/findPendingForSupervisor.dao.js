import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ComplianceCheck } = db.models;
const { translateDbError } = common.errors;

/** The owning supervisor's pending check, including the saved input a retry needs. Never send this to a client. */
export async function findPendingForSupervisor(id, supervisorId) {
  try {
    return await ComplianceCheck.findOne({ _id: id, supervisorId, status: ComplianceConstants.STATUS.PENDING }).select('+pendingInput');
  } catch (error) {
    throw translateDbError(error, { operation: 'read', resource: ComplianceConstants.RESOURCE });
  }
}
