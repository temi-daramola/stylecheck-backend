# Idempotency Key Middleware Pattern

## Status
🔴 **CRITICAL** - Required for POST and any other non-naturally-idempotent operation

## Purpose
Make a repeated POST (or any operation with a non-repeatable side
effect) safe to retry — without a real second attempt accidentally
creating a second order, charge, or email.

---

## Universal Pattern

**"Same intent, same key, processed once. Atomic Redis SET...NX, not a plain Map. A reused key with a different payload is a client bug — reject it, never silently process it."**

**Redis from day one, same instance as `10-Caching-Patterns`** — not an
in-memory `Map`, even for early-stage or single-instance deployments. An
in-memory store is lost on restart and doesn't work once there's more
than one server instance; starting with Redis avoids a later migration
and a real gap in correctness in the meantime.

**Atomic `SET key value EX ttl NX`, not `Map.has()` then `Map.set()`.**
Two requests carrying the same key can arrive within the same
millisecond — a check-then-set done as two separate steps has a real
race window where both could slip through. Redis's `NX` flag ("set only
if the key doesn't already exist") performs the check-and-set as one
atomic operation, closing that window entirely.

**Payload-hash mismatch detection is mandatory, not optional.** If the
same idempotency key arrives with a *different* request body than the
first time it was used, that's a client bug — most likely a key being
reused across two genuinely different user intents — and must be
rejected with a `422`, never silently processed as if it were a
legitimate retry.

---

## The Middleware

```javascript
// middleware/idempotency.js
const { client } = require('@adapters/redis');
const crypto = require('crypto');

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24h

async function idempotencyMiddleware(req, res, next) {
  const key = req.header('Idempotency-Key');
  if (!key) return next(); // optional per this API's own design — decide per endpoint

  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  const storeKey = `idempotency:${key}`;

  const existing = await client.get(storeKey);
  if (existing) {
    const parsed = JSON.parse(existing);
    if (parsed.payloadHash !== payloadHash) {
      // Same key, different payload — a client bug, not a retry. Reject,
      // don't silently process either version.
      throw new AppError('Idempotency key reused with a different payload', { statusCode: 422, code: 'IDEMPOTENCY_PAYLOAD_MISMATCH', layer: Layer.CONTROLLER });
    }
    return res.status(parsed.status).json(parsed.body);
  }

  // Atomic claim — SET ... NX ensures two simultaneous requests with the
  // same brand-new key can't both pass this check.
  const claimed = await client.set(
    storeKey,
    JSON.stringify({ status: 'pending', payloadHash }),
    { EX: IDEMPOTENCY_TTL_SECONDS, NX: true }
  );

  if (!claimed) {
    // Another request with this exact key claimed it a moment ago —
    // treat as a retry, not a new request. A short wait-and-recheck is
    // reasonable here; omitted for brevity.
    return res.status(409).json(ResponseUtils.error('Request already in progress', null));
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    client.set(
      storeKey,
      JSON.stringify({ status: res.statusCode, body, payloadHash }),
      { EX: IDEMPOTENCY_TTL_SECONDS }
    ).catch((error) => console.error('Idempotency store write failed:', error));
    return originalJson(body);
  };

  next();
}

module.exports = idempotencyMiddleware;
```

```javascript
// modules/invoice/routes/invoice/createInvoice.route.js
router.post('/invoices', idempotencyMiddleware, async (req, res) => {
  const result = await controller.createInvoice(req.body);
  res.status(201).json(result);
});
```

---

## Audit Checklist

- [ ] Idempotency keys are stored in Redis, never a plain in-memory `Map`
- [ ] The claim step uses atomic `SET ... NX`, never a separate
      check-then-set
- [ ] A reused key with a different payload hash is rejected with `422`
      — never silently processed as either version
- [ ] Every endpoint with a non-repeatable side effect (POST creating a
      resource, anything charging money, anything sending an email)
      uses this middleware — not just "the important ones"
- [ ] The TTL is long enough to cover realistic retry windows (24h is
      the default here, matching common industry convention)

---

## Related Patterns
- [Naturally Idempotent Endpoints](./02-NaturallyIdempotentEndpoints.PATTERN.md)
- [Unique Constraints](./04-UniqueConstraints.PATTERN.md) — the last line of defense if this middleware is somehow bypassed
- [Cache-Aside Strategy](../10-Caching-Patterns/01-CacheAsideStrategy.PATTERN.md) — shares the same Redis instance

---

**One atomic claim per key. A mismatched payload is a bug to reject, never a retry to honor.**
