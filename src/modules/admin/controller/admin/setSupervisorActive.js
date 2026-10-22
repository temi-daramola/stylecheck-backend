import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';
import { utils } from '@modules/admin/utils/_index.js';

const { ResponseUtils } = common.utilities;
const { AppError, NotFoundError, ValidationError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = AdminConstants;

export async function setSupervisorActive(id, isActive, actorId) {
  try {
    if (!isActive && String(id) === String(actorId)) {
      throw new ValidationError(MESSAGES.CANNOT_DEACTIVATE_SELF, { layer: Layer.CONTROLLER });
    }

    const target = await this.supervisorDAO.findById(id);
    if (!target) {
      throw new NotFoundError('Supervisor', { layer: Layer.CONTROLLER });
    }

    // Never lock everyone out: the last active admin cannot be deactivated.
    const isActiveAdmin = target.role === SupervisorConstants.ROLES.ADMIN && target.isActive;
    if (!isActive && isActiveAdmin && (await this.supervisorDAO.countActiveAdmins()) <= 1) {
      throw new ValidationError(MESSAGES.LAST_ADMIN, { layer: Layer.CONTROLLER });
    }

    const updated = await this.supervisorDAO.setActive(id, isActive);
    if (!isActive) {
      // End every session they currently have.
      await this.refreshTokenDAO.deleteAllForAccount(id);
    }

    return ResponseUtils.success(isActive ? MESSAGES.ACTIVATED : MESSAGES.DEACTIVATED, utils.toSupervisorDto(updated));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.ACTIVE_FAILED, {
      code: CODES.ACTIVE_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
