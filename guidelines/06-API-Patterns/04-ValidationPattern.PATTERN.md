# Validation Pattern
## Status
🟡 **REQUIRED**
## Universal Pattern
**"DTOs define validation rules using express-validator from common.utilities.validation"**
## Pattern
```javascript
// common/utilities/validation.js
export { body, param, query, validationResult } from 'express-validator';

// modules/auth/dto/signup.dto.js
import { common } from '@common/_index.js';
const { body } = common.utilities.validation;

export const signupValidation = [
  body('email').notEmpty().bail().isEmail(),
  body('password').notEmpty().bail().isString().isLength({ min: 8 }),
  body('firstName').notEmpty().bail().isString()
];
```
## Rules
- camelCase field names
- Required checks first with .bail()
- Minimal validation unless specified
---
**DTOs use validators from common - no validation implementation in DTOs**
