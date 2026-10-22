# Sentry, Better Stack & Uptime Setup Pattern

## Status
🟡 **REQUIRED** - Account setup and wiring for the tools confirmed in 01-AddNowVsLater

## Purpose
The actual account setup and wiring for Sentry, Better Stack, and uptime
monitoring — with one strict design decision made explicit up front.

---

## Universal Pattern

**"Zero conditional logic based on environment, anywhere in this code. The exact same code runs unconditionally in dev and prod. The ONLY difference between environments is which values happen to be loaded for that stage — separate Sentry projects, separate Better Stack sources, never an if (env === 'production') branch deciding whether a tool runs at all."**

---

## Sentry — Two Projects, Not One

1. Create an account at sentry.io.
2. Create **two projects** (Express platform, both): e.g.
   `myapp-development` and `myapp-production`. Each gets its own DSN —
   this is the entire separation mechanism.
3. Copy each project's DSN into the matching stage's variables,
   under the *same* variable name:
   - development → `.env.development` (local file): `SENTRY_DSN=https://<dev-key>@o000000.ingest.us.sentry.io/1111111`
   - production → the production service's environment tab, no file: `SENTRY_DSN=https://<prod-key>@o000000.ingest.us.sentry.io/2222222`
   - staging → the staging service's environment tab. It may reuse the development project's DSN or have its own; either way it is only a value (see `03-Configuration-Patterns/04-EnvironmentDeployment.PATTERN.md`).

## Better Stack — Two Sources, Same Idea

1. Create an account at betterstack.com.
2. Create **two Sources** for logs: e.g. `myapp-dev` and `myapp-prod`.
   Each gives its own Source Token (`LOGTAIL_SOURCE_TOKEN`).
3. **Uptime** only makes sense against the production URL — one monitor,
   pointed at the live domain's health endpoint, no dev counterpart
   needed.
4. **Error tracking is a separate Source type, not a reuse of the Logs
   sources above — create two more.** Select the error-tracking/
   Sentry-compatible platform option, not a generic Logs source. Do this
   twice (`myapp-dev-errors`, `myapp-prod-errors`), mirroring the same
   dev/prod split, for the same reason. Each gives an **Ingest DSN**
   (`BETTERSTACK_ERROR_DSN`) — a different credential from
   `LOGTAIL_SOURCE_TOKEN`, even though it lives in the same account.

**Four Better Stack sources total** (two logs, two error-tracking) plus
one uptime monitor, all under one account.

## What's Actually Free — Confirmed Limits, Worth Re-Checking Over Time

**Sentry (Developer/free tier)**: 5,000 errors/month, 1 user, 5M spans,
50 replays, 30-day retention, email alerts only (Slack/PagerDuty is
paid-tier). Paid tiers start around $26/month if outgrown.

