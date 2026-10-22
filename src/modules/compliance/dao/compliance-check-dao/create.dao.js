import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ComplianceCheck } = db.models;
const { translateDbError } = common.errors;

export async function create(data) {
  try {
    return await ComplianceCheck.create(data);
  } catch (error) {
    throw translateDbError(error, { operation: 'create', resource: ComplianceConstants.RESOURCE });
  }
}
