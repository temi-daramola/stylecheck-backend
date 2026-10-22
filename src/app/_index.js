import { createDependencies } from './dependencies.js';
import { applyMiddleware, applyErrorHandlers } from './middleware.js';
import { registerRoutes } from './routes.js';
import * as startup from './startup.js';

export const app = Object.freeze({
  createDependencies,
  applyMiddleware,
  applyErrorHandlers,
  registerRoutes,
  startup,
});
