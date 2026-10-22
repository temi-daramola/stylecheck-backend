import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { RefreshToken } = db.models;
const { translateDbError } = common.errors;

export async function findByTokenHash(tokenHash) {
  try {
    return await RefreshToken.findOne({ tokenHash });
  } catch (error) {
    throw translateDbError(error, { operation: 'read', resource: AuthConstants.RESOURCE });
  }
}
