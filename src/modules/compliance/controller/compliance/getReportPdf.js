import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { utils } from '@modules/compliance/utils/_index.js';
import { loadOwnedCheck } from '@modules/compliance/controller/compliance/loadOwnedCheck.util.js';

const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = ComplianceConstants;
const { buildReportData, buildReportFileName } = utils.report;

/** Builds the PDF on demand from the stored results. Returns raw bytes, not a JSON envelope. */
export async function getReportPdf(id, supervisorId) {
  try {
    const { check, ruleResults } = await loadOwnedCheck(this.checkDAO, this.ruleResultDAO, id, supervisorId);
    const buffer = await this.adapters.pdfAdapter.renderComplianceReport(buildReportData(check, ruleResults));
    return { buffer, fileName: buildReportFileName(check.studentName) };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.PDF_FAILED, {
      code: CODES.PDF_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
