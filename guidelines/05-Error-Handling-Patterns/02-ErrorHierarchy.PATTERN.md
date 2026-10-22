# Error Hierarchy Pattern

## Status
🔴 **CRITICAL** - Replaces the previous ControllerError/DAOError split entirely

## Purpose
A bare `Error` doesn't know it's a 404 — whatever catches it has to
parse the message string to figure out what HTTP status to send, which
breaks the moment anyone changes the wording. Error classes need to
carry their own type and their own origin, structurally, not through
string inspection.

---

## Universal Pattern

**"Error classes are organized by failure TYPE (NotFoundError, ValidationError...), never by architectural origin. WHERE an error happened is a separate, independent, mandatory field — layer — not folded into the class name or a message string."**

**This replaces this reference's previous `ControllerError`/`DAOError`
split entirely** — that split organized errors by *which layer threw
them*, which is precisely the organizing principle this pattern rejects.
Every file in this reference previously referencing `ControllerError` or
`DAOError` has been updated to use the type-based classes below with an
explicit `layer` field instead.

---

## The `Layer` Enum

```js
const Layer = Object.freeze({
  ROUTE: 'route',
  VALIDATION: 'validation',
  AUTH: 'auth',
  CONTROLLER: 'controller',
  SERVICE: 'service',
  DATABASE: 'database',
  EXTERNAL_API: 'external_api',
});
```

## `AppError`, Extended With `layer` and `cause`

```js
class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true, layer, cause } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.layer = layer;   // required on every AppError — where this actually happened
    this.cause = cause;   // the original raw error, if this wraps one — for logs only, never sent to a client
    Error.captureStackTrace(this, this.constructor);
  }
}
```

## Type-Based Subclasses

```js
class NotFoundError extends AppError {
  constructor(resource, opts) { super(`${resource} not found`, { ...opts, statusCode: 404, code: 'NOT_FOUND' }); }
}
class ValidationError extends AppError {
  constructor(message, opts, details) {
    super(message, { ...opts, statusCode: 400, code: 'VALIDATION_ERROR' });
    this.details = details; // e.g. Zod's flattened field errors
  }
}
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', opts) { super(message, { ...opts, statusCode: 401, code: 'UNAUTHORIZED' }); }
}
class ConflictError extends AppError {
  constructor(message, opts) { super(message, { ...opts, statusCode: 409, code: 'CONFLICT' }); }
}
```

---

## Two Axes, Both Mandatory, Neither Standing In For the Other

**Failure *type*** (the class) decides the HTTP status and the
client-facing shape — the error middleware has to settle on exactly one
status code, and "which layer did this come from" doesn't map to a
status on its own (a DB failure could be a `500` if unexpected, or a
`409` if it's a recognized duplicate-key conflict).

**Failure *layer*** is not optional metadata squeezed into a message
string — it's a required field, captured at construction time, because
it answers a different question type alone can't: "where do I go to fix
this, and what should I watch." In logs, `layer: database` is a
queryable field independent of whatever status code that particular
error happened to produce — alerting on "too many `layer: external_api`
failures this hour" works regardless of what type each one turned out to
be.

**Type tells the client what to see; layer tells the team where to
look.**

```js
throw new ConflictError('Email already registered', { layer: Layer.DATABASE, isOperational: true, cause: mongoErr });
```

---

## What This Replaces, Concretely

| Before (retired) | Now |
|---|---|
| `ControllerError` — any business-logic failure in a controller | A type-based class (`NotFoundError`, `ValidationError`, etc.) with `layer: Layer.CONTROLLER` |
| `DAOError` — any database failure | A type-based class with `layer: Layer.DATABASE` — see `03-ErrorTranslation.PATTERN.md` for how a raw DB error becomes one of these |
| Checking `error instanceof DAOError \|\| error instanceof ControllerError` to decide whether to re-throw as-is | Checking `error instanceof AppError` — the type/layer split means there's no longer a need to distinguish "which layer's error class" at re-throw time |

---

## Audit Checklist

- [ ] No file in this codebase defines or references `ControllerError`
      or `DAOError` — every error is a type-based `AppError` subclass
- [ ] `layer` is set on every thrown `AppError`, using the `Layer` enum
      — never a raw string, never omitted
- [ ] A new failure case is handled by picking (or adding) a type-based
      class, never by inventing a layer-named class
- [ ] `cause` carries the original raw error when one exists — never
      discarded, never sent to a client

---

## Related Patterns
- [Error Classification](./01-ErrorClassification.PATTERN.md)
- [Error Translation](./03-ErrorTranslation.PATTERN.md)
- [Central Error Middleware](./04-CentralErrorMiddleware.PATTERN.md)

---

**Type decides the status and the client-facing shape. Layer decides where the team looks. Never conflate the two.**
