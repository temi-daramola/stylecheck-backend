import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ComplianceCheck } = db.models;
const { translateDbError } = common.errors;

export async function markShared(id, supervisorId, studentEmail) {
  try {
    return await ComplianceCheck.findOneAndUpdate(
      { _id: id, supervisorId },
      { $set: { sharedWithStudent: true, studentEmail } },
      { new: true }
    );
  } catch (error) {
    throw translateDbError(error, { operation: 'update', resource: ComplianceConstants.RESOURCE });
  }
}
