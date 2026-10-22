import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { PasswordResetToken } = db.models;
const { translateDbError } = common.errors;

export async function create(data) {
  try {
    return await PasswordResetToken.create(data);
  } catch (error) {
    throw translateDbError(error, { operation: 'create', resource: AuthConstants.RESET_RESOURCE });
  }
}
