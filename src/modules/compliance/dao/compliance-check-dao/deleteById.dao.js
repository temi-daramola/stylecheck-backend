import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ComplianceCheck } = db.models;
const { translateDbError } = common.errors;

export async function deleteById(id) {
  try {
    return await ComplianceCheck.deleteOne({ _id: id });
  } catch (error) {
    throw translateDbError(error, { operation: 'delete', resource: ComplianceConstants.RESOURCE });
  }
}
