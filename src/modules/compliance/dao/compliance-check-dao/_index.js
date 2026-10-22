import { create } from '@modules/compliance/dao/compliance-check-dao/create.dao.js';
import { findByIdForSupervisor } from '@modules/compliance/dao/compliance-check-dao/findByIdForSupervisor.dao.js';
import { findPaginatedBySupervisor } from '@modules/compliance/dao/compliance-check-dao/findPaginatedBySupervisor.dao.js';
import { countBySupervisor } from '@modules/compliance/dao/compliance-check-dao/countBySupervisor.dao.js';
import { markShared } from '@modules/compliance/dao/compliance-check-dao/markShared.dao.js';
import { deleteById } from '@modules/compliance/dao/compliance-check-dao/deleteById.dao.js';

class ComplianceCheckDAO {
  async create(data) {
    return create.call(this, data);
  }

  async findByIdForSupervisor(id, supervisorId) {
    return findByIdForSupervisor.call(this, id, supervisorId);
  }

  async findPaginatedBySupervisor(supervisorId, pagination) {
    return findPaginatedBySupervisor.call(this, supervisorId, pagination);
  }

  async countBySupervisor(supervisorId) {
    return countBySupervisor.call(this, supervisorId);
  }

  async markShared(id, supervisorId, studentEmail) {
    return markShared.call(this, id, supervisorId, studentEmail);
  }

  async deleteById(id) {
    return deleteById.call(this, id);
  }
}

export default ComplianceCheckDAO;
