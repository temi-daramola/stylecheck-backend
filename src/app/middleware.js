import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { common } from '../common/_index.js';

const { env } = common.constants;
const { requestContextMiddleware, centralErrorMiddleware } = common.middleware;
const { NotFoundError } = common.errors;
const { Layer } = common.constants;

export function applyMiddleware(app) {
  // 1. Correlation context first
  app.use(requestContextMiddleware);

  // 2. CORS
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-idempotency-key'],
    })
  );

  // 3. Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Cookie parser
  app.use(cookieParser());
}

export function applyErrorHandlers(app) {
  // 404 Route Handler
  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`, { layer: Layer.ROUTE }));
  });

  // Central Error Handler (must be last)
  app.use(centralErrorMiddleware);
}
