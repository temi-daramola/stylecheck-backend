import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ComplianceCheck } = db.models;
const { translateDbError } = common.errors;
const MS_PER_HOUR = 60 * 60 * 1000;

/** Saves a check whose document has been read but whose AI analysis has not succeeded yet. Expires on its own. */
export async function createPending(data) {
  try {
    return await ComplianceCheck.create({
      ...data,
      status: ComplianceConstants.STATUS.PENDING,
      pendingExpiresAt: new Date(Date.now() + ComplianceConstants.PENDING_TTL_HOURS * MS_PER_HOUR),
    });
  } catch (error) {
    throw translateDbError(error, { operation: 'create', resource: ComplianceConstants.RESOURCE });
  }
}
