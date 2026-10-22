import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { ResponseUtils } = common.utilities;
const { UnauthorizedError } = common.errors;
const { Layer, messages } = common.constants;
const { jwtAdapter } = adapters.jwt;
const { passwordAdapter } = adapters.password;

export class LoginController {
  constructor(userDAO, refreshTokenDAO) {
    this.userDAO = userDAO;
    this.refreshTokenDAO = refreshTokenDAO;
  }

  async execute(email, password, res) {
    const user = await this.userDAO.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError(messages.AUTH.INVALID_CREDENTIALS, {
        layer: Layer.CONTROLLER,
      });
    }

    const isPasswordValid = await passwordAdapter.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError(messages.AUTH.INVALID_CREDENTIALS, {
        layer: Layer.CONTROLLER,
      });
    }

    const accessToken = jwtAdapter.generateAccessToken({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const { rawToken, tokenHash } = jwtAdapter.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + AuthConstants.REFRESH_TOKEN_EXPIRY_DAYS);

    await this.refreshTokenDAO.create({
      tokenHash,
      userId: user._id,
      expiresAt,
    });

    res.cookie(AuthConstants.REFRESH_COOKIE_NAME, rawToken, AuthConstants.COOKIE_OPTIONS);

    return ResponseUtils.success(messages.AUTH.LOGIN_SUCCESS, {
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
