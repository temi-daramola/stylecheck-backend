import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';
import { issueSession } from '@modules/auth/controller/auth/issueSession.util.js';

const { ResponseUtils } = common.utilities;
const { AppError, UnauthorizedError } = common.errors;
const { Layer, env } = common.constants;
const { MESSAGES, CODES, REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTIONS } = AuthConstants;

const reject = (res, message) => {
  res.clearCookie(REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
  return new UnauthorizedError(message, { layer: Layer.CONTROLLER });
};

export async function refresh(req, res) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      throw new UnauthorizedError(MESSAGES.NOT_AUTHENTICATED, { layer: Layer.CONTROLLER });
    }

    const tokenHash = this.jwtAdapter.hashToken(rawToken);
    const stored = await this.refreshTokenDAO.findByTokenHash(tokenHash);
    if (!stored) throw reject(res, MESSAGES.SESSION_EXPIRED);

    // Reuse of an already-rotated token means it may have been stolen: revoke every session.
    if (stored.isUsed) {
      await this.refreshTokenDAO.deleteAllForAccount(stored.supervisorId);
      throw reject(res, MESSAGES.SESSION_REVOKED);
    }

    if (new Date() > stored.expiresAt) throw reject(res, MESSAGES.SESSION_EXPIRED);

    const supervisor = await this.supervisorDAO.findById(stored.supervisorId);
    if (!supervisor) throw reject(res, MESSAGES.ACCOUNT_NOT_FOUND);
    if (!supervisor.isActive) throw reject(res, MESSAGES.ACCOUNT_DEACTIVATED);

    await this.refreshTokenDAO.markUsed(tokenHash);

    const session = await issueSession({
      supervisor,
      res,
      refreshTokenDAO: this.refreshTokenDAO,
      jwtAdapter: this.jwtAdapter,
      refreshExpiryDays: env.REFRESH_TOKEN_EXPIRES_DAYS,
    });

    return ResponseUtils.success(MESSAGES.REFRESH_SUCCESS, session);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.REFRESH_FAILED, {
      code: CODES.REFRESH_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
