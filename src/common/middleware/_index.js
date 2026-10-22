import { asyncHandler } from './asyncHandler.middleware.js';
import { centralErrorMiddleware } from './centralError.middleware.js';
import { authMiddleware } from './auth.middleware.js';
import { requestContextMiddleware } from '../context/requestContext.js';

export const middleware = Object.freeze({
  asyncHandler,
  centralErrorMiddleware,
  authMiddleware,
  requestContextMiddleware,
});
