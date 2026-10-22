import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { RefreshToken } = db.models;
const { translateDbError } = common.errors;

export async function deleteOne(tokenHash) {
  try {
    return await RefreshToken.deleteOne({ tokenHash });
  } catch (error) {
    throw translateDbError(error, { operation: 'delete', resource: AuthConstants.RESOURCE });
  }
}
