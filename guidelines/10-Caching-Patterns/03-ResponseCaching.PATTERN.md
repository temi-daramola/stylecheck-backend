# Response Caching Pattern (CDN / `Cache-Control`)

## Status
🟡 **REQUIRED** - Public, high-traffic, non-user-specific responses only

## Purpose
For responses that are the same for every caller (public product
catalogs, public blog content, static assets), let a CDN or browser
serve the cached response directly — many requests never reach this
backend at all.

---

## Universal Pattern

**"Public and non-user-specific → Cache-Control headers so a CDN can serve it directly. User-specific or sensitive → explicit opt-out, never cached at a shared layer."**

---

## Public, Cacheable Responses

```javascript
// modules/catalog/controller/product/getProducts.js
async function getProducts() {
  const products = await this.productDAO.findAll();
  // handled in the route layer — see below — not the controller, since
  // Cache-Control is a response-header concern, not business logic
  return ResponseUtils.success('Products retrieved', products);
}
```

```javascript
// modules/catalog/routes/product/getProducts.route.js
router.get('/products', async (req, res) => {
  const result = await controller.getProducts();
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  res.json(result);
});
```

`stale-while-revalidate=60` tells the CDN/browser: serve the cached copy
instantly even up to 60 seconds past its `max-age`, while quietly
refetching a fresh one in the background — no caller ever waits on a
slow request, even right at the edge of expiry.

Static assets, content-hashed at build time:

```javascript
app.use('/static', express.static('public', { maxAge: '1y', immutable: true }));
```

---

## User-Specific / Sensitive — Explicit Opt-Out, Not Just "Don't Add Headers"

```javascript
router.get('/user/profile', requireAuth, async (req, res) => {
  const result = await controller.getProfile(req.user.id);
  res.set('Cache-Control', 'private, no-store'); // explicit, not merely absent
  res.json(result);
});
```

**State this explicitly on every user-specific route, don't rely on the
absence of a header to mean "not cached"** — an explicit `private,
no-store` is unambiguous to every CDN/proxy in the chain; a missing
header can be interpreted differently by different intermediaries.

---

## Audit Checklist

- [ ] Every public, non-user-specific GET route sets `Cache-Control`
      explicitly — not left to default behavior
- [ ] Every user-specific or sensitive route sets `private, no-store`
      explicitly — never just omits the header
- [ ] Static assets are served with long `max-age` + `immutable`, backed
      by content-hashed filenames
- [ ] This CDN-layer caching is never relied on as a substitute for
      `01-CacheAsideStrategy.PATTERN.md`'s Redis layer — they solve
      different problems (edge delivery vs. server-side work avoidance)

---

## Related Patterns
- [Cache-Aside Strategy](./01-CacheAsideStrategy.PATTERN.md)

---

**Public and shared → let the edge serve it. User-specific → say so explicitly, every time.**
