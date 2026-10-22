import express from 'express';
import { common } from '@common/_index.js';
import { listSupervisorsRoute } from '@modules/admin/routes/admin/listSupervisors.route.js';
import { createSupervisorRoute } from '@modules/admin/routes/admin/createSupervisor.route.js';
import { resendInviteRoute } from '@modules/admin/routes/admin/resendInvite.route.js';
import { setSupervisorActiveRoute } from '@modules/admin/routes/admin/setSupervisorActive.route.js';

const { authMiddleware } = common.middleware;

/** Every admin route is behind authentication AND the admin gate (`requireAdmin`). */
export function createAdminRoutes(controllers) {
  const router = express.Router();
  const guards = [authMiddleware, controllers.requireAdmin];

  listSupervisorsRoute(router, controllers, guards);
  createSupervisorRoute(router, controllers, guards);
  resendInviteRoute(router, controllers, guards);
  setSupervisorActiveRoute(router, controllers, guards);
  return router;
}
