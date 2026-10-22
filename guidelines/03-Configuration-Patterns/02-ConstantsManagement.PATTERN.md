# Constants Management Pattern
## Status
🟡 **REQUIRED**
## Universal Pattern
**"Constants can be common/ (shared) or modules/{name}/constants/ (scoped)"**
## Structure
```
common/
  constants/
    env.constants.js
    _index.js

modules/
  auth/
    constants/
      auth.constants.js
      _index.js
```
---
**If only one module needs it → module constants. If shared → common constants**
