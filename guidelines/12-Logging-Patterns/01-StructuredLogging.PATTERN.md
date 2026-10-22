# Structured Logging Pattern

## Status
🔴 **CRITICAL** - `console.log` is never acceptable in this codebase

## Purpose
`console.log`/`console.error` write a plain string, with no level, no
structure, and no way to filter by anything other than grepping text.
That's fine for one developer's terminal. It breaks down in production
for reasons specific to Node.

---

## Universal Pattern

**"Structured logging (Pino), kept behind this codebase's own Logger adapter — never called directly. Every call is an object first, a message second. Shipped to stdout AND a hosted platform simultaneously, as two independent destinations, not a fallback chain."**

---

## Why `console.log` Specifically Fails in Node

1. **Concurrent requests interleave.** Node's single-threaded event loop
   means two requests' `console.log` calls, from unrelated code paths,
   land in the same stdout stream in whatever order their I/O happened
   to resolve — nothing distinguishes which line belongs to which
   request.
2. **This app almost certainly runs more than one process** — PM2
   cluster mode, multiple container replicas, or a serverless platform
   all mean "the terminal" doesn't exist as a single place.
3. **Logs are read after the fact, not live.** By the time anyone is
   looking, they're searching, not watching — `console.log`'s only
   search mechanism is text matching.

---

## What a Structured Logger Actually Is

A function that takes an object, adds a few standard fields, and writes
one line of JSON. Pino is worth reaching for specifically because of
what it does beyond that basic shape:

- **Non-blocking at real volume** — writes through a separate worker
  thread by default, so logging doesn't compete with request-handling
  for the same thread.
- **Cheap, centrally-enforced levels** — "only log `warn` and above in
  production" is one config line; a call below the configured level
  costs almost nothing.
- **A timestamp on every single line, automatically** — this matters
  more than it sounds: once logs from many requests, possibly many
  servers, get merged somewhere central, the timestamp is the only way
  to reconstruct what happened in what order. A hand-rolled logger risks
  one missed call site breaking an incident timeline; a library
  guarantees it's never missing.
- **Redaction, child loggers, and transports already solved** — not
  worth rebuilding.

```js
const pino = require('pino');
const { common } = require('@common/_index.js');
const logger = pino({
  level: common.constants.env.LOG_LEVEL, // never process.env here (03-Configuration-Patterns/01)
  redact: ['req.headers.authorization', 'body.password'],
});

logger.warn({ userId: 4821, reason: 'wrong_password' }, 'Login failed');
// {"level":40,"time":1718000000000,"userId":4821,"reason":"wrong_password","msg":"Login failed"}
```

The object-first argument is the entire point — `reason: "wrong_password"`
is a queryable field in whatever system ingests this, not a substring to
grep for. `redact` matters specifically because structured logging makes
it *easier* to accidentally over-log — `logger.info({ req: req.body })`
will happily capture a plaintext password the moment someone adds it to
a request body without thinking about the logger.

**One failure, one log line.** Never log the same failure at every layer
as it re-throws upward (a DAO logs it, the controller re-throws and logs
it again, the route logs it a third time) — this triples log volume for
one real event and poisons any log-based error-rate metric built on top
of it.

---

## Keep the Library Behind This Codebase's Own Adapter

If `logger.warn(...)` in middleware is really `pinoInstance.warn(...)`
everywhere, Pino's specific API has leaked into every file that logs
anything. Same treatment this reference's `adapters/` folder already
gives bcrypt, JWT, and storage:

```js
// common/logging/Logger.js — the contract every part of the app depends on
class Logger {
  info(meta, message) {}
  warn(meta, message) {}
  error(meta, message) {}
  fatal(meta, message) {}
  child(meta) {}
}
module.exports = Logger;
```

```js
// adapters/logging/pino.logger.js — the only file that knows Pino exists
const pino = require('pino');
const Logger = require('@common/logging/Logger');
const { common } = require('@common/_index.js');

class PinoLogger extends Logger {
  constructor(pinoInstance) {
    super();
    this._pino = pinoInstance || pino({ level: common.constants.env.LOG_LEVEL });
  }
  info(meta, message) { this._pino.info(meta, message); }
  warn(meta, message) { this._pino.warn(meta, message); }
  error(meta, message) { this._pino.error(meta, message); }
  fatal(meta, message) { this._pino.fatal(meta, message); }
  child(meta) { return new PinoLogger(this._pino.child(meta)); }
}
module.exports = PinoLogger;
```

