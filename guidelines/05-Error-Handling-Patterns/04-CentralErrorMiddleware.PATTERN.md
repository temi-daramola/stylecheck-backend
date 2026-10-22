# Central Error Middleware Pattern

## Status
🔴 **CRITICAL** - Replaces per-route try/catch response formatting entirely

## Purpose
Routes should never format their own error responses — every route
independently deciding this produces inconsistent shapes across
endpoints the instant more than one person touches the codebase. Exactly
one piece of middleware, registered last, owns the response shape.

---

## Universal Pattern

**"Routes don't format error responses — they throw, or call next(err). Exactly one 4-argument error-handling middleware, registered last, owns the response shape for the whole API. The response contract is { status, message, data, code, requestId } — five fields, identical shape on success and failure."**

**This replaces every route in this reference that previously did its
own `try { ... } catch (error) { res.status(...).json(...) }`.** That
per-route pattern is the anti-pattern this file exists to eliminate —
two routes written by two different people, at two different times, were
free to produce two different response shapes for the same conceptual
failure, and every route blindly trusted `error.statusCode`/`error.message`
on *any* thrown value, including a raw Mongoose error or a `TypeError`.

---

## The Response Contract — Revised From Three Fields to Five

**Previously: `{ status, message, data }`. Now: `{ status, message,
data, code, requestId }` — on every response, success or failure
alike.** This is a breaking change to the existing contract, not an
addition alongside it — every file in this reference that constructs a
response (and the frontend consuming it) uses the five-field shape now.

- `status` — always `'success'` or `'error'`, unchanged from before.
- `message` — unchanged from before.
- `data` — always strictly the payload: the actual resource on success;
  always `null` on failure, never repurposed to carry error detail.
- `code` — **new.** `null` on success; the machine-readable identifier
  (`NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`) on failure, so a
  client branching on error type never has to parse `message` text.
- `requestId` — **new.** Present on every response either way (see
  `12-Logging-Patterns/02-CorrelationIds.PATTERN.md`) — a user might
  reference *any* response, not just a failed one, when reporting
  something later.

---

## Routes: Throw or `next(err)`, Nothing Else

```js
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await getOrderById(req.params.id); // throws NotFoundError if missing
  res.json({ status: 'success', message: 'Order retrieved', data: order, code: null, requestId: req.id });
  // no try/catch here — errors go to the central handler
}));
```

## The Central Middleware

Express identifies error-handling middleware by arity — a 4-argument
signature (`err, req, res, next`) — and it must be registered *after*
every route:

```js
app.use((err, req, res, next) => {
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ reqId: req.id, code: err.code, statusCode: err.statusCode, layer: err.layer }, err.message);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      data: null,
      code: err.code,
      requestId: req.id,
    });
  }

  // Anything that isn't one of your own operational errors is untrusted by definition.
  logger.error({ reqId: req.id, layer: err.layer, err }, 'Unhandled error');
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
    data: null,
    code: 'INTERNAL_ERROR',
    requestId: req.id,
  });
});
```

**Note `layer` is logged in both branches, but never sent in the
response body in either** — the five fields above are what the client
needs; `layer` (and, for the second branch, the full `err` with its
`cause`) is what the team needs, and only ever goes to the log.

**This is one either/or check, not two independent branches to keep
straight.** There's exactly one condition —
`err instanceof AppError && err.isOperational` — and exactly two
outcomes. "Not an `AppError` at all" and "an `AppError` with
`isOperational: false`" are not handled separately; both simply fail the
one condition and land in the same `logger.error(...)` path. This is the
entire reason `isOperational` exists as a flag in the first place
(`01-ErrorClassification.PATTERN.md`): it lets a genuinely unrecognized
error and a recognized-but-flagged-non-operational error be treated
identically, with one check.

**The `instanceof AppError` check is the entire security property of
this function.** Without it, one unexpected `err.statusCode` — set by
some unrelated library, or just `undefined` coercing oddly — is enough
to either leak an internal message or return a nonsensical status.
Gating the *stack trace* in the response on
`common.constants.env.IS_PRODUCTION_LIKE` (true for staging and production;
never compare `NODE_ENV` to `'production'` directly) is good practice,
but gating only the stack while still sending `err.message`
unconditionally is a common half-measure: an unclassified error's
`.message` is exactly the thing that can't be trusted, stack trace or
not.

**What this middleware deliberately does NOT do: guess.** It never
inspects properties to figure out what kind of error it received
(`if (err.name === 'ValidationError')`, `if (err.code === 11000)`) —
that recognition belongs at the point where the error originates
(`03-ErrorTranslation.PATTERN.md`), where the actual failure is already
known. By the time an error reaches this middleware, it should already
be one of this reference's own types if it's meant to produce anything
other than a generic `500`.

---

## Audit Checklist

- [ ] No route anywhere has its own `try/catch` that formats a response
      — every route either lets a synchronous throw propagate, or (for
      async routes) relies on `05-AsyncErrorHandling.PATTERN.md`'s
      mechanism to reach this middleware
- [ ] Exactly one error-handling middleware (4-argument signature) exists
      in the app, registered after every route
- [ ] Every response — success AND failure — uses the five-field shape:
      `{ status, message, data, code, requestId }`
- [ ] `layer` and `cause`/the raw `err` are logged but never appear in a
      response body
- [ ] The middleware checks `instanceof AppError && isOperational`
      before trusting anything on the error object

---

## Related Patterns
- [Error Classification](./01-ErrorClassification.PATTERN.md)
- [Async Error Handling](./05-AsyncErrorHandling.PATTERN.md)
- [Response Format](../06-API-Patterns/01-ResponseFormat.PATTERN.md)
- [Correlation IDs](../12-Logging-Patterns/02-CorrelationIds.PATTERN.md) — where `requestId` comes from

---

**One middleware, one shape, five fields, every response — routes never format their own.**