**Better Stack (free tier)**: 10 uptime monitors, 100,000 exceptions/
month (considerably more headroom than Sentry's quota), 5,000 session
replays, 30GB metrics, 1 status page. **Logs specifically are the real
limitation**: 1–3GB, retained only 3 days — further back requires a paid
tier (roughly $24–29/month).

**Confirm directly in each dashboard before relying on this, not just
here**: whether Sentry's free quota is pooled or separate across two
free organizations, and whether Better Stack's free quota is shared or
separate across the four Sources set up above. Neither platform's exact
multi-project free-tier behavior is confirmable from outside their own
dashboards — pricing pages are the authoritative source if either turns
out to matter.

**Practical takeaway at solo-project scale**: both are genuinely free in
practice. The 3-day log-retention window is the limit most likely to
actually matter before either error-tracking quota does.

---

## The Wiring — One Code Path, No Environment Checks

```js
// common/constants/env.constants.js — additions to the existing file.
// It is the only file that reads process.env (03-Configuration-Patterns/01 and 04);
// NODE_ENV and IS_PRODUCTION_LIKE are already exported by its loader.
export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';   // optional: a default is allowed
export const SENTRY_DSN = process.env.SENTRY_DSN;
export const LOGTAIL_SOURCE_TOKEN = process.env.LOGTAIL_SOURCE_TOKEN;
export const BETTERSTACK_ERROR_DSN = process.env.BETTERSTACK_ERROR_DSN; // used once 03-DualDestinationObservability wires it up
```

```js
// app/observability.js — baseline, Sentry-only version;
// 03-DualDestinationObservability.PATTERN.md replaces this once the
// Better Stack error-tracking DSN is in the picture
const Sentry = require('@sentry/node');
const { common } = require('@common/_index.js');
const { SENTRY_DSN } = common.constants.env;

function initSentry(app) {
  Sentry.init({ dsn: SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}

function sentryErrorHandler(app) {
  app.use(Sentry.Handlers.errorHandler()); // register before the app's own error middleware
}

module.exports = { initSentry, sentryErrorHandler };
```

No branch anywhere asks what environment this is running in. Which
Sentry project events land in is decided entirely by whichever
`SENTRY_DSN` value was loaded.

---

## The Health Endpoint Uptime Monitoring Pings

```js
// routes/health.routes.js
router.get('/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping(); // actually checks the DB, not just "server responded"
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error' });
  }
});
```

Deliberately unauthenticated and lightweight, but must reflect real DB
connectivity — a process that's up but can't reach its database is
exactly the half-working state
`02-Architecture-Patterns/04-ServerBootstrap.PATTERN.md`'s fail-fast
startup is meant to avoid.

---

## Where Each Stage's Values Live — Same Variable Names, Different Real Values

```bash
# .env.example — committed, documents what's needed, no real values
SENTRY_DSN=
LOGTAIL_SOURCE_TOKEN=
BETTERSTACK_ERROR_DSN=

# .env.development — local file, gitignored, real DEV credentials
SENTRY_DSN=https://<dev-key>@o000000.ingest.us.sentry.io/1111111
LOGTAIL_SOURCE_TOKEN=<dev-token>
BETTERSTACK_ERROR_DSN=<dev-error-ingest-dsn>

# Production (and staging) — NOT a file. The same variable names are set in
# each service's environment tab (Render/Railway), or in a VPS's PM2
# ecosystem file / systemd unit. No production value exists on a developer machine.
SENTRY_DSN=https://<prod-key>@o000000.ingest.us.sentry.io/2222222
LOGTAIL_SOURCE_TOKEN=<prod-token>
BETTERSTACK_ERROR_DSN=<prod-error-ingest-dsn>
```

**`NODE_ENV` must be set explicitly on every host, and the app refuses to
start without it**
(`03-Configuration-Patterns/04-EnvironmentDeployment.PATTERN.md`). Render
sets `production` on its own, so the staging service overrides it to
`staging`; Railway needs it set by hand. On a raw VPS with PM2, this is
manual:

```js
module.exports = {
  apps: [{
    name: 'api',
    script: 'src/server.js',
    env_production: {
      NODE_ENV: 'production',
      SENTRY_DSN: '<prod DSN>',
      LOGTAIL_SOURCE_TOKEN: '<prod token>',
    },
  }],
};
// then: pm2 start ecosystem.config.js --env production
// staging: add an env_staging block with NODE_ENV: 'staging' and start with --env staging
// keep this file out of git, or point it at the host's environment instead of literals
```

Because the code has no environment check anywhere, there's no fallback
behavior to notice if this goes wrong — if production accidentally
starts with dev credentials loaded, it runs completely normally, just
quietly logging into the *dev* Sentry project and Better Stack source
instead of production's. Nothing looks broken from the outside; the only
symptom is production incidents showing up in the wrong dashboard. Worth
confirming which credentials actually loaded on the first real deploy,
precisely because the code will never complain either way.

---

## Audit Checklist

- [ ] Sentry has two separate projects (dev/prod), never one project
      shared across environments
- [ ] Better Stack has four sources total (two logs, two error-tracking)
      plus one uptime monitor
- [ ] No file anywhere contains `if (env === 'production')` or
      equivalent to decide whether Sentry/logging runs — only which
      credentials get loaded differs
- [ ] Sentry/Better Stack values are read through
      `common.constants.env`, never `process.env` directly
- [ ] The health endpoint checks real DB connectivity, not just process
      liveness
- [ ] Which credentials loaded was confirmed directly after the first
      real production deploy, not assumed

---

## Related Patterns
- [Add Now vs. Later](./01-AddNowVsLater.PATTERN.md)
- [Dual-Destination Observability](./03-DualDestinationObservability.PATTERN.md)
- [Environment Deployment](../03-Configuration-Patterns/04-EnvironmentDeployment.PATTERN.md)

---

**Same code, every environment. Only the loaded credentials differ — the code never asks which environment it's in.**
