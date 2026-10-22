import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { INSTITUTION_NAME, EMAIL } = ComplianceConstants;
const DATE_LOCALE = 'en-GB';
const DATE_OPTIONS = { day: 'numeric', month: 'long', year: 'numeric' };
const UNSAFE_FILENAME_CHARS = /[^a-z0-9]+/gi;
const FILENAME_SEPARATOR = '-';

export function buildReportData(check, ruleResults) {
  return {
    institutionName: INSTITUTION_NAME,
    studentName: check.studentName,
    chapterSection: check.chapterSection,
    checkDate: new Date(check.checkDate).toLocaleDateString(DATE_LOCALE, DATE_OPTIONS),
    score: check.complianceScore,
    band: check.complianceBand,
    passed: check.rulesPassed,
    failed: check.rulesFailed,
    rules: ruleResults.map(({ ruleName, status, reasoning }) => ({ ruleName, status, reasoning })),
  };
}

export function buildReportFileName(studentName) {
  const safeName = studentName.replace(UNSAFE_FILENAME_CHARS, FILENAME_SEPARATOR).replace(/^-|-$/g, '');
  return `${EMAIL.ATTACHMENT_PREFIX}-${safeName || 'Student'}${EMAIL.PDF_EXTENSION}`;
}
