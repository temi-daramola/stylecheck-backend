# Cache-Aside Strategy Pattern

## Status
🟡 **REQUIRED** - Default caching mechanism for read-heavy data

## Purpose
Avoid repeating slow work (DB queries, external API calls, heavy
computation) when nothing has changed since the last identical request.

---

## Universal Pattern

**"Check the cache first. Hit → return immediately, DB never touched. Miss → do the work, save the result, then respond. Redis from day one — not an in-memory Map, even for a single instance."**

**Why Redis always, never in-memory `Map`:** an in-memory cache is lost
on every restart and doesn't work across more than one server instance.
Starting with Redis avoids a later migration and keeps this consistent
with `11-Idempotency-Patterns`, which also needs Redis — one piece of
shared infrastructure serving both concerns, not two separate ad hoc
solutions.

---

## The Mechanism

```javascript
// adapters/redis/index.js
const { createClient } = require('redis');
const client = createClient({ url: env.REDIS_URL });
client.on('error', (err) => console.error('Redis error:', err));

async function connect() {
  await client.connect();
}

module.exports = { client, connect };
```

```javascript
// modules/invoice/controller/invoice/getInvoiceById.js
const { client } = require('@adapters/redis');

async function getInvoiceById(id) {
  const cacheKey = `invoice:${id}`;

  const cached = await client.get(cacheKey);
  if (cached) return ResponseUtils.success('Invoice retrieved', JSON.parse(cached));

  const invoice = await this.invoiceDAO.findById(id);
  if (!invoice) return ResponseUtils.success('Invoice not found', null);

  await client.set(cacheKey, JSON.stringify(invoice), { EX: 300 });
  return ResponseUtils.success('Invoice retrieved', invoice);
}
```

**Cache reads must never break the request if Redis is unreachable** —
wrap the read in try/catch and fall through to the database on failure,
same reasoning as every other layer's error handling in this reference:

```javascript
let cached = null;
try {
  cached = await client.get(cacheKey);
} catch (error) {
  // Redis being down should degrade to "slower," never "broken"
  cached = null;
}
if (cached) return ResponseUtils.success('Invoice retrieved', JSON.parse(cached));
```

---

## Why TTL Is Never Dropped, Even on Resources That Also Invalidate

**TTL's real job isn't "the acceptable staleness window" — it's a
backstop against invalidation bugs.** Event-driven invalidation
(`02-CacheInvalidation.PATTERN.md`) depends on every write path
correctly remembering to call it — a new endpoint that forgets, a
request that throws before reaching that line, a deploy briefly missing
updated invalidation logic for a new field. Without a TTL, a missed
invalidation call leaves a resource **permanently** stale until someone
manually notices. With one, even a missed invalidation call self-heals
within a bounded window.

**This means every cached resource keeps a TTL, including ones that also
have event-driven invalidation wired up** — the two aren't redundant;
invalidation handles the common case quickly, TTL is what catches it
when invalidation itself has a bug.

## Classifying Data — Two Independent Axes, Not One Scale

**Revised from an earlier version of this pattern**, which used a single
frequency scale (rare/moderate/frequent) and assumed stakes rose in
lockstep with it. They don't. *How often something changes* and *how bad
it is to be wrong* are genuinely independent properties — a resource can
land anywhere in the grid below, and assuming a diagonal relationship
between them misclassifies real cases:

- A **finalized, paid invoice** rarely changes again, but showing it as
  unpaid (or the reverse) from a stale cache is a real problem — low
  frequency, high stakes.
- A **feature flag gating checkout** rarely changes, but is arguably
  among the highest-stakes values in the whole system if cached wrong —
  also low frequency, high stakes.
- A **"last seen online" timestamp** changes constantly and matters to
  almost nobody if it's a few seconds off — high frequency, low stakes.

Classify every resource on **both axes**, independently:

| | Low stakes (wrong = harmless) | High stakes (wrong = a real problem) |
|---|---|---|
| **Rare changes** | Long TTL alone (hours+) — product descriptions, static config | Long TTL, but event-driven invalidation is still required — see `02-CacheInvalidation.PATTERN.md` — e.g. a finalized invoice, a feature flag |
| **Moderate changes** | Short TTL, or stale-while-revalidate — dashboard stats, counts | Short TTL **combined with** event-driven invalidation on write — inventory counts, account balances |
| **Frequent changes** | Very short TTL, or skip caching if the overhead isn't worth it — a "last seen" timestamp | **Not cache-aside territory at all — see below** |

**This classification must be made per-resource, explicitly, on both
axes** — never cache a resource without deciding where it sits on each
one, documented as a comment in the resource's own controller file.

### A Fourth Case: When the Right Answer Is to Exit This Pattern Entirely

**Frequent changes + high stakes doesn't have a safe cell in the grid
above — and that's not an oversight, it's the point.** A TTL short
enough to be safe at that intersection (sub-second) defeats the purpose
of caching at all. Genuinely real-time data — a live price feed, a live
typing indicator, anything where even a few seconds of staleness is
unacceptable and the data changes faster than any TTL could safely
tolerate — shouldn't be squeezed into a very-short-TTL bucket. The
correct answer there is usually a push mechanism (WebSockets/SSE)
telling connected clients when something changed, not a cache
the client has to keep re-asking.

---

## The Required Step Before Caching Any Resource

