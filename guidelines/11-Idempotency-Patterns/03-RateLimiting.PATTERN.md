# Rate Limiting Pattern

## Status
🟡 **REQUIRED** - Applied broadly, independent of idempotency

## Purpose
Control request volume from a single client/IP regardless of whether
those requests are duplicates — the layer that protects against direct
API access, scripts, and bots that bypass the frontend entirely.

---

## Universal Pattern

**"Rate limiting is coarser than idempotency by design — it doesn't know or care if requests are duplicates, only that there are too many of them. Redis-backed, same shared instance as caching and idempotency keys — not a separate in-memory store."**

**Not a substitute for `01-IdempotencyKeyMiddleware.PATTERN.md`.** Rate
limiting guarantees the system isn't overwhelmed by volume; it says
nothing about whether two requests represent the same intent.
Idempotency keys still own correctness for POST-like requests — this is
a separate, broader layer applied regardless of an endpoint's
idempotency status.

---

## The Middleware

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { client } = require('@adapters/redis');

const generalLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => client.sendCommand(args) }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later.', data: null },
});

const strictLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => client.sendCommand(args) }),
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, strictLimiter };
```

```javascript
// app/middleware.js
const { generalLimiter, strictLimiter } = require('@middleware/rateLimiter');

function applyMiddleware(app) {
  // ...existing middleware
  app.use(generalLimiter); // applied globally
}
```

```javascript
// modules/invoice/routes/invoice/createInvoice.route.js
router.post('/invoices', strictLimiter, idempotencyMiddleware, async (req, res) => { /* ... */ });
```

**Redis-backed, not the package's default in-memory store** — the same
reasoning as every other piece of this reference needing shared state
across instances: an in-memory rate-limit store resets per-instance, so
a client could get a fresh limit just by having a request routed to a
different server.

---

## Audit Checklist

- [ ] The rate limiter's store is Redis-backed, not the default
      in-memory store
- [ ] A general limit applies globally; sensitive/expensive endpoints
      (checkout, login, anything triggering external API calls) get a
      stricter, dedicated limit
- [ ] Rate limiting is applied even to endpoints that already have
      idempotency-key protection — the two layers are independent, not
      redundant

---

## Related Patterns
- [Idempotency Key Middleware](./01-IdempotencyKeyMiddleware.PATTERN.md)
- [Cache-Aside Strategy](../10-Caching-Patterns/01-CacheAsideStrategy.PATTERN.md) — shares the same Redis instance

---

**Volume control, not duplicate detection — a different problem from idempotency, solved independently.**
