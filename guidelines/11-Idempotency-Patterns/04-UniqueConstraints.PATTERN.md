# Unique Constraints Pattern

## Status
🔴 **CRITICAL** - Last line of defense against races

## Purpose
Catch the narrow race condition that slips past both the frontend
trigger-lock and the backend idempotency-key middleware — two requests
processed concurrently before either finishes writing.

---

## Universal Pattern

**"Where a resource has a naturally unique attribute, enforce it at the database level. If two requests race past every other layer, the DB throws on the second insert — catch it and respond gracefully, never let it surface as an unhandled error."**

---

## Schema-Level Enforcement

```javascript
// database/models/Order.js
const orderSchema = new mongoose.Schema({
  checkoutSessionId: { type: String, required: true, unique: true }, // hard DB-level guard
  items: [{ /* ... */ }],
  total: Number,
});
```

---

## Handling the Violation Gracefully

```javascript
// modules/order/controller/order/createOrder.js
async function createOrder(data) {
  try {
    const order = await this.orderDAO.create(data);
    return ResponseUtils.success('Order created', order);
  } catch (error) {
    if (error.code === 11000) {
      // Mongo duplicate-key error — another request for this exact
      // checkoutSessionId already landed first. Return the existing
      // resource, don't surface this as a failure.
      const existing = await this.orderDAO.findByCheckoutSessionId(data.checkoutSessionId);
      return ResponseUtils.success('Order created', existing);
    }
    throw error;
  }
}
```

**This is a genuine race condition, not a bug in the layers above it** —
both the frontend trigger-lock and the idempotency-key middleware
correctly reduce how often this happens, but neither can make it
impossible when two requests are processed by the server at the exact
same instant. This layer exists specifically to catch what the others
structurally cannot.

---

## Audit Checklist

- [ ] Every resource with a natural uniqueness rule (a checkout session,
      an email address, an order reference) has that uniqueness enforced
      as a DB-level constraint, not just checked in application code
      first
- [ ] The duplicate-key error path returns the existing resource
      gracefully — never lets the raw DB error surface as an unhandled
      `500`

---

## Related Patterns
- [Idempotency Key Middleware](./01-IdempotencyKeyMiddleware.PATTERN.md)
- [DAO Error Handling](../07-Data-Access-Patterns/02-DAOErrorHandling.PATTERN.md)

---

**Even with every other layer correct, this is the one that makes a true race condition impossible to corrupt data with.**
