import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '@common/constants/env.constants.js';

const REFRESH_TOKEN_BYTES = 40;
const TOKEN_ENCODING = 'hex';
const HASH_ALGORITHM = 'sha256';

const hashToken = (rawToken) =>
  crypto.createHash(HASH_ALGORITHM).update(rawToken).digest(TOKEN_ENCODING);

export const jwtAdapter = Object.freeze({
  generateAccessToken: (payload) =>
    jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN }),

  verifyAccessToken: (token) => jwt.verify(token, env.JWT_SECRET),

  generateRefreshToken: () => {
    const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString(TOKEN_ENCODING);
    return { rawToken, tokenHash: hashToken(rawToken) };
  },

  hashToken,
});
