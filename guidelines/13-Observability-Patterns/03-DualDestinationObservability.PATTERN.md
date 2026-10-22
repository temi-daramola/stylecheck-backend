# Dual-Destination Observability Pattern

## Status
🟡 **REQUIRED** - Every log call reaching both Better Stack and Sentry

## Purpose
`02-SentryBetterStackSetup.PATTERN.md` wires up Sentry and Better Stack
as two independent destinations. This pattern makes a deliberate choice
on top of that: every log call, at every layer, reaches both — not just
whichever one each tool's own defaults happen to catch.

---

## Universal Pattern

**"One composite wrapper — ObservableLogger — not duplicated calls scattered through the codebase. Every layer calls exactly one method on one object; that object is the only thing that knows both the Logger and ErrorTracker exist."**

---

## The Seven Layers That Get This Treatment

Every one of these writes through the same logger, at entry (and at any
meaningful business event), tagging its own layer using the `Layer` enum
from `05-Error-Handling-Patterns/02-ErrorHierarchy.PATTERN.md` — never a
raw string:

- **Routes** — request received
- **Validation** — its own middleware, not folded into route or
  controller; tagging it separately allows searching "every validation
  failure, across every endpoint" as its own category
- **Auth** — same reasoning, its own distinct failure mode
  (`UnauthorizedError`), worth isolating in a search
- **Controllers** — delegating to a service
- **Services** (internal business logic)
- **External services** — any third-party API call, a distinct layer
  from internal services
- **DAOs** — the database access layer

```js
req.log.debug({ layer: Layer.ROUTE }, 'Request received');
req.log.debug({ layer: Layer.VALIDATION }, 'Validating request body');
req.log.debug({ layer: Layer.AUTH }, 'Verifying token');
req.log.debug({ layer: Layer.CONTROLLER }, 'Delegating to service');
req.log.debug({ layer: Layer.SERVICE }, 'Entering createOrder');
req.log.debug({ layer: Layer.EXTERNAL_API }, 'Calling payment provider');
req.log.debug({ layer: Layer.DATABASE }, 'DAO create called');
```

---

## The `ErrorTracker` Contract

Same reasoning as `12-Logging-Patterns/01-StructuredLogging.PATTERN.md`'s
`Logger` adapter: nothing outside this one file should know Sentry
specifically exists.

```js
// common/errorTracking/ErrorTracker.js — the contract
class ErrorTracker {
  captureException(err, context) {}
  addBreadcrumb(breadcrumb) {}
  setUser(user) {} // { id, name } — Sentry's dedicated user-context panel, not a breadcrumb/tag
  log(level, message, meta) {} // see enableSentryLogs note below — optional, flagged, not default-on
}
module.exports = ErrorTracker;
```

```js
// adapters/errorTracking/sentry.errorTracker.js — the only file that knows Sentry exists
const Sentry = require('@sentry/node');
const ErrorTracker = require('@common/errorTracking/ErrorTracker');

class SentryErrorTracker extends ErrorTracker {
  captureException(err, context) { Sentry.captureException(err, { extra: context }); }
  addBreadcrumb(breadcrumb) { Sentry.addBreadcrumb(breadcrumb); }
  setUser(user) { Sentry.setUser({ id: user.id, username: user.name }); }
  log(level, message, meta) { Sentry.logger[level](message, meta); }
}
module.exports = SentryErrorTracker;
```

**Why `setUser` is safe to call per-request, not just once globally:**
in a Node server handling many requests concurrently, a naive global
`Sentry.setUser(...)` call would leak one user's identity onto an error
that actually happened while handling a *different* user's request at
the same moment. `Sentry.Handlers.requestHandler()`
(`02-SentryBetterStackSetup.PATTERN.md`) runs each request in its own
isolated Sentry scope specifically to prevent this — calling `setUser`
inside the same per-request auth middleware that already updates
`req.log` is correct, not a race condition waiting to happen.

---

## Wiring: the Multiplexed Transport

Every captured exception fans out to both the real Sentry DSN and Better
Stack's error-tracking DSN:

```js
// app/observability.js — replaces 02-SentryBetterStackSetup.PATTERN.md's baseline version
const Sentry = require('@sentry/node');
const { makeNodeTransport } = require('@sentry/node');
const { makeMultiplexedTransport } = require('@sentry/core');
const { common } = require('@common/_index.js');
const { SENTRY_DSN, BETTERSTACK_ERROR_DSN } = common.constants.env;

Sentry.init({
  dsn: SENTRY_DSN,
  enableLogs: true, // required if enableSentryLogs below is ever turned on
  transport: makeMultiplexedTransport(makeNodeTransport, () => [
    { dsn: SENTRY_DSN },
    { dsn: BETTERSTACK_ERROR_DSN },
  ]),
});

function initSentry(app) {
  app.use(Sentry.Handlers.requestHandler());
}

function sentryErrorHandler(app) {
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error) { return true; }, // capture everything, not just the 500+ default
  }));
}

module.exports = { initSentry, sentryErrorHandler };
```

