import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { StyleManual } = db.models;
const { translateDbError } = common.errors;

export async function findBySupervisorId(supervisorId) {
  try {
    return await StyleManual.findOne({ supervisorId });
  } catch (error) {
    throw translateDbError(error, { operation: 'read', resource: StyleManualConstants.RESOURCE });
  }
}
