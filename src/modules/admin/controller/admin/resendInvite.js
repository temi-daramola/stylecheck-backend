import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { issueInvite } from '@modules/admin/controller/admin/issueInvite.util.js';

const { ResponseUtils } = common.utilities;
const { AppError, NotFoundError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = AdminConstants;

export async function resendInvite(id) {
  try {
    const supervisor = await this.supervisorDAO.findById(id);
    if (!supervisor) {
      throw new NotFoundError('Supervisor', { layer: Layer.CONTROLLER });
    }

    await issueInvite.call(this, supervisor);
    return ResponseUtils.success(MESSAGES.INVITE_SENT);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.INVITE_FAILED, {
      code: CODES.INVITE_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
