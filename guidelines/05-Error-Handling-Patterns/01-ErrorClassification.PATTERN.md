# Error Classification Pattern

## Status
🔴 **CRITICAL** - The decision everything else in this category depends on

## Purpose
Before any `catch` block is written, classify every failure as
**operational** or **a bug** — three separate mechanisms built later
(the error middleware, the logger, the crash handler) each need to
answer a version of this same question, and classifying once at the
source means they read an answer instead of each re-deriving it
differently.

---

## Universal Pattern

**"Operational = your API working correctly, rejecting or reporting something. Programmer error = a bug, internal state may now be unreliable. Decide once, at the point the error is thrown, via a boolean flag every consumer reads — never re-derive this elsewhere by checking `.statusCode`, the constructor name, or string-matching a message."**

---

## The Two Categories

- **Operational**: wrong password, a 404 on a resource, a Stripe
  timeout, a validation failure (Joi/Zod), a Mongoose duplicate-key
  error on a unique index. The API is working correctly — rejecting or
  reporting something, not malfunctioning.
- **Programmer error**: a `TypeError: Cannot read properties of
  undefined`, an `await` on something that isn't a promise, a logic bug
  producing an impossible DB write. The process's internal state may now
  be unreliable in ways that can't be enumerated.

**Why this is the decision everything else depends on:** the error
middleware (`04-CentralErrorMiddleware.PATTERN.md`) needs to decide "is
it safe to send `err.message` to the client?"; the logger needs to
decide `warn` vs. `fatal`; the `uncaughtException` handler
(`13-Observability-Patterns`) needs to decide whether the process should
exit. Classifying once, at the source, via a flag, means none of those
three places guesses the same question independently and inconsistently.

---

## `AppError` — the Base Class

```js
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

*(Minimal version, to isolate this concept. `02-ErrorHierarchy.PATTERN.md`
extends this constructor with one more mandatory field — `layer` — once
the reasoning for that is established.)*

**What actually changes because the flag exists.** Without it, the error
middleware can only ask "is this an `AppError`?" — a question about
*shape*, not *safety*. A `500` database failure and a `404` not-found
both pass `instanceof AppError` equally, even though one represents a
real problem and the other is routine. With the flag:

```js
if (err instanceof AppError && err.isOperational) {
  return res.status(err.statusCode).json({ message: err.message }); // safe, expected — describe it
}
// isOperational: false, or an error you didn't create at all → generic response, logged loudly
```

An `AppError` can legitimately be constructed with `isOperational:
false` — e.g. an unexpected database write failure — meaning the
right-shaped object does not automatically mean the right-to-describe
object.

**This flag is also what keeps something out of the last-resort crash
handler in the first place.** Every operational error is expected to be
caught somewhere on purpose (`04-CentralErrorMiddleware.PATTERN.md`), so
if `uncaughtException` ever fires for something that was actually
operational, that's a bug in the error handling itself, not a normal
event.

---

## `Error.captureStackTrace(this, this.constructor)` — Why This Line Matters

A stack trace is captured at the moment an `Error` object is
*constructed*. Normally that's the same line as the `throw`, so this is
invisible — but once a base class is subclassed, construction runs
through a chain: `new NotFoundError('Order')` calls `super(...)`, which
runs *inside* `AppError`'s own constructor. Without `captureStackTrace`,
the top of the stack trace points at `AppError`'s constructor line, not
the actual `throw new NotFoundError(...)` call site:

```
// without captureStackTrace:
  at new AppError (/app/errors/AppError.js:4:5)
  at new NotFoundError (/app/errors/AppError.js:12:5)
  at getOrderById (/app/services/orders.js:8:9)   ← what actually matters, buried third

// with captureStackTrace:
  at getOrderById (/app/services/orders.js:8:9)   ← straight to the real throw site
```

`Error.captureStackTrace(this, this.constructor)` tells V8 to start the
trace one frame above `this.constructor` — skip past `AppError`'s own
constructor and start from whoever actually threw. Small, but a real
time save reading a stack trace during a live incident.

---

## Audit Checklist

- [ ] Every custom error class extends `AppError` (directly or via a
      type-based subclass in `02-ErrorHierarchy.PATTERN.md`) and calls
      `Error.captureStackTrace(this, this.constructor)`
- [ ] `isOperational` is set deliberately on every thrown error — never
      left to default silently when the situation actually calls for
      `false` (an unrecognized failure)
- [ ] No code anywhere re-derives "is this safe to describe to the
      client" by checking `.statusCode`, constructor name, or message
      content — `isOperational` is the single source of truth

---

## Related Patterns
- [Error Hierarchy](./02-ErrorHierarchy.PATTERN.md)
- [Central Error Middleware](./04-CentralErrorMiddleware.PATTERN.md)

---

**Classify once, at the source, via a flag — every consumer reads the answer instead of re-deriving it.**
