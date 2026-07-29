# FINDING-008 — Admin and customer-PII worker routes ship with no authentication

- **Increment:** 8 (raised during CR-008 MCP feasibility mapping, not by that work)
- **Component:** worker (`SOURCE/worker/src/routes/`)
- **Raised by:** Roma (API surface map, 2026-07-28)
- **Severity:** **HIGH** — unauthenticated write access to fleet/safety state and
  unauthenticated read access to customer PII on the public internet.

## Summary

Four route modules are mounted into the worker with **no auth middleware of
their own**, and because of mount order the `backoffice` catch-all guard cannot
rescue them.

`src/index.ts` mounts in this order (all at `/`):

```
63  app.route("/", tourops);
64  app.route("/", pretour);
65  app.route("/", fleet);
66  app.route("/", posttour);
67  app.route("/", backoffice);   <-- backoffice.use("*", operatorGuard) lives here
68  app.route("/", adminLists);
69  app.route("/", toursAdmin);
70  app.route("/", emailRoutes);
```

Hono runs matched handlers in registration order. Anything matched by lines
63–66 responds before the line-67 middleware is ever reached. The guard is a
second layer for `adminLists`/`toursAdmin`/`emailRoutes` only.

## Exposed routes

**`src/routes/fleet.ts` — zero auth imports in the file.**

| Route | Effect if called anonymously |
|---|---|
| `POST /admin/bikes` | add bike to fleet |
| `POST /admin/equipment` | add equipment line item |
| `GET /admin/fleet` | read fleet state |
| `PATCH /admin/bikes/:id/flag` | flag a bike |
| `POST /admin/bikes/:id/maintenance` | log a maintenance event |
| `PATCH /admin/bikes/:id/status` | **return a bike to service** |
| `PATCH /admin/compliance/:id/renew` | **renew a compliance expiry** |

The last two are the serious ones. `PATCH /admin/bikes/:id/status` is the
clear-to-service operation the UI deliberately gates behind
`canClearToService` (≥1 logged maintenance event, UXD-11 / FINDING-003 lineage).
An anonymous caller can log a maintenance event and then clear the bike in two
requests — satisfying the guard's letter while defeating its purpose — putting a
flagged bike back into rider service. `PATCH /admin/compliance/:id/renew` lets an
anonymous caller falsify insurance/compliance expiry dates.

**`src/routes/tourops.ts`** — two `/admin/*` routes sit outside the
`use("/guide/*", requireDeviceAuth)` middleware and are unguarded:
`PATCH /admin/incidents/:id/dispatch` (dispatches an incident to the insurer —
external and irreversible) and `PATCH /admin/hazards/:id`.

**`src/routes/pretour.ts`** — the module's own comments state session middleware
is "assumed" from core-auth but it is not wired. `GET /tour-hub/:bookingId`,
`PATCH /tour-hub/:id/details`, `POST /tour-hub/:id/late`, `POST /notices/:id/ack`,
`POST /notices/:id/remediation` are open. **`GET /tour-hub/:bookingId` returns
booking and participant PII to anyone who can guess or enumerate a booking id** —
including emergency contacts and stated requirements. This is a personal-data
exposure, not merely a missing guard.

**`src/routes/posttour.ts`** — `POST /internal/post-tour/:bookingId/complete` is
named "internal" but is publicly reachable.

## Contributing weaknesses found alongside

1. **No rate limiting anywhere in `src/`**, including `POST /auth/owner/login`,
   which compares against a plain **unsalted SHA-256** password hash
   (`OWNER_PASSWORD_HASH`). Brute-forceable online, and trivially rainbow-tabled
   if the secret ever leaks. Should be a slow salted KDF (scrypt/argon2/bcrypt)
   plus attempt throttling.
2. **`POST /webhooks/postmark` has no signature verification** — Zod shape and a
   D1 idempotency claim only. Postmark is no longer even the transport (DR-18 →
   CHG-008 moved to Resend); the route is live, unauthenticated, and obsolete.
   Anyone can inject deliverability/bounce events.
