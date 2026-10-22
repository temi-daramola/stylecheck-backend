import { listSupervisors } from '@modules/admin/controller/admin/listSupervisors.js';
import { createSupervisor } from '@modules/admin/controller/admin/createSupervisor.js';
import { resendInvite } from '@modules/admin/controller/admin/resendInvite.js';
import { setSupervisorActive } from '@modules/admin/controller/admin/setSupervisorActive.js';
import { ensureInitialAdmin } from '@modules/admin/controller/admin/ensureInitialAdmin.js';

class AdminController {
  constructor({ supervisorDAO, refreshTokenDAO, passwordResetTokenDAO, passwordAdapter, jwtAdapter, brevoAdapter, logger }) {
    this.supervisorDAO = supervisorDAO;
    this.refreshTokenDAO = refreshTokenDAO;
    this.passwordResetTokenDAO = passwordResetTokenDAO;
    this.passwordAdapter = passwordAdapter;
    this.jwtAdapter = jwtAdapter;
    this.brevoAdapter = brevoAdapter;
    this.logger = logger;
  }

  async listSupervisors() {
    return listSupervisors.call(this);
  }

  async createSupervisor(input) {
    return createSupervisor.call(this, input);
  }

  async resendInvite(id) {
    return resendInvite.call(this, id);
  }

  async setSupervisorActive(id, isActive, actorId) {
    return setSupervisorActive.call(this, id, isActive, actorId);
  }

  async ensureInitialAdmin() {
    return ensureInitialAdmin.call(this);
  }
}

export default AdminController;
