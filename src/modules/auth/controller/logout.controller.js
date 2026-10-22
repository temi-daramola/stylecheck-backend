import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { ResponseUtils } = common.utilities;
const { messages } = common.constants;
const { jwtAdapter } = adapters.jwt;

export class LogoutController {
  constructor(refreshTokenDAO) {
    this.refreshTokenDAO = refreshTokenDAO;
  }

  async execute(req, res) {
    const rawToken = req.cookies?.[AuthConstants.REFRESH_COOKIE_NAME];
    if (rawToken) {
      const tokenHash = jwtAdapter.hashToken(rawToken);
      await this.refreshTokenDAO.deleteOne(tokenHash);
    }

    res.clearCookie(AuthConstants.REFRESH_COOKIE_NAME, {
      path: AuthConstants.REFRESH_COOKIE_PATH,
    });

    return ResponseUtils.success(messages.AUTH.LOGOUT_SUCCESS, null);
  }
}
