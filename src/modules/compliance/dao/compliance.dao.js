import { db } from '@database/_index.js';
import { common } from '@common/_index.js';

const { ComplianceCheck } = db.models;
const { DatabaseError } = common.errors;
const { Layer } = common.constants;

export const createComplianceCheckDAO = async (data) => {
  try {
    return await ComplianceCheck.create(data);
  } catch (error) {
    throw new DatabaseError('Failed to record compliance check', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const findRecentChecksDAO = async (limit = 10) => {
  try {
    return await ComplianceCheck.find().sort({ checkedAt: -1 }).limit(limit);
  } catch (error) {
    throw new DatabaseError('Failed to retrieve recent checks', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const findCheckByIdDAO = async (id) => {
  try {
    return await ComplianceCheck.findById(id);
  } catch (error) {
    throw new DatabaseError('Failed to retrieve check by id', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const updateCheckShareDAO = async (id, shareData) => {
  try {
    return await ComplianceCheck.findByIdAndUpdate(
      id,
      {
        $set: {
          sharedWithEmail: shareData.studentEmail,
          sharedMessage: shareData.sharedMessage,
          sharedAt: shareData.sharedAt || new Date(),
        },
      },
      { new: true }
    );
  } catch (error) {
    throw new DatabaseError('Failed to update check share details', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};
