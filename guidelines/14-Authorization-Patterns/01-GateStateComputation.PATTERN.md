# Gate State Computation Pattern

## Status
🟡 **REQUIRED** - The backend half of the frontend's access gating pattern

## Purpose
The frontend's `09-Access-Control-Patterns/02-AccessGating.PATTERN.md` computes a named
lock state (`getLock(facts, requires)`) client-side, from facts it
already has, to decide what to blur and which modal to show. The backend
needs the identical computation, from the same facts, so the two sides
can never disagree about what the current state actually is.

**Not authentication.** This is a non-auth business-rule gate — an
onboarding step, a subscription requirement, a verification status —
entirely independent of `09-Authentication-Patterns`.

---

## Universal Pattern

**"The exact same requirement-ladder logic the frontend documents — facts in, one named state out — computed server-side from the authoritative data, exposed via one endpoint the frontend calls to render the correct lock state."**

---

## The Shared Shape, Computed From the Authoritative Source

```js
// modules/merchant-onboarding/controller/gate/getGateState.js
const LADDER = ['setup', 'payouts']; // identical order to the frontend's own LADDER — keep both in sync deliberately

function computeLockState(facts, requires) {
  const requiredIndex = LADDER.indexOf(requires);
  for (let i = 0; i <= requiredIndex; i++) {
    const level = LADDER[i];
    if (!facts[level]) return level; // first failing condition wins — same rule, same order
  }
  return 'none';
}

async function getGateState(merchantId) {
  const merchant = await this.merchantDAO.findById(merchantId);
  const facts = {
    setup: merchant.businessProfileComplete,
    payouts: merchant.payoutAccountVerified,
  };
  return ResponseUtils.success('Gate state retrieved', {
    state: computeLockState(facts, 'payouts'),
  });
}
```

```js
// modules/merchant-onboarding/routes/gate/getGateState.route.js
router.get('/gate-state', asyncHandler(async (req, res) => {
  const result = await controller.getGateState(req.merchantId);
  res.json(result);
}));
```

**Why this lives server-side at all, rather than the frontend simply
computing it from data it already fetched elsewhere:** `facts` here
(`businessProfileComplete`, `payoutAccountVerified`) are often derived
from several underlying fields, sometimes from a third-party's own
status (a payout provider's verification state) — computing this once,
server-side, from the authoritative record, means the frontend never
re-implements that derivation logic and risks it drifting out of sync
with what the backend considers true.

**The ladder order must match the frontend's exactly, deliberately kept
in sync as a known coupling** — not derived automatically from one
shared source in this reference's current shape. If the two ladders ever
diverge, the frontend could show a different lock state than what
`02-ServerSideGateEnforcement.PATTERN.md` actually allows, producing a
confusing experience (blocked by a gate the UI didn't warn about, or the
reverse) even though neither side is, individually, incorrect.

---

## Audit Checklist

- [ ] The ladder order and level names match the frontend's `getLock`
      exactly — checked deliberately whenever either side changes
- [ ] `facts` are derived from the authoritative record, never trusted
      from anything the client sent
- [ ] The endpoint is a Query (`06-API-Patterns/02-QueryVsMutation.PATTERN.md`)
      — computing a gate state never has a side effect

---

## Related Patterns
- [Server-Side Gate Enforcement](./02-ServerSideGateEnforcement.PATTERN.md)
- Frontend: `09-Access-Control-Patterns/02-AccessGating.PATTERN.md` (frontend reference)

---

**Same facts, same ladder, same shape — computed once, authoritatively, server-side.**
