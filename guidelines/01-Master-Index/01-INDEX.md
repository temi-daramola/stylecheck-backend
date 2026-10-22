# Backend Development Reference - Master Index

This is the **single source of truth** for all backend development patterns, guidelines, and best practices. **All code must comply with these references.**

**Location:** all folders below live in the `guidelines/` directory; every path in this index is relative to it. The `CLAUDE.md` at the project root points here and holds no rules of its own.

---

## 🤖 INSTRUCTIONS FOR AI ASSISTANTS (Copilot, Claude, etc.)

### How to Traverse This Reference

When implementing any feature, fix, or audit, you **must** read and apply guidelines in the following order:

**Step 1: Follow folder order** - Process folders numerically (01 → 02 → 03 → … → 14)

**Step 2: Follow file order within each folder** - Within each folder, process files numerically (01 → 02 → 03 → ...)

**Full traversal order:**
```
01-Master-Index/
  01-INDEX.md                          ← Start here (you are here)

02-Architecture-Patterns/
  01-ProjectStructure.PATTERN.md       ← Read first in folder
  02-ModuleStructure.PATTERN.md
  03-AppDirectory.PATTERN.md
  04-ServerBootstrap.PATTERN.md
  05-DependencyInjection.PATTERN.md
  06-ModuleFileOrganization.PATTERN.md  ← Read last in folder

03-Configuration-Patterns/
  01-EnvironmentVariables.PATTERN.md
  02-ConstantsManagement.PATTERN.md
  03-ZeroHardcoding.PATTERN.md
  04-EnvironmentDeployment.PATTERN.md

04-Import-Export-Patterns/
  01-AbsoluteImports.PATTERN.md
  02-NamespaceExports.PATTERN.md
  03-UnderscoreIndex.PATTERN.md

05-Error-Handling-Patterns/
  01-ErrorClassification.PATTERN.md
  02-ErrorHierarchy.PATTERN.md
  03-ErrorTranslation.PATTERN.md
  04-CentralErrorMiddleware.PATTERN.md
  05-AsyncErrorHandling.PATTERN.md

06-API-Patterns/
  01-ResponseFormat.PATTERN.md
  02-QueryVsMutation.PATTERN.md
  03-RouteFactory.PATTERN.md
  04-ValidationPattern.PATTERN.md
  05-ResponseUtility.PATTERN.md
  06-PaginationPattern.PATTERN.md

07-Data-Access-Patterns/
  01-DAOStructure.PATTERN.md
  02-DAOErrorHandling.PATTERN.md
  03-DatabaseConnection.PATTERN.md

08-Controller-Patterns/
  01-ControllerStructure.PATTERN.md
  02-ControllerErrorHandling.PATTERN.md
  03-BusinessLogicSeparation.PATTERN.md

09-Authentication-Patterns/
  01-AuthPatternSelection.PATTERN.md   ← Read first — confirms which pattern applies before reading further
  02-DeviceBoundRefreshToken.PATTERN.md
  03-HttpOnlyCookieJWT.PATTERN.md

10-Caching-Patterns/
  01-CacheAsideStrategy.PATTERN.md
  02-CacheInvalidation.PATTERN.md
  03-ResponseCaching.PATTERN.md
  04-CacheMonitoring.PATTERN.md

11-Idempotency-Patterns/
  01-IdempotencyKeyMiddleware.PATTERN.md
  02-NaturallyIdempotentEndpoints.PATTERN.md
  03-RateLimiting.PATTERN.md
  04-UniqueConstraints.PATTERN.md

12-Logging-Patterns/
  01-StructuredLogging.PATTERN.md
  02-CorrelationIds.PATTERN.md

13-Observability-Patterns/
  01-AddNowVsLater.PATTERN.md
  02-SentryBetterStackSetup.PATTERN.md
  03-DualDestinationObservability.PATTERN.md

14-Authorization-Patterns/
  01-GateStateComputation.PATTERN.md
  02-ServerSideGateEnforcement.PATTERN.md
```

### Rules for AI Assistants

