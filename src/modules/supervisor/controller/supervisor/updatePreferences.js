import { common } from '@common/_index.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { ResponseUtils } = common.utilities;
const { AppError, NotFoundError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES, RESOURCE, PREFERENCE_KEYS } = SupervisorConstants;

export async function updatePreferences(supervisorId, input) {
  try {
    const preferences = Object.fromEntries(
      PREFERENCE_KEYS.filter((key) => key in input).map((key) => [key, input[key]])
    );

    const updated = await this.supervisorDAO.updatePreferences(supervisorId, preferences);
    if (!updated) {
      throw new NotFoundError(RESOURCE, { layer: Layer.CONTROLLER });
    }

    return ResponseUtils.success(MESSAGES.PREFERENCES_UPDATED, { preferences: updated.preferences });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.UPDATE_PREFERENCES_FAILED, {
      code: CODES.UPDATE_PREFERENCES_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
