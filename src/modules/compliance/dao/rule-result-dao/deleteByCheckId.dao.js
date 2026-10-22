import { db } from '@database/_index.js';
import { common } from '@common/_index.js';

const { RuleResult } = db.models;
const { translateDbError } = common.errors;
const RESOURCE = 'RuleResult';

export async function deleteByCheckId(checkId) {
  try {
    return await RuleResult.deleteMany({ checkId });
  } catch (error) {
    throw translateDbError(error, { operation: 'delete', resource: RESOURCE });
  }
}
