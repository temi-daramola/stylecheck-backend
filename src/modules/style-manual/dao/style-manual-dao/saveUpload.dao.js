import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { StyleManual } = db.models;
const { translateDbError } = common.errors;
const { STATUS } = StyleManualConstants;

/**
 * Saves an uploaded manual's text before any AI work happens, so a failed extraction never loses it.
 *  - no manual yet: create it as 'uploaded'
 *  - a working ('ready') manual exists: keep it in use and hold the new one as `pending`
 *  - an 'uploaded' manual that never worked: simply replace it
 */
export async function saveUpload(supervisorId, upload) {
  try {
    const saved = { ...upload, uploadDate: new Date() };
    const existing = await StyleManual.findOne({ supervisorId });

    if (!existing) {
      return await StyleManual.create({ supervisorId, ...saved, rules: [], status: STATUS.UPLOADED });
    }
    if (existing.status === STATUS.READY) {
      existing.pending = saved;
    } else {
      existing.set({ ...saved, rules: [], status: STATUS.UPLOADED, pending: null });
    }
    return await existing.save();
  } catch (error) {
    throw translateDbError(error, { operation: 'save', resource: StyleManualConstants.RESOURCE });
  }
}
