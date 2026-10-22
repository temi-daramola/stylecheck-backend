import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';

const { env } = common.constants;
const { database } = db;
const { logger } = adapters.logging;

const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT'];

let serverInstance = null;

export async function connectDatabase() {
  await database.connect(env.MONGODB_URI);
  logger.info({ stage: env.NODE_ENV }, 'Database connected');
}

export function startServer(app, port) {
  return new Promise((resolve) => {
    serverInstance = app.listen(port, () => {
      logger.info({ port }, 'StyleCheck backend listening');
      resolve(serverInstance);
    });
  });
}

export async function shutdownServer() {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
  await database.disconnect();
  logger.info({}, 'Gracefully shut down');
}

export function registerShutdownHandlers() {
  SHUTDOWN_SIGNALS.forEach((signal) => {
    process.on(signal, async () => {
      logger.info({ signal }, 'Shutdown signal received');
      await shutdownServer();
      process.exit(0);
    });
  });
}
