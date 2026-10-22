import express from 'express';
import { loginRoute } from '@modules/auth/routes/auth/login.route.js';
import { refreshRoute } from '@modules/auth/routes/auth/refresh.route.js';
import { logoutRoute } from '@modules/auth/routes/auth/logout.route.js';
import { forgotPasswordRoute } from '@modules/auth/routes/auth/forgotPassword.route.js';
import { resetPasswordRoute } from '@modules/auth/routes/auth/resetPassword.route.js';

export function createAuthRoutes(controllers) {
  const router = express.Router();
  loginRoute(router, controllers);
  refreshRoute(router, controllers);
  logoutRoute(router, controllers);
  forgotPasswordRoute(router, controllers);
  resetPasswordRoute(router, controllers);
  return router;
}
