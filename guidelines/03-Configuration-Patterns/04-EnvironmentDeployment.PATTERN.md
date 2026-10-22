# Environment Deployment Pattern

## Status
🔴 **CRITICAL** - Governs how environment variables get loaded and deployed on every stage

## Purpose
Define the stages the backend runs in, how `NODE_ENV` identifies the stage, how each stage's variables get INTO `process.env`, and the deploy process. Distinct from [Environment Variables](./01-EnvironmentVariables.PATTERN.md), which governs how `process.env` is READ once it's already populated.

---

## Universal Pattern

**"`NODE_ENV` is always set explicitly, to one of four values: `development`, `test`, `staging`, `production`. A missing or unrecognized value is a startup failure, never a fallback. Development and test read a local file; staging and production get their values from the host. The loader lives inside `env.constants.js`, before any value is read."**

---

## The Stages

| Stage | `NODE_ENV` | Where it runs | API keys | Database | Where values live |
|---|---|---|---|---|---|
| Development | `development` | Developer machine | Test/sandbox | Dev database | `.env.development` (local file) |
| Test | `test` | Test runner / CI | Fake or sandbox | Throwaway database | `.env.test` (local file) |
| Staging | `staging` | Hosted, non-live URL | Test/sandbox (may match development) | Its own database | Host dashboard |
| Production | `production` | Hosted, live | Real keys, **only here** | Live database | Host dashboard |

- **Development and staging may share sandbox keys.** Staging still gets its own database, so test data never mixes with local experiments.
- **Production credentials exist only on the production host.** They never appear in a development file or on a developer machine.
- **No `.env` file exists for production or staging.** Their values are set in the host's dashboard, per service.

---

## Why Fail-Fast

There are two ways to get the stage wrong, and they do not cost the same.

| Mistake | This pattern (fail-fast) | Silent production default |
|---|---|---|
| `NODE_ENV` forgotten on a developer machine | Process exits at startup with a clear message | Loads the production file: real reads, writes, emails and payments against the live database |
| `NODE_ENV` misspelled (`prod`) | Process exits at startup | Treated as production, or as nothing at all |
| `NODE_ENV=production` set by mistake on a developer machine | Process exits: no production values exist there, so required variables are missing | Would load live credentials if a production file were present |
| Test runner, CI job or a new stage | Allowlisted, or one added row | Silently loads the production file |

- **A crash at startup is the cheapest possible failure.** It happens before any traffic, any query, any side effect.
- **A silent fall-through is the most expensive.** Nothing looks broken until the damage is done.
- **The protection is two layers.** The allowlist stops unknown stages; keeping production values off developer machines stops a wrong-but-valid stage from reaching anything live.

---

## Loading Mechanism

The loader lives at the top of the one file allowed to read `process.env`, so it runs before any value is exported.

```javascript
// backend/src/common/constants/env.constants.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

// One row per stage. Adding a stage = adding a row. Anything not listed is a hard failure.
//   file:           local env file to load, or null when the host supplies the variables
//   productionLike: true when the stage should behave like production (secure cookies,
//                   no stack traces in responses, production logging)
const STAGES = Object.freeze({
  development: { file: '.env.development', productionLike: false },
  test:        { file: '.env.test',        productionLike: false },
  staging:     { file: null,               productionLike: true },
  production:  { file: null,               productionLike: true },
});

const nodeEnv = process.env.NODE_ENV;

if (!Object.hasOwn(STAGES, nodeEnv)) {
  throw new Error(
    `NODE_ENV is "${nodeEnv || '(unset)'}" — must be explicitly one of: ` +
    `${Object.keys(STAGES).join(', ')}. Refusing to start: an unset or unrecognized ` +
    'NODE_ENV must never silently fall back to another stage\'s config (above all production, ' +
    'which points at the live database). Set NODE_ENV explicitly — `npm run dev` already ' +
    'does this for local work; hosted services set it in their dashboard.'
  );
}

const stage = STAGES[nodeEnv];

if (stage.file) {
  // Resolve from the backend root, never from process.cwd() — pm2 and systemd
  // can start the process from any directory.
  const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const envFilePath = path.join(BACKEND_ROOT, stage.file);

  // Does not override variables already set in the real environment.
  const loaded = dotenv.config({ path: envFilePath });
  if (loaded.error) {
    throw new Error(`Could not load ${envFilePath} for NODE_ENV="${nodeEnv}": ${loaded.error.message}`);
  }
}

// Expand ${NAME} references. Works the same for file values and host-supplied values,
// because it runs on process.env after loading. Only values that contain ${...} are
// touched, so a plain "$" elsewhere (e.g. in a password) is left alone.
const referenceKeys = Object.keys(process.env).filter((key) => /\$\{[A-Za-z_]/.test(process.env[key]));

for (const key of referenceKeys) {
  for (const [, name] of process.env[key].matchAll(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g)) {
    if (process.env[name] === undefined) {
      throw new Error(`${key} references \${${name}}, which is not set`);
    }
  }
}
dotenvExpand.expand({ parsed: Object.fromEntries(referenceKeys.map((key) => [key, process.env[key]])) });

export const NODE_ENV = nodeEnv;
export const IS_PRODUCTION_LIKE = stage.productionLike;
```

