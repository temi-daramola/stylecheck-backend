# Server-Side Gate Enforcement Pattern

## Status
🔴 **CRITICAL** - The UI is advisory, this is authority

## Purpose
The frontend's blur is a visual affordance only — nothing about it stops
a request from reaching an endpoint it shouldn't. Every action the
frontend's gate blocks visually must be independently re-checked and
rejected here, regardless of what the frontend currently renders.

---

## Universal Pattern

**"Middleware re-computes the same lock state the frontend shows, independently, from the authoritative record — and rejects the request outright if the gate isn't satisfied. Never trust that the frontend wouldn't have let the user get here."**

---

## The Middleware

```js
// middleware/requireGateState.js
const { computeLockState } = require('@modules/merchant-onboarding/controller/gate/getGateState');

function requireGateState(requires) {
  return async (req, res, next) => {
    const merchant = await req.app.locals.merchantDAO.findById(req.merchantId);
    const facts = {
      setup: merchant.businessProfileComplete,
      payouts: merchant.payoutAccountVerified,
    };
    const state = computeLockState(facts, requires);

    if (state !== 'none') {
      throw new AppError(`This action requires completing: ${state}`, {
        statusCode: 403,
        code: 'GATE_NOT_SATISFIED',
        isOperational: true,
        layer: Layer.AUTH,
      });
    }
    next();
  };
}

module.exports = { requireGateState };
```

```js
// modules/orders/routes/order/createOrder.route.js
router.post('/orders', requireGateState('payouts'), asyncHandler(async (req, res) => {
  const result = await controller.createOrder(req.merchantId, req.body);
  res.status(201).json(result);
}));
```

**Applied to every mutating endpoint the gate is meant to block** — not
just the ones a careful reviewer happens to remember. A new endpoint
added later under a gated feature needs this middleware added
deliberately; it is never inherited automatically just because the
frontend route happens to sit inside a `GatedLayout` group.

**Why this can't be skipped even though the frontend already blurs the
page:** the blur assumes the request actually came from that blurred
page, in that browser, having gone through that component tree. None of
that is true for a direct API call, a replayed request, or simply
opening dev tools and calling the endpoint directly — the frontend
component tree offers no protection at all against any of these. This
middleware is what makes the gate actually real, independent of how the
request arrived.

**This reuses the exact same `computeLockState` function
`01-GateStateComputation.PATTERN.md` defines** — not a second,
separately-written check. Two independent implementations of "is the
gate satisfied" are themselves a way for the two to quietly drift apart
over time; one function, called from both the state-reporting endpoint
and this enforcement middleware, can't disagree with itself.

---

## Audit Checklist

- [ ] Every mutating endpoint inside a gated frontend route group has
      `requireGateState(...)` applied — checked deliberately, never
      assumed inherited from the frontend's route structure
- [ ] The middleware calls the SAME `computeLockState` function the
      state-reporting endpoint uses — never a second, separately
      hand-rolled check
- [ ] A rejected request returns `403` with `GATE_NOT_SATISFIED`, through
      the standard `AppError`/central-error-middleware path — never a
      bespoke response shape
- [ ] This was verified against a direct API call (e.g. via curl/Postman,
      bypassing the frontend entirely) — not just tested through the UI,
      where the blur could mask a missing server-side check

---

## Related Patterns
- [Gate State Computation](./01-GateStateComputation.PATTERN.md)
- [Central Error Middleware](../05-Error-Handling-Patterns/04-CentralErrorMiddleware.PATTERN.md)
- Frontend: `09-Access-Control-Patterns/02-AccessGating.PATTERN.md` (frontend reference)

---

**The frontend blurs the page. This is what actually stops the request. Never assume the first implies the second.**
