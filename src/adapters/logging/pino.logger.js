import pino from 'pino';
import { env } from '@common/constants/env.constants.js';

const REDACTED_PATHS = ['req.headers.authorization', 'body.password', 'password'];

// Two independent destinations, never a fallback chain: stdout always, hosted platform when configured.
const buildTargets = () => {
  const targets = [
    env.IS_PRODUCTION_LIKE
      ? { target: 'pino/file', options: { destination: 1 }, level: env.LOG_LEVEL }
      : { target: 'pino-pretty', level: env.LOG_LEVEL },
  ];
  if (env.LOGTAIL_SOURCE_TOKEN) {
    targets.push({
      target: '@logtail/pino',
      options: { sourceToken: env.LOGTAIL_SOURCE_TOKEN },
      level: env.LOG_LEVEL,
    });
  }
  return targets;
};

const buildPino = () =>
  pino({ level: env.LOG_LEVEL, redact: REDACTED_PATHS }, pino.transport({ targets: buildTargets() }));

const wrap = (pinoInstance) => ({
  info: (meta, message) => pinoInstance.info(meta, message),
  warn: (meta, message) => pinoInstance.warn(meta, message),
  error: (meta, message) => pinoInstance.error(meta, message),
  fatal: (meta, message) => pinoInstance.fatal(meta, message),
  child: (meta) => wrap(pinoInstance.child(meta)),
});

export const logger = wrap(buildPino());