3. **CORS reflects any `https://*.friendsonbikes.uk` subdomain with
   `credentials: true`.** One compromised or dangling subdomain gets
   credentialed cross-origin access to the whole API.
4. **Two divergent operator guards for one concept.**
   `lib/auth.ts::requireOperatorSession` (used by nearly everything) treats the
   bearer token as an **opaque KV key and never verifies the JWT signature**;
   `modules/auth/middleware.ts::requireOwnerSession` (used only by
   `GET /admin/audit` and `POST /publish`) does verify it. `api-contracts.md`
   documents the verifying behaviour as if it were universal — so the contract
   describes the minority implementation.
5. **Most admin mutations are not audited.** `audit_log` is written from 12
   explicit call sites, not middleware; refunds, transitions, fleet writes and
   template deletes largely do not appear.

## Root cause

Same class as FINDING-001/002: **GATE-P5 verifies builds, tests and functional
coverage, never that a declared guard is actually mounted on the route it
guards.** No test asserts auth on fleet, pretour, posttour, or the two tourops
`/admin/*` routes — the 22 vitest files cover the guarded paths only
(`test/tourops.routes.test.ts` does assert 401/403, but for `/guide/*` only). The
gaps are untested rather than deliberately open, which is why they survived a
gate.

## Recommendation

1. **Immediate:** mount `requireOperatorSession` on `fleet.ts` and the two
   tourops `/admin/*` routes; mount `requireCustomerSession` (booking-scoped, as
   `lib/auth.ts` does for `/bookings/:id`) on `pretour.ts`; guard or delete
   `POST /internal/post-tour/:bookingId/complete`; delete the Postmark webhook.
2. **Structural:** stop relying on per-module discipline. Apply a
   deny-by-default guard to `/admin/*` **before** any sub-app is mounted, and
   have modules opt out explicitly rather than opt in.
3. **Gate:** add an auth-conformance check to P5 — enumerate every route, assert
   each `/admin/*` route returns 401 without a token. This is mechanically
   checkable and would have caught all of it.
4. Converge the two operator guards on the signature-verifying one, then make
   `api-contracts.md` true.
5. Salt+KDF the owner password and rate-limit the login route.

## Bearing on CR-008 (MCP tool)

CR-008 proposes an MCP server driving these APIs. It must not be built on this
surface as it stands, and it must not paper over the gaps by using the
unauthenticated routes because they are convenient. This finding is a
**prerequisite**, not a parallel concern.

## Status

**PARTIALLY REMEDIATED — 2026-07-28 (Roma).** The unauthenticated-access
exposure is closed. Four contributing weaknesses are NOT fixed and remain open;
see below. Not yet gated — this work has not been through GATE-P5.

### Fixed

Recommendation 2 (structural) was taken in preference to recommendation 1
(per-module patching), so protection no longer depends on each module
remembering to opt in:

- `src/index.ts` — deny-by-default middleware mounted **before** any sub-app:
  `/admin/*` and `/internal/*` require an operator session; `/tour-hub/*`
  requires a booking-scoped customer session; `/notices/*` requires a customer
  session **plus** an ownership check.
- `src/lib/notice-auth.ts` (new) — `requireNoticeOwner`. `/notices/:id/*` could
  not use `requireCustomerSession` alone: its `:id` is a notice id, so the
  generic param check would compare a notice id against a booking id and reject
  every legitimate caller. Ownership is resolved by lookup, returning 401 (not
  404) so notice ids cannot be enumerated. This also closes a horizontal-access
  gap the original finding did not name: an authenticated customer could
  otherwise have acknowledged another customer's notice.
- `src/db/client.ts` — added `operatorNotices.getById` to support the above.

### Verified

