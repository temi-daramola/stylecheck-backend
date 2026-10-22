import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { AuthConstants } from '@modules/auth/constants/auth.constants.js';

const { RefreshToken } = db.models;
const { translateDbError } = common.errors;

export async function markUsed(tokenHash) {
  try {
    return await RefreshToken.updateOne({ tokenHash }, { $set: { isUsed: true } });
  } catch (error) {
    throw translateDbError(error, { operation: 'update', resource: AuthConstants.RESOURCE });
  }
}
