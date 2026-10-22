import { db } from '@database/_index.js';
import { common } from '@common/_index.js';

const { RuleResult } = db.models;
const { translateDbError } = common.errors;
const RESOURCE = 'RuleResult';

export async function findByCheckId(checkId) {
  try {
    return await RuleResult.find({ checkId }).sort({ _id: 1 });
  } catch (error) {
    throw translateDbError(error, { operation: 'read', resource: RESOURCE });
  }
}
