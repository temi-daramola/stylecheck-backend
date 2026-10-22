import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ComplianceCheck } = db.models;
const { translateDbError } = common.errors;

/** Marks a pending check completed with its score, and discards the saved input. */
export async function complete(id, scoreFields) {
  try {
    return await ComplianceCheck.findByIdAndUpdate(
      id,
      {
        $set: { ...scoreFields, status: ComplianceConstants.STATUS.COMPLETED, checkDate: new Date() },
        $unset: { pendingInput: '', pendingExpiresAt: '' },
      },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw translateDbError(error, { operation: 'update', resource: ComplianceConstants.RESOURCE });
  }
}
