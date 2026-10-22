import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ComplianceCheck } = db.models;
const { translateDbError } = common.errors;

export async function countBySupervisor(supervisorId) {
  try {
    return await ComplianceCheck.countDocuments({ supervisorId, status: { $ne: 'pending' } });
  } catch (error) {
    throw translateDbError(error, { operation: 'read', resource: ComplianceConstants.RESOURCE });
  }
}
