import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { ResponseUtils } = common.utilities;
const { AppError, ValidationError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = AuthConstants;

export async function resetPassword(token, newPassword) {
  try {
    const tokenHash = this.jwtAdapter.hashToken(token);
    const stored = await this.passwordResetTokenDAO.findByTokenHash(tokenHash);
    if (!stored || new Date() > stored.expiresAt) {
      throw new ValidationError(MESSAGES.RESET_TOKEN_INVALID, { layer: Layer.CONTROLLER, code: CODES.RESET_TOKEN_INVALID });
    }

    const passwordHash = await this.passwordAdapter.hash(newPassword);
    await this.supervisorDAO.updatePasswordHash(stored.supervisorId, passwordHash);

    // The link is single-use, and every existing session must end: whoever held the old password is out.
    await this.passwordResetTokenDAO.deleteAllForSupervisor(stored.supervisorId);
    await this.refreshTokenDAO.deleteAllForAccount(stored.supervisorId);

    return ResponseUtils.success(MESSAGES.RESET_SUCCESS);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.RESET_FAILED, {
      code: CODES.RESET_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
