import { getProfile } from '@modules/supervisor/controller/supervisor/getProfile.js';
import { updatePreferences } from '@modules/supervisor/controller/supervisor/updatePreferences.js';

class SupervisorController {
  constructor(supervisorDAO) {
    this.supervisorDAO = supervisorDAO;
  }

  async getProfile(supervisorId) {
    return getProfile.call(this, supervisorId);
  }

  async updatePreferences(supervisorId, input) {
    return updatePreferences.call(this, supervisorId, input);
  }
}

export default SupervisorController;
