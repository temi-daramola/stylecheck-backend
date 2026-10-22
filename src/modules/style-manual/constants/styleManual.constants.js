export const StyleManualConstants = Object.freeze({
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024, // 20 MB
  MESSAGES: {
    FETCH_SUCCESS: 'Active style manual retrieved',
    UPLOAD_SUCCESS: 'Style manual updated successfully',
    NOT_FOUND: 'No active style manual found',
    FILE_REQUIRED: 'A style manual file is required',
    INVALID_FORMAT: 'Only PDF or DOCX files up to 20MB are allowed',
  },
});
