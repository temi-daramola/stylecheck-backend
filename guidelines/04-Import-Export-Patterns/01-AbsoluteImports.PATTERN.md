# Absolute Imports Pattern
## Status
🔴 **CRITICAL**
## Universal Pattern
**"ALWAYS use absolute imports with @ prefix. NEVER use relative imports (../ or ./)"**
## Pattern
```javascript
// ✅ CORRECT
import { common } from '@common/_index.js';
import { auth } from '@modules/auth/_index.js';

// ❌ WRONG
import { common } from '../../../common/_index.js';
```
## Path Aliases
- @common/ → src/common/
- @modules/ → src/modules/
- @adapters/ → src/adapters/
- @database/ → src/database/
- @app/ → src/app/
---
**Absolute imports everywhere - even within same module**
