import { create } from '@modules/supervisor/dao/supervisor-dao/create.dao.js';
import { findByEmail } from '@modules/supervisor/dao/supervisor-dao/findByEmail.dao.js';
import { findById } from '@modules/supervisor/dao/supervisor-dao/findById.dao.js';
import { updatePreferences } from '@modules/supervisor/dao/supervisor-dao/updatePreferences.dao.js';
import { updatePasswordHash } from '@modules/supervisor/dao/supervisor-dao/updatePasswordHash.dao.js';

class SupervisorDAO {
  async create(data) {
    return create.call(this, data);
  }

  async findByEmail(email) {
    return findByEmail.call(this, email);
  }

  async findById(id) {
    return findById.call(this, id);
  }

  async updatePreferences(id, preferences) {
    return updatePreferences.call(this, id, preferences);
  }

  async updatePasswordHash(id, passwordHash) {
    return updatePasswordHash.call(this, id, passwordHash);
  }
}

export default SupervisorDAO;
