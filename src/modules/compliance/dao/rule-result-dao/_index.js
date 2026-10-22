import { createMany } from '@modules/compliance/dao/rule-result-dao/createMany.dao.js';
import { findByCheckId } from '@modules/compliance/dao/rule-result-dao/findByCheckId.dao.js';

class RuleResultDAO {
  async createMany(checkId, results) {
    return createMany.call(this, checkId, results);
  }

  async findByCheckId(checkId) {
    return findByCheckId.call(this, checkId);
  }
}

export default RuleResultDAO;
