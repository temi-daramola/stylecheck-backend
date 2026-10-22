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

const requireEnv = (name) => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = Object.freeze({
  NODE_ENV: nodeEnv,
  IS_PRODUCTION_LIKE: stage.productionLike,
  PORT: Number(process.env.PORT ?? 5000),
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN || null,

  MONGODB_URI: requireEnv('MONGODB_URI'),
  FRONTEND_URL: requireEnv('FRONTEND_URL'),

  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '15m',
  REFRESH_TOKEN_EXPIRES_DAYS: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 30),

  GEMINI_API_KEY: requireEnv('GEMINI_API_KEY'),
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash',
  // Tried after the main model keeps failing (separate quota). Set to an empty value to disable.
  GEMINI_FALLBACK_MODEL: (process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-flash-lite-latest') || null,
  // How much the model "thinks" before answering: lower is faster. Set to an empty value to omit it
  // (needed if you switch to a model that does not support thinking levels).
  GEMINI_THINKING_LEVEL: (process.env.GEMINI_THINKING_LEVEL ?? 'low') || null,

  BREVO_API_KEY: requireEnv('BREVO_API_KEY'),
  BREVO_SENDER_EMAIL: requireEnv('BREVO_SENDER_EMAIL'),
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME ?? 'StyleCheck',

  MAX_MANUAL_TEXT_LENGTH: Number(process.env.MAX_MANUAL_TEXT_LENGTH ?? 500000),
  MAX_DOC_SIZE_MB: Number(process.env.MAX_DOC_SIZE_MB ?? 50),
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? './uploads',
  PYTHON_BIN: process.env.PYTHON_BIN ?? (process.platform === 'win32' ? 'python' : 'python3'),
});
