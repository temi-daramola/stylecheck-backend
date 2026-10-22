# Authentication Pattern Selection

## Status
🔴 **CRITICAL** - Read before implementing any authentication code

## Purpose
This project's reference supports **more than one** authentication
pattern. This file exists so a pattern is never assumed — it must be
confirmed before any auth code gets written.

---

## Universal Pattern

**"Do not default to a pattern. Ask which one applies to this project, then read that pattern's file, before writing any authentication code."**

---

## Available Patterns

| # | Pattern | File | Fits when |
|---|---------|------|-----------|
| 02 | Device-Bound Refresh Token | `02-DeviceBoundRefreshToken.PATTERN.md` | Frontend and backend may be deployed on different domains/sites (check the actual domains of the frontend and backend in every stage, staging included), or multi-device session management (per-device revocation) is needed |
| 03 | httpOnly Cookie + JWT | `03-HttpOnlyCookieJWT.PATTERN.md` | Frontend and backend share an origin or true subdomains of one site; simpler, standard pattern, fewer moving parts |

Both are fully specified, generic, production-grade patterns — **neither
is "the old way" or "the new way."** Which one is correct depends
entirely on this project's actual deployment topology and session
requirements, not on recency.

---

## The Required Step Before Writing Any Auth Code

1. **Ask**: "Which authentication pattern applies to this project — Device-Bound
   Refresh Token or httpOnly Cookie + JWT?" Do not assume based on what
   was used in a different project, or on which pattern happens to be
   listed first.
2. **Read that pattern's file in full** before writing anything —
   `02-DeviceBoundRefreshToken.PATTERN.md` or
   `03-HttpOnlyCookieJWT.PATTERN.md`.
3. Every other pattern in this reference (error handling, response
   format, DAO structure, controller structure, etc.) still applies
   identically regardless of which auth pattern is chosen — only the
   auth-specific flows themselves differ.

---

## Audit Checklist

- [ ] Before any auth-related code was written, was the pattern
      explicitly confirmed rather than assumed?
- [ ] Does the implementation match ONE pattern consistently — not a
      mix of both (e.g. an httpOnly cookie alongside a WebCrypto key
      pair would be redundant, not "extra security")?
- [ ] Does the chosen pattern's own file's Audit Checklist pass?

---

## Related Patterns
- [Device-Bound Refresh Token](./02-DeviceBoundRefreshToken.PATTERN.md)
- [httpOnly Cookie + JWT](./03-HttpOnlyCookieJWT.PATTERN.md)

---

**Two valid patterns exist. Confirm which one applies before writing a single line of auth code.**
