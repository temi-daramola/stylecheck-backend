import { findBySupervisorId } from '@modules/style-manual/dao/style-manual-dao/findBySupervisorId.dao.js';
import { findForProcessing } from '@modules/style-manual/dao/style-manual-dao/findForProcessing.dao.js';
import { saveUpload } from '@modules/style-manual/dao/style-manual-dao/saveUpload.dao.js';
import { applyRules } from '@modules/style-manual/dao/style-manual-dao/applyRules.dao.js';

class StyleManualDAO {
  async findBySupervisorId(supervisorId) {
    return findBySupervisorId.call(this, supervisorId);
  }

  async findForProcessing(supervisorId) {
    return findForProcessing.call(this, supervisorId);
  }

  async saveUpload(supervisorId, upload) {
    return saveUpload.call(this, supervisorId, upload);
  }

  async applyRules(supervisorId, rules) {
    return applyRules.call(this, supervisorId, rules);
  }
}

export default StyleManualDAO;
