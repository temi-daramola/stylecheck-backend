import express from 'express';
import { getMyManualRoute } from '@modules/style-manual/routes/style-manual/getMyManual.route.js';
import { uploadManualRoute } from '@modules/style-manual/routes/style-manual/uploadManual.route.js';

export function createStyleManualRoutes(controllers) {
  const router = express.Router();
  getMyManualRoute(router, controllers);
  uploadManualRoute(router, controllers);
  return router;
}
