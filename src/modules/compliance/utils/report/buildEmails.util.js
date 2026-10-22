import { common } from '@common/_index.js';

const { escapeHtml } = common.utilities;

export function buildShareEmailHtml({ supervisorName, check, message }) {
  const note = message ? `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>` : '';
  return `
    <p>Hello ${escapeHtml(check.studentName)},</p>
    <p>${escapeHtml(supervisorName)} has shared your style compliance report for
       <strong>${escapeHtml(check.chapterSection)}</strong>. It is attached as a PDF.</p>
    <p><strong>Score:</strong> ${check.complianceScore}/100 (${escapeHtml(check.complianceBand)})</p>
    ${note}
    <p style="color:#64748B">Sent via StyleCheck</p>`;
}

export function buildCompletionEmailHtml({ supervisorName, check }) {
  return `
    <p>Hello ${escapeHtml(supervisorName)},</p>
    <p>The compliance check for <strong>${escapeHtml(check.studentName)}</strong>
       (${escapeHtml(check.chapterSection)}) is complete.</p>
    <p><strong>Score:</strong> ${check.complianceScore}/100 (${escapeHtml(check.complianceBand)})</p>
    <p style="color:#64748B">Sent via StyleCheck</p>`;
}
