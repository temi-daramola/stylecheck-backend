# Zero Hardcoding Pattern

## Status
🔴 **CRITICAL** - Zero hardcoding is MANDATORY across entire backend

## Purpose
Eliminate all hardcoded strings, numbers, and values from the backend codebase by centralizing them in constant objects.

---

## Universal Pattern

**"Zero hardcoding anywhere. Every string, number, message, endpoint, status value, or configuration must be in constants. No exceptions."**

---

## Core Rule

**NEVER hardcode values in:**
- Controller logic
- DAO operations
- Route handlers
- Error messages
- Response messages
- Validation messages
- API endpoints
- Status checks
- Configuration values
- Anywhere else

**ALWAYS define values in constants files.**

---

## What Must Be Constants

### 1. Response Messages

```javascript
// modules/auth/constants/auth.constants.js

export const AuthConstants = {
  MESSAGES: {
    SUCCESS: {
      SIGNUP: 'Account created successfully',
      LOGIN: 'Login successful',
      LOGOUT: 'Logged out successfully',
      EMAIL_VERIFIED: 'Email verified successfully',
      PASSWORD_RESET: 'Password reset successfully',
    },
    ERROR: {
      SIGNUP_FAILED: 'Failed to create account',
      LOGIN_FAILED: 'Invalid credentials',
      EMAIL_EXISTS: 'Email already registered',
      USER_NOT_FOUND: 'User not found',
      INVALID_TOKEN: 'Invalid or expired token',
      UNAUTHORIZED: 'Unauthorized access',
    },
  },
};
```

### 2. Error Messages

```javascript
export const ProductConstants = {
  ERRORS: {
    NOT_FOUND: 'Product not found',
    CREATE_FAILED: 'Failed to create product',
    UPDATE_FAILED: 'Failed to update product',
    DELETE_FAILED: 'Failed to delete product',
    INVALID_ID: 'Invalid product ID',
    DUPLICATE_SKU: 'Product with this SKU already exists',
    INSUFFICIENT_STOCK: 'Insufficient stock available',
  },
};
```

### 3. Validation Messages

```javascript
export const ProductConstants = {
  VALIDATION: {
    NAME_REQUIRED: 'Product name is required',
    NAME_MIN_LENGTH: 'Name must be at least 3 characters',
    NAME_MAX_LENGTH: 'Name must not exceed 100 characters',
    PRICE_REQUIRED: 'Price is required',
    PRICE_MIN: 'Price must be greater than 0',
    PRICE_INVALID: 'Invalid price format',
    SKU_REQUIRED: 'SKU is required',
    SKU_UNIQUE: 'SKU must be unique',
    CATEGORY_REQUIRED: 'Category is required',
    STOCK_MIN: 'Stock cannot be negative',
  },
};
```

### 4. API Endpoints

```javascript
export const ProductConstants = {
  API: {
    BASE: '/api/products',
    BY_ID: '/api/products/:id',
    BY_CATEGORY: '/api/products/category/:categoryId',
    SEARCH: '/api/products/search',
    BULK: '/api/products/bulk',
    EXPORT: '/api/products/export',
  },
};
```

### 5. Status Values

```javascript
export const ProductConstants = {
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DRAFT: 'draft',
    ARCHIVED: 'archived',
    OUT_OF_STOCK: 'out_of_stock',
  },
  STOCK_LEVEL: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    OUT: 'out',
  },
};
```

### 6. Database Query Messages

```javascript
export const ProductConstants = {
  DB_ERRORS: {
    QUERY_FAILED: 'Database query failed',
    CONNECTION_FAILED: 'Failed to connect to database',
    DUPLICATE_KEY: 'Duplicate key error',
    VALIDATION_FAILED: 'Database validation failed',
    TIMEOUT: 'Database operation timed out',
  },
};
```

### 7. Configuration Values

```javascript
export const ProductConstants = {
  CONFIG: {
    MAX_PRICE: 999999.99,
    MIN_PRICE: 0,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MAX_NAME_LENGTH: 200,
    MIN_NAME_LENGTH: 3,
    MAX_DESCRIPTION_LENGTH: 2000,
    STOCK_LOW_THRESHOLD: 10,
    CACHE_TTL: 3600, // seconds
  },
};
```

### 8. Success Response Messages

```javascript
export const ProductConstants = {
  SUCCESS: {
    CREATED: 'Product created successfully',
    UPDATED: 'Product updated successfully',
    DELETED: 'Product deleted successfully',
    FETCHED: 'Products retrieved successfully',
    STOCK_UPDATED: 'Stock updated successfully',
    PRICE_UPDATED: 'Price updated successfully',
  },
};
```

