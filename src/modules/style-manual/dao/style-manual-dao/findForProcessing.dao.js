import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { StyleManual } = db.models;
const { translateDbError } = common.errors;

/** Like findBySupervisorId, but includes the saved text, which processing needs. Never send this to a client. */
export async function findForProcessing(supervisorId) {
  try {
    return await StyleManual.findOne({ supervisorId }).select('+extractedText +pending.extractedText');
  } catch (error) {
    throw translateDbError(error, { operation: 'read', resource: StyleManualConstants.RESOURCE });
  }
}
