import { findBySupervisorId } from '@modules/style-manual/dao/style-manual-dao/findBySupervisorId.dao.js';
import { replaceForSupervisor } from '@modules/style-manual/dao/style-manual-dao/replaceForSupervisor.dao.js';

class StyleManualDAO {
  async findBySupervisorId(supervisorId) {
    return findBySupervisorId.call(this, supervisorId);
  }

  async replaceForSupervisor(supervisorId, data) {
    return replaceForSupervisor.call(this, supervisorId, data);
  }
}

export default StyleManualDAO;
