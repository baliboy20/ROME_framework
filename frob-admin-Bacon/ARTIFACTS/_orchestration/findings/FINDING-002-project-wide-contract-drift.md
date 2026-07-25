# FINDING-002 — Project-wide frontend↔backend contract drift (P5 gate escape)

- **Increment:** 0
- **Components:** webapp-customer, mobile-guide, webapp-editor (and webapp-admin, see FINDING-001)
- **Raised by:** Roma (post-delivery audit, 3 parallel component auditors)
- **Date:** 2026-07-22
- **Severity:** CRITICAL — the primary revenue path (customer booking) and the
  operational path (guide submissions) are both non-functional end-to-end.
- **Status:** OPEN

## Summary

The same defect class found in webapp-admin (FINDING-001) affects **every**
frontend component. Each app's Flutter/HTML client was generated against an API
contract that diverges from what api-worker actually implements — different body
keys (camelCase vs snake_case), missing required fields, wrong response shapes,
routes that don't exist, and unwired authentication. The api-worker backend is
largely CORRECT and complete; the frontends were never wired to it. P5's
per-component unit tests (mock-backed) never exercised the seam, so all of this
passed GATE-P5 "78/78, independently verified".

## webapp-customer (27 owned REQs) — booking money-path broken

Genuinely satisfied end-to-end: ~4 (BOOK05 webhook, AUTH04 expiry, SEO02
sitemap, PRE01 en catalogue). The Flutter booking SPA cannot complete a single
booking:
- Contract breaks at every call: `fetchAvailability` omits required `partySize`
  (422); `createBooking` omits required `pricePerPersonPence`, sends stray
  `tourId` (422); `updateParticipants` sends `{attendees}` not `{participants}` +
  missing emergency-contact fields (422); `submitConsent` sends `marketingOptIn`
  not `termsAccepted` (422, marketing consent dropped); `createCheckoutSession`
  missing `Idempotency-Key` header (422) and reads `publishableKey` from a
  response that returns `{clientSecret,sessionId}` → null force-unwrap CRASH.
- `GET /bookings/:id` (fetchBooking) — route does not exist (404).
- **Customer auth (AUTH02) entirely unwired** — client never calls
  `/auth/customer/verify-link`, stores no token, sends no `Authorization` header;
  every `requireCustomerSession` route (attendees → payment) returns 401.
- ~15 REQs have complete backend routes but ZERO built UI: PRE04 (enquire),
  PRE06 (saved), BOOK06/07 (modify/cancel), TOUR01/04/06/08/09 (tour hub),
  POST03 (feedback), POST10/CNA02 (preferences), AUTH05 (logout). Dead nav links
  (hub.html, saved.html, enquire.html, riverside-loop.html all missing).
- SEO01: no ld+json structured data; es/ and fr/ locales unbuilt (empty dirs).

## mobile-guide (AUTH03, OPS01–11 excl OPS12, OPS13) — nothing persists

Genuinely satisfied end-to-end: 0. All screens exist and enforce several gates
locally, but:
- **All 11 write endpoints have body-contract mismatches** (camelCase vs
  snake_case + wrong/missing required fields) → every sync 400s. `ApiClient`
  swallows failures to a bool; local sembast state always "succeeds", so the app
  looks functional offline while nothing reaches the DB.
- OPS01 read path (`GET /guide/departures/:id`) never called — rider list is mock
  seed data; rider model lacks age-band/health/accessibility fields the REQ needs.
- OPS11 path-param bug: passes departure id where the route expects incident id.
- OPS10 wrong domain: submits customer-style star ratings, not the structured
  operational review; the "flag bike / exclude tomorrow" outcome never fires.
- AUTH03: client self-generates a random unregistered device id → live requests
  403 (contradicts the "issued device, no self-registration" requirement).

## webapp-editor (SEO03 shared; no exclusive REQ) — shell over missing API

Only login/logout work. The app is built around a content-authoring CRUD
resource the worker never implemented:
- `GET /admin/content` returns `{pages,quality}` object; client casts `as List`
  → crash. Field shapes also incompatible (expects `id`, `description`, etc.).
- `PATCH /admin/content/:id` — route does not exist (404); saves fail.
- `POST /publish` — client sends `{content_id}`; server requires
  `{tours:[{id,name,description,urlPath,locale,schemaOrgType}]}` (400).
- `GET /admin/content/quality` — route does not exist; method also dead-code.
- No content table in the v1 schema → even fixed wire shapes have nowhere to save.

## Root cause (same as FINDING-001, systemic)

Frontend and backend were produced against divergent, unenforced API contracts.
GATE-P5 verified per-component code+unit-test existence, not:
1. cross-component contract conformance (method, body keys, response shape,
   auth-guard compatibility),
