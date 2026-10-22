import { create } from '@modules/auth/dao/password-reset-token-dao/create.dao.js';
import { findByTokenHash } from '@modules/auth/dao/password-reset-token-dao/findByTokenHash.dao.js';
import { deleteAllForSupervisor } from '@modules/auth/dao/password-reset-token-dao/deleteAllForSupervisor.dao.js';

class PasswordResetTokenDAO {
  async create(data) {
    return create.call(this, data);
  }

  async findByTokenHash(tokenHash) {
    return findByTokenHash.call(this, tokenHash);
  }

  async deleteAllForSupervisor(supervisorId) {
    return deleteAllForSupervisor.call(this, supervisorId);
  }
}

export default PasswordResetTokenDAO;
