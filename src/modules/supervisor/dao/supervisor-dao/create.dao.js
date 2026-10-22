import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { Supervisor } = db.models;
const { translateDbError } = common.errors;

export async function create(data) {
  try {
    return await Supervisor.create(data);
  } catch (error) {
    throw translateDbError(error, { operation: 'create', resource: SupervisorConstants.RESOURCE });
  }
}