**This classification is not something to decide silently while writing
the code — state it explicitly, every time, the same way
`09-Authentication-Patterns` requires an explicit pattern confirmation
before any auth code.** The shape is different, though: auth pattern
selection happens once per project; a caching classification decision
happens every time a new resource or endpoint gets cached — far too
often for a full stop-and-wait confirmation each time. Instead:

1. **Before writing the caching code for a resource, state where it
   lands on both axes and why** — e.g. "Invoices: moderate change
   frequency while in draft, high stakes once payment is involved →
   short TTL plus event-driven invalidation." This is a proposal, stated
   plainly, not a silent decision baked directly into the code.
2. **If the resource lands in the frequent-changes + high-stakes
   corner**, say so explicitly and recommend exiting cache-aside
   entirely (§ above) — don't quietly pick the least-bad TTL instead.
3. A human confirms or corrects the classification before the caching
   code is treated as final — the stated reasoning is what makes that
   confirmation fast, since there's a concrete claim to agree with or
   correct, rather than an invisible assumption to discover later.

---

## State-Dependent TTL — the Same Resource Can Need Different Treatment at Different Points in Its Life

**A resource's classification on the two axes isn't always fixed for its
whole lifetime — some resources genuinely behave differently depending
on their own current state.** An unpaid, actively-edited invoice and a
paid, finalized invoice are the same resource *type*, but one is
volatile and one is essentially frozen. Treating "the invoice resource"
as one fixed point on the grid, applied uniformly regardless of status,
misses this.

**Important distinction, stated precisely so this isn't overstated:**
this is a refinement to TTL *duration* only — it is NOT a correctness
fix, and invalidation-on-write (`02-CacheInvalidation.PATTERN.md`)
already handles correctness regardless of state, unchanged. The moment
an invoice's status actually flips from unpaid to paid, that's still
just a normal update going through the same controller method that
already clears the cached entry in that same request. The next read
after that transition is already guaranteed correct, with or without
anything in this section.

**What state-dependent TTL actually fixes is efficiency, not safety.** A
single fixed TTL forces a bad tradeoff: short enough to be safe for a
volatile draft means a frozen, paid invoice gets re-fetched from the
database far more often than it ever needs to; long enough to be
efficient for the paid case risks a draft sitting stale slightly longer
than ideal. Making the TTL a function of current state resolves the
tradeoff instead of picking a side:

```javascript
// modules/invoice/controller/invoice/getInvoiceById.js
const { client } = require('@adapters/redis');

function getTtlForInvoice(invoice) {
  // Paid/finalized invoices rarely change again — safe to cache much
  // longer. Draft/unpaid invoices are actively edited — a shorter
  // window keeps a draft from sitting stale longer than necessary,
  // even though invalidation-on-write would already catch a real edit
  // regardless of this number.
  return invoice.status === 'paid' ? 3600 : 300; // 1h vs 5min
}

async function getInvoiceById(id) {
  const cacheKey = `invoice:${id}`;

  const cached = await client.get(cacheKey);
  if (cached) return ResponseUtils.success('Invoice retrieved', JSON.parse(cached));

  const invoice = await this.invoiceDAO.findById(id);
  if (!invoice) return ResponseUtils.success('Invoice not found', null);

  await client.set(cacheKey, JSON.stringify(invoice), { EX: getTtlForInvoice(invoice) });
  return ResponseUtils.success('Invoice retrieved', invoice);
}
```

**This only ever changes the TTL *number* — it never changes whether
invalidation-on-write happens, and never substitutes for it.** A
resource with per-state TTL still follows the exact same invalidation
rules as any other resource in its stakes category.

---

## Audit Checklist

- [ ] Every cached read is wrapped in try/catch — a Redis outage
      degrades to a DB hit, never a broken response
- [ ] Every cache key includes enough identifying information to avoid
      collisions between resources (`invoice:${id}`, not just `${id}`)
- [ ] The resource was classified on BOTH axes (change frequency AND
      cost of being wrong) independently — never assumed to move
      together
- [ ] A resource landing in frequent-changes + high-stakes was
      recognized as a signal to exit cache-aside (push-based instead),
      not squeezed into an unsafe short TTL
- [ ] A TTL is set even on resources that also have event-driven
      invalidation wired up — never dropped as "redundant"
- [ ] The classification (both axes) was stated explicitly, with
      reasoning, before the caching code was treated as final — not
      silently decided and baked directly into the code
- [ ] If a resource behaves differently depending on its own state (e.g.
      draft vs. finalized), that was considered explicitly — either a
      state-dependent TTL, or a stated reason why a single fixed TTL is
      still correct for this resource
- [ ] Redis is used — never a plain in-memory `Map`, even for early-stage
      or single-instance deployments

---

## Related Patterns
- [Cache Invalidation](./02-CacheInvalidation.PATTERN.md)
- [Response Caching](./03-ResponseCaching.PATTERN.md)
- [Idempotency Key Middleware](../11-Idempotency-Patterns/01-IdempotencyKeyMiddleware.PATTERN.md) — shares the same Redis instance
- **Frontend counterpart:** `04-Adapter-Patterns/04-QueryAdapter.PATTERN.md`'s "Caching
  defaults" section (frontend reference) documents the equivalent gap on
  the browser side — this backend's event-driven invalidation has no
  direct frontend analogue, and that section covers the targeted fix
  (`refetchInterval`) using this same two-axis classification to decide
  where it's actually warranted

---

**Do the slow thing once, remember the answer, hand out the remembered answer — always via Redis.**
