# Error Translation Pattern

## Status
🔴 **CRITICAL** - How a raw DB/external-API error becomes an AppError

## Purpose
The data-access layer (and any external API client) is the most common
place a raw, untyped error enters the system — it's the boundary between
this code and someone else's (the driver, the ORM, a third-party HTTP
client). Translate it safely and specifically at that boundary, not
generically and not by forwarding it raw.

---

## Universal Pattern

**"A small table of recognized failures per layer, each mapped to a safe, specific AppError subclass — with a generic, operation-scoped, non-operational fallback for anything not recognized. Never always-generic (loses real information), never forward-the-raw-error (leaks internal detail)."**

**This is the replacement for the previous `DAOErrorHandling` pattern's
flat "wrap everything as `DAOError` with a generic message" rule** —
that approach lost real, useful information (e.g. "email already
exists") that a recognized failure can safely provide.

---

## The Recognition Table

```js
// services/errors/translateDbError.js
const KNOWN_DB_ERRORS = [
  {
    matches: (err) => err.code === 11000, // Mongo duplicate key
    translate: (err, { resource }) =>
      new ConflictError(`${resource} already exists`, { layer: Layer.DATABASE, isOperational: true, cause: err }),
  },
  {
    matches: (err) => err.name === 'CastError', // e.g. malformed ObjectId
    translate: (err, { resource }) =>
      new ValidationError(`Invalid identifier for ${resource}`, { layer: Layer.DATABASE, isOperational: true, cause: err }),
  },
  {
    matches: (err) => err.name === 'ValidationError', // Mongoose schema validation
    translate: (err, { resource }) =>
      new ValidationError(`Invalid ${resource} data`, { layer: Layer.DATABASE, isOperational: true, cause: err }),
  },
];

function translateDbError(err, { operation, resource }) {
  const known = KNOWN_DB_ERRORS.find((entry) => entry.matches(err));
  if (known) return known.translate(err, { resource });

  // fallback: generic, but still specific to what was being attempted — never the raw message
  return new AppError(`Could not ${operation} ${resource}`, {
    statusCode: 500,
    code: 'DB_OPERATION_FAILED',
    isOperational: false, // unrecognized — treat as a real problem, log loudly
    layer: Layer.DATABASE,
    cause: err,
  });
}
```

Used identically at every call site, regardless of the operation:

```js
async function createUser(data) {
  try {
    return await User.create(data);
  } catch (err) {
    throw translateDbError(err, { operation: 'create', resource: 'User' });
  }
}

async function getOrderById(id) {
  let order;
  try {
    order = await Order.findById(id);
  } catch (err) {
    throw translateDbError(err, { operation: 'read', resource: 'Order' });
  }
  if (!order) throw new NotFoundError('Order', { layer: Layer.DATABASE });
  return order;
}
```

---

## Why This Scales, and Doesn't Just Move the Mess

- **Recognition rules are written once per failure family, not once per
  operation.** "Duplicate key" is a single entry, automatically covering
  every `create`-style call across every resource — not a duplicate-key
  check written separately inside `createUser`, `createCategory`,
  `createInvoice`, and so on.
- **The fallback is always safe, and still specific, because it's
  parameterized, not hardcoded.** `Could not create User` vs. `Could not
  update Invoice` comes from `operation`/`resource` at the call site —
  never one single generic string reused everywhere, and never the real
  DB error text reaching a client.
- **`isOperational` is set deliberately differently on the two paths.**
  A recognized failure (duplicate key) is operational — normal, expected
  client-facing traffic. An *unrecognized* DB error is explicitly
  `isOperational: false`, since by definition it's unknown — routing it
  to loud logging instead of quietly treating it as routine.
- **The raw error is never discarded** — it's kept on `cause`, so logs
  retain full diagnostic detail (stack, driver-specific fields) even
  though the client only ever sees what `translate()` decided was safe
  to say.
- **The same shape covers external API calls with no structural
  change** — a `translateExternalApiError(err, { provider, operation })`
  with its own table: a specific Stripe decline code → a `ValidationError`
  with a safe, specific message; a timeout → an `AppError` mapped to
  `503` with `isOperational: true` (a slow payment provider is arguably
  expected, not a bug); an unrecognized response shape → non-operational,
  generic, logged loudly. Different layer, same pattern, same reasoning
  about what's safe to say and what needs escalation.

---

## Audit Checklist

- [ ] Every DB/external-API call site that can fail routes its error
      through a `translate*Error` function — never a bare `catch` that
      constructs an ad hoc error inline
- [ ] Recognition rules live in one table per failure family, not
      duplicated per operation
- [ ] The fallback case is always `isOperational: false`
- [ ] `cause` is always set to the original raw error
- [ ] A new recognized failure case is added to the existing table, not
      hand-rolled at its one call site

---

## Related Patterns
- [Error Hierarchy](./02-ErrorHierarchy.PATTERN.md)
- [DAO Structure](../07-Data-Access-Patterns/01-DAOStructure.PATTERN.md)

---

**Recognize what you can, safely and specifically. Never forward the raw error; never flatten everything to one generic message.**
