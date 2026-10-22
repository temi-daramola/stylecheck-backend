import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { Supervisor } = db.models;
const { translateDbError } = common.errors;

export async function updatePreferences(id, preferences) {
  const updates = Object.fromEntries(
    Object.entries(preferences).map(([key, value]) => [`preferences.${key}`, value])
  );

  try {
    return await Supervisor.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .select('-passwordHash');
  } catch (error) {
    throw translateDbError(error, { operation: 'update', resource: SupervisorConstants.RESOURCE });
  }
}
