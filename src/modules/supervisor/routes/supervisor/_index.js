import express from 'express';
import { getProfileRoute } from '@modules/supervisor/routes/supervisor/getProfile.route.js';
import { updatePreferencesRoute } from '@modules/supervisor/routes/supervisor/updatePreferences.route.js';

export function createSupervisorRoutes(controllers) {
  const router = express.Router();
  getProfileRoute(router, controllers);
  updatePreferencesRoute(router, controllers);
  return router;
}
