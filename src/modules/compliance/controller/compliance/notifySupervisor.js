import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { utils } from '@modules/compliance/utils/_index.js';

const { MESSAGES, EMAIL } = ComplianceConstants;
const { buildCompletionEmailHtml } = utils.report;

/**
 * Best-effort "check completed" email to the supervisor, if they enabled the preference.
 * Deliberately not awaited by the caller: a failed notification must never fail the check.
 */
export function notifySupervisor(supervisorId, check) {
  (async () => {
    const supervisor = await this.supervisorDAO.findById(supervisorId);
    if (!supervisor?.preferences?.emailNotifications) return;

    await this.adapters.brevoAdapter.sendEmail({
      to: supervisor.email,
      subject: EMAIL.COMPLETED_SUBJECT(check.studentName),
      htmlContent: buildCompletionEmailHtml({ supervisorName: supervisor.name, check }),
    });
  })().catch((error) => this.logger.warn({ err: error, supervisorId }, MESSAGES.NOTIFY_FAILED_LOG));
}
