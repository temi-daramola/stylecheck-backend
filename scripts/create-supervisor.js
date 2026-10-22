// Usage: npm run create-supervisor -- <email> "<Full Name>" <password> [--admin]
// Admins normally add supervisors from the Admin page inside the app. This script is the
// command-line fallback (and a way to create an admin without INITIAL_ADMIN_* variables).
import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { modules } from '@modules/_index.js';

const { env } = common.constants;
const { passwordAdapter } = adapters.password;
const { database } = db;
const { ROLES } = modules.supervisor.constants;

const MIN_PASSWORD_LENGTH = 8;
const ADMIN_FLAG = '--admin';
const args = process.argv.slice(2);
const isAdmin = args.includes(ADMIN_FLAG);
const [email, name, password] = args.filter((arg) => arg !== ADMIN_FLAG);

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

if (!email || !name || !password) {
  fail('Usage: npm run create-supervisor -- <email> "<Full Name>" <password> [--admin]');
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
    role: isAdmin ? ROLES.ADMIN : ROLES.SUPERVISOR,
  });
  process.stdout.write(`Created ${created.role} ${created.email} (${created._id})\n`);
} catch (error) {
  fail(`Could not create supervisor: ${error.message}`);
} finally {
  await database.disconnect();
}
