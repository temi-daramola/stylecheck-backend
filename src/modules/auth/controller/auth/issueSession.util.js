import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Issues a fresh access token + rotated refresh token cookie for a supervisor.
 * Shared by login and refresh so the cookie and payload shape cannot drift apart.
 */
export async function issueSession({ supervisor, res, refreshTokenDAO, jwtAdapter, refreshExpiryDays }) {
  const accessToken = jwtAdapter.generateAccessToken({
    id: supervisor._id,
    email: supervisor.email,
    name: supervisor.name,
    role: supervisor.role,
  });

  const { rawToken, tokenHash } = jwtAdapter.generateRefreshToken();
  await refreshTokenDAO.create({
    tokenHash,
    supervisorId: supervisor._id,
    expiresAt: new Date(Date.now() + refreshExpiryDays * MS_PER_DAY),
  });

  res.cookie(AuthConstants.REFRESH_COOKIE_NAME, rawToken, AuthConstants.COOKIE_OPTIONS);

  return {
    account: { id: supervisor._id, email: supervisor.email, name: supervisor.name, role: supervisor.role },
    accessToken,
  };
}