Every other file — the central error middleware, a controller, a DAO —
only ever calls `logger.warn(...)` on whatever `Logger`-shaped instance
it was given. Swapping Pino for Winston, or a hosted SDK, means writing
one new adapter file and changing the one place that constructs
`logger` — no call site anywhere else changes.

---

## Shipping: Local AND Remote, Simultaneously — Never a Fallback Chain

For a solo engineer with no team to notice problems, "check the
platform's viewer after a user complains" isn't enough — alerting has to
exist before something breaks, which means logs need to live somewhere
genuinely queryable. **Write to stdout and ship to a hosted log platform
as two independent, parallel destinations, every time** — not "try
remote, fall back to local," which requires failure-detection logic of
its own.

```js
// adapters/logging/pino.logger.js
const pino = require('pino');
const Logger = require('@common/logging/Logger');
const { common } = require('@common/_index.js');

class PinoLogger extends Logger {
  constructor(pinoInstance) {
    super();
    this._pino = pinoInstance || pino(
      pino.transport({
        targets: [
          {
            target: 'pino/file',
            options: { destination: 1 }, // fd 1 = stdout — no network involved, always works
            level: common.constants.env.LOG_LEVEL,
          },
          {
            target: '@logtail/pino', // Better Stack; swap for another provider's transport if preferred
            options: { sourceToken: common.constants.env.LOGTAIL_SOURCE_TOKEN },
            level: common.constants.env.LOG_LEVEL,
          },
        ],
      })
    );
  }
  info(meta, message) { this._pino.info(meta, message); }
  warn(meta, message) { this._pino.warn(meta, message); }
  error(meta, message) { this._pino.error(meta, message); }
  fatal(meta, message) { this._pino.fatal(meta, message); }
  child(meta) { return new PinoLogger(this._pino.child(meta)); }
}
module.exports = PinoLogger;
```

Pino transports run in a separate worker thread specifically so one
failing destination can't block the others — if the network target can't
reach the log platform, that failure is isolated to that one thread. It
doesn't throw in the route, doesn't crash the process, and doesn't delay
the stdout write. **One honest limitation**: logs written during a
sustained outage won't retroactively backfill into the hosted platform
once it recovers — this is best-effort-forward, not a durable queue —
but they're never actually lost, since stdout still has them.

Once logs land in a real platform (Better Stack, Axiom, or Grafana
Cloud — a managed one, not self-hosted, since standing up a Loki/ELK
stack is real ongoing ops work for a benefit not needed yet at solo-
engineer scale), real queries and configured alerts become possible —
see `13-Observability-Patterns/02-SentryBetterStackSetup.PATTERN.md` for
the actual account setup.

---

## Audit Checklist

- [ ] No `console.log`/`console.error` anywhere in application code
- [ ] Logging is only ever accessed through this codebase's own `Logger`
      adapter — no file outside `adapters/logging/` imports Pino directly
- [ ] Sensitive fields (`password`, `authorization` header, etc.) are
      redacted at the logger config level, not left to each call site's
      discretion
- [ ] Every log call is object-first, message-second — never a plain
      string template
- [ ] A single failure is logged exactly once, at one deliberate layer —
      never duplicated as it re-throws upward
- [ ] Logs ship to both stdout and a hosted platform simultaneously —
      never a fallback chain between them

---

## Related Patterns
- [Correlation IDs](./02-CorrelationIds.PATTERN.md)
- [Central Error Middleware](../05-Error-Handling-Patterns/04-CentralErrorMiddleware.PATTERN.md)
- [Sentry & Better Stack Setup](../13-Observability-Patterns/02-SentryBetterStackSetup.PATTERN.md)

---

**Structured, behind an adapter, shipped to two destinations at once — never console.log, never called directly, never a fallback chain.**
