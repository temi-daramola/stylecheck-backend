import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { common } from '@common/_index.js';

const { env, Layer } = common.constants;
const { requestContextMiddleware, centralErrorMiddleware } = common.middleware;
const { NotFoundError } = common.errors;

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'x-request-id', 'x-idempotency-key'];
const BODY_LIMIT = '10mb';

export function applyMiddleware(app) {
  // Behind a hosting proxy (Render), the real client IP is in X-Forwarded-For; rate limiting needs it.
  app.set('trust proxy', env.IS_PRODUCTION_LIKE ? 1 : false);

  app.use(requestContextMiddleware);

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ALLOWED_METHODS,
      allowedHeaders: ALLOWED_HEADERS,
    })
  );

  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
  app.use(cookieParser());
}

export function applyErrorHandlers(app) {
  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`, { layer: Layer.ROUTE }));
  });

  app.use(centralErrorMiddleware);
}
