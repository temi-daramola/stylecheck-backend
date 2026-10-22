import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';
import { issueSession } from '@modules/auth/controller/auth/issueSession.util.js';

const { ResponseUtils } = common.utilities;
const { AppError, UnauthorizedError } = common.errors;
const { Layer, env } = common.constants;
const { MESSAGES, CODES } = AuthConstants;

export async function login(email, password, res) {
  try {
    const supervisor = await this.supervisorDAO.findByEmail(email);
    const isValid = supervisor && (await this.passwordAdapter.compare(password, supervisor.passwordHash));
    if (!isValid) {
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS, { layer: Layer.CONTROLLER });
    }

    // Only after the password is proven correct, so this message cannot be used to probe for accounts.
    if (!supervisor.isActive) {
      throw new UnauthorizedError(MESSAGES.ACCOUNT_DEACTIVATED, { layer: Layer.CONTROLLER });
    }

    const session = await issueSession({
      supervisor,
      res,
      refreshTokenDAO: this.refreshTokenDAO,
      jwtAdapter: this.jwtAdapter,
      refreshExpiryDays: env.REFRESH_TOKEN_EXPIRES_DAYS,
    });

    return ResponseUtils.success(MESSAGES.LOGIN_SUCCESS, session);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.LOGIN_FAILED, {
      code: CODES.LOGIN_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
