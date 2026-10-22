# Cache Monitoring Pattern

## Status
🟡 **REQUIRED** - Once any cache-aside pattern is live in production

## Purpose
A cache with no visibility into whether it's actually helping is a
liability, not an optimization — track whether it's earning its added
complexity.

---

## Universal Pattern

**"Track hit ratio, misses, and evictions. A low hit ratio or a spike in misses signals a real problem, not noise to ignore."**

---

## Pulling Stats From Redis

```javascript
// adapters/redis/getCacheStats.js
async function getCacheStats() {
  const info = await client.info('stats');
  const stats = Object.fromEntries(
    info.split('\r\n').filter((line) => line.includes(':')).map((line) => line.split(':'))
  );

  const hits = Number(stats.keyspace_hits || 0);
  const misses = Number(stats.keyspace_misses || 0);

  return {
    hits,
    misses,
    hitRatio: hits / (hits + misses || 1),
    evictedKeys: Number(stats.evicted_keys || 0),
  };
}

module.exports = { getCacheStats };
```

**What the numbers mean:**

| Metric | Healthy | A problem looks like |
|---|---|---|
| Hit ratio | Above ~80% | A sustained drop — the cache isn't earning its complexity, or keys aren't being reused as expected |
| Misses | Low, stable | A sudden spike — usually broken invalidation logic, or a TTL set too short for the actual access pattern |
| Evictions | Near zero | A high rate — the cache is undersized (memory-limited) for the current workload, dropping entries before they're reused |

**Expose this through existing observability tooling, not a one-off
script** — feed `getCacheStats()` into whatever this project already
uses (Datadog, Grafana, etc.) rather than polling it manually or
building a bespoke dashboard for it.

---

## Audit Checklist

- [ ] Hit ratio, miss count, and eviction count are all tracked, not
      just one of the three
- [ ] These feed into existing observability tooling — not a standalone,
      manually-checked script
- [ ] A sustained low hit ratio or eviction spike triggers an actual
      investigation, not just a noted-and-ignored metric

---

## Related Patterns
- [Cache-Aside Strategy](./01-CacheAsideStrategy.PATTERN.md)
- [Cache Invalidation](./02-CacheInvalidation.PATTERN.md)

---

**A cache you can't measure is a cache you can't trust.**
