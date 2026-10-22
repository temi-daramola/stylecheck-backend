# Module File Organization Pattern

## Status
🔴 **CRITICAL** - Prevents bloated files and improves maintainability

## Purpose
Define how to organize all module files (controllers, DAOs, routes, utils, constants) by splitting operations into separate files to prevent bloated, hard-to-read code.

---

## Universal Pattern

**"Every business logic operation should be self-contained in its own file. This applies to ALL layers: controllers, DAOs, routes, utils, constants - not just controllers."**

---

## Core Rule

**ALL resources (simple or complex) follow the same pattern:**
- ✅ Resource folder (e.g., `signup/`, `contact/`)
- ✅ `_index.js` (class definition)
- ✅ One file per method/operation
- ✅ Absolute imports everywhere (even within same directory)
- ✅ Class imports and calls methods with `.call(this)`

**No inline methods - EVERYTHING is split into separate files!**

---

## File Structure Template

### Controller Files
```
{resource}/
  _index.js           # Class definition
  {method1}.js        # Method 1 implementation
  {method2}.js        # Method 2 implementation
```

### DAO Files (add .dao suffix)
```
{resource}-dao/
  _index.js           # Class definition
  {method1}.dao.js    # Method 1 implementation
  {method2}.dao.js    # Method 2 implementation
```

### Route Files (add .route suffix)
```
{resource}/
  _index.js           # Router
  {method1}.route.js  # Route 1 implementation
  {method2}.route.js  # Route 2 implementation
```

---

## Simple Resource Example (Auth/Signup)

### Controller Structure
```
modules/
  auth/
    controller/
      signup/
        _index.js         # SignupController class
        signup.js         # signup() method
      login/
        _index.js         # LoginController class
        login.js          # login() method
      verify-email/
        _index.js         # VerifyEmailController class
        verifyEmail.js    # verifyEmail() method
```

### DAO Structure
```
modules/
  auth/
    dao/
      account-dao/
        _index.js            # AccountDAO class
        create.dao.js        # create() method
        findByEmail.dao.js   # findByEmail() method
        findById.dao.js      # findById() method
        update.dao.js        # update() method
        delete.dao.js        # delete() method
```

---

## Simple Resource Implementation

### SignupController

**Class Definition (_index.js):**
```javascript
// modules/auth/controller/signup/_index.js
import { signup } from '@modules/auth/controller/signup/signup.js';

class SignupController {
  constructor(accountDAO, passwordAdapter, emailAdapter) {
    this.accountDAO = accountDAO;
    this.passwordAdapter = passwordAdapter;
    this.emailAdapter = emailAdapter;
  }

  async signup(userData) {
    return signup.call(this, userData);
  }
}

export default SignupController;
```

**Method Implementation (signup.js):**
```javascript
// modules/auth/controller/signup/signup.js
import { common } from '@common/_index.js';
import { auth } from '@modules/auth/_index.js';

const { ResponseUtils } = common.utilities;
const { AppError, ConflictError, Layer } = common.errors;
const { AuthConstants } = auth.constants;

export async function signup(userData) {
  try {
    const { email, password, firstName, lastName } = userData;
    
    // Check if user exists
    const existingUser = await this.accountDAO.findByEmail(email);
    if (existingUser) {
      throw new ConflictError(AuthConstants.ERRORS.EMAIL_EXISTS, { layer: Layer.CONTROLLER });
    }
    
    // Hash password
    const hashedPassword = await this.passwordAdapter.hash(password);
    
    // Create account
    const account = await this.accountDAO.create({
      email,
      password: hashedPassword,
      firstName,
      lastName
    });
    
    return ResponseUtils.success(
      AuthConstants.SUCCESS.SIGNUP, 
      { id: account._id, email: account.email }
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(AuthConstants.ERRORS.SIGNUP_FAILED, {
      statusCode: 500,
      code: 'SIGNUP_FAILED',
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
```

### AccountDAO

