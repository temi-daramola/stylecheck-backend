import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { env } = common.constants;
const { MESSAGES, MIN_INITIAL_ADMIN_PASSWORD_LENGTH } = AdminConstants;
const { ROLES } = SupervisorConstants;

/**
 * Bootstrap for a fresh deployment, so the first administrator never needs a code or database step:
 * if no active admin exists and INITIAL_ADMIN_EMAIL/PASSWORD are set, create that admin, or promote
 * the account that already has that email. Does nothing once an admin exists, so it is safe to run
 * on every start (and the variables can be removed afterwards).
 */
export async function ensureInitialAdmin() {
  const { INITIAL_ADMIN_EMAIL: email, INITIAL_ADMIN_PASSWORD: password, INITIAL_ADMIN_NAME: name } = env;
  if (!email || !password) return;

  if ((await this.supervisorDAO.countActiveAdmins()) > 0) return;

  const existing = await this.supervisorDAO.findByEmail(email);
  if (existing) {
    await this.supervisorDAO.setRole(existing._id, ROLES.ADMIN);
    this.logger.info({ email }, MESSAGES.ADMIN_PROMOTED);
    return;
  }

  if (password.length < MIN_INITIAL_ADMIN_PASSWORD_LENGTH) {
    this.logger.warn({}, MESSAGES.ADMIN_PASSWORD_WEAK);
    return;
  }

  await this.supervisorDAO.create({
    name,
    email,
    passwordHash: await this.passwordAdapter.hash(password),
    role: ROLES.ADMIN,
  });
  this.logger.info({ email }, MESSAGES.ADMIN_BOOTSTRAPPED);
}
