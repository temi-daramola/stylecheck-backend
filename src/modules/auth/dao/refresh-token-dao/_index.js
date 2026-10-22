import { create } from '@modules/auth/dao/refresh-token-dao/create.dao.js';
import { findByTokenHash } from '@modules/auth/dao/refresh-token-dao/findByTokenHash.dao.js';
import { markUsed } from '@modules/auth/dao/refresh-token-dao/markUsed.dao.js';
import { deleteAllForAccount } from '@modules/auth/dao/refresh-token-dao/deleteAllForAccount.dao.js';
import { deleteOne } from '@modules/auth/dao/refresh-token-dao/deleteOne.dao.js';

class RefreshTokenDAO {
  async create(data) {
    return create.call(this, data);
  }

  async findByTokenHash(tokenHash) {
    return findByTokenHash.call(this, tokenHash);
  }

  async markUsed(tokenHash) {
    return markUsed.call(this, tokenHash);
  }

  async deleteAllForAccount(supervisorId) {
    return deleteAllForAccount.call(this, supervisorId);
  }

  async deleteOne(tokenHash) {
    return deleteOne.call(this, tokenHash);
  }
}

export default RefreshTokenDAO;
