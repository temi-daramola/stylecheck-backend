import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { utils } from '@modules/compliance/utils/_index.js';
import { loadOwnedCheck } from '@modules/compliance/controller/compliance/loadOwnedCheck.util.js';

const { ResponseUtils } = common.utilities;
const { AppError, NotFoundError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES, EMAIL } = ComplianceConstants;
const { buildReportData, buildReportFileName, buildShareEmailHtml, toCheckDetailDto } = utils.report;

export async function shareCheck(id, supervisorId, { studentEmail, message }) {
  try {
    const { check, ruleResults } = await loadOwnedCheck(this.checkDAO, this.ruleResultDAO, id, supervisorId);
    const supervisor = await this.supervisorDAO.findById(supervisorId);
    if (!supervisor) {
      throw new NotFoundError('Supervisor', { layer: Layer.CONTROLLER });
    }

    const pdf = await this.adapters.pdfAdapter.renderComplianceReport(buildReportData(check, ruleResults));

    // Send first, record second: a failed send must never be recorded as shared.
    await this.adapters.brevoAdapter.sendEmail({
      to: studentEmail,
      subject: EMAIL.SHARE_SUBJECT(check.studentName),
      htmlContent: buildShareEmailHtml({ supervisorName: supervisor.name, check, message }),
      attachment: { name: buildReportFileName(check.studentName), content: pdf },
    });

    const updated = await this.checkDAO.markShared(check._id, supervisorId, studentEmail);
    return ResponseUtils.success(MESSAGES.SHARE_SUCCESS, toCheckDetailDto(updated, ruleResults));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.SHARE_FAILED, {
      code: CODES.SHARE_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
