import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';
import { utils } from '@modules/admin/utils/_index.js';
import { issueInvite } from '@modules/admin/controller/admin/issueInvite.util.js';

const { ResponseUtils } = common.utilities;
const { AppError, ConflictError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = AdminConstants;

export async function createSupervisor({ name, email }) {
  try {
    const passwordHash = await this.passwordAdapter.hash(utils.generateTempPassword());

    let supervisor;
    try {
      supervisor = await this.supervisorDAO.create({
        name,
        email,
        passwordHash,
        role: SupervisorConstants.ROLES.SUPERVISOR,
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        throw new ConflictError(MESSAGES.EMAIL_TAKEN, { layer: Layer.CONTROLLER, cause: error });
      }
      throw error;
    }

    // The account exists either way. If only the email failed, the admin is told and can resend.
    let inviteSent = true;
    try {
      await issueInvite.call(this, supervisor);
    } catch (error) {
      inviteSent = false;
      this.logger.warn({ err: error, supervisorId: supervisor._id }, MESSAGES.INVITE_LOG);
    }

    return ResponseUtils.success(inviteSent ? MESSAGES.CREATED_AND_INVITED : MESSAGES.CREATED_NOT_INVITED, {
      supervisor: utils.toSupervisorDto(supervisor),
      inviteSent,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.CREATE_FAILED, {
      code: CODES.CREATE_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
