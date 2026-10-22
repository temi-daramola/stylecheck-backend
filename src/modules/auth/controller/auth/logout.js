import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { ResponseUtils } = common.utilities;
const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES, REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTIONS } = AuthConstants;

export async function logout(req, res) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) {
      await this.refreshTokenDAO.deleteOne(this.jwtAdapter.hashToken(rawToken));
    }

    res.clearCookie(REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
    return ResponseUtils.success(MESSAGES.LOGOUT_SUCCESS);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.LOGOUT_FAILED, {
      code: CODES.LOGOUT_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