**Class Definition (_index.js):**
```javascript
// modules/auth/dao/account-dao/_index.js
import { create } from '@modules/auth/dao/account-dao/create.dao.js';
import { findByEmail } from '@modules/auth/dao/account-dao/findByEmail.dao.js';
import { findById } from '@modules/auth/dao/account-dao/findById.dao.js';
import { update } from '@modules/auth/dao/account-dao/update.dao.js';
import { deleteAccount } from '@modules/auth/dao/account-dao/delete.dao.js';

class AccountDAO {
  async create(data) {
    return create.call(this, data);
  }

  async findByEmail(email) {
    return findByEmail.call(this, email);
  }

  async findById(id) {
    return findById.call(this, id);
  }

  async update(id, data) {
    return update.call(this, id, data);
  }

  async delete(id) {
    return deleteAccount.call(this, id);
  }
}

export default AccountDAO;
```

**Method Implementation (create.dao.js):**
```javascript
// modules/auth/dao/account-dao/create.dao.js
import { common } from '@common/_index.js';
import { database } from '@database/_index.js';

const { translateDbError } = common.errors;
const { Account } = database.models;

export async function create(data) {
  try {
    const account = await Account.create(data);
    return account;
  } catch (error) {
    throw translateDbError(error, { operation: 'create', resource: 'Account' });
    // translateDbError (see 05-Error-Handling-Patterns/03-ErrorTranslation.PATTERN.md)
    // recognizes Mongo's duplicate-key code (11000) and produces a specific
    // ConflictError automatically — no manual error.code check needed here.
  }
}
```

---

## Complex Resource Example (CRM/Contact)

### Controller Structure
```
modules/
  crm/
    controller/
      contact/
        _index.js                # ContactController class
        createContact.js         # createContact() method
        getContacts.js           # getContacts() method
        getContactById.js        # getContactById() method
        updateContact.js         # updateContact() method
        deleteContact.js         # deleteContact() method
        queryLatestContact.js    # queryLatestContact() custom method
      
      status/
        _index.js                # StatusController class
        createStatus.js          # createStatus() method
        getStatuses.js           # getStatuses() method
        updateStatus.js          # updateStatus() method
        deleteStatus.js          # deleteStatus() method
```

### DAO Structure
```
modules/
  crm/
    dao/
      contact-dao/
        _index.js                # ContactDAO class
        createContact.dao.js     # create() method
        findById.dao.js          # findById() method
        findAll.dao.js           # findAll() method
        updateContact.dao.js     # update() method
        deleteContact.dao.js     # delete() method
        findLatest.dao.js        # findLatest() custom method
      
      status-dao/
        _index.js                # StatusDAO class
        createStatus.dao.js      # create() method
        findAll.dao.js           # findAll() method
        updateStatus.dao.js      # update() method
        deleteStatus.dao.js      # delete() method
```

---

## Complex Resource Implementation

### ContactController

**Class Definition (_index.js):**
```javascript
// modules/crm/controller/contact/_index.js
import { createContact } from '@modules/crm/controller/contact/createContact.js';
import { getContacts } from '@modules/crm/controller/contact/getContacts.js';
import { getContactById } from '@modules/crm/controller/contact/getContactById.js';
import { updateContact } from '@modules/crm/controller/contact/updateContact.js';
import { deleteContact } from '@modules/crm/controller/contact/deleteContact.js';
import { queryLatestContact } from '@modules/crm/controller/contact/queryLatestContact.js';

class ContactController {
  constructor(contactDAO, contactTypeDAO, fieldDefinitionDAO) {
    this.contactDAO = contactDAO;
    this.contactTypeDAO = contactTypeDAO;
    this.fieldDefinitionDAO = fieldDefinitionDAO;
  }

  async createContact(data, merchantId) {
    return createContact.call(this, data, merchantId);
  }

  async getContacts(merchantId) {
    return getContacts.call(this, merchantId);
  }

  async getContactById(id, merchantId) {
    return getContactById.call(this, id, merchantId);
  }

  async updateContact(id, data, merchantId) {
    return updateContact.call(this, id, data, merchantId);
  }

  async deleteContact(id, merchantId) {
    return deleteContact.call(this, id, merchantId);
  }

  async queryLatestContact(merchantId) {
    return queryLatestContact.call(this, merchantId);
  }
}

export default ContactController;
```

