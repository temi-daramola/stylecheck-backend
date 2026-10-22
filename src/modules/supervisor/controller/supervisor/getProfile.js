import { common } from '@common/_index.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { ResponseUtils } = common.utilities;
const { AppError, NotFoundError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES, RESOURCE } = SupervisorConstants;

export async function getProfile(supervisorId) {
  try {
    const supervisor = await this.supervisorDAO.findById(supervisorId);
    if (!supervisor) {
      throw new NotFoundError(RESOURCE, { layer: Layer.CONTROLLER });
    }

    return ResponseUtils.success(MESSAGES.PROFILE_FETCHED, {
      id: supervisor._id,
      name: supervisor.name,
      email: supervisor.email,
      role: supervisor.role,
      preferences: supervisor.preferences,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.GET_PROFILE_FAILED, {
      code: CODES.GET_PROFILE_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
