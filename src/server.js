import express from 'express';
import { app as appSetup } from '@app/_index.js';
import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';

const { env } = common.constants;
const { logger } = adapters.logging;

async function bootstrap() {
  const expressApp = express();

  // 1. Connect database
  await appSetup.startup.connectDatabase();

  // 2. Register shutdown handlers
  appSetup.startup.registerShutdownHandlers();

  // 3. Apply global middleware
  appSetup.applyMiddleware(expressApp);

  // 4. Create dependencies (DI container)
  const dependencies = appSetup.createDependencies();

  // 5. Register routes
  appSetup.registerRoutes(expressApp, dependencies);

  // 6. Apply error handlers (central error middleware must be last)
  appSetup.applyErrorHandlers(expressApp);

  // 7. Start server
  await appSetup.startup.startServer(expressApp, env.PORT);
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Bootstrap failed');
  process.exit(1);
});
