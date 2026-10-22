export const AuthConstants = Object.freeze({
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
  REFRESH_COOKIE_NAME: 'refreshToken',
  REFRESH_COOKIE_PATH: '/api/auth',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  ERRORS: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    SESSION_REVOKED: 'Session revoked, please log in again',
    SESSION_EXPIRED: 'Session expired, please log in again',
    NOT_AUTHENTICATED: 'Not authenticated',
    ACCOUNT_NOT_FOUND: 'Account not found',
  },
});
