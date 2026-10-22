// Usage: npm run create-supervisor -- <email> "<Full Name>" <password>
// There is no public signup: supervisors are created by an administrator with this script.
import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';
import { modules } from '@modules/_index.js';

const { env } = common.constants;
const { passwordAdapter } = adapters.password;
const { database } = db;

const MIN_PASSWORD_LENGTH = 8;
const [, , email, name, password] = process.argv;

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

if (!email || !name || !password) {
  fail('Usage: npm run create-supervisor -- <email> "<Full Name>" <password>');
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
  });
  process.stdout.write(`Created supervisor ${created.email} (${created._id})\n`);
} catch (error) {
  fail(`Could not create supervisor: ${error.message}`);
} finally {
  await database.disconnect();
}
