import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

const STAGES = Object.freeze({
  development: { file: '.env.development', productionLike: false },
  test:        { file: '.env.test',        productionLike: false },
  staging:     { file: null,               productionLike: true },
  production:  { file: null,               productionLike: true },
});

const nodeEnv = process.env.NODE_ENV || 'development';

if (!Object.hasOwn(STAGES, nodeEnv)) {
  throw new Error(
    `NODE_ENV is "${nodeEnv}" - must be explicitly one of: ${Object.keys(STAGES).join(', ')}`
  );
}

const stage = STAGES[nodeEnv];

if (stage.file) {
  const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const envFilePath = path.join(BACKEND_ROOT, stage.file);
  const loaded = dotenv.config({ path: envFilePath });
  if (loaded.error && nodeEnv !== 'development') {
    throw new Error(`Could not load ${envFilePath} for NODE_ENV="${nodeEnv}": ${loaded.error.message}`);
  }
}

dotenvExpand.expand({ parsed: process.env });

export const env = Object.freeze({
  NODE_ENV: nodeEnv,
  IS_PRODUCTION: stage.productionLike,
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stylecheck_dev',
  JWT_SECRET: process.env.JWT_SECRET || 'stylecheck_dev_secret_key_32_characters_long_min',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
});
