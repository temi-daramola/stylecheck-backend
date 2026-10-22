# Response Format Pattern

## Status
🔴 **CRITICAL**

## Universal Pattern
**"All responses: { status: 'success' | 'error', message: string, data: any | null, code: string | null, requestId: string }"**

**Revised from a three-field shape to five.** `code` and `requestId` are
new — see `05-Error-Handling-Patterns/04-CentralErrorMiddleware.PATTERN.md`
for the full reasoning. This is a breaking change to the existing
contract, not an addition alongside it.

## Format
```javascript
// Success
{
  status: 'success',
  message: 'User created successfully',
  data: { id: '123', email: 'user@example.com' },
  code: null,
  requestId: 'a1b2c3'
}

// Error
{
  status: 'error',
  message: 'Email already exists',
  data: null,
  code: 'CONFLICT',
  requestId: 'a1b2c3'
}
```

- `code` — `null` on success; a machine-readable identifier
  (`NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`) on
  failure, matching the thrown `AppError` subclass's own `code` — so a
  client branching on error type never parses `message` text.
- `requestId` — present on EVERY response, success or failure alike, not
  just failures — a user might reference any response, not only a
  failed one, when reporting something later. See
  `05-Error-Handling-Patterns/04-CentralErrorMiddleware.PATTERN.md` and
  `12-Logging-Patterns/02-CorrelationIds.PATTERN.md`.

---
**Controllers construct response shape, routes just send it — all five fields, every time.**
