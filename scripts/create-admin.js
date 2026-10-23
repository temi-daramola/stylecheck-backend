// Creates an ADMIN account. Run it once to get your first admin; then add supervisors from the Admin page.
// Local database:   npm run create-admin -- <email> "<Full Name>" <password>
// Deployed database: fill in .env.admin (see .env.admin.example) and run: npm run create-admin:remote
// Values may also come from ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD.
import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { modules } from '@modules/_index.js';

const { env } = common.constants;
const { passwordAdapter } = adapters.password;
const { database } = db;
const { ROLES } = modules.supervisor.constants;

const MIN_PASSWORD_LENGTH = 8;
const [, , argEmail, argName, argPassword] = process.argv;
const email = argEmail ?? process.env.ADMIN_EMAIL;
const name = argName ?? process.env.ADMIN_NAME;
const password = argPassword ?? process.env.ADMIN_PASSWORD;

const fail = (message) => {
  process.stderr.write(`${message}
`);
  process.exit(1);
};

if (!email || !name || !password) {
  fail('Missing admin details. Usage: npm run create-admin -- <email> "<Full Name>" <password>, or fill in .env.admin and run npm run create-admin:remote');
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
