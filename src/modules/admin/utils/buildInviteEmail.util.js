import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';

const { escapeHtml } = common.utilities;
const { env } = common.constants;

export function buildInviteLink(rawToken) {
  return `${env.FRONTEND_URL}${AdminConstants.SET_PASSWORD_PATH}?token=${encodeURIComponent(rawToken)}&invite=1`;
}

export function buildInviteEmailHtml({ supervisorName, link }) {
  return `
    <p>Hello ${escapeHtml(supervisorName)},</p>
    <p>An administrator has added you to StyleCheck, the tool for checking student documents against your
       institution's style manual.</p>
    <p>Set your password to get started. The link is valid for ${AdminConstants.INVITE_TTL_HOURS} hours and can be used once.</p>
    <p><a href="${escapeHtml(link)}">Set your password</a></p>
    <p style="color:#64748B">If you were not expecting this, you can ignore this email.</p>`;
}
