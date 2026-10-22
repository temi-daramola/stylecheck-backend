// Usage: npm run create-admin -- <email> "<Full Name>" <password>
// Creates an ADMIN account. Run it once to get your first admin (or set INITIAL_ADMIN_EMAIL /
// INITIAL_ADMIN_PASSWORD on the host instead). After signing in, add supervisors from the Admin page.
import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { modules } from '@modules/_index.js';

const { env } = common.constants;
const { passwordAdapter } = adapters.password;
const { database } = db;
const { ROLES } = modules.supervisor.constants;

const MIN_PASSWORD_LENGTH = 8;
const [, , email, name, password] = process.argv;

const fail = (message) => {
  process.stderr.write(`${message}
`);
  process.exit(1);
};

if (!email || !name || !password) {
  fail('Usage: npm run create-admin -- <email> "<Full Name>" <password>');
}
if (password.length < MIN_PASSWORD_LENGTH) {
  fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
}

try {
  await database.connect(env.MONGODB_URI);
  const supervisorDAO = new modules.supervisor.dao.SupervisorDAO();
  const created = await supervisorDAO.create({
    email,
    name,
    passwordHash: await passwordAdapter.hash(password),
    role: ROLES.ADMIN,
  });
  process.stdout.write(`Created admin ${created.email} (${created._id}). Sign in, then add supervisors from the Admin page.
`);
} catch (error) {
  fail(`Could not create admin: ${error.message}`);
} finally {
  await database.disconnect();
}
