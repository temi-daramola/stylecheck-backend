import { db } from '@database/_index.js';
import { errors } from '@common/errors/_index.js';
import { constants } from '@common/constants/_index.js';

const { User } = db.models;
const { DatabaseError } = errors;
const { Layer } = constants;

export const createUserDAO = async (userData) => {
  try {
    return await User.create(userData);
  } catch (error) {
    throw new DatabaseError('Failed to create user', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const findUserByEmailDAO = async (email) => {
  try {
    return await User.findOne({ email: email.toLowerCase() });
  } catch (error) {
    throw new DatabaseError('Failed to query user by email', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};

export const findUserByIdDAO = async (id) => {
  try {
    return await User.findById(id).select('-passwordHash');
  } catch (error) {
    throw new DatabaseError('Failed to query user by id', {
      layer: Layer.DATABASE,
      cause: error,
    });
  }
};
