import { userDAO } from './user-dao/_index.js';
import { refreshTokenDAO } from './refresh-token-dao/_index.js';

export const dao = Object.freeze({
  user: userDAO,
  refreshToken: refreshTokenDAO,
});
