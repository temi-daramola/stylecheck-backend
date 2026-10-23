const RULES_PLACEHOLDER = '{{STYLE_RULES}}';
const TEXT_PLACEHOLDER = '{{DOCUMENT_TEXT}}';
const PROFILE_PLACEHOLDER = '{{FORMATTING_PROFILE}}';

// This text is also the specification in the product brief (Section 9, Call 2). Keep the two identical.
const COMPLIANCE_PROMPT = `You are a document compliance checker. You will be given:
1. A list of style rules, each with an ID, that the document must follow.
2. The full text of a student academic document.
3. The formatting profile of that document (margins, fonts, spacing, indentation).

For EVERY rule in the list, decide one of three outcomes:
- "Passed": the document clearly follows the rule.
- "Failed": the document clearly breaks the rule, or the required element is missing.
- "Not verifiable": the document text and formatting profile do not contain enough information to decide. Use this whenever a value is null or listed under "unresolved" in the formatting profile, or the rule concerns something not present in the data you were given. NEVER guess: if you cannot tell, answer "Not verifiable".

Use the document text for content-based rules (citations, wording, headings, spelling, reference list).
Use the formatting profile for formatting-based rules (margins, font, font size, line spacing, indentation).

Be brief. For "Failed" and "Not verifiable", give one short sentence saying what was found or what is missing. For "Passed", give a few words at most (or an empty string).

Return ONLY valid JSON in exactly this format, with no other text:
{
  "results": [
    { "ruleId": "<the rule's ID exactly as given>", "status": "Passed" | "Failed" | "Not verifiable", "reasoning": "<short>" }
  ]
}

Return exactly one result for every rule, using the rule's ID exactly as given. Do NOT include an overall score.

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
  PENDING_TTL_HOURS: 24,
  MANUAL_READY_STATUS: 'ready',
  STATUS: Object.freeze({ PASSED: 'Passed', FAILED: 'Failed', NOT_VERIFIABLE: 'Not verifiable', PENDING: 'pending', COMPLETED: 'completed' }),
  BANDS: Object.freeze({
    FULL: 'Full Compliance',
    PARTIAL: 'Partial Compliance',
    NON_COMPLIANT: 'Non-Compliant',
  }),
  NOT_VERIFIABLE_VERIFIABILITY: 'not-verifiable',
  NOT_VERIFIABLE_REASON: 'This rule cannot be checked from the document file (it concerns something physical or administrative).',
  MISSING_VERDICT_REASON: 'The AI did not give a verdict for this rule.',
  // Up to this share (and at least this many) of verdicts may be missing before the whole run is rejected.
  MISSING_VERDICT_TOLERANCE: Object.freeze({ share: 0.2, minimum: 3 }),
  MAX_REASONING_LENGTH: 1000,
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
    RETRY_NOT_FOUND: 'Pending compliance check',
    MANUAL_NOT_READY: 'Your style manual has not been processed yet. Open Settings to process it, then try again.',
    LIST_FAILED: 'Failed to retrieve compliance checks',
    DETAIL_FAILED: 'Failed to retrieve compliance report',
    PDF_FAILED: 'Failed to generate the report',
    SHARE_FAILED: 'Failed to send the report',
    NOTIFY_FAILED_LOG: 'Could not send completion notification',
  }),
  CODES: Object.freeze({
    MANUAL_REQUIRED: 'STYLE_MANUAL_REQUIRED',
    CHECK_FAILED: 'COMPLIANCE_CHECK_FAILED',
    MANUAL_NOT_READY: 'STYLE_MANUAL_NOT_READY',
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
    RETRY: '/:id/retry',
  }),
});
