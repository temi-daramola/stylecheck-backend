import { db } from '@database/_index.js';
import { common } from '@common/_index.js';

const { RuleResult } = db.models;
const { translateDbError } = common.errors;
const RESOURCE = 'RuleResult';

export async function createMany(checkId, results) {
  try {
    // ordered: true keeps insertion order, which is the order rules are shown in.
    return await RuleResult.insertMany(results.map((result) => ({ ...result, checkId })), { ordered: true });
  } catch (error) {
    throw translateDbError(error, { operation: 'create', resource: RESOURCE });
  }
}
