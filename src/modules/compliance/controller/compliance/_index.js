import { createCheck } from '@modules/compliance/controller/compliance/createCheck.js';
import { notifySupervisor } from '@modules/compliance/controller/compliance/notifySupervisor.js';
import { listChecks } from '@modules/compliance/controller/compliance/listChecks.js';
import { getCheck } from '@modules/compliance/controller/compliance/getCheck.js';
import { getReportPdf } from '@modules/compliance/controller/compliance/getReportPdf.js';
import { shareCheck } from '@modules/compliance/controller/compliance/shareCheck.js';

class ComplianceController {
  /**
   * @param adapters { docxTextAdapter, docxFormattingAdapter, geminiAdapter, pdfAdapter, brevoAdapter }
   */
  constructor({ checkDAO, ruleResultDAO, styleManualDAO, supervisorDAO, adapters, logger }) {
    this.checkDAO = checkDAO;
    this.ruleResultDAO = ruleResultDAO;
    this.styleManualDAO = styleManualDAO;
    this.supervisorDAO = supervisorDAO;
    this.adapters = adapters;
    this.logger = logger;
  }

  async createCheck(supervisorId, input) {
    return createCheck.call(this, supervisorId, input);
  }

  notifySupervisor(supervisorId, check) {
    return notifySupervisor.call(this, supervisorId, check);
  }

  async listChecks(supervisorId, query) {
    return listChecks.call(this, supervisorId, query);
  }

  async getCheck(id, supervisorId) {
    return getCheck.call(this, id, supervisorId);
  }

  async getReportPdf(id, supervisorId) {
    return getReportPdf.call(this, id, supervisorId);
  }

  async shareCheck(id, supervisorId, input) {
    return shareCheck.call(this, id, supervisorId, input);
  }
}

export default ComplianceController;
