import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { StyleManual } = db.models;
const { translateDbError } = common.errors;
const { STATUS } = StyleManualConstants;

/**
 * Records the extracted rules and makes the manual 'ready'. If a pending replacement was being
 * processed, it now becomes the active manual (the old one is only replaced once this succeeds).
 */
export async function applyRules(supervisorId, rules) {
  try {
    const doc = await StyleManual.findOne({ supervisorId }).select('+extractedText +pending.extractedText');
    if (!doc) return null;

    const source = doc.pending ?? doc;
    doc.set({
      fileName: source.fileName,
      fileType: source.fileType,
      fileSize: source.fileSize,
      uploadDate: source.uploadDate,
      extractedText: source.extractedText,
      rules,
      status: STATUS.READY,
      pending: null,
    });
    await doc.save();
    return await StyleManual.findOne({ supervisorId });
  } catch (error) {
    throw translateDbError(error, { operation: 'save', resource: StyleManualConstants.RESOURCE });
  }
}
