# Add Now vs. Later Pattern

## Status
🟡 **REQUIRED** - The decision framework before adding any observability tool

## Purpose
Logs tell you what happened in one place at a time. Several things
typically sit on top of a logging setup, but they don't all deserve the
same timeline — decide using one consistent test, not by bucketing
everything under "observability" as equally deferrable.

---

## Universal Pattern

**"The test: can this tell you about a problem before a user does, given you're the only one watching? Run each candidate through this test honestly — don't default to 'add it now' out of enthusiasm, or 'defer it' out of inertia."**

---

## Add Now: Error Tracking (Sentry)

Fills a gap log-based alerting genuinely cannot close. Alerting on
`isOperational:false` counts (`05-Error-Handling-Patterns/
01-ErrorClassification.PATTERN.md`) only fires for failures already
classified that way. An error tracker's entire job is catching the ones
*not* anticipated — any unhandled exception, automatically grouped by
stack signature, with zero per-error-type configuration. "This exact bug
fired 400 times today" shows up as one item, not 400 identical log
lines someone has to notice.

## Add Now: Uptime Monitoring

Closes the one hole every logging-based alert structurally has: **if the
process crashes, hangs, or the server goes down entirely, it stops
producing logs — there's nothing left to alert on.** Every alert in
`12-Logging-Patterns` depends on the app being alive enough to log its
own failure; a total outage isn't a log line, it's silence, and silence
doesn't trigger anything on its own. Something *external* pinging the
app on a schedule is the only thing that closes this.

## Waits: Metrics Dashboards

Full metrics infrastructure (latency percentiles, request-rate-over-time
graphs) answers "is performance trending worse over months" or "do I
need to scale this" — a capacity-planning question, not a "something is
broken right now" question. It doesn't serve the same need as the two
tools above, so it's legitimately deferred, not just deprioritized for
convenience. Worth it once there's real traffic and scaling decisions are
actually being made, not before.

## Waits: Distributed Tracing (OpenTelemetry)

Extends a correlation ID across service boundaries, solving "which of
several services is slow or failing." **A single-service monolith has no
version of "find out before a user does" that this addresses**, because
the problem it exists to solve — a request's path being unclear across
multiple systems — doesn't exist yet. Not "not now because it's extra
setup" — "not applicable yet because the failure mode it targets can't
occur in this architecture."

---

## Why the Framing Matters

None of these four replace `05-Error-Handling-Patterns` or
`12-Logging-Patterns` — they're built on top of a system already
throwing typed errors and logging them once, structurally, with a
request ID attached. Two of them belong in the same "do this now" bucket
as structured logging itself; the other two are deferred because the
problems they solve genuinely don't exist yet, not because they're
lower-priority versions of the same problem.

---

## Audit Checklist

- [ ] Error tracking (Sentry or equivalent) is live, not deferred
- [ ] An external uptime check exists, pointed at a real health endpoint
      (not just "the server responded")
- [ ] Metrics dashboards and distributed tracing are explicitly deferred
      with a stated reason — not silently absent with no decision made
- [ ] Any new observability tool proposed in the future is run through
      the same "before a user does, given you're the only one watching"
      test before being added

---

## Related Patterns
- [Sentry & Better Stack Setup](./02-SentryBetterStackSetup.PATTERN.md)
- [Structured Logging](../12-Logging-Patterns/01-StructuredLogging.PATTERN.md)

---

**One test, applied honestly: does this tell you about a problem before a user does?**