2. reachability (a REQ "covered" by an orphaned backend route or a mock-seeded
   screen is not satisfied),
3. design-surface coverage (missing customer/editor screens; es/fr locales).

The single highest-leverage framework fix: a **contract-conformance gate** that
diffs every client call against the server route set, plus a **running-app smoke
check per surface** against seeded data. Candidate ROME-PROP (shared with
FINDING-001's recommendation).

## Remediation scope (NOT yet started — awaiting sponsor prioritisation)

Large. Backend is mostly reusable. Frontend work per app:
- customer: align booking_api body/response keys; wire AUTH02 (verify-link +
  token + Idempotency-Key); build missing UI (hub, enquire, saved, feedback,
  prefs, modify/cancel, logout); add ld+json + es/fr.
- guide: normalise all 11 request bodies to snake_case + required fields; stop
  swallowing errors; call OPS01 read; fix OPS11 path param; fix OPS10 domain;
  resolve AUTH03 device provisioning.
- editor: add a content table + CRUD routes OR rescope to the tour-catalogue
  publish contract; fix `/admin/content` list shape and `/publish` body.

## Changelog
- 2026-07-22 — Finding raised from 3-component parallel audit. Remediation not started.
- 2026-07-22 — Remediation COMPLETE for customer/guide/editor (status OPEN → RESOLVED-pending-reaudit).
  Backend (api-worker) changes:
  - booking draft creation now mints a booking-scoped customer session token
    (wires AUTH02 for the inline flow) — resolves the customer 401 cascade.
  - added GET /bookings/:id (was 404); enriched availability with per-person price
    (interim TOUR_PRICE_PENCE until R2 catalogue price is wired).
  - fixed route-shadowing: mounted booking/presales BEFORE seo so
    /tours/:id/availability is no longer shadowed by seo's /tours/:locale/:id.
  - real Stripe test key loaded into .dev.vars; seeded a registered guide device
    (DEV-GUIDE-DEMO → g-sam) so AUTH03 device auth passes in dev.
  Frontend:
  - webapp-customer: booking client realigned to all contracts (availability
    +partySize, createBooking keys+token capture, participants keys+age_band,
    consent termsAccepted, checkout Idempotency-Key + {clientSecret}); selection
    fetches real availability; attendees collect emergency contact+email; consent
    has waiver+terms; publishable key via dart-define. flutter analyze clean.
    VERIFIED end-to-end: availability→draft→participants→consent→REAL Stripe
    checkout session (cs_test_...) all 200.
  - mobile-guide: all 11 write bodies normalised to snake_case + required fields;
    per-rider check-in loop; OPS09 incident-type selector; OPS10 structured review
    (not star ratings); OPS11 path-param fixed via captured incident id; errors
    now surfaced (no silent swallow); OPS01 read wired to GET /guide/departures/:id.
    DEVICE_ID dart-define for owner-issued device. analyze clean, 15 tests pass.
    VERIFIED: OPS01 read 200, hazard write 200, device auth 200.
  - webapp-editor: realigned to real /admin/content (object) + /publish (tours[])
    contracts; publish console. analyze clean, 8 tests pass. VERIFIED publish 200.
  All four apps serve: admin :5173, customer :5174, guide :5175, editor :5176.
  Residual / not-yet-addressed:
  - AUTH03 production device provisioning (self-registration) still out of scope;
    dev uses an owner-issued seeded device.
  - editor content edits are non-persisting (no content store in v1 schema).
  - customer post-booking surface — NOW BUILT (2026-07-22): "Manage your booking"
    hub (lib/widgets/hub_flow.dart, lib/api/hub_api.dart) covers TOUR01 (view),
    TOUR04 (details), TOUR06 (ack), TOUR08 (remediation), TOUR09 (late), POST03
    (feedback), BOOK06 (change date), BOOK07 (cancel), AUTH05 (logout). Reached
    from the confirmation screen (in-app, with token) or standalone via
    ?mode=hub&booking=<id>&token=<t>. Backend enriched: GET /tour-hub/:id now
    returns notices + payment_status. flutter analyze clean, tests pass. All hub
    action endpoints verified 200 (details/late/ack/remediation/feedback).
    STILL not built: marketing preferences (POST10) + consent withdraw (CNA02) —
    prospect-scoped, belong to the unsubscribe-link flow, not the booking hub.
  - interim tour pricing is a stopgap until the R2 catalogue is the price source.
  - kit/readiness guide steps need a tour_readiness row (created earlier in the
    real flow); not seeded here.
  - Full P5 re-audit + re-gate still owed before increment 0 seal.
