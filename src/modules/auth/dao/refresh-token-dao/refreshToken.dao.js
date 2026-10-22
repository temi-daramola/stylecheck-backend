import { db } from '@database/_index.js';
import { errors } from '@common/errors/_index.js';
import { constants } from '@common/constants/_index.js';

const { RefreshToken } = db.models;
const { DatabaseError } = errors;
const { Layer } = constants;

export const createRefreshTokenDAO = async (data) => {
  try {
    return await RefreshToken.create(data);
  } catch (error) {
    throw new DatabaseError('Failed to store refresh token', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const findByTokenHashDAO = async (tokenHash) => {
  try {
    return await RefreshToken.findOne({ tokenHash });
  } catch (error) {
    throw new DatabaseError('Failed to lookup refresh token', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const markUsedDAO = async (tokenHash) => {
  try {
    return await RefreshToken.updateOne({ tokenHash }, { $set: { isUsed: true } });
  } catch (error) {
    throw new DatabaseError('Failed to mark refresh token as used', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const deleteAllForAccountDAO = async (userId) => {
  try {
    return await RefreshToken.deleteMany({ userId });
  } catch (error) {
    throw new DatabaseError('Failed to revoke account sessions', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const deleteOneDAO = async (tokenHash) => {
  try {
    return await RefreshToken.deleteOne({ tokenHash });
  } catch (error) {
    throw new DatabaseError('Failed to delete refresh token', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};