- **Allowlist, not a ternary.** A two-way `=== 'development' ? … : …` treats every other value as production. A lookup table makes each stage an explicit decision.
- **`Object.hasOwn`, not `in`.** `'constructor' in STAGES` is `true`; `Object.hasOwn` (Node 16.9+) is not fooled by inherited properties.
- **Absolute path.** `dotenv.config({ path })` resolves a relative path against the current working directory, not the file's location.
- **A missing file is fatal.** `dotenv.config()` never throws — it returns `{ error }`. Ignoring that result means a missing file silently produces an app full of `undefined` variables.
- **Hosted stages load no file.** A stray `.env` on disk is ignored by design; nothing loads it automatically.
- **Real environment variables always win** over the file. `dotenv` does not override variables already in `process.env`.

---

## Required Variables

With no file to inspect on hosted stages, every mandatory variable is verified after loading. This is the contract with [Environment Variables](./01-EnvironmentVariables.PATTERN.md): mandatory variables have no silent fallback.

```javascript
// same file, below the loader
const requireEnv = (name) => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const MONGODB_URI = requireEnv('MONGODB_URI');   // mandatory: fails fast
export const BASE_URL = requireEnv('BASE_URL');
export const AUTH_URL = requireEnv('AUTH_URL');
export const USERS_URL = requireEnv('USERS_URL');
export const PORT = Number(process.env.PORT ?? 5000);   // genuinely optional: a default is fine
```

This is what protects a hosted stage from a forgotten dashboard entry: the service crashes at startup instead of running with `undefined`.

---

## Variable References (Interpolation)

One constant (e.g. `BASE_URL`) can be reused inside other variables with `${NAME}`. The app expands them once, at startup, using `dotenv-expand` — so it works the same locally and on the host.

**`.env.development` (local file):**
```env
BASE_URL=http://localhost:5000
AUTH_URL=${BASE_URL}/auth
USERS_URL=${BASE_URL}/users
```

**Host dashboard (staging or production), typed exactly like this:**
```
BASE_URL  = https://api.mydomain.com
AUTH_URL  = ${BASE_URL}/auth
USERS_URL = ${BASE_URL}/users
```

- **The host does not expand these; the app does.** Hosts pass dashboard values through as typed. The expansion happens in `env.constants.js`, which is why `dotenv-expand` is in `package.json`.
- **Only `BASE_URL` changes between stages.** The derived lines are identical everywhere.
- **A reference to an unset variable is a startup failure,** not an empty string.
- **Reference plain values.** A variable that itself contains `${...}` should not be the target of another reference.
- **Derived values are never concatenated in application code.** They are computed here, once.

---

## Using the Stage in Code

Application code never compares `NODE_ENV` to the string `'production'`. It imports one of two things from `env.constants.js`:

| Need | Use |
|---|---|
| Behave like production (secure cookies, hide stack traces, production log level) | `IS_PRODUCTION_LIKE` — true for staging **and** production |
| Label something (Sentry `environment` tag, a log field) | `NODE_ENV` as data |

Behaviour that differs between stages comes from different **variable values**, never from `if (NODE_ENV === 'staging') …` branches.

**Known cost of one variable.** Third-party libraries read `NODE_ENV` themselves and only switch to their production mode for the exact word `production`. On staging they run in their default mode. For an API-only Express backend with no view templates the difference is small, and the central error middleware replaces Express's default error output.

---

## Adding a Stage

1. Add one row to `STAGES` (for example `preview: { file: null, productionLike: true }`).
2. Set `NODE_ENV=preview` on that host, and its variables in the host's dashboard.

No other code changes. A stage that is not in the table cannot start.

---

## package.json Scripts

```json
"scripts": {
  "dev": "cross-env NODE_ENV=development node src/server.js",
  "test": "cross-env NODE_ENV=test <your test runner>",
  "start": "node src/server.js"
}
```

- **`cross-env` stays.** The `dev` and `test` scripts run on developer machines, which may be Windows — not on the Linux deployment server.
- **`start` deliberately does not set `NODE_ENV`.** If it did, running `npm start` locally could load the wrong stage. The host sets it; `start` only starts the process.
- **Dependencies:** `dotenv` and `dotenv-expand` are normal (non-dev) dependencies, because the loader runs in production too.

