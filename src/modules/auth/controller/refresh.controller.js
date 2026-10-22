import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { ResponseUtils } = common.utilities;
const { UnauthorizedError } = common.errors;
const { Layer, messages } = common.constants;
const { jwtAdapter } = adapters.jwt;

export class RefreshController {
  constructor(userDAO, refreshTokenDAO) {
    this.userDAO = userDAO;
    this.refreshTokenDAO = refreshTokenDAO;
  }

  async execute(req, res) {
    const rawToken = req.cookies?.[AuthConstants.REFRESH_COOKIE_NAME];
    if (!rawToken) {
      throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED, {
        layer: Layer.CONTROLLER,
      });
    }

    const tokenHash = jwtAdapter.hashToken(rawToken);
    const storedToken = await this.refreshTokenDAO.findByTokenHash(tokenHash);

    if (!storedToken) {
      res.clearCookie(AuthConstants.REFRESH_COOKIE_NAME, { path: AuthConstants.REFRESH_COOKIE_PATH });
      throw new UnauthorizedError(AuthConstants.ERRORS.SESSION_EXPIRED, {
        layer: Layer.CONTROLLER,
      });
    }

    if (storedToken.isUsed) {
      await this.refreshTokenDAO.deleteAllForAccount(storedToken.userId);
      res.clearCookie(AuthConstants.REFRESH_COOKIE_NAME, { path: AuthConstants.REFRESH_COOKIE_PATH });
      throw new UnauthorizedError(AuthConstants.ERRORS.SESSION_REVOKED, {
        layer: Layer.CONTROLLER,
      });
    }

    await this.refreshTokenDAO.markUsed(tokenHash);

    if (new Date() > new Date(storedToken.expiresAt)) {
      res.clearCookie(AuthConstants.REFRESH_COOKIE_NAME, { path: AuthConstants.REFRESH_COOKIE_PATH });
      throw new UnauthorizedError(AuthConstants.ERRORS.SESSION_EXPIRED, {
        layer: Layer.CONTROLLER,
      });
    }

    const user = await this.userDAO.findById(storedToken.userId);
    if (!user) {
      res.clearCookie(AuthConstants.REFRESH_COOKIE_NAME, { path: AuthConstants.REFRESH_COOKIE_PATH });
      throw new UnauthorizedError(AuthConstants.ERRORS.ACCOUNT_NOT_FOUND, {
        layer: Layer.CONTROLLER,
      });
    }

    const newTokens = jwtAdapter.generateRefreshToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + AuthConstants.REFRESH_TOKEN_EXPIRY_DAYS);

    await this.refreshTokenDAO.create({
      tokenHash: newTokens.tokenHash,
      userId: user._id,
      expiresAt: newExpiresAt,
    });

    const accessToken = jwtAdapter.generateAccessToken({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.cookie(AuthConstants.REFRESH_COOKIE_NAME, newTokens.rawToken, AuthConstants.COOKIE_OPTIONS);

    return ResponseUtils.success(messages.AUTH.REFRESH_SUCCESS, {
      account: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    });
  }
}
