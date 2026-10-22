import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';
import { buildResetLink, buildResetEmailHtml } from '@modules/auth/utils/buildResetEmail.util.js';

const { ResponseUtils } = common.utilities;
const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES, RESET_TOKEN_TTL_MINUTES, EMAIL } = AuthConstants;
const MS_PER_MINUTE = 60 * 1000;

/**
 * Always answers the same way, whether or not the email is registered, so the endpoint cannot be
 * used to discover which supervisors exist. The email is sent in the background for the same reason:
 * a slower response would give the answer away.
 */
export async function forgotPassword(email) {
  try {
    const supervisor = await this.supervisorDAO.findByEmail(email);

    if (supervisor) {
      const { rawToken, tokenHash } = this.jwtAdapter.generateRefreshToken();
      await this.passwordResetTokenDAO.deleteAllForSupervisor(supervisor._id);
      await this.passwordResetTokenDAO.create({
        tokenHash,
        supervisorId: supervisor._id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * MS_PER_MINUTE),
      });

      this.brevoAdapter
        .sendEmail({
          to: supervisor.email,
          subject: EMAIL.RESET_SUBJECT,
          htmlContent: buildResetEmailHtml({ supervisorName: supervisor.name, link: buildResetLink(rawToken) }),
        })
        .catch((error) => this.logger.warn({ err: error }, MESSAGES.RESET_EMAIL_LOG));
    }

    return ResponseUtils.success(MESSAGES.FORGOT_ACCEPTED);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.FORGOT_FAILED, {
      code: CODES.FORGOT_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
