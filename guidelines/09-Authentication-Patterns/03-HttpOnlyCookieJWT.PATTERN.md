# httpOnly Cookie + JWT Authentication

## Status
🔴 **CRITICAL** - Only read this if `01-AuthPatternSelection.PATTERN.md`
confirmed this is the pattern for this project

## Purpose
Short-lived JWT access tokens paired with a refresh token delivered as
an httpOnly cookie — simpler than the device-bound pattern, correct only
when frontend and backend share an origin or a true same-site subdomain
relationship.

**Full flow-by-flow detail, including every line of frontend and backend
code, lives in the standalone reference document
`HttpOnly-Cookie-JWT-Auth-Flow.md`.** This file maps that design onto
this backend's established conventions, rather than repeating the full
flow narrative.

---

## Universal Pattern

**"A new DAO (RefreshTokenDAO) and controller methods are added to the auth module, one file per operation. Rotation with reuse detection on every refresh is REQUIRED, not optional — see the mandatory note below."**

---

## Mandatory, Not Optional: Rotation + Reuse Detection

**RFC 9700 (the current IETF OAuth 2.0 security standard) requires
refresh tokens for public clients — a browser app is one — to be either
sender-constrained or rotated.** This pattern has no sender-constraining
mechanism (that's what the device-bound pattern adds instead), so
rotation on every refresh, with reuse detection reusing a token that's
already been rotated revoking every token for that account, is not
optional hardening here — it's the only way this pattern meets that
bar. Implement this from the start, not as a later addition.

---

## New Middleware Dependency: `cookie-parser`

`req.cookies` (used throughout this pattern's backend code) requires the
`cookie-parser` package wired into `app/middleware.js`'s
`applyMiddleware(app)` — not a new adapter, since it's Express
middleware configuration, not a wrapped library call made from
application code.

---

## New DAO: RefreshTokenDAO

```
modules/auth/dao/refresh-token-dao/
  _index.js
  create.dao.js
  findByTokenHash.dao.js
  markUsed.dao.js
  deleteAllForAccount.dao.js   # theft response + password reset
  deleteOne.dao.js             # logout
```

Same `02-DAOErrorHandling.PATTERN.md` treatment as every other DAO in
this reference — not repeated here; see
`HttpOnly-Cookie-JWT-Auth-Flow.md` for the actual Mongoose queries each
method runs.

---

## New Controller Methods

```
modules/auth/controller/auth/
  signup.js
  login.js
  refresh.js   # now includes the mandatory rotation + reuse check
  logout.js
```

Every message and number — cookie `maxAge`, the grace window if one is
added, error strings — is a named constant per
`03-ZeroHardcoding.PATTERN.md`:

```javascript
// modules/auth/constants/auth.constants.js — additions
export const AuthConstants = {
  // ...existing entries
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
  REFRESH_COOKIE_NAME: "refreshToken",
  REFRESH_COOKIE_PATH: "/auth",
  ERRORS: {
    // ...existing entries
    SESSION_REVOKED: "Session revoked, please log in again",
    SESSION_EXPIRED: "Session expired",
    NOT_AUTHENTICATED: "Not authenticated",
  },
};
```

---

## Every Response Uses `ResponseUtils`, Not Raw Objects

The generic reference's code shows `res.json({ accessToken })` and
`res.status(401).json({ error: "..." })` directly — in this backend,
both become `ResponseUtils.success(...)` / `ResponseUtils.error(...)`,
per `01-ResponseFormat.PATTERN.md` and `05-ResponseUtility.PATTERN.md`,
same as every other endpoint in this reference.

---

## Dependency Injection

```javascript
export function createDependencies() {
  // ...existing DAOs/adapters
  const refreshTokenDAO = new RefreshTokenDAO();
  const authController = new AuthController(accountDAO, refreshTokenDAO, passwordAdapter, jwtAdapter);

  return {
    auth: { authController },
    // ...other modules
  };
}
```

---

## Audit Checklist

- [ ] Refresh rotates AND checks for reuse on every call — not
      optional, see the mandatory note above
- [ ] `cookie-parser` is wired into `app/middleware.js`
- [ ] Cookie options (`httpOnly`, `secure`, `sameSite`, `path`,
      `maxAge`) are set identically everywhere the cookie is issued
      (Sign Up, Log In, Refresh) — a mismatch means `res.clearCookie`
      silently fails later
- [ ] Every response goes through `ResponseUtils`
- [ ] Every message/number is a named constant
- [ ] Password reset triggers `deleteAllForAccount`
- [ ] Logout deletes only the one matching record and clears the cookie
      with the exact same `path` it was set with

---

## Related Patterns
- [Auth Pattern Selection](./01-AuthPatternSelection.PATTERN.md)
- [Module File Organization](../02-Architecture-Patterns/06-ModuleFileOrganization.PATTERN.md)
- [Error Hierarchy](../05-Error-Handling-Patterns/02-ErrorHierarchy.PATTERN.md)
- [Response Format](../06-API-Patterns/01-ResponseFormat.PATTERN.md)

---

**Simpler than the device-bound pattern, but only correct for same-site deployments — check the frontend and backend domains of every stage (staging included) before choosing this.**
