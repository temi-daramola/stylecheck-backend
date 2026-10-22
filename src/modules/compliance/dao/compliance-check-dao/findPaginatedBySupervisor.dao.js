import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ComplianceCheck } = db.models;
const { translateDbError } = common.errors;

export async function findPaginatedBySupervisor(supervisorId, { page, pageSize }) {
  try {
    return await ComplianceCheck.find({ supervisorId })
      .sort({ checkDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
  } catch (error) {
    throw translateDbError(error, { operation: 'read', resource: ComplianceConstants.RESOURCE });
  }
}
