# Pagination Pattern

## Status
🟡 **REQUIRED** - Standard shape for any paginated list endpoint

## Purpose
Define the standard way a paginated list endpoint combines a filtered/
paginated query with a total count, and the standard response shape it
returns.

---

## Universal Pattern

**"Every paginated list endpoint returns { items, totalCount, pageSize } as its response data. page and pageSize come from PaginationConstants defaults, never hardcoded."**

---

## Response Shape

```javascript
// Success
{
  status: 'success',
  message: 'Invoices retrieved successfully',
  data: {
    items: [ /* array of resources for this page */ ],
    totalCount: 142,
    pageSize: 20
  }
}
```

`totalCount` is the total number of matching records across the WHOLE
collection (not just the current page) — the client uses this to compute
total page count. `pageSize` is echoed back so the client always knows
the actual page size the server used, even if it fell back to a default.

---

## DAO Layer

One method for the paginated find (uses `.skip()`/`.limit()`), reusing
the existing `countByMerchant` method for the count — no new count
method needed.

```javascript
// modules/{module}/dao/{resource}-dao/findPaginatedByMerchant.dao.js
import { common } from '@common/_index.js';
import { database } from '@database/_index.js';

const { translateDbError } = common.errors;
const { Model } = database.models;

export async function findPaginatedByMerchant(merchantId, { page, pageSize }) {
  try {
    const skip = (page - 1) * pageSize;
    return await Model.find({ merchantId }).skip(skip).limit(pageSize);
  } catch (error) {
    throw translateDbError(error, { operation: 'fetch', resource: 'records' });
  }
}
```

```javascript
// modules/{module}/dao/{resource}-dao/_index.js — addition
import { findPaginatedByMerchant } from '@modules/{module}/dao/{resource}-dao/findPaginatedByMerchant.dao.js';

class ResourceDAO {
  // ...existing methods (create, findById, updateById, deleteById, countByMerchant)

  async findPaginatedByMerchant(merchantId, pagination) {
    return findPaginatedByMerchant.call(this, merchantId, pagination);
  }
}
```

---

## Controller Layer

Combines the paginated find and the count via `Promise.all`. `page`/
`pageSize` defaults and the max cap come from the existing
`PaginationConstants` (`common/constants/pagination.constants.js`) — per
Zero Hardcoding, never hardcoded inline.

```javascript
// modules/{module}/controller/{resource}/get{Resources}.js
import { common } from '@common/_index.js';
import { moduleNamespace } from '@modules/{module}/_index.js';

const { ResponseUtils } = common.utilities;
const { AppError, Layer } = common.errors;
const { PaginationConstants } = common.constants;
const { ResourceConstants } = moduleNamespace.constants;

export async function getResources(merchantId, query) {
  try {
    const page = Number(query.page) || PaginationConstants.DEFAULT_PAGE;
    const pageSize = Math.min(
      Number(query.pageSize) || PaginationConstants.DEFAULT_PAGE_SIZE,
      PaginationConstants.MAX_PAGE_SIZE
    );

    const [items, totalCount] = await Promise.all([
      this.resourceDAO.findPaginatedByMerchant(merchantId, { page, pageSize }),
      this.resourceDAO.countByMerchant(merchantId),
    ]);

    return ResponseUtils.success(ResourceConstants.SUCCESS.FETCHED, {
      items,
      totalCount,
      pageSize,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(ResourceConstants.ERRORS.FETCH_FAILED, {
      statusCode: 500,
      code: 'FETCH_FAILED',
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
```

**This is a Query, not a Mutation** (see
[Query vs Mutation](./02-QueryVsMutation.PATTERN.md)) — an empty result
set is still success, with `items: []` and `totalCount: 0`. Never throw
an error just because a page has no matching records.

---

## Route Layer

**Revised — the route no longer has its own `try/catch` at all.** Per
`05-Error-Handling-Patterns/04-CentralErrorMiddleware.PATTERN.md`, routes
throw or let a rejection propagate; exactly one central middleware,
registered once for the whole app, owns the response shape. Standard
[Route Factory](./03-RouteFactory.PATTERN.md) — `page`/`pageSize` come
from `req.query`, nothing new.

```javascript
// modules/{module}/routes/{resource}/get{Resources}.route.js
router.get('/', asyncHandler(async (req, res) => {
  const result = await controller.getResources(req.merchantId, req.query);
  res.json(result);
  // no try/catch here — any thrown error goes to the central middleware
}));
```

---

## Audit Checklist

- [ ] Response `data` is exactly `{ items, totalCount, pageSize }` — no
      other shape for a paginated list endpoint
- [ ] `totalCount` is the count across the WHOLE collection, not the
      current page's item count
- [ ] `page`/`pageSize` defaults come from `PaginationConstants` — never
      a hardcoded number in the controller
- [ ] `pageSize` is capped at `PaginationConstants.MAX_PAGE_SIZE`
- [ ] Paginated find and count are combined via a SINGLE controller
      method, not two separate endpoints the client has to call
- [ ] Empty result set is a success (`items: []`), never an error — same
      rule as [Query vs Mutation](./02-QueryVsMutation.PATTERN.md)
- [ ] DAO reuses the existing `countByMerchant` method — no duplicate
      count logic

---

## Related Patterns
- [Response Format](./01-ResponseFormat.PATTERN.md)
- [Query vs Mutation](./02-QueryVsMutation.PATTERN.md)
- [Response Utility](./05-ResponseUtility.PATTERN.md)
- [DAO Structure](../07-Data-Access-Patterns/01-DAOStructure.PATTERN.md)
- [Constants Management](../03-Configuration-Patterns/02-ConstantsManagement.PATTERN.md)

---

**Every paginated list endpoint: one controller method, { items, totalCount, pageSize }, defaults from PaginationConstants.**
