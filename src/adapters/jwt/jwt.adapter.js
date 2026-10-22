import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { constants } from '@common/constants/_index.js';

const { env } = constants;

export const jwtAdapter = Object.freeze({
  generateAccessToken: (payload) => {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  },

  verifyAccessToken: (token) => {
    return jwt.verify(token, env.JWT_SECRET);
  },

  generateRefreshToken: () => {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
  },

  hashToken: (rawToken) => {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  },
});
