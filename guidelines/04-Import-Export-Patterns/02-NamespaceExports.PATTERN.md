# Namespace Exports Pattern
## Status
🔴 **CRITICAL**
## Universal Pattern
**"Everything exports as single namespace. Never destructure in imports."**
## Pattern
```javascript
// ✅ CORRECT Export
export const auth = {
  controller: { SignupController },
  dao: { AccountDAO }
};

// ✅ CORRECT Import
import { auth } from '@modules/auth/_index.js';
const { SignupController } = auth.controller;

// ❌ WRONG Import
import { SignupController } from '@modules/auth/_index.js';
```
---
**Import namespace, then destructure - never destructure in import**
