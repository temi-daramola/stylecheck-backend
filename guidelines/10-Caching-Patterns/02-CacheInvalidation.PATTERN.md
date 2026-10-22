# Cache Invalidation Pattern

## Status
🔴 **CRITICAL** - Required for any data where staleness is actually costly

## Purpose
For data where a stale cached value is a real problem (price, inventory,
account balance, permissions) — TTL alone isn't sufficient. The write
path must actively clear or update the cache the moment the source
changes.

---

## Universal Pattern

**"The code that changes the data is responsible for invalidating its cache key, in the same request. One shared Redis instance, read directly by every server instance — no per-instance local cache, no Pub/Sub needed."**

**Why no Pub/Sub, deliberately — not an oversight.** Pub/Sub exists to
solve "instance A invalidated its cache, but instance B's *own separate*
cache doesn't know." That problem only exists if each instance keeps its
own local cache layer. **This reference's default is every instance
reading the same shared Redis directly** — there's only one cache to
begin with, so a `client.del()` from any instance is immediately visible
to every other instance on its next read. Simpler and more correct than
adding a broadcast mechanism to keep multiple caches in sync, when not
having multiple caches in the first place removes the problem entirely.

---

## Event-Driven Invalidation (the default — sufficient for most cases)

```javascript
// modules/invoice/controller/invoice/updateInvoice.js
async function updateInvoice(id, data) {
  const updated = await this.invoiceDAO.updateById(id, data);
  if (!updated) throw new NotFoundError('Invoice', { layer: Layer.CONTROLLER });

  await client.del(`invoice:${id}`); // invalidate in the SAME request, not deferred

  return ResponseUtils.success('Invoice updated', updated);
}
```

**Every write endpoint touching cached data must invalidate explicitly
— this is not optional once a resource is classified as high-stakes
on either axis (see §Classifying Data in ).** A missed invalidation point silently reintroduces stale data,
with no error anywhere to signal it happened.

### The Load-Bearing Assumption This Whole Pattern Depends On

**"Event-driven invalidation" really means "application-triggered
invalidation" — a narrower guarantee than it sounds, and worth stating
explicitly rather than leaving implicit.** It only protects against
writes that go through this application's own Controller → DAO path. It
does **not** protect against any write that bypasses that path entirely
— a one-off migration script, a separate internal admin tool, another
service writing to the same database directly. None of those would ever
trigger `client.del()`, and the cache would serve stale data for the
**full TTL**, regardless of how carefully invalidation is implemented
everywhere in this codebase.

**This holds today specifically because this architecture has exactly
one write path** — every change to cached data goes through this app's
own Controller → DAO code, by construction, per `02-ModuleStructure`/
`06-ModuleFileOrganization`. **This assumption breaks the moment a
second writer is introduced** — a migration script run directly against
MongoDB, a second service sharing this database, a direct admin
console. If that ever happens, either that new writer must also call the
same invalidation, or the resource it touches needs a short enough TTL
that the gap is tolerable regardless.

---

## Write-Through (stronger guarantee — for the highest-stakes data)

Cache and database updated as one logical step, so the cache is never
allowed to drift out of sync at all:

```javascript
async function updateInvoiceBalance(id, newBalance) {
  const cacheKey = `invoice:${id}`;

  let invoice = await client.get(cacheKey).then((v) => v && JSON.parse(v));
  if (!invoice) invoice = await this.invoiceDAO.findById(id);

  invoice.balance = newBalance;
  await client.set(cacheKey, JSON.stringify(invoice), { EX: 3600 });

  try {
    await this.invoiceDAO.updateById(id, { balance: newBalance });
  } catch (error) {
    // DB write failed — the cache is now wrong. Don't leave it stale;
    // clear it rather than serve an un-persisted value.
    await client.del(cacheKey);
    throw error;
  }

  return invoice;
}
```

Reserve this for genuinely high-stakes fields (balances, inventory
counts) — event-driven invalidation above is sufficient for everything
else at that stakes level.

---

## Audit Checklist

- [ ] Every write endpoint for a high-stakes resource invalidates
      its cache key in the SAME request, not deferred or forgotten
- [ ] No per-instance local cache layer exists anywhere in this
      codebase — every instance reads the same shared Redis directly
- [ ] If write-through is used, a failed DB write triggers cache
      deletion, never leaves a cache entry the database doesn't agree
      with
- [ ] A new write endpoint touching an already-cached resource was
      checked against this file before being considered complete
- [ ] If a second writer to this database is ever introduced (a
      migration script, another service, a direct admin tool), it was
      checked against the single-write-path assumption above — either
      made to call the same invalidation, or the resource's TTL was
      shortened to make the gap tolerable

---

## Related Patterns
- [Cache-Aside Strategy](./01-CacheAsideStrategy.PATTERN.md)
- [Idempotency Key Middleware](../11-Idempotency-Patterns/01-IdempotencyKeyMiddleware.PATTERN.md)

---

**One shared Redis, invalidated at the source of the write — not multiple caches needing a broadcast to agree.**
