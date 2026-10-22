# Controller Error Handling Pattern

## Status
🔴 **CRITICAL**

## Universal Pattern
**"Controllers re-throw any AppError as-is; wrap anything else in a type-appropriate AppError subclass. ControllerError no longer exists in this reference."**

**Revised — `ControllerError`/`DAOError` are retired**, replaced by the
type-based hierarchy in
`05-Error-Handling-Patterns/02-ErrorHierarchy.PATTERN.md`. The
re-throw-explicit/wrap-implicit shape is unchanged; only the class names
and the `instanceof` check changed.

## Pattern
```javascript
async function getResource(id, merchantId) {
  try {
    const resource = await this.dao.findById(id, merchantId);
    if (!resource) {
      throw new NotFoundError('Resource', { layer: Layer.CONTROLLER });
    }
    return resource;
  } catch (error) {
    if (error instanceof AppError) {
      throw error; // Re-throw explicit — already correctly typed, whichever layer produced it
    }
    throw new AppError(`Failed: ${error.message}`, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      isOperational: false, // unrecognized — treat as a real problem
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
```

**The check simplified from two classes to one.** Previously:
`error instanceof DAOError || error instanceof ControllerError`. Now:
`error instanceof AppError` — since every typed error throughout this
reference, regardless of which layer produced it, is an `AppError`
subclass, there's no longer a need to check for two separate base
classes.

---
**Controllers still distinguish explicit (already typed) from implicit (unknown) errors — just via one base class, not two.**
