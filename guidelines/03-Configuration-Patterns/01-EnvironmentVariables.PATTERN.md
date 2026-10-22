# Environment Variables Pattern
## Status
🔴 **CRITICAL**
## Universal Pattern
**"ALL env vars read ONLY in common/constants/env.constants.js. Never use process.env anywhere else."**
## Pattern
```javascript
// common/constants/env.constants.js
// The loader at the top of this file (NODE_ENV allowlist, env file, ${} expansion)
// is defined in 04-EnvironmentDeployment.PATTERN.md. Below it, every value is exported:

export const MONGODB_URI = requireEnv('MONGODB_URI');   // mandatory: no fallback, fails fast
export const PORT = Number(process.env.PORT ?? 5000);   // genuinely optional: a default is allowed

// Usage
import { common } from '@common/_index.js';
const port = common.constants.env.PORT;
```
---
**process.env ONLY in env.constants.js - nowhere else**

**Required environment variables must not use silent fallback values.**
If an env var is mandatory, the application should fail fast with a clear error instead of substituting a default.
This prevents hidden misconfiguration and enforces explicit deployment settings.

**Mandatory or optional is decided per variable, in the code.** `requireEnv('NAME')` for mandatory variables; a `??` default only for variables that are genuinely optional.

**The stage is read the same way.** `common.constants.env.NODE_ENV` for labels, and `common.constants.env.IS_PRODUCTION_LIKE` for behaviour that should apply to both staging and production. Never compare `NODE_ENV` to `'production'` directly.

---

## Related Patterns
- [Environment Deployment](./04-EnvironmentDeployment.PATTERN.md)
- [Constants Management](./02-ConstantsManagement.PATTERN.md)
