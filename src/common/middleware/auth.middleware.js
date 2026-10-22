import { UnauthorizedError } from '@common/errors/subclasses.js';
import { Layer } from '@common/constants/layer.constants.js';
import { messages } from '@common/constants/messages.constants.js';
import { adapters } from '@adapters/_index.js';

const BEARER_PREFIX = 'Bearer ';
const { jwtAdapter } = adapters.jwt;

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedError(messages.COMMON.UNAUTHORIZED, { layer: Layer.AUTH });
  }

  const token = authHeader.slice(BEARER_PREFIX.length);
  try {
    req.user = jwtAdapter.verifyAccessToken(token);
  } catch (error) {
    throw new UnauthorizedError(messages.COMMON.SESSION_EXPIRED, { layer: Layer.AUTH, cause: error });
  }
  next();
};
