import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { escapeHtml } = common.utilities;
const { env } = common.constants;

export function buildResetLink(rawToken) {
  return `${env.FRONTEND_URL}${AuthConstants.RESET_LINK_PATH}?token=${encodeURIComponent(rawToken)}`;
}

export function buildResetEmailHtml({ supervisorName, link }) {
  return `
    <p>Hello ${escapeHtml(supervisorName)},</p>
    <p>We received a request to reset your StyleCheck password.
       This link is valid for ${AuthConstants.RESET_TOKEN_TTL_MINUTES} minutes and can be used once.</p>
    <p><a href="${escapeHtml(link)}">Reset your password</a></p>
    <p style="color:#64748B">If you did not ask for this, you can ignore this email.</p>`;
}
