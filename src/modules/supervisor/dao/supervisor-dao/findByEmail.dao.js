import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { Supervisor } = db.models;
const { translateDbError } = common.errors;

export async function findByEmail(email) {
  try {
    return await Supervisor.findOne({ email: email.toLowerCase().trim() });
  } catch (error) {
    throw translateDbError(error, { operation: 'read', resource: SupervisorConstants.RESOURCE });
  }
}
