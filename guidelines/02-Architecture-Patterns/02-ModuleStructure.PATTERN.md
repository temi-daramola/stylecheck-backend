# Module Structure Pattern

## Status
🔴 **CRITICAL** - Standard module organization

## Universal Pattern

**"Every module follows standard structure: controller/, dao/, dto/, routes/, utils/, constants/, and _index.js"**

## Standard Module Structure

```
modules/
  {moduleName}/
    ├── controller/
    │   ├── {resource}/
    │   │   └── _index.js
    │   └── _index.js
    ├── dao/
    │   ├── {resource}-dao/
    │   │   └── _index.js
    │   └── _index.js
    ├── dto/
    │   ├── {operation}.dto.js
    │   └── _index.js
    ├── routes/
    │   ├── {operation}.routes.js
    │   └── _index.js
    ├── utils/              # Optional - module-specific
    │   └── _index.js
    ├── constants/          # Optional - module-specific
    │   └── _index.js
    └── _index.js           # Main export
```

## Module Export

```javascript
// modules/auth/_index.js
import { controller } from './controller/_index.js';
import { dao } from './dao/_index.js';
import { dto } from './dto/_index.js';
import { routes } from './routes/_index.js';

export const auth = {
  controller,
  dao,
  dto,
  routes
};
```

---

**Every module exports as single namespace via _index.js**
