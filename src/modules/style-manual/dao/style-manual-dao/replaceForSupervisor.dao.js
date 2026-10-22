import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { StyleManual } = db.models;
const { translateDbError } = common.errors;

/**
 * One style manual per supervisor: the existing record is overwritten, never accumulated.
 */
export async function replaceForSupervisor(supervisorId, data) {
  try {
    return await StyleManual.findOneAndUpdate(
      { supervisorId },
      { $set: { ...data, supervisorId, uploadDate: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
  } catch (error) {
    throw translateDbError(error, { operation: 'save', resource: StyleManualConstants.RESOURCE });
  }
}
