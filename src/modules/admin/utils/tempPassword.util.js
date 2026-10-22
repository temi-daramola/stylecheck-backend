import crypto from 'node:crypto';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';

/**
 * A random password nobody ever sees. A new supervisor sets their own through the emailed link;
 * until then the account cannot be signed into with a guessable password.
 */
export const generateTempPassword = () => crypto.randomBytes(AdminConstants.TEMP_PASSWORD_BYTES).toString('base64url');
