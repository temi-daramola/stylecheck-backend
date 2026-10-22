import express from 'express';
import { createCheckRoute } from '@modules/compliance/routes/compliance/createCheck.route.js';
import { retryCheckRoute } from '@modules/compliance/routes/compliance/retryCheck.route.js';
import { listChecksRoute } from '@modules/compliance/routes/compliance/listChecks.route.js';
import { getCheckRoute } from '@modules/compliance/routes/compliance/getCheck.route.js';
import { getReportPdfRoute } from '@modules/compliance/routes/compliance/getReportPdf.route.js';
import { shareCheckRoute } from '@modules/compliance/routes/compliance/shareCheck.route.js';

export function createComplianceRoutes(controllers) {
  const router = express.Router();
  createCheckRoute(router, controllers);
  retryCheckRoute(router, controllers);
  listChecksRoute(router, controllers);
  getCheckRoute(router, controllers);
  getReportPdfRoute(router, controllers);
  shareCheckRoute(router, controllers);
  return router;
}