---

## Constants File Structure

### Resource-Level Constants

```javascript
// modules/merchant/products/constants/product.constants.js

export const ProductConstants = {
  // Success Messages
  SUCCESS: {
    CREATED: 'Product created successfully',
    UPDATED: 'Product updated successfully',
    DELETED: 'Product deleted successfully',
  },
  
  // Error Messages
  ERRORS: {
    NOT_FOUND: 'Product not found',
    CREATE_FAILED: 'Failed to create product',
    DUPLICATE_SKU: 'Product with this SKU already exists',
  },
  
  // Validation Messages
  VALIDATION: {
    NAME_REQUIRED: 'Product name is required',
    PRICE_REQUIRED: 'Price is required',
    PRICE_MIN: 'Price must be greater than 0',
  },
  
  // API Endpoints
  API: {
    BASE: '/api/products',
    BY_ID: '/api/products/:id',
  },
  
  // Status Values
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DRAFT: 'draft',
  },
  
  // Configuration
  CONFIG: {
    MAX_PRICE: 999999.99,
    MIN_PRICE: 0,
    DEFAULT_PAGE_SIZE: 20,
  },
};

export default ProductConstants;
```

### Module Export

```javascript
// modules/merchant/products/constants/_index.js
import ProductConstants from './product.constants.js';

export const constants = {
  ProductConstants,
};

// modules/merchant/products/_index.js
import { constants } from './constants/_index.js';

export const products = {
  constants,
  // ... other exports
};
```

---

## Usage Examples

### Example 1: Controller - Success Response

```javascript
// ❌ WRONG - Hardcoded message
class ProductController {
  async createProduct(data, merchantId) {
    const product = await this.productDAO.create(data);
    return ResponseUtils.success('Product created successfully', product);
  }
}

// ✅ CORRECT - Using constants
import { products } from '@modules/merchant/products/_index.js';
const { ProductConstants } = products.constants;

class ProductController {
  async createProduct(data, merchantId) {
    const product = await this.productDAO.create(data);
    return ResponseUtils.success(ProductConstants.SUCCESS.CREATED, product);
  }
}
```

### Example 2: Controller - Error Handling

```javascript
// ❌ WRONG - Hardcoded error message
class ProductController {
  async getProductById(id, merchantId) {
    const product = await this.productDAO.findById(id, merchantId);
    
    if (!product) {
      throw new AppError('Product not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    
    return product;
  }
}

// ✅ CORRECT - Using constants
import { products } from '@modules/merchant/products/_index.js';
import { common } from '@common/_index.js';
const { ProductConstants } = products.constants;
const { AppError, Layer } = common.errors;

class ProductController {
  async getProductById(id, merchantId) {
    const product = await this.productDAO.findById(id, merchantId);
    
    if (!product) {
      throw new AppError(ProductConstants.ERRORS.NOT_FOUND, { statusCode: 404, code: 'NOT_FOUND', layer: Layer.CONTROLLER });
    }
    
    return product;
  }
}
```

**A `NotFoundError('Product', opts)` (§`05-Error-Handling-Patterns/02-ErrorHierarchy.PATTERN.md`)
is also valid here** — its own built-in `${resource} not found` message
means there's no separate message string to centralize in constants at
all for this specific case. Either approach satisfies Zero Hardcoding;
the generic `AppError` + constant shown above is used here specifically
to keep this example's focus on the constants pattern itself.

### Example 3: DAO - Database Errors

```javascript
// ❌ WRONG - Hardcoded error messages, and hand-rolled duplicate-key detection
// repeated at this one call site instead of using the shared recognition table
class ProductDAO {
  async create(data) {
    try {
      const product = await Product.create(data);
      return product;
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('Product with this SKU already exists', { statusCode: 409, code: 'CONFLICT' });
      }
      throw new AppError('Failed to create product', { statusCode: 500, code: 'CREATE_FAILED' });
    }
  }
}

// ✅ CORRECT - translateDbError's shared recognition table already detects
// Mongo's duplicate-key code; the message still comes from constants, via
// the table's own translate function, not hardcoded at this call site
import { products } from '@modules/merchant/products/_index.js';
import { common } from '@common/_index.js';
const { ProductConstants } = products.constants;
const { translateDbError } = common.errors;

class ProductDAO {
  async create(data) {
    try {
      const product = await Product.create(data);
      return product;
    } catch (error) {
      throw translateDbError(error, { operation: 'create', resource: ProductConstants.RESOURCE_NAME });
    }
  }
}
```

### Example 4: Routes - API Endpoints

