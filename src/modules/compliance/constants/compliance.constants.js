const RULES_PLACEHOLDER = '{{STYLE_RULES}}';
const TEXT_PLACEHOLDER = '{{DOCUMENT_TEXT}}';
const PROFILE_PLACEHOLDER = '{{FORMATTING_PROFILE}}';

const COMPLIANCE_PROMPT = `You are a document compliance checker. You will be given:
1. A list of style rules that the document must follow.
2. The full text of a student academic document.
3. The formatting profile of that document (margins, fonts, spacing, indentation).

For each rule, determine whether the document PASSES or FAILS that rule.
Use the document text to check content-based rules (citations, paragraph starters, spelling, reference list).
Use the formatting profile to check formatting-based rules (margins, font, font size, line spacing).
If a value in the formatting profile is null or listed under "unresolved", it could not be measured: do not guess it.

Return ONLY valid JSON in this exact format:
{
  "results": [
    {
      "ruleName": "<rule name>",
      "status": "Passed" | "Failed",
      "reasoning": "<one or two sentences explaining the verdict>"
    }
  ]
}

Do NOT include an overall score. Return one result object per rule, in the same order as the rules list.

STYLE RULES:
${RULES_PLACEHOLDER}

DOCUMENT TEXT:
${TEXT_PLACEHOLDER}

DOCUMENT FORMATTING PROFILE:
${PROFILE_PLACEHOLDER}`;

export const ComplianceConstants = Object.freeze({
  RESOURCE: 'ComplianceCheck',
  UPLOAD_FIELD: 'document',
  DOCX_EXTENSION: '.docx',
  DOCX_MIME_TYPES: Object.freeze([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  ]),
  BYTES_PER_MB: 1024 * 1024,
  MAX_DOCUMENT_TEXT_LENGTH: 1000000,
  MIN_DOCUMENT_TEXT_LENGTH: 1,
  CHAPTERS: Object.freeze([
    'Chapter One',
    'Chapter Two',
    'Chapter Three',
    'Chapter Four',
    'Chapter Five',
    'Proposal',
    'Full Document',
  ]),
  RATE_LIMITS: Object.freeze({
    CREATE_CHECK: Object.freeze({ windowMinutes: 60, max: 60, message: 'You have run many checks recently. Please try again later.' }),
    SHARE: Object.freeze({ windowMinutes: 60, max: 60, message: 'You have sent many reports recently. Please try again later.' }),
  }),
  MAX_STUDENT_NAME_LENGTH: 200,
  MAX_SHARE_MESSAGE_LENGTH: 2000,
  STATUS: Object.freeze({ PASSED: 'Passed', FAILED: 'Failed' }),
  BANDS: Object.freeze({
    FULL: 'Full Compliance',
    PARTIAL: 'Partial Compliance',
    NON_COMPLIANT: 'Non-Compliant',
  }),
  BAND_THRESHOLDS: Object.freeze({ FULL_MIN: 85, PARTIAL_MIN: 60 }),
  INSTITUTION_NAME: 'Department of Information Science, University of Ibadan',
  PROMPT: Object.freeze({
    TEMPLATE: COMPLIANCE_PROMPT,
    RULES_PLACEHOLDER,
    TEXT_PLACEHOLDER,
    PROFILE_PLACEHOLDER,
  }),
  EMAIL: Object.freeze({
    SHARE_SUBJECT: (studentName) => `Style compliance report for ${studentName}`,
    COMPLETED_SUBJECT: (studentName) => `Compliance check completed: ${studentName}`,
    ATTACHMENT_PREFIX: 'StyleCheck-Report',
    PDF_EXTENSION: '.pdf',
  }),
  MESSAGES: Object.freeze({
    CHECK_SUCCESS: 'Compliance analysis completed successfully',
    LIST_SUCCESS: 'Compliance checks retrieved successfully',
    DETAIL_SUCCESS: 'Compliance report retrieved successfully',
    SHARE_SUCCESS: 'Report sent successfully',
    NOT_FOUND_RESOURCE: 'Compliance report',
    MANUAL_REQUIRED: 'Upload a style manual before running a compliance check.',
    FILE_REQUIRED: 'A student document (.docx) is required',
    FILE_TYPE_INVALID: 'Only .docx files are accepted for student documents.',
    FILE_TOO_LARGE: 'The document is larger than the allowed size.',
    UPLOAD_FAILED: 'The file could not be uploaded.',
    STUDENT_NAME_REQUIRED: 'Student name is required',
    STUDENT_NAME_TOO_LONG: 'Student name is too long',
    CHAPTER_INVALID: 'Select a valid chapter or section',
    EMAIL_INVALID: 'A valid student email address is required',
    MESSAGE_TOO_LONG: 'The message is too long',
    ID_INVALID: 'Invalid report identifier',
    DOCUMENT_EMPTY: 'No readable text was found in this document.',
    DOCUMENT_TOO_LONG: 'This document is too long to analyse.',
    RESULTS_INCOMPLETE: 'The AI returned an incomplete analysis. Please try again.',
    CHECK_FAILED: 'Failed to run compliance check',
    LIST_FAILED: 'Failed to retrieve compliance checks',
    DETAIL_FAILED: 'Failed to retrieve compliance report',
    PDF_FAILED: 'Failed to generate the report',
    SHARE_FAILED: 'Failed to send the report',
    NOTIFY_FAILED_LOG: 'Could not send completion notification',
  }),
  CODES: Object.freeze({
    MANUAL_REQUIRED: 'STYLE_MANUAL_REQUIRED',
    CHECK_FAILED: 'COMPLIANCE_CHECK_FAILED',
    LIST_FAILED: 'COMPLIANCE_LIST_FAILED',
    DETAIL_FAILED: 'COMPLIANCE_DETAIL_FAILED',
    PDF_FAILED: 'COMPLIANCE_PDF_FAILED',
    SHARE_FAILED: 'COMPLIANCE_SHARE_FAILED',
    RESULTS_INCOMPLETE: 'AI_RESULTS_INCOMPLETE',
  }),
  API: Object.freeze({
    BASE: '/api/checks',
    ROOT: '/',
    BY_ID: '/:id',
    PDF: '/:id/pdf',
    SHARE: '/:id/share',
  }),
});
