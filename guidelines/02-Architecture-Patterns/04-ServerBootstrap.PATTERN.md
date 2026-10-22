# Server Bootstrap Pattern

## Status
🔴 **CRITICAL**

## Universal Pattern
**"server.js orchestrates bootstrap in specific order: middleware → database → dependencies → routes → error handlers → shutdown → start. Startup fails fast and exits non-zero if a required dependency isn't reachable — never serves traffic in a half-initialized state. Shutdown is graceful: stop accepting new connections, let in-flight requests finish, then exit."**

**Revised — the sequence itself is unchanged; the fail-fast and
graceful-shutdown steps now have concrete implementations instead of
being named but left abstract.** See
`05-Error-Handling-Patterns/01-ErrorClassification.PATTERN.md` for the
companion `uncaughtException`/`unhandledRejection` handlers — those are
process-level, registered once, separate from the request/response
lifecycle this file covers.

## Bootstrap Sequence

```javascript
async function bootstrap() {
  const app = express();
  applyMiddleware(app);
  await connectDatabase();
  const dependencies = createDependencies();
  registerRoutes(app, dependencies);
  applyErrorHandlers(app);
  registerShutdownHandlers();
  await startServer(app, PORT);
}
```

## Fail-Fast on Startup — Concrete Implementation

```javascript
async function start() {
  const { MONGODB_URI, PORT } = common.constants.env; // never process.env in server.js
  try {
    await mongoose.connect(MONGODB_URI);
  } catch (err) {
    logger.fatal({ err }, 'Failed to connect to database — exiting before accepting traffic');
    process.exit(1);
  }
  const server = app.listen(PORT);
  registerShutdownHandlers(server);
}
```

**Why this exits rather than continuing**: a comment like `// don't call
process.exit() - let it continue` on a bootstrap failure path is the
inverse of this principle — it keeps a process that failed to even
finish starting up (couldn't reach the database, missing required
config) alive and answering requests it can't actually service
correctly. That fails far more confusingly than a container that exits
cleanly and gets flagged by a health check and process manager.

## Graceful Shutdown — Concrete Implementation

```javascript
function registerShutdownHandlers(server) {
  const shutdown = (signal) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      mongoose.disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref(); // force-exit if close hangs
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
```

`server.close()` stops accepting new connections but lets in-flight ones
finish — this is what makes a rolling deploy or a container scale-down
not cut off real requests mid-response. The `setTimeout(...).unref()` is
a safety valve: if something is holding a connection open indefinitely,
the process still exits eventually instead of hanging on shutdown
forever. `.unref()` specifically means this timer alone will never keep
the process alive if everything else has already finished.

---
**server.js is pure orchestration — no implementations inline — but the fail-fast and graceful-shutdown steps it orchestrates are concrete, not aspirational.**