1. **Always read this INDEX first** before generating any code
2. **Process ALL relevant folders** - do not skip any folder
3. **Process files in numbered order** within each folder
4. **Every pattern is mandatory** - do not ignore or partially apply any guideline
5. **When in conflict** - earlier numbered patterns take priority
6. **When auditing** - check compliance against ALL patterns across ALL folders at once

---

## 🚨 CRITICAL RULES (Read Before Any Code)

1. **Reference Module is Law** - Every operation must follow guidelines documented here
2. **Absolute Imports Only** - Use `@` prefix, never relative imports
3. **Namespace Exports** - Everything exports via `_index.js` as single namespace
4. **Never Destructure in Imports** - Import namespace, then destructure
5. **All Env Vars Through Constants** - Never use `process.env` directly
6. **Zero Hardcoding** - No hardcoded strings, messages, or values anywhere
7. **Error Hierarchy** - Type-based `AppError` subclasses with a required `layer` field — never `ControllerError`/`DAOError`
8. **Try/Catch in Every Layer** - DAO, Controller - translate/classify errors; Routes never catch, they throw or `next(err)`
9. **Response Shape Standard** - `{ status, message, data, code, requestId }` everywhere — five fields, not three

---

## 📐 02 - Architecture Patterns

**Core structural patterns for organizing the backend**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | ProjectStructure | ⭐ Source directory organization |
| 02 | ModuleStructure | Standard module directory layout |
| 03 | AppDirectory | Dependencies, middleware, routes, startup |
| 04 | ServerBootstrap | Bootstrap sequence and orchestration |
| 05 | DependencyInjection | Central DI container pattern |
| 06 | ModuleFileOrganization | ⭐ One file per operation (all layers) |

---

## ⚙️ 03 - Configuration Patterns

**Environment and configuration management**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | EnvironmentVariables | ⭐ All env vars through common.constants.env |
| 02 | ConstantsManagement | Centralized constants structure |
| 03 | ZeroHardcoding | ⭐ No hardcoded strings/messages anywhere |
| 04 | EnvironmentDeployment | ⭐ NODE_ENV stages (development/test/staging/production), fail-fast loader, `${}` references, deploy process |

---

## 📦 04 - Import/Export Patterns

**Module importing and exporting standards**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | AbsoluteImports | ⭐ Always use @ prefix, never relative |
| 02 | NamespaceExports | ⭐ Single namespace export pattern |
| 03 | UnderscoreIndex | ⭐ Use _index.js everywhere |

---

## ⚠️ 05 - Error Handling Patterns

**Error management and flow**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | ErrorClassification | ⭐ isOperational — the decision everything else depends on |
| 02 | ErrorHierarchy | ⭐ AppError + type-based subclasses + the Layer enum — replaces ControllerError/DAOError |
| 03 | ErrorTranslation | Recognition-table pattern for DB/external API errors |
| 04 | CentralErrorMiddleware | ⭐ One middleware owns the response shape — 5 fields now, not 3 |
| 05 | AsyncErrorHandling | Express 4 vs. 5 — the async-handler-hangs-forever bug |

---

## 🌐 06 - API Patterns

**HTTP API design and implementation**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | ResponseFormat | ⭐ Standard `{ status, message, data, code, requestId }` — five fields |
| 02 | QueryVsMutation | Not found handling (query vs mutation) |
| 03 | RouteFactory | Route factory dependency injection |
| 04 | ValidationPattern | DTOs with express-validator |
| 05 | ResponseUtility | ResponseUtils.success/error |
| 06 | PaginationPattern | ⭐ Paginated list response: { items, totalCount, pageSize } |

---

## 💾 07 - Data Access Patterns

**Database access and DAO layer**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | DAOStructure | Standard DAO organization |
| 02 | DAOErrorHandling | Wrapping database errors |
| 03 | DatabaseConnection | Database lifecycle management |

---

## 🎮 08 - Controller Patterns

**Business logic and controller layer**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | ControllerStructure | Controller class organization |
| 02 | ControllerErrorHandling | Error handling in controllers |
| 03 | BusinessLogicSeparation | Separating business logic concerns |

