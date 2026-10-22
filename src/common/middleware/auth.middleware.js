import { errors } from '@common/errors/_index.js';
import { constants } from '@common/constants/_index.js';
import { adapters } from '@adapters/_index.js';

const { UnauthorizedError } = errors;
const { Layer, messages } = constants;
const { jwtAdapter } = adapters.jwt;

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED, { layer: Layer.AUTH });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwtAdapter.verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    throw new UnauthorizedError(messages.AUTH.SESSION_EXPIRED, {
      layer: Layer.AUTH,
      cause: error,
    });
  }
};
