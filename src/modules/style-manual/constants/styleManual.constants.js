const PROMPT_TEXT_PLACEHOLDER = '{{STYLE_MANUAL_TEXT}}';
const PROMPT_FOCUS_PLACEHOLDER = '{{FOCUS}}';

// This text is also the specification in the product brief (Section 9, Call 1). Keep the two identical.
const RULE_EXTRACTION_PROMPT = `You are an expert analyst of academic style manuals and formatting guidelines. You will be given the full text of an institutional style manual. Your job is to extract EVERY rule it contains into a complete, structured, machine-readable list that will later be used to check student documents. Completeness and precision matter more than brevity. A rule you omit can never be checked.

WHAT COUNTS AS A RULE
Any statement that requires, forbids, limits or fixes something about how a document must be written, formatted, structured, cited or referenced. This includes: mandatory requirements ("must", "shall", "is required"), prohibitions ("must not", "is not permitted", "avoid"), exact values (sizes, margins, spacing, limits, counts), mandatory formats, the required order and content of sections, naming and numbering conventions, and rules that apply only in particular cases. If the manual says it, and a document could comply or fail to comply, it is a rule.

HOW TO WORK
1. Read the entire text before writing anything, including headings, lists, tables, footnotes, sample pages and appendices.
2. Go through the manual part by part, in order, and extract every rule you find. Do not stop early and do not skip a part because it looks minor or repetitive.
3. Before you answer, check your work: re-scan the manual for every numbered or lettered item, every list entry and every table row, and confirm each one is covered by at least one rule. Add anything you missed.

GRANULARITY (the most important instruction)
- One rule = one single checkable requirement. NEVER merge several requirements into one rule, and NEVER summarise a group of rules into a general statement.
- If a rule, list or table contains several requirements, create a separate rule for each one. Example: a list of font settings for ten kinds of text becomes ten rules, one per kind of text, each with its own values. A rule for several source types (books, journals, websites) becomes one rule per source type. A rule with sub-parts (a), (b), (c) or (i), (ii), (iii) becomes one rule per sub-part.
- Keep every exact value: numbers, units, measurements, limits, ranges, counts, fonts, capitalisation, punctuation patterns, and examples given as the required form. Never replace a value with phrases such as "as specified", "appropriate", "various" or "the required size".
- Keep conditions: if a rule applies only to certain pages, sections, source types or situations, say so in the rule.
- If the same requirement is stated more than once, create one rule and cite every place it appears. If two statements conflict, create both rules and say that they conflict in the description.
- Do not invent rules, and do not add requirements that the manual does not state. Do not include introductions, explanations, rationale, advice that is clearly optional, or administrative text that contains no requirement.

SOURCE REFERENCES
For each rule, record where it comes from, in the manual's own terms: its rule number or letter if it has one (for example "[15](b)"), otherwise its section or heading and, if useful, page. Use the manual's own numbering whenever it exists, but do not rely on numbering: some manuals have none.

CATEGORIES
Give each rule exactly one category: "formatting" (page layout, fonts, spacing, margins, alignment), "structure" (required sections, their order, numbering, chapter limits, page numbering, tables and figures), "content" (language, spelling, wording, what a section must contain, length limits), "citation" (in-text citations and quotations), "reference-list" (the reference list and its entry formats), or "submission" (binding, copies, approval, anything about physical or administrative submission).

VERIFIABILITY
State how a Word (.docx) document could be checked against the rule:
- "formatting" if it depends on measurable formatting (margins, fonts, sizes, spacing, indents, alignment, bold/italic, page-number placement);
- "text" if it depends on the written content (spelling, wording, citation and reference patterns, section headings and order, word limits);
- "both" if it needs formatting and text;
- "not-verifiable" if it cannot be checked from the document file (paper quality, binding, number of printed copies, signatures, approvals, anything physical or administrative).
Never omit a rule because it cannot be checked: extract it and mark it "not-verifiable".

OUTPUT
Return ONLY valid JSON in exactly this format, with no commentary, no explanations and no text outside the JSON:
{
  "rules": [
    {
      "ruleId": "R001",
      "sourceRef": "<where it comes from in the manual>",
      "category": "formatting | structure | content | citation | reference-list | submission",
      "verifiability": "formatting | text | both | not-verifiable",
      "ruleName": "<short name, 2 to 8 words>",
      "description": "<the complete requirement in plain words, stating every exact value, limit and condition>"
    }
  ]
}
There is no limit on the number of rules. Return every rule. If the manual is long, still return every rule, keeping each description as short as exactness allows.
${PROMPT_FOCUS_PLACEHOLDER}
STYLE MANUAL TEXT:
${PROMPT_TEXT_PLACEHOLDER}`;

// Added to the prompt only for the follow-up call that asks for numbered items the first pass skipped.
const FOCUS_INSTRUCTION = (references) => `
FOCUS FOR THIS REQUEST
An earlier pass already extracted most of this manual, but it did not cover these numbered items: ${references}. In this request extract ONLY the rules found in those numbered items (and their sub-parts), following every instruction above exactly. Do not repeat rules from other parts of the manual.
`;

export const StyleManualConstants = Object.freeze({
  RESOURCE: 'StyleManual',
  FILE_TYPES: Object.freeze(['pdf', 'docx']),
  STATUS: Object.freeze({ UPLOADED: 'uploaded', READY: 'ready' }),
  CATEGORIES: Object.freeze(['formatting', 'structure', 'content', 'citation', 'reference-list', 'submission']),
  VERIFIABILITY: Object.freeze({
    FORMATTING: 'formatting',
    TEXT: 'text',
    BOTH: 'both',
    NOT_VERIFIABLE: 'not-verifiable',
  }),
  // When the model leaves a field out or invents a value: the safe defaults (the check step can still answer "Not verifiable").
  DEFAULT_CATEGORY: 'content',
  DEFAULT_VERIFIABILITY: 'both',
  MAX_FILE_NAME_LENGTH: 255,
  MIN_EXTRACTED_TEXT_LENGTH: 200,
  MAX_RULES: 400,
  MAX_RULE_NAME_LENGTH: 200,
  MAX_RULE_DESCRIPTION_LENGTH: 1500,
  MAX_SOURCE_REF_LENGTH: 120,
  RULE_ID_PREFIX: 'R',
  RULE_ID_PAD_LENGTH: 3,
  // Plenty of room for a long rule list: a truncated answer would silently lose rules.
  MAX_OUTPUT_TOKENS: 60000,
  // Long manuals produce long answers: allow more than the usual per-attempt limit.
  REQUEST_TIMEOUT_MS: 180000,
  COVERAGE: Object.freeze({
    // Numbered rules look like [12] or [ 12 ] (the PDF text sometimes adds a space).
    MARKER_PATTERN: /\[\s*(\d{1,3})\s*\]/g,
    // Only trust the check when the manual clearly numbers its rules this way.
    MIN_MARKERS: 5,
    // Do not follow up on a huge unexplained gap; something else is wrong.
    MAX_FOLLOW_UP_MARKERS: 60,
  }),
  PROMPT_TEXT_PLACEHOLDER,
  PROMPT_FOCUS_PLACEHOLDER,
  RULE_EXTRACTION_PROMPT,
  FOCUS_INSTRUCTION,
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
    EXTRACTION_SUMMARY_LOG: 'Style manual rules extracted',
    COVERAGE_GAP_LOG: 'Numbered items in the manual are still not covered by any rule',
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