```javascript
// ❌ WRONG - Hardcoded endpoint
export function createProductRoutes(controller) {
  const router = express.Router();
  
  router.get('/api/products', async (req, res) => {
    // ...
  });
  
  return router;
}

// ✅ CORRECT - Using constants
import { products } from '@modules/merchant/products/_index.js';
const { ProductConstants } = products.constants;

export function createProductRoutes(controller) {
  const router = express.Router();
  
  // Note: Base path is defined in route registration
  router.get('/', async (req, res) => {
    // ...
  });
  
  return router;
}

// app/routes.js - Base path from constants
app.use(ProductConstants.API.BASE, createProductRoutes(dependencies.products.productController));
```

### Example 5: Validation - DTO Messages

```javascript
// ❌ WRONG - Hardcoded validation messages
export const createProductValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be greater than 0'),
];

// ✅ CORRECT - Using constants
import { products } from '@modules/merchant/products/_index.js';
const { ProductConstants } = products.constants;

export const createProductValidation = [
  body('name').notEmpty().withMessage(ProductConstants.VALIDATION.NAME_REQUIRED),
  body('price').isFloat({ min: 0 }).withMessage(ProductConstants.VALIDATION.PRICE_MIN),
];
```

### Example 6: Status Checks

```javascript
// ❌ WRONG - Hardcoded status values
class ProductController {
  async activateProduct(id, merchantId) {
    const product = await this.productDAO.findById(id, merchantId);
    
    if (product.status === 'active') {
      throw new AppError('Product is already active', { statusCode: 400, code: 'ALREADY_ACTIVE' });
    }
    
    product.status = 'active';
    await this.productDAO.update(id, merchantId, product);
  }
}

// ✅ CORRECT - Using constants
import { products } from '@modules/merchant/products/_index.js';
import { common } from '@common/_index.js';
const { ProductConstants } = products.constants;
const { AppError, Layer } = common.errors;

class ProductController {
  async activateProduct(id, merchantId) {
    const product = await this.productDAO.findById(id, merchantId);
    
    if (product.status === ProductConstants.STATUS.ACTIVE) {
      throw new AppError(ProductConstants.ERRORS.ALREADY_ACTIVE, { statusCode: 400, code: 'ALREADY_ACTIVE', layer: Layer.CONTROLLER });
    }
    
    product.status = ProductConstants.STATUS.ACTIVE;
    await this.productDAO.update(id, merchantId, product);
  }
}
```

### Example 7: Configuration Values

```javascript
// ❌ WRONG - Magic numbers
class ProductController {
  async listProducts(merchantId, page = 1) {
    const pageSize = 20; // Magic number!
    const products = await this.productDAO.findByMerchant(merchantId, page, pageSize);
    
    if (products.length === 0) {
      return ResponseUtils.success('No products found', []);
    }
    
    return ResponseUtils.success('Products retrieved successfully', products);
  }
}

// ✅ CORRECT - Using constants
import { products } from '@modules/merchant/products/_index.js';
const { ProductConstants } = products.constants;

class ProductController {
  async listProducts(merchantId, page = 1) {
    const pageSize = ProductConstants.CONFIG.DEFAULT_PAGE_SIZE;
    const products = await this.productDAO.findByMerchant(merchantId, page, pageSize);
    
    if (products.length === 0) {
      return ResponseUtils.success(ProductConstants.SUCCESS.FETCHED, []);
    }
    
    return ResponseUtils.success(ProductConstants.SUCCESS.FETCHED, products);
  }
}
```

---

## Common Module Constants

For shared values across all modules:

```javascript
// common/constants/http.constants.js
export const HttpConstants = {
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
  MESSAGES: {
    INTERNAL_ERROR: 'Internal server error',
    INVALID_REQUEST: 'Invalid request',
    UNAUTHORIZED: 'Unauthorized access',
  },
};

// common/constants/pagination.constants.js
export const PaginationConstants = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// common/constants/_index.js
import { HttpConstants } from './http.constants.js';
import { PaginationConstants } from './pagination.constants.js';

export const constants = {
  http: HttpConstants,
  pagination: PaginationConstants,
};
```

---

## Benefits

### 1. Single Source of Truth
Change message in one place, reflects everywhere:
```javascript
// Change "Product created successfully" to "Product added successfully"
// Only update in constants file
SUCCESS: {
  CREATED: 'Product added successfully', // Update once
}
```

### 2. Easy Localization/i18n
Constants become translation keys:
```javascript
SUCCESS: {
  CREATED: t('product.success.created'), // Easy i18n
}
```

### 3. Consistency
No typos or variations:
```javascript
// No more:
'Product created successfully' vs 'Product Created Successfully' vs 'Product added'

// Just one constant:
ProductConstants.SUCCESS.CREATED
```

