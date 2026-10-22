import { common } from '@common/_index.js';
import { AdminConstants } from '@modules/admin/constants/admin.constants.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { asyncHandler } = common.middleware;
const { ForbiddenError } = common.errors;
const { Layer } = common.constants;

/**
 * Admin gate. The role is re-read from the database on every request, never trusted from the token,
 * so demoting or deactivating an admin takes effect immediately. Must run after authMiddleware.
 */
export const createRequireAdmin = (supervisorDAO) =>
  asyncHandler(async (req, res, next) => {
    const account = await supervisorDAO.findById(req.user.id);
    const isAdmin = account && account.isActive && account.role === SupervisorConstants.ROLES.ADMIN;
    if (!isAdmin) {
      throw new ForbiddenError(AdminConstants.MESSAGES.NOT_ADMIN, { layer: Layer.AUTH });
    }
    next();
  });
