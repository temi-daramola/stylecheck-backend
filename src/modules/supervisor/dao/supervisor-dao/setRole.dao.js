import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { Supervisor } = db.models;
const { translateDbError } = common.errors;

export async function setRole(id, role) {
  try {
    return await Supervisor.findByIdAndUpdate(id, { $set: { role, isActive: true } }, { new: true }).select('-passwordHash');
  } catch (error) {
    throw translateDbError(error, { operation: 'update', resource: SupervisorConstants.RESOURCE });
  }
}