### 4. Searchability
Find all usages of a message:
```javascript
// Search for "ProductConstants.SUCCESS.CREATED"
// Shows everywhere this message is used
```

### 5. Type Safety (TypeScript)
```typescript
export const ProductConstants = {
  STATUS: {
    ACTIVE: 'active' as const,
    INACTIVE: 'inactive' as const,
  },
} as const;
```

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Hardcoded Messages
```javascript
// NEVER do this
return ResponseUtils.success('Product created successfully', product);
throw new AppError('Product not found', { statusCode: 404, code: 'NOT_FOUND' });
```

### ❌ Anti-Pattern 2: Magic Numbers
```javascript
// NEVER do this
const pageSize = 20;
if (product.stock < 10) { /* ... */ }
```

### ❌ Anti-Pattern 3: Hardcoded Status Values
```javascript
// NEVER do this
if (product.status === 'active') { /* ... */ }
product.status = 'inactive';
```

### ❌ Anti-Pattern 4: Hardcoded Endpoints
```javascript
// NEVER do this
const response = await axios.get('/api/products');
```

---

## Migration Guide

### Before (Hardcoded):
```javascript
class ProductController {
  async createProduct(data, merchantId) {
    try {
      const product = await this.productDAO.create(data);
      return ResponseUtils.success('Product created successfully', product);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create product', { statusCode: 500, code: 'CREATE_FAILED' });
    }
  }
}

class ProductDAO {
  async create(data) {
    try {
      return await Product.create(data);
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('Product with this SKU already exists', { statusCode: 409, code: 'CONFLICT' });
      }
      throw new AppError('Failed to create product', { statusCode: 500, code: 'CREATE_FAILED' });
    }
  }
}
```

### After (Constants):
```javascript
// 1. Create constants file
// modules/merchant/products/constants/product.constants.js
export const ProductConstants = {
  RESOURCE_NAME: 'Product',
  SUCCESS: {
    CREATED: 'Product created successfully',
  },
  ERRORS: {
    CREATE_FAILED: 'Failed to create product',
    DUPLICATE_SKU: 'Product with this SKU already exists',
  },
};

// 2. Import and use
import { products } from '@modules/merchant/products/_index.js';
import { common } from '@common/_index.js';
const { ProductConstants } = products.constants;
const { AppError, Layer, translateDbError } = common.errors;

class ProductController {
  async createProduct(data, merchantId) {
    try {
      const product = await this.productDAO.create(data);
      return ResponseUtils.success(ProductConstants.SUCCESS.CREATED, product);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ProductConstants.ERRORS.CREATE_FAILED, { statusCode: 500, code: 'CREATE_FAILED', layer: Layer.CONTROLLER, cause: error });
    }
  }
}

class ProductDAO {
  async create(data) {
    try {
      return await Product.create(data);
    } catch (error) {
      // translateDbError's shared recognition table (05-Error-Handling-Patterns/
      // 03-ErrorTranslation.PATTERN.md) already detects the duplicate-key case —
      // no manual error.code check needed here at all, hardcoded or otherwise
      throw translateDbError(error, { operation: 'create', resource: ProductConstants.RESOURCE_NAME });
    }
  }
}
```

---

## Audit Checklist

- [ ] No hardcoded strings in controllers
- [ ] No hardcoded strings in DAOs
- [ ] No hardcoded strings in routes
- [ ] No hardcoded error messages
- [ ] No hardcoded success messages
- [ ] No hardcoded validation messages
- [ ] No hardcoded API endpoints
- [ ] No hardcoded status values
- [ ] No magic numbers in configuration
- [ ] All constants in dedicated files
- [ ] Constants exported via namespace
- [ ] Constants imported via namespace pattern

---

## Related Patterns
- [Response Format](../06-API-Patterns/01-ResponseFormat.PATTERN.md)
- [Error Hierarchy](../05-Error-Handling-Patterns/02-ErrorHierarchy.PATTERN.md)
- [Response Utility](../06-API-Patterns/05-ResponseUtility.PATTERN.md)
- [Validation Pattern](../06-API-Patterns/04-ValidationPattern.PATTERN.md)

---

## Exceptions

**There are NO exceptions to this rule.**

Even seemingly "obvious" values must be constants:
```javascript
// Even these need to be constants
const DEFAULT_PAGE = 1;  // → Constants.pagination.DEFAULT_PAGE
const STATUS_OK = 200;   // → Constants.http.STATUS_CODES.OK
```

---

**Zero hardcoding is MANDATORY. No exceptions. Ever.**
