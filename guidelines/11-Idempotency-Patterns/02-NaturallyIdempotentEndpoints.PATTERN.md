# Naturally Idempotent Endpoints Pattern

## Status
🟡 **REQUIRED** - GET, PUT, DELETE

## Purpose
GET, PUT, and DELETE are already safe to repeat by what they *do* —
no idempotency-key middleware is needed for any of them. What each one
needs instead is graceful handling of the "already done" case.

---

## Universal Pattern

**"GET reads, nothing to duplicate. PUT replaces/overwrites — repeating it converges to the same value. DELETE removes — repeating it must also converge to the same end state (resource absent), which means a second DELETE is success, not a 404."**

---

## Why DELETE's Correct Behavior Changed Here

**This reference's `06-QueryVsMutation.PATTERN.md` previously grouped
DELETE with POST/PUT as "not found = error."** That's wrong specifically
for DELETE. Idempotency means: no matter how many times an operation
repeats, the end result matches doing it once. A delete's whole job is
making a resource absent — if it's already absent, that job is already
done. Erroring on the second call treats "already achieved the goal" as
a failure, which it isn't. A legitimate case this actually breaks: a
network timeout drops the response after a DELETE succeeded
server-side, the client retries, and gets a confusing 404 for an action
that worked the first time.

**POST and PUT are unaffected** — see `06-QueryVsMutation.PATTERN.md`
for their unchanged behavior.

---

## DELETE

```javascript
// modules/invoice/controller/invoice/deleteInvoice.js
async function deleteInvoice(id) {
  const invoice = await this.invoiceDAO.findById(id);
  if (!invoice) {
    // Already gone — this IS success, not an error
    return ResponseUtils.success('Already deleted', null);
  }
  await this.invoiceDAO.deleteById(id);
  return ResponseUtils.success('Deleted', null);
}
```

---

## PUT

Upsert semantics naturally converge to the same end state regardless of
how many times the same payload is sent:

```javascript
// modules/invoice/dao/invoice-dao/upsertById.dao.js
async function upsertById(id, data) {
  try {
    return await Invoice.findByIdAndUpdate(id, data, { new: true, upsert: true, runValidators: true });
  } catch (error) {
    throw translateDbError(error, { operation: 'upsert', resource: 'Invoice' });
  }
}
```

---

## GET

No special handling needed beyond what's already documented elsewhere
in this reference — a GET for a resource that doesn't exist is already
correctly a success-with-null per `06-QueryVsMutation.PATTERN.md`'s
unchanged GET behavior.

---

## Audit Checklist

- [ ] DELETE on an already-deleted resource returns success, never a 404
      or other error
- [ ] PUT uses upsert semantics where repeating the same payload should
      converge to the same stored value
- [ ] No idempotency-key middleware is applied to GET/PUT/DELETE routes
      — that mechanism exists specifically for POST and similar
      non-idempotent operations (`01-IdempotencyKeyMiddleware.PATTERN.md`)

---

## Related Patterns
- [Idempotency Key Middleware](./01-IdempotencyKeyMiddleware.PATTERN.md)
- [Query vs Mutation](../06-API-Patterns/02-QueryVsMutation.PATTERN.md)

---

**Repeating any of these three must land in the same place as doing it once — including when "the same place" is "already done."**