**Method Implementation (createContact.js):**
```javascript
// modules/crm/controller/contact/createContact.js
import { common } from '@common/_index.js';
import { crm } from '@modules/crm/_index.js';

const { ResponseUtils } = common.utilities;
const { AppError, NotFoundError, Layer } = common.errors;
const { ContactConstants } = crm.constants;

export async function createContact(data, merchantId) {
  try {
    const { contactTypeId, fields } = data;
    
    // Validate contact type exists
    const contactType = await this.contactTypeDAO.findById(contactTypeId, merchantId);
    if (!contactType) {
      throw new NotFoundError('Contact type', { layer: Layer.CONTROLLER });
    }
    
    // Create contact
    const contact = await this.contactDAO.create({
      merchantId,
      contactTypeId,
      fields
    });
    
    return ResponseUtils.success(ContactConstants.SUCCESS.CREATED, contact);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(ContactConstants.ERRORS.CREATE_FAILED, {
      statusCode: 500,
      code: 'CREATE_FAILED',
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
```

---

## Applies to ALL Layers

### Routes Example
```
modules/
  crm/
    routes/
      contact/
        _index.js                    # Contact router
        createContact.route.js       # POST /contacts
        getContacts.route.js         # GET /contacts
        getContactById.route.js      # GET /contacts/:id
        updateContact.route.js       # PUT /contacts/:id
        deleteContact.route.js       # DELETE /contacts/:id
```

### Utils Example
```
modules/
  crm/
    utils/
      contact/
        _index.js
        validateEmail.util.js
        formatPhone.util.js
        sanitizeData.util.js
```

### Constants Example
```
modules/
  crm/
    constants/
      contact/
        _index.js
        messages.constants.js      # Success/error messages
        validation.constants.js    # Validation messages
        status.constants.js        # Status values
```

---

## Naming Convention

### Controllers
- Folder: `{resource}/`
- Files: `{methodName}.js`
- Example: `createContact.js`, `getContacts.js`, `queryLatestContact.js`

### DAOs
- Folder: `{resource}-dao/`
- Files: `{methodName}.dao.js`
- Example: `createContact.dao.js`, `findById.dao.js`, `findLatest.dao.js`

### Routes
- Folder: `{resource}/`
- Files: `{methodName}.route.js`
- Example: `createContact.route.js`, `getContacts.route.js`

### Utils
- Folder: `{resource}/`
- Files: `{utilName}.util.js`
- Example: `validateEmail.util.js`, `formatPhone.util.js`

---

## Benefits

### 1. No Bloated Files
Each file contains ONE operation - easy to read and debug.

### 2. Clear Responsibility
Each file has a single, clear purpose.

### 3. Easy Navigation
Find specific operation immediately by filename.

### 4. Better Git History
Changes to one operation don't clutter diffs with unrelated code.

### 5. Parallel Development
Team can work on different operations without conflicts.

### 6. Easier Testing
Test operations in isolation.

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Inline Methods (Even for Simple Resources)
```javascript
// DON'T keep methods inline even for simple resources
class SignupController {
  async signup(userData) {
    // 100+ lines of code here
  }
}
```

### ❌ Anti-Pattern 2: Relative Imports
```javascript
// ❌ WRONG
import { signup } from './signup.js';

// ✅ CORRECT
import { signup } from '@modules/auth/controller/signup/signup.js';
```

### ❌ Anti-Pattern 3: Multiple Operations in One File
```javascript
// DON'T put multiple operations in one file
// createAndUpdateContact.js  ← WRONG!
```

---

## Audit Checklist

- [ ] Every resource has its own folder
- [ ] Every operation has its own file
- [ ] All resources have `_index.js` with class definition
- [ ] Methods called with `.call(this)` in class
- [ ] Absolute imports used everywhere
- [ ] DAO files use `.dao.js` suffix
- [ ] Route files use `.route.js` suffix
- [ ] Util files use `.util.js` suffix
- [ ] No inline method implementations in `_index.js`
- [ ] Simple and complex resources follow same pattern

---

## Related Patterns
- [Module Structure](./02-ModuleStructure.PATTERN.md)
- [Absolute Imports](../04-Import-Export-Patterns/01-AbsoluteImports.PATTERN.md)
- [Namespace Exports](../04-Import-Export-Patterns/02-NamespaceExports.PATTERN.md)

---

**Every operation in its own file - simple or complex, all layers follow this pattern.**
