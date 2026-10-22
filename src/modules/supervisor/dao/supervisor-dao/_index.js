import { create } from '@modules/supervisor/dao/supervisor-dao/create.dao.js';
import { findByEmail } from '@modules/supervisor/dao/supervisor-dao/findByEmail.dao.js';
import { findById } from '@modules/supervisor/dao/supervisor-dao/findById.dao.js';
import { findAll } from '@modules/supervisor/dao/supervisor-dao/findAll.dao.js';
import { updatePreferences } from '@modules/supervisor/dao/supervisor-dao/updatePreferences.dao.js';
import { updatePasswordHash } from '@modules/supervisor/dao/supervisor-dao/updatePasswordHash.dao.js';
import { setActive } from '@modules/supervisor/dao/supervisor-dao/setActive.dao.js';
import { countActiveAdmins } from '@modules/supervisor/dao/supervisor-dao/countActiveAdmins.dao.js';

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

  async findAll() {
    return findAll.call(this);
  }

  async updatePreferences(id, preferences) {
    return updatePreferences.call(this, id, preferences);
  }

  async updatePasswordHash(id, passwordHash) {
    return updatePasswordHash.call(this, id, passwordHash);
  }

  async setActive(id, isActive) {
    return setActive.call(this, id, isActive);
  }

  async countActiveAdmins() {
    return countActiveAdmins.call(this);
  }
}

export default SupervisorDAO;
