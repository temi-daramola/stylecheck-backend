const PROMPT_TEXT_PLACEHOLDER = '{{STYLE_MANUAL_TEXT}}';

const RULE_EXTRACTION_PROMPT = `You are an academic style manual analyser. You will be given the full text of an institutional academic style manual.

Your task is to identify and extract ALL formatting, structural, and citation rules from this document into a consistent, structured list.

Return ONLY valid JSON in this exact format:
{
  "rules": [
    {
      "ruleId": "R01",
      "ruleName": "<short rule name>",
      "description": "<one sentence describing exactly what this rule requires>"
    }
  ]
}

Do not include commentary. Extract every rule you can identify.

STYLE MANUAL TEXT:
${PROMPT_TEXT_PLACEHOLDER}`;

export const StyleManualConstants = Object.freeze({
  RESOURCE: 'StyleManual',
  FILE_TYPES: Object.freeze(['pdf', 'docx']),
  STATUS: Object.freeze({ UPLOADED: 'uploaded', READY: 'ready' }),
  MAX_FILE_NAME_LENGTH: 255,
  MIN_EXTRACTED_TEXT_LENGTH: 200,
  MAX_RULES: 200,
  MAX_RULE_NAME_LENGTH: 200,
  MAX_RULE_DESCRIPTION_LENGTH: 1000,
  RULE_ID_PREFIX: 'R',
  RULE_ID_PAD_LENGTH: 2,
  PROMPT_TEXT_PLACEHOLDER,
  RULE_EXTRACTION_PROMPT,
  MESSAGES: Object.freeze({
    FETCH_SUCCESS: 'Style manual retrieved successfully',
    UPLOAD_SUCCESS: 'Style manual updated successfully',
    PROCESS_SUCCESS: 'Style manual processed successfully',
    NOTHING_TO_PROCESS: 'There is no uploaded style manual waiting to be processed.',
    FILE_NAME_REQUIRED: 'File name is required',
    FILE_NAME_TOO_LONG: 'File name is too long',
    FILE_TYPE_INVALID: 'File type must be pdf or docx',
    FILE_SIZE_INVALID: 'File size must be a non-negative number',
    TEXT_REQUIRED: 'Extracted text is required',
    TEXT_TOO_SHORT: 'This file has no readable text. Please upload a text-based PDF or a DOCX.',
    TEXT_TOO_LONG: 'The style manual text is too long',
    NO_RULES_EXTRACTED: 'No style rules could be found in this document. Please check that it is a style manual.',
    GET_FAILED: 'Failed to retrieve style manual',
    UPLOAD_FAILED: 'Failed to process style manual',
    SAVE_FAILED: 'Failed to save the style manual',
  }),
  CODES: Object.freeze({
    NO_RULES_EXTRACTED: 'NO_RULES_EXTRACTED',
    GET_FAILED: 'STYLE_MANUAL_GET_FAILED',
    UPLOAD_FAILED: 'STYLE_MANUAL_UPLOAD_FAILED',
    NOTHING_TO_PROCESS: 'STYLE_MANUAL_NOTHING_TO_PROCESS',
  }),
  API: Object.freeze({
    BASE: '/api/manuals',
    ME: '/me',
    ROOT: '/',
    PROCESS: '/process',
  }),
});
