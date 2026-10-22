# Query vs Mutation Pattern

## Status
🟡 **REQUIRED**

## Universal Pattern
**"Query (GET) not found = success with null. Mutation (POST/PUT) not found = error. DELETE not found = success — repeating a delete must converge to the same end state, not error on the second call."**

**Revised from the original version of this pattern** — DELETE was
previously grouped with POST/PUT as "not found = error." That's wrong
specifically for DELETE: see `11-Idempotency-Patterns/
02-NaturallyIdempotentEndpoints.PATTERN.md` for the full reasoning. POST
and PUT are unaffected by this change.

## Query (GET) - Success
```javascript
const invoice = await dao.findById(id);
if (!invoice) {
  return ResponseUtils.success('Invoice not found or deleted', null);
}
```

## Mutation (POST/PUT) - Error
```javascript
const invoice = await dao.findById(id);
if (!invoice) {
  throw new NotFoundError('Invoice', { layer: Layer.CONTROLLER });
}
```

## Mutation (DELETE) - Success, Not Error

```javascript
const invoice = await dao.findById(id);
if (!invoice) {
  // Already gone — a retry of a delete that already succeeded (e.g.
  // after a dropped response) must not surface as an error. The end
  // state the caller wanted — this resource absent — is already true.
  return ResponseUtils.success('Already deleted', null);
}
await dao.deleteById(id);
return ResponseUtils.success('Deleted', null);
```

---
**Query executed successfully but no data = success. POST/PUT cannot execute = error. DELETE already done = still success.**
