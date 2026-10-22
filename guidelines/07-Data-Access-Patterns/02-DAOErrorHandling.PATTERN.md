# DAO Error Handling Pattern

## Status
🔴 **CRITICAL**

## Universal Pattern
**"Every DAO method wraps database errors via translateDbError — never a bare DAOError, which no longer exists in this reference."**

**Revised — `DAOError` is retired.** See
`05-Error-Handling-Patterns/02-ErrorHierarchy.PATTERN.md` (the
type-not-layer reorganization) and
`05-Error-Handling-Patterns/03-ErrorTranslation.PATTERN.md` (the
recognition-table pattern this file now defers to for the actual
translation logic).

## Pattern
```javascript
async findByMerchant(merchantId) {
  try {
    const records = await Model.find({ merchantId });
    return records;
  } catch (error) {
    throw translateDbError(error, { operation: 'fetch', resource: 'records' });
  }
}
```

Every DAO method still has a try/catch — that part is unchanged. What
changed is what the `catch` does: instead of constructing a flat
`DAOError` with the raw message, it calls `translateDbError` (full
reasoning and the recognition table in
`05-Error-Handling-Patterns/03-ErrorTranslation.PATTERN.md`), which
recognizes known failures (duplicate key, cast error, schema validation)
and produces a specific, safe, type-based `AppError` subclass with
`layer: Layer.DATABASE` — falling back to a generic, non-operational
`AppError` only for what it doesn't recognize.

---
**Try/catch in every DAO method, unchanged — but translate through the recognition table, never construct a bare DAOError.**
