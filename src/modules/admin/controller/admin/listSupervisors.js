import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { utils } from '@modules/admin/utils/_index.js';

const { ResponseUtils } = common.utilities;
const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = AdminConstants;

export async function listSupervisors() {
  try {
    const supervisors = await this.supervisorDAO.findAll();
    return ResponseUtils.success(MESSAGES.LIST_SUCCESS, { items: supervisors.map(utils.toSupervisorDto) });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.LIST_FAILED, {
      code: CODES.LIST_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
