export const ComplianceConstants = Object.freeze({
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  DEFAULT_RULES: [
    { ruleId: 'font-size', ruleName: 'Font size (12pt body text)', defaultStatus: 'Passed', description: 'Body text adheres to 12pt standard font specification.' },
    { ruleId: 'margins', ruleName: 'Page margins (1 inch all sides)', defaultStatus: 'Passed', description: 'Margins match 1.0 inch / 2.54 cm all borders.' },
    { ruleId: 'line-spacing', ruleName: 'Line spacing (1.5 lines)', defaultStatus: 'Passed', description: 'Paragraph line spacing conforms to 1.5 spacing requirement.' },
    { ruleId: 'citation-format', ruleName: 'Citation format (APA 7th Ed.)', defaultStatus: 'Failed', description: 'In-text citations show inconsistent date punctuation in chapter body.' },
    { ruleId: 'reference-list', ruleName: 'Reference list format', defaultStatus: 'Failed', description: 'Missing hanging indent on entries and unitalicized journal titles.' },
    { ruleId: 'heading-format', ruleName: 'Heading format (bold, centred)', defaultStatus: 'Passed', description: 'Level 1 and Level 2 headings follow style manual hierarchy.' },
    { ruleId: 'page-numbering', ruleName: 'Page numbering', defaultStatus: 'Passed', description: 'Page numbers placed top right starting Arabic numerals on chapter opener.' },
    { ruleId: 'toc-format', ruleName: 'Table of contents format', defaultStatus: 'Failed', description: 'Dot leaders missing for sub-sections 3.2.1 through 3.2.4.' },
  ],
  MESSAGES: {
    CHECK_SUCCESS: 'Compliance analysis completed successfully',
    FETCH_SUCCESS: 'Recent compliance checks retrieved',
    CHECK_DETAIL_SUCCESS: 'Compliance report retrieved successfully',
    NOT_FOUND: 'Compliance report not found',
    FILE_REQUIRED: 'A student document (.docx) is required',
    STUDENT_NAME_REQUIRED: 'Student name is required',
    CHAPTER_REQUIRED: 'Chapter or section selection is required',
    SHARE_SUCCESS: 'Report sent successfully',
    EMAIL_REQUIRED: 'Student email is required',
  },
});
