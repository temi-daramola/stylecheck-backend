import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { utils } from '@modules/admin/utils/_index.js';

const { INVITE_TTL_HOURS, EMAIL } = AdminConstants;
const { buildInviteLink, buildInviteEmailHtml } = utils;
const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Replaces any older set-password links for this supervisor with a fresh single-use one and emails it.
 * Throws if the email cannot be sent. Called with the controller as `this`.
 */
export async function issueInvite(supervisor) {
  const { rawToken, tokenHash } = this.jwtAdapter.generateRefreshToken();

  await this.passwordResetTokenDAO.deleteAllForSupervisor(supervisor._id);
  await this.passwordResetTokenDAO.create({
    tokenHash,
    supervisorId: supervisor._id,
    expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * MS_PER_HOUR),
  });

  await this.brevoAdapter.sendEmail({
    to: supervisor.email,
    subject: EMAIL.INVITE_SUBJECT,
    htmlContent: buildInviteEmailHtml({ supervisorName: supervisor.name, link: buildInviteLink(rawToken) }),
  });
}