---

## 🔐 09 - Authentication Patterns

**Multiple selectable auth patterns — confirm which one applies before implementing**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | AuthPatternSelection | ⭐ Read first — confirms which pattern applies, never assume |
| 02 | DeviceBoundRefreshToken | WebCrypto-bound rotating refresh token, works cross-site |
| 03 | HttpOnlyCookieJWT | httpOnly cookie refresh token, same-site/same-origin only |

---

## 💰 10 - Caching Patterns

**Avoiding repeated slow work — DB queries, external calls, computation**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | CacheAsideStrategy | ⭐ Core mechanism, always via Redis, never in-memory |
| 02 | CacheInvalidation | Event-driven/write-through, one shared Redis, no Pub/Sub needed |
| 03 | ResponseCaching | CDN/`Cache-Control`, explicit opt-out for user-specific data |
| 04 | CacheMonitoring | Hit ratio, misses, evictions |

---

## 🔁 11 - Idempotency Patterns

**Safe repetition of operations — correctness and volume control**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | IdempotencyKeyMiddleware | ⭐ Atomic Redis SET...NX, mandatory payload-mismatch rejection |
| 02 | NaturallyIdempotentEndpoints | GET/PUT/DELETE — DELETE-already-gone is success, not error |
| 03 | RateLimiting | Redis-backed, independent of idempotency |
| 04 | UniqueConstraints | DB-level last line of defense against races |

---

## 📝 12 - Logging Patterns

**Structured logging, kept behind an adapter, correlated per request**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | StructuredLogging | ⭐ Pino behind a Logger adapter, dual-shipped to stdout + hosted platform |
| 02 | CorrelationIds | ⭐ AsyncLocalStorage reqId/userId, requestId on every response |

---

## 👁️ 13 - Observability Patterns

**Beyond logs — error tracking, uptime, and full dual-destination coverage**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | AddNowVsLater | ⭐ The test: can this catch a problem before a user does |
| 02 | SentryBetterStackSetup | Account setup, zero environment-conditional code |
| 03 | DualDestinationObservability | ObservableLogger — every log call reaches both Sentry and Better Stack |

---

## 🚧 14 - Authorization Patterns

**Non-auth business-rule gating — onboarding, subscriptions, etc. NOT authentication (see 09)**

| # | Pattern | Description |
|---|---------|-------------|
| 01 | GateStateComputation | ⭐ Same requirement-ladder shape the frontend uses, computed authoritatively |
| 02 | ServerSideGateEnforcement | The UI is advisory, this is authority — independently rejects blocked actions |

---

## 🔄 Workflow

### For New Features
1. Read this INDEX
2. Traverse folders 02 → 14 in order
3. Within each folder read files 01 → last in order
4. Apply ALL relevant patterns before writing code

### For Code Reviews
1. Check compliance with all relevant patterns in folder order
2. Verify absolute imports (04-01)
3. Verify namespace exports (04-02)
4. Verify error handling (05-01, 05-02, 05-03)
5. Verify response format (06-01)

### For Audits
1. Use modules/ directory as source of truth for resources
2. Check ALL resources at once (not one-by-one)
3. Verify compliance with EVERY pattern across ALL folders
4. Document violations and remediation plan

---

## 🎯 Priority Order

When in doubt, follow this priority:

1. **04-01 Absolute Imports** - Always use @ prefix
2. **04-02 Namespace Exports** - Single namespace via _index.js
3. **03-01 Environment Variables** - All env through constants
4. **05-01/02 Error Classification + Hierarchy** - `AppError` subclasses, never `ControllerError`/`DAOError`
5. **06-01 Response Format** - Standard `{ status, message, data, code, requestId }`
6. **Remaining patterns** - As applicable

---

## 📝 Adding New Patterns

When adding new patterns:
1. Place file in appropriate category folder
2. Number it sequentially within that folder
3. Update this INDEX.md table for that category
4. Include examples and audit checklist
5. Reference related patterns

---

**Version:** 1.0.0  
**Status:** Active - All code must comply
