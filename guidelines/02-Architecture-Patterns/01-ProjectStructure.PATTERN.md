# Project Structure Pattern

## Status
🔴 **CRITICAL** - Foundation for entire backend

## Purpose
Define the standard directory structure for the backend application.

---

## Universal Pattern

**"All backend code lives in src/ with clear separation: adapters, app, common, database, modules, and server.js as entry point."**

---

## Root Directory Structure

```
backend/
  ├── src/                    # All source code
  ├── node_modules/           # Dependencies
  ├── reference/              # Guidelines documentation
  ├── rest-clients/           # API testing files
  ├── .env.development        # Local development values (gitignored)
  ├── .env.test               # Test values (gitignored)
  ├── .env.example            # Variable names only, no real values (committed)
  └── package.json
```

Staging and production have no env file — their values live in the host's dashboard (`03-Configuration-Patterns/04-EnvironmentDeployment.PATTERN.md`).

---

## Source Directory Structure

```
src/
  ├── adapters/               # Third-party library implementations
  │   ├── jwt/
  │   ├── password/
  │   ├── brevo/
  │   └── _index.js
  │
  ├── app/                    # Application setup
  │   ├── dependencies.js     # DI container
  │   ├── middleware.js       # Middleware config
  │   ├── routes.js           # Route registration
  │   └── startup.js          # Lifecycle management
  │
  ├── common/                 # Shared resources
  │   ├── constants/
  │   ├── middleware/
  │   ├── utilities/
  │   ├── errors/
  │   └── _index.js
  │
  ├── database/               # Database layer
  │   ├── models/
  │   ├── database.js
  │   └── _index.js
  │
  ├── modules/                # Feature modules
  │   ├── auth/
  │   ├── crm/
  │   ├── invoice/
  │   └── ...
  │
  └── server.js               # Entry point
```

---

## Directory Responsibilities

### `adapters/`
Third-party library implementations (bcrypt, JWT, email services)

### `app/`
Application setup and configuration (no business logic)

### `common/`
Shared utilities, constants, middleware, errors

### `database/`
Mongoose models and database connection

### `modules/`
Feature-specific code (auth, crm, invoice, etc.)

### `server.js`
Pure orchestration - calls app/ functions

---

## Audit Checklist

- [ ] All code in src/
- [ ] Reference guidelines in backend/reference/
- [ ] server.js is orchestration only
- [ ] app/ contains setup, not business logic
- [ ] modules/ organized by feature
- [ ] All directories have _index.js

---

## Related Patterns
- [Module Structure](./02-ModuleStructure.PATTERN.md)
- [App Directory](./03-AppDirectory.PATTERN.md)

---

**src/ is the foundation - all code lives here with clear separation.**
