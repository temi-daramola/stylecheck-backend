import RefreshTokenDAO from '@modules/auth/dao/refresh-token-dao/_index.js';
import PasswordResetTokenDAO from '@modules/auth/dao/password-reset-token-dao/_index.js';

export const dao = Object.freeze({
  RefreshTokenDAO,
  PasswordResetTokenDAO,
});
