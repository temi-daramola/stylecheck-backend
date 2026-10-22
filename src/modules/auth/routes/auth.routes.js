import express from 'express';
import { common } from '@common/_index.js';
import { loginValidation } from '@modules/auth/dto/login.dto.js';

const { asyncHandler, authMiddleware } = common.middleware;

export function createAuthRoutes({
  loginController,
  refreshController,
  logoutController,
  meController,
}) {
  const router = express.Router();

  router.post(
    '/login',
    loginValidation,
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const result = await loginController.execute(email, password, res);
      res.json(result);
    })
  );

  router.post(
    '/refresh',
    asyncHandler(async (req, res) => {
      const result = await refreshController.execute(req, res);
      res.json(result);
    })
  );

  router.post(
    '/logout',
    asyncHandler(async (req, res) => {
      const result = await logoutController.execute(req, res);
      res.json(result);
    })
  );

  router.get(
    '/me',
    authMiddleware,
    asyncHandler(async (req, res) => {
      const result = await meController.execute(req.user.id);
      res.json(result);
    })
  );

  return router;
}
