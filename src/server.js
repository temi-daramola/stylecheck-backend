import express from 'express';
import { app as appSetup } from '@app/_index.js';
import { common } from '@common/_index.js';

const { env } = common.constants;

async function bootstrap() {
  const expressApp = express();

  // 1. Connect database & seed data
  await appSetup.startup.connectDatabase();
  await appSetup.startup.seedInitialData();

  // 2. Register shutdown handlers
  appSetup.startup.registerShutdownHandlers();

  // 3. Apply global middleware
  appSetup.applyMiddleware(expressApp);

  // 4. Create dependencies (DI Container)
  const dependencies = appSetup.createDependencies();

  // 5. Register routes
  appSetup.registerRoutes(expressApp, dependencies);

  // 6. Apply error handlers (Central Error Middleware must be last)
  appSetup.applyErrorHandlers(expressApp);

  // 7. Start server
  await appSetup.startup.startServer(expressApp, env.PORT);
}

bootstrap().catch((error) => {
  console.error('[Bootstrap Error]', error);
  process.exit(1);
});
