import {
  createUserDAO,
  findUserByEmailDAO,
  findUserByIdDAO,
} from './user.dao.js';

export const userDAO = Object.freeze({
  create: createUserDAO,
  findByEmail: findUserByEmailDAO,
  findById: findUserByIdDAO,
});
