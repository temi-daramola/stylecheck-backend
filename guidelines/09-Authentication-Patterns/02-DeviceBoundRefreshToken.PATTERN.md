# Device-Bound Refresh Token Authentication

## Status
🔴 **CRITICAL** - Only read this if `01-AuthPatternSelection.PATTERN.md`
confirmed this is the pattern for this project

## Purpose
A rotating refresh mechanism cryptographically bound to a specific
browser via a non-extractable WebCrypto key pair — a stolen refresh
value alone is useless without also possessing the private key, which
never leaves the browser. Works correctly regardless of frontend/backend
deployment topology (same domain, same site, or fully cross-site).

**Full flow-by-flow detail, including every line of frontend and backend
code, lives in the standalone reference document
`Device-Bound-Refresh-Token-Auth-Flow.md`.** This file maps that design
onto this backend's established conventions — namespace exports,
one-file-per-operation, the type-based `AppError` hierarchy, `ResponseUtils` —
rather than repeating the full flow narrative.

---

## Universal Pattern

**"A new adapter wraps WebCrypto. A new DAO (RefreshRecordDAO) and controller methods are added to the auth module, one file per operation, following every existing convention exactly — this pattern changes WHAT the auth module does, not HOW this backend organizes code."**

---

## New Adapter Required: WebCrypto

Neither `jwt/` nor `password/` (the existing adapters) cover this —
`crypto.webcrypto.subtle` (`importKey`, `verify`) is a new native
capability, wrapped the same way any new adapter is, per
`04-NamespaceExports.PATTERN.md`'s own reasoning for wrapping native
APIs consistently.

```javascript
// adapters/webcrypto/importKey.js
import { webcrypto } from "crypto";

export async function importKey(publicKeyJwk) {
  return webcrypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}
```

```javascript
// adapters/webcrypto/verifySignature.js
import { webcrypto } from "crypto";

export async function verifySignature(importedKey, signature, payload) {
  return webcrypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    importedKey,
    Buffer.from(signature, "base64"),
    new TextEncoder().encode(JSON.stringify(payload))
  );
}
```

```javascript
// adapters/webcrypto/_index.js
import { importKey } from "@adapters/webcrypto/importKey.js";
import { verifySignature } from "@adapters/webcrypto/verifySignature.js";

export const webcrypto = { importKey, verifySignature };
```

---

## New DAO: RefreshRecordDAO

Following `07-DAOStructure.PATTERN.md`'s standard method set, plus the
operations this pattern specifically needs:

```
modules/auth/dao/refresh-record-dao/
  _index.js
  create.dao.js
  findByDeviceTokenHash.dao.js
  findByUserAndFingerprint.dao.js   # the Flow 2 upsert lookup
  markUsed.dao.js
  deleteAllForUser.dao.js            # theft response + password reset
  deleteOne.dao.js                   # logout
```

Each method follows `02-DAOErrorHandling.PATTERN.md` exactly — try/catch,
translate via `translateDbError`. Not repeated here since the shape is
identical to every other DAO method in this reference; see
`Device-Bound-Refresh-Token-Auth-Flow.md` for the actual query logic
each one runs (it's the same Mongoose calls shown there, just split into
one file per operation here instead of inline).

---

## New Controller Methods

One file per operation, per `06-ModuleFileOrganization.PATTERN.md`,
added to the existing `AuthController`:

```
modules/auth/controller/auth/
  verifyOtpAndRegisterDevice.js   # Flow 1
  loginAndRegisterDevice.js       # Flow 2
  refresh.js                      # Flow 3
  logout.js                       # Flow 5
```

Each follows `08-ControllerErrorHandling.PATTERN.md`'s re-throw-explicit/
wrap-implicit rule exactly. Every error message, every expiry duration,
every magic number (grace window, token byte length) is a named constant
per `03-ZeroHardcoding.PATTERN.md` — e.g.:

```javascript
// modules/auth/constants/auth.constants.js — additions
export const AuthConstants = {
  // ...existing entries
  REFRESH_TOKEN_EXPIRY_DAYS: 60,
  REFRESH_REUSE_GRACE_WINDOW_MS: 10_000,
  ERRORS: {
    // ...existing entries
    SESSION_REVOKED: "Session revoked, please log in again",
    INVALID_SESSION: "Invalid session",
  },
};
```

---

## Every Response Uses `ResponseUtils`, Not Raw Objects

The generic reference document's code shows `res.json({ accessToken, deviceToken })` directly — in this backend, that becomes:

```javascript
res.json(ResponseUtils.success(AuthConstants.SUCCESS.LOGIN, { accessToken, deviceToken }));
```

Every response in every flow (Sign Up, Log In, Refresh, Logout) gets
this same treatment — `{ status, message, data }`, never a bare object,
per `01-ResponseFormat.PATTERN.md`.

---

## Dependency Injection

`createDependencies()` gains the new DAO and adapter:

```javascript
export function createDependencies() {
  // ...existing DAOs/adapters
  const refreshRecordDAO = new RefreshRecordDAO();
  const authController = new AuthController(accountDAO, refreshRecordDAO, passwordAdapter, jwtAdapter, webcryptoAdapter);

  return {
    auth: { authController },
    // ...other modules
  };
}
```

---

## Audit Checklist

- [ ] WebCrypto is only ever touched inside `adapters/webcrypto/` —
      never imported directly in a controller or DAO
- [ ] `RefreshRecordDAO` follows the standard DAO method shape and
      translates every error via `translateDbError`
- [ ] Every flow's response goes through `ResponseUtils`, never a raw
      object literal
- [ ] Every message/number is a named constant — no hardcoded strings
      or magic numbers in the controller or route files
- [ ] `createDependencies()` wires the new DAO and adapter in
- [ ] Logout (`deleteOne`) only ever deletes the requesting device's own
      record — never every device's, unlike the theft-response path
- [ ] Password reset triggers `deleteAllForUser` — session invalidation
      is not optional, see the generic reference's Flow 4

---

## Related Patterns
- [Auth Pattern Selection](./01-AuthPatternSelection.PATTERN.md)
- [Module File Organization](../02-Architecture-Patterns/06-ModuleFileOrganization.PATTERN.md)
- [Error Hierarchy](../05-Error-Handling-Patterns/02-ErrorHierarchy.PATTERN.md)
- [Response Format](../06-API-Patterns/01-ResponseFormat.PATTERN.md)
- [DAO Structure](../07-Data-Access-Patterns/01-DAOStructure.PATTERN.md)

---

**Same conventions as every other module — only the auth module's own operations are new.**