- **Live, against a running worker.** Before: `GET /admin/fleet` → 200 with no
  credentials; bike-status, compliance-renew, incident-dispatch, tour-hub and
  post-tour-complete all reached their handlers (400/404 responses, not 401).
  After: all 15 → 401. `/health` and `POST /auth/owner/login` still 200, and a
  valid operator token still reads fleet, bookings, departures, email-templates,
  enquiries, tours and compliance (all 200) — no lockout.
- **`test/auth-conformance.test.ts` (new, 23 cases).** Drives the COMPOSED
  worker rather than a sub-app, which is the whole point: every other suite
  imports sub-apps in isolation, where app-level mount order does not exist —
  which is precisely why this defect passed a gate. Confirmed non-vacuous: with
  the guards commented out, 16 of the 23 fail.
- Full suite: 238/238 pass across 23 files. `tsc --noEmit` clean.

### Also fixed — second pass, 2026-07-28

**Item 4 — guard convergence. DONE.** `lib/auth.ts`'s `requireOperatorSession`
and `requireCustomerSession` now verify the JWT signature before the KV lookup,
matching `modules/auth/middleware.ts#resolveSession`. Confirmed additive and
safe first: every `putSession` call site (`routes/auth.ts` owner login,
`routes/auth.ts` customer link, `routes/booking.ts`) mints its token via
`signJwt`, so no legitimate session can fail verification. KV remains
authoritative for expiry/revocation (AUTH04).

The regression this closes: the token was previously an **opaque KV key**, so
any string with a matching KV entry was accepted — a forged token needed no
valid signature. `api-contracts.md` is now true rather than describing the
minority implementation.

**Item 2 — login throttling. DONE.** `lib/rate-limit.ts` (new), applied to
`POST /auth/owner/login`: **10 attempts / 15 minutes / client**, keyed on
`CF-Connecting-IP`, backed by the existing IDEMPOTENCY KV namespace. Checked
*before* any credential work, so a throttled caller learns nothing about
whether the address or password was right. A successful sign-in clears the
budget, so ordinary daily use never accumulates toward a lockout.

Deliberate design notes: it **fails open** if KV is unavailable — a broken
limiter must not lock the Owner out of their own back office — and KV's eventual
consistency means this is a deterrent, not a hard cap. Both are accepted
limitations of the available store, recorded rather than hidden.

**Tests:** `test/auth-hardening.test.ts` (new, 7 cases) covers signature
verification (including the forged-token-with-valid-KV-entry regression and a
wrong-secret token) and throttling (budget exhaustion, correct password also
blocked once throttled, per-client isolation, reset on success). Full suite
245/245 across 24 files; `tsc --noEmit` clean. Verified live: 10 bad attempts
returned 401, the 11th returned 429.

### NOT fixed — still open, each needs a decision

1. **`POST /webhooks/postmark` remains unauthenticated.** Not simply deletable:
   it implements **REQ-NOTIF02** (delivery/bounce/complaint ingestion) and has 7
   test references. Postmark is no longer the transport (CHG-008 → Resend), so
   the route is both unauthenticated *and* listening for a provider that no
   longer calls it — meaning REQ-NOTIF02 is currently **unserved** as well as
   exposed. Deleting it drops a delivered requirement; keeping it leaves an open
   injection point. The real fix is a Resend webhook **with** signature
   verification, which is a change, not a patch.
3. Owner password is still an **unsalted SHA-256** hash. Throttling (item 2)
   reduces the exposure but does not fix it. A salted KDF invalidates the stored
   credential, so it needs a rotation plan.
5. Most admin mutations remain unaudited.

CORS reflection (contributing weakness 3) is unchanged and partly reshaped by
DEV-6 — a native macOS client sends no browser origin, so CORS stops being an
access control for the admin surface regardless.

### Bearing on the gate

Recommendation 3 is now partly satisfied: the auth-conformance check exists and
is mechanically enforceable. It should become a standing P5 check rather than a
one-off, since the defect class is "a declared guard is not actually mounted".
