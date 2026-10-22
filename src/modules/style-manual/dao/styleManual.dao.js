import { db } from '@database/_index.js';
import { common } from '@common/_index.js';

const { StyleManual } = db.models;
const { DatabaseError } = common.errors;
const { Layer } = common.constants;

export const createStyleManualDAO = async (data) => {
  try {
    return await StyleManual.create(data);
  } catch (error) {
    throw new DatabaseError('Failed to save style manual', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const findActiveStyleManualDAO = async () => {
  try {
    return await StyleManual.findOne({ isActive: true }).sort({ uploadedAt: -1 });
  } catch (error) {
    throw new DatabaseError('Failed to retrieve active style manual', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const deactivateAllStyleManualsDAO = async () => {
  try {
    return await StyleManual.updateMany({ isActive: true }, { $set: { isActive: false } });
  } catch (error) {
    throw new DatabaseError('Failed to update active style manual status', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};