---

## `ObservableLogger` — the One Wrapper Every Layer Actually Calls

This is the piece that turns "one call site, two destinations" from a
rule to remember into something structurally guaranteed:

```js
// common/logging/ObservableLogger.js
class ObservableLogger {
  constructor(logger, errorTracker, { enableSentryLogs = false, context = {} } = {}) {
    this._logger = logger;                     // Logger contract → Better Stack
    this._tracker = errorTracker;              // ErrorTracker contract → Sentry
    this._enableSentryLogs = enableSentryLogs; // OFF by default — see decision point below
    this._context = context;                   // reqId/userId/userName accumulated via child()
  }

  debug(meta, message) { this._record('debug', meta, message); }
  info(meta, message)  { this._record('info', meta, message); }
  warn(meta, message)  { this._record('warn', meta, message); }
  error(meta, message) { this._record('error', meta, message); }
  fatal(meta, message) { this._record('fatal', meta, message); }

  _record(level, meta, message) {
    this._logger[level](meta, message); // → Better Stack, always, every call

    this._tracker.addBreadcrumb({ category: meta.layer, message, level, data: { ...this._context, ...meta } });

    if (this._enableSentryLogs) {
      this._tracker.log(level, message, { ...this._context, ...meta });
    }
  }

  child(meta) {
    const mergedContext = { ...this._context, ...meta }; // accumulates, e.g. { reqId } then later + { userId, userName }
    return new ObservableLogger(this._logger.child(meta), this._tracker, {
      enableSentryLogs: this._enableSentryLogs,
      context: mergedContext,
    });
  }
}
module.exports = ObservableLogger;
```

Every layer's call stays exactly as simple as it already was —
`req.log.debug({ layer: Layer.SERVICE }, 'Entering createOrder')` —
nothing at any call site changes to get dual-destination coverage; the
duplication lives in this one class, once. `child()` accumulates context
for Sentry breadcrumbs the same way it already does for Pino — by the
time auth attaches `userId`/`userName`, both destinations have it on
every subsequent line.

**Call-site update needed in `12-Logging-Patterns/02-CorrelationIds.PATTERN.md`'s
`attachUserToLogger`, now that `setUser` exists**:

```js
function attachUserToLogger(req, res, next) {
  req.log = req.log.child({ userId: req.user.id, userName: req.user.name }); // breadcrumbs + Better Stack
  errorTracker.setUser({ id: req.user.id, name: req.user.name });            // Sentry's dedicated User panel
  next();
}
```

---

## `enableSentryLogs` — a Flagged Decision, Not a Default

**Deliberately off by default, confirmed at implementation time, not
assumed.** Given Better Stack already holds every log line regardless of
outcome, and Sentry breadcrumbs already surface automatically on any
error that does get captured, a *third* full copy of every log line in
Sentry Logs may add nothing — or it may be pure redundant storage and
cost. Whoever implements this should treat `enableSentryLogs` as a
question to raise and get a real answer on before flipping it to `true`,
not a setting to default on because the capability exists.

---

## Audit Checklist

- [ ] Every one of the seven layers tags its own `layer` on log calls,
      using the `Layer` enum
- [ ] All logging goes through `ObservableLogger`, never `Logger` or
      `ErrorTracker` called separately at a call site
- [ ] `setUser` is called per-request (inside auth middleware), never
      once globally at app boot
- [ ] `enableSentryLogs` is off unless a deliberate decision was made and
      recorded to turn it on
- [ ] A background job's logger (see
      `12-Logging-Patterns/02-CorrelationIds.PATTERN.md`) is also an
      `ObservableLogger`, not a plain `Logger` — dual coverage applies
      there too

---

## Related Patterns
- [Sentry & Better Stack Setup](./02-SentryBetterStackSetup.PATTERN.md)
- [Structured Logging](../12-Logging-Patterns/01-StructuredLogging.PATTERN.md)
- [Correlation IDs](../12-Logging-Patterns/02-CorrelationIds.PATTERN.md)

---

**One call, two destinations, guaranteed by one wrapper class — not a rule every call site has to remember.**
