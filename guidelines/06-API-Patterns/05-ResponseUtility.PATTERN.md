# Response Utility Pattern

## Status
🔴 **CRITICAL**

## Universal Pattern
**"Use ResponseUtils.success/error to construct all response shapes — all five fields, every time. requestId is pulled automatically from the correlation-ID context, never threaded manually through every controller signature."**

**Revised for the five-field contract.** `code` is now an explicit
parameter; `requestId` is read automatically via
`12-Logging-Patterns/02-CorrelationIds.PATTERN.md`'s `currentReqId()` —
controllers don't need `req` passed into them just to populate this
field.

## Utility
```javascript
// common/utilities/response.js
const { currentReqId } = require('@common/context/requestContext'); // AsyncLocalStorage-based, see 12-Logging-Patterns

const ResponseUtils = {
  success: (message, data = null, code = null) => ({
    status: 'success',
    message,
    data,
    code,
    requestId: currentReqId(),
  }),

  error: (message, code = 'INTERNAL_ERROR', data = null) => ({
    status: 'error',
    message,
    data,
    code,
    requestId: currentReqId(),
  }),
};

module.exports = ResponseUtils;
```

```javascript
// Usage
return ResponseUtils.success('Login successful', { user, token });
res.json(ResponseUtils.error('Login failed', 'UNAUTHORIZED'));
```

**Why `requestId` is pulled automatically rather than passed in:** a
controller shouldn't need `req` threaded into its signature purely to
populate a response field — `AsyncLocalStorage` already makes the
current request's ID available anywhere in the call stack without
explicit parameter-passing, so `ResponseUtils` reads it the same way
`12-Logging-Patterns`' request-scoped logger does.

---
**Never manually construct a response shape — always use this utility, which guarantees all five fields are present every time.**
