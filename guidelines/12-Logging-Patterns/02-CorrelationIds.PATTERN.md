# Correlation IDs Pattern

## Status
🔴 **CRITICAL** - Required for isolating one request's full log history

## Purpose
Once logs are structured, it's still impossible to answer "show me
everything that happened during this one user's failed request" if
fifty other requests' log lines are interleaved with it. Stamp a request
ID onto every log line produced while handling that request.

---

## Universal Pattern

**"AsyncLocalStorage — the official, core-team-maintained mechanism since Node 16.4 — carries a reqId across every async/await boundary with no manual parameter-passing. requestId rides on every response, success or failure. Once authenticated, userId/userName are added the same way."**

---

## `AsyncLocalStorage` Setup

```js
const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID } = require('node:crypto');

const als = new AsyncLocalStorage();

function requestContext(req, res, next) {
  const reqId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', reqId);
  als.run({ reqId }, next); // everything downstream, however deep, can read this
}

// anywhere else in the codebase, no parameter-passing required:
function currentReqId() {
  return als.getStore()?.reqId;
}

module.exports = { requestContext, currentReqId };
```

Register `requestContext` as the very first middleware. Then either read
`currentReqId()` manually at each log call, or — cleaner — bind a
request-scoped child logger early in the pipeline via the `Logger`
adapter's own `child()` method (`req.log = logger.child({ reqId })`) and
use `req.log` everywhere downstream instead of the base logger, so every
line from that request is stamped without threading the ID through every
function signature by hand.

---

## `requestId` on Every Response, Not Just Logs

`reqId` ties together everything that happened during one request — it
doesn't by itself tell you who the request belonged to, and without the
step below, nothing hands it to the client, so a user reporting "I got
an error" has no ID to give back.

**Return the request ID to the client** — already set as a response
header above; also a standing field (`requestId`) on every response
body, success or failure alike, per the unified five-field shape in
`05-Error-Handling-Patterns/04-CentralErrorMiddleware.PATTERN.md` — a
header is easy to miss, but a visible ID in an error message ("Something
went wrong — ref: a1b2c3") is something a user can actually copy and
report.

---

## Attaching `userId`/`userName` Once Authenticated

```js
// in auth middleware, right after a token is verified and req.user is set
function attachUserToLogger(req, res, next) {
  req.log = req.log.child({ userId: req.user.id, userName: req.user.name });
  next();
}
```

**Note on `userName` in logs**: a reasonable, deliberate call for a
solo-engineer debugging workflow, but it is personal data sitting in
every log line from that point forward — worth being aware of if log
retention/compliance ever becomes a concern later, not a blocker now.

**A `userId`-carrying request means it happened after that request was
authenticated** — not "right after signup." A user who signed up a month
ago carries `userId` on every logged-in request from then on, forever;
it's not a one-time marker. "No `userId` present" correctly means "this
happened before the request proved who it was" — covering both genuine
pre-signup activity and a currently-logged-out user hitting a public
endpoint, not specifically "pre-signup" as its only meaning.

**A failed login is exactly the case where `userId` can't exist yet** —
identity isn't confirmed until the password checks out, but repeated
failures against the same account still need to be traceable. Log the
attempted identifier as its own field instead:

```js
req.log.warn({ attemptedEmail: req.body.email }, 'Login failed');
```

So "every failed login for this email" is searchable without it ever
being confused with a verified `userId`.

---

## Background Jobs / Queue Consumers — the Parallel Pattern, Not a Retrofit

Everything above assumes an HTTP request to hang a `reqId` off of. A
background job (a cron task, a queue consumer, anything triggered by a
timer or message rather than an incoming request) has no request at all
— it needs its own, parallel version of the same idea, not an attempt to
force it into the request-based design above.

**The equivalent of `reqId` here is a `jobId`** — generated the same way
(`AsyncLocalStorage`), just entered differently, since there's no Express
middleware to hook into:

```js
// common/jobs/jobContext.js
const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID } = require('node:crypto');
const jobAls = new AsyncLocalStorage();

async function runWithJobContext(jobName, fn) {
  const jobId = randomUUID();
  return jobAls.run({ jobId, jobName }, fn);
}

function currentJobContext() {
  return jobAls.getStore();
}
```

```js
// usage — a cron task or queue consumer, wrapped the same way requestContext wraps an HTTP request
await runWithJobContext('send-weekly-digest', async () => {
  const jobLog = logger.child({ jobId: currentJobContext().jobId, jobName: 'send-weekly-digest' });
  jobLog.info({ layer: Layer.SERVICE }, 'Job started');
  // ... the job's actual work, using jobLog the same way req.log is used elsewhere ...
});
```

Two adjustments worth making explicit, not left as an afterthought:
**if the job is operating on behalf of a specific user** (e.g. "send
this one user's weekly digest"), attach `userId`/`userName` to `jobLog`
exactly as above for a request — the same "search by identity first"
reasoning applies. **If using a real queue system** (BullMQ, SQS, etc.)
rather than a bare cron task, prefer the queue's own message/job ID as
`jobId` instead of generating a new one — that way the ID used to search
Better Stack/Sentry is the same one visible in the queue system's own
dashboard, rather than two disconnected IDs for the same unit of work.

---

## Audit Checklist

- [ ] `requestContext` is registered as the very first middleware
- [ ] `requestId` is a standing field on every response body — success
      AND failure — not just error responses
- [ ] `userId`/`userName` are attached via `child()` immediately after
      authentication, not threaded manually through function signatures
- [ ] A failed login logs `attemptedEmail` (or equivalent), never
      conflated with a verified `userId`
- [ ] Any background job/queue consumer uses its own `jobId` via the
      same `AsyncLocalStorage` pattern — never silently uncorrelated
- [ ] A job acting on behalf of a specific user attaches that user's
      identity to its own logger, the same as a request would

---

## Related Patterns
- [Structured Logging](./01-StructuredLogging.PATTERN.md)
- [Central Error Middleware](../05-Error-Handling-Patterns/04-CentralErrorMiddleware.PATTERN.md)

---

**One ID per unit of work — request or job — carried automatically through every async boundary, never passed by hand.**
