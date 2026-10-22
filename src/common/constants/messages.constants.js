export const messages = Object.freeze({
  AUTH: {
    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    REFRESH_SUCCESS: 'Session refreshed successfully',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Authentication required',
    SESSION_EXPIRED: 'Session expired, please log in again',
    SESSION_REVOKED: 'Session revoked, please log in again',
  },
  STYLE_MANUAL: {
    UPLOAD_SUCCESS: 'Style manual updated successfully',
    FETCH_SUCCESS: 'Style manual retrieved successfully',
    NOT_FOUND: 'No active style manual found',
    FILE_REQUIRED: 'A style manual file (PDF or DOCX) is required',
    INVALID_FORMAT: 'Only PDF and DOCX files are supported',
  },
  COMPLIANCE: {
    CHECK_SUCCESS: 'Compliance analysis completed successfully',
    FETCH_SUCCESS: 'Compliance checks retrieved successfully',
    NOT_FOUND: 'Compliance check not found',
    FILE_REQUIRED: 'A student document (.docx) is required',
    STUDENT_NAME_REQUIRED: 'Student name is required',
    CHAPTER_REQUIRED: 'Chapter or section is required',
    SHARE_SUCCESS: 'Report sent successfully to student',
    EMAIL_REQUIRED: 'Valid student email address is required',
  },
  COMMON: {
    SERVER_ERROR: 'An unexpected error occurred. Please try again.',
    VALIDATION_FAILED: 'Validation failed',
    RESOURCE_NOT_FOUND: 'Resource not found',
  },
});
