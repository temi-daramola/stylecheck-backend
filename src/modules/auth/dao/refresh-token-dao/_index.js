import {
  createRefreshTokenDAO,
  findByTokenHashDAO,
  markUsedDAO,
  deleteAllForAccountDAO,
  deleteOneDAO,
} from './refreshToken.dao.js';

export const refreshTokenDAO = Object.freeze({
  create: createRefreshTokenDAO,
  findByTokenHash: findByTokenHashDAO,
  markUsed: markUsedDAO,
  deleteAllForAccount: deleteAllForAccountDAO,
  deleteOne: deleteOneDAO,
});
