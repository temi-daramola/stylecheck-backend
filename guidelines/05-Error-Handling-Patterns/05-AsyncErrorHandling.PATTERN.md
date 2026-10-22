# Async Error Handling Pattern

## Status
🔴 **CRITICAL** - Not optional reading if this project is on Express 4

## Purpose
Getting async error handling wrong in Express doesn't produce a wrong
response — it produces a hung request that never gets a response at
all, with nothing reaching `04-CentralErrorMiddleware.PATTERN.md`.

---

## Universal Pattern

**"A synchronous throw is caught by Express's own try/catch automatically. An async function's rejection is NOT — something must explicitly watch that promise and forward any rejection to next(). Express 5 does this natively; Express 4 requires a wrapper or express-async-errors."**

---

## What Already Works — Synchronous Throws

```js
app.get('/orders/:id', (req, res) => {
  throw new Error('boom'); // Express's own try/catch catches this and routes it to the error middleware. Fine.
});
```

## What Breaks — Async Functions, on Express 4

```js
app.get('/orders/:id', async (req, res) => {
  const order = await getOrderById(req.params.id); // this line throws NotFoundError
  res.json(order);
});
```

**The mechanics:** calling an `async` function always returns a promise,
immediately, regardless of what happens inside it. If something inside
throws, that promise *rejects* — but the function has already returned a
promise object by that point; nothing was thrown synchronously for
Express's `try/catch` to catch. Express 4's router calls the handler,
receives the promise back, and does nothing further with it — doesn't
`await` it, doesn't attach `.catch()`.

**The failure sequence:** `getOrderById` rejects → the promise the route
handler returned rejects → nobody is watching that promise → the
rejection has nowhere to go. Node doesn't crash from this alone; it
becomes an unhandled rejection floating with no listener. Critically,
`res.json(...)` never runs, and `next(err)` never gets called either —
`04-CentralErrorMiddleware.PATTERN.md` never sees this error at all. The
client's connection just sits open until it times out.

---

## The Fix — Express 4

```js
// A wrapper — the standard hand-rolled fix
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await getOrderById(req.params.id);
  res.json(order);
}));
```

Read it literally: it calls the async function, which always returns a
promise; `.catch(next)` means "if this promise ever rejects, call
`next(error)` with it" — the one line doing the job Express 4's router
should be doing but isn't.

**Alternative:** `require('express-async-errors')` once, at app startup,
before routes are defined — it monkey-patches Express 4's router to do
exactly the above for every route automatically, so individual routes
don't need the wrapper.

## The Fix — Express 5 (Native, No Wrapper Needed)

**Express 5 fixes this at the framework level** — its router checks
whether a handler returned a promise and performs that same
`.catch(next)` step internally. Neither the wrapper nor
`express-async-errors` is needed on Express 5.

```js
// Express 5 — this works correctly with no wrapper at all
app.get('/orders/:id', async (req, res) => {
  const order = await getOrderById(req.params.id);
  res.json(order);
});
```

**If this project is on Express 4** (a large share of production apps
still are), this isn't a stylistic choice — every `async` route, and
every async middleware, needs one of the two mechanisms above, or it's a
latent request-hanging bug waiting for the first unexpected rejection.

---

## Beyond HTTP Routes — Neither Fix Applies

**A queue consumer, a `setInterval`-driven job, a WebSocket message
handler — none of these go through Express's router at all**, so
`express-async-errors` and Express 5's native handling don't help them
either way. Each needs its own explicit `try/catch` around any `await`,
forwarding failures to logging/error-tracking directly, since there's no
middleware chain to fall back on. See
`12-Logging-Patterns/02-CorrelationIds.PATTERN.md`'s background-jobs
section for the parallel pattern these contexts need instead of a
request ID.

---

## Audit Checklist

- [ ] If on Express 4: every async route uses `asyncHandler` (or
      `express-async-errors` is required once at startup) — no bare
      `async (req, res) => {...}` route exists unwrapped
- [ ] If on Express 5: confirmed the actual installed version before
      assuming the wrapper isn't needed — don't guess
- [ ] Non-HTTP async entry points (jobs, queue consumers, socket
      handlers) have their own explicit `try/catch` — never assumed to
      be covered by Express's error handling

---

## Related Patterns
- [Central Error Middleware](./04-CentralErrorMiddleware.PATTERN.md)
- [Correlation IDs](../12-Logging-Patterns/02-CorrelationIds.PATTERN.md)

---

**A rejected promise nobody is watching never reaches your error middleware — it just hangs. Make something explicitly watch it.**
