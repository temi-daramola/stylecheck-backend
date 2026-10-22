import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { PasswordResetToken } = db.models;
const { translateDbError } = common.errors;

export async function deleteAllForSupervisor(supervisorId) {
  try {
    return await PasswordResetToken.deleteMany({ supervisorId });
  } catch (error) {
    throw translateDbError(error, { operation: 'delete', resource: AuthConstants.RESET_RESOURCE });
  }
}