---

## Deploy Process

`NODE_ENV` is set **once, on the host**, never in code. Each stage is its own service with its own variables.

| Host | Production service | Staging service |
|---|---|---|
| Render | Nothing to do — Render sets `NODE_ENV=production` by default for Node services | Override `NODE_ENV` to `staging` in the service's environment tab |
| Railway and similar | Set `NODE_ENV=production` | Set `NODE_ENV=staging` |
| VPS + PM2 | `env_production: { NODE_ENV: 'production' }`, then `pm2 start ecosystem.config.js --env production` | `env_staging: { NODE_ENV: 'staging' }`, then `--env staging` |
| VPS + systemd | `Environment=NODE_ENV=production` | `Environment=NODE_ENV=staging` |

- **A staging service that keeps Render's default** runs as `production` with staging's values. The values still point at staging resources, so nothing live is touched; only the label is wrong. Override it on creation.
- **On a plain VPS with no dashboard,** change that stage's `file: null` to a filename (for example `'.env.staging'`), gitignore it and give it `600` permissions.

---

## Secrets Handling

- **Never commit `.env*`.** All env files are in `.gitignore`; commit a `.env.example` with variable names and placeholder values only.
- **Production and staging secrets live in the host's dashboard,** not in files and not on developer machines.
- **Development files hold sandbox keys only.** A real production key in `.env.development` defeats the whole separation.
- **A leaked shared sandbox key affects both development and staging.** Rotate it in the provider's dashboard; production is unaffected.

---

## Relationship to Environment Variables Pattern

This pattern governs how env vars get **INTO** `process.env`. [Environment Variables](./01-EnvironmentVariables.PATTERN.md) (03-01) governs how `process.env` is **READ**.

Both live in the same file, so the rule "`process.env` is read only in `env.constants.js`" has **no exceptions**. The loader runs at the top of that module, before any export is evaluated; ESM import hoisting does not change that, because the load happens in the module's own body.

---

## Considered and Rejected

**Silent production default.** Unset `NODE_ENV` loaded `.env`, and `NODE_ENV` was never set on the server.
- **Wrong failure direction.** Forgetting a flag on a developer machine loaded live credentials.
- **Inaccurate premise.** "`NODE_ENV` is unset on the server" depends on the host; Render sets it to `production` automatically.
- **Does not extend.** A third stage (test, staging) had no home and silently loaded the production file.
- **Needed an exception.** The loader sat outside `env.constants.js`, carving a hole in the `process.env` rule.

**A second variable (`APP_ENV`) for the stage, with `NODE_ENV` kept at `production` on staging.** Technically tidier for libraries, but two settings that must agree are more to understand and more to get wrong. Rejected for simplicity; `IS_PRODUCTION_LIKE` covers our own code.

**A production file next to the development file.** Any copy on a developer machine is a live credential one mistaken command away from use. dotenv's own FAQ also advises against a main `.env` plus per-environment files.

---

## Audit Checklist

- [ ] The loader is at the top of `env.constants.js`; no other file calls `dotenv` or reads `process.env`
- [ ] `NODE_ENV` is checked against the `STAGES` allowlist (`Object.hasOwn`); unset or unrecognized throws at startup
- [ ] The env file path is absolute (resolved from the backend root), not relative to `process.cwd()`
- [ ] A missing env file throws for `development` and `test`
- [ ] No `.env` or `.env.production` file exists; staging and production load no file
- [ ] Every mandatory variable goes through `requireEnv`; only genuinely optional ones have defaults
- [ ] `${NAME}` references are expanded in `env.constants.js` after loading; an unset reference throws
- [ ] `dotenv` and `dotenv-expand` are in `dependencies`, not `devDependencies`
- [ ] No application file compares `NODE_ENV` to `'production'`; production-like behaviour uses `IS_PRODUCTION_LIKE`
- [ ] No `if (NODE_ENV === 'staging')` branching; stage differences come from variable values
- [ ] `NODE_ENV` is set on the host (PaaS dashboard, PM2 `env_*`, or systemd) — not in code and not in `start`
- [ ] The staging service overrides Render's default `NODE_ENV=production`
- [ ] `dev` and `test` scripts set `NODE_ENV` via `cross-env`
- [ ] No production credential appears in any file on a developer machine
- [ ] All `.env*` files are gitignored; `.env.example` is committed

---

## Related Patterns
- [Environment Variables](./01-EnvironmentVariables.PATTERN.md)
- [Constants Management](./02-ConstantsManagement.PATTERN.md)

---

**`NODE_ENV` is explicit, the allowlist is closed, and `${NAME}` references are expanded by the app itself — a stage that isn't named cannot start, and a value that isn't set cannot be skipped.**
