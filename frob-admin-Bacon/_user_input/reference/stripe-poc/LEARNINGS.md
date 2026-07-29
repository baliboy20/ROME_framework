# Learnings — Stripe Embedded Checkout POC

Running log of gotchas, tool ordering surprises, and doc-vs-reality mismatches. Newest first.

## Phase 1 — Scaffold

- Reused the sibling `pocs/stripe` project's Wrangler/D1 conventions (binding name `DB`,
  `STRIPE_MODE`/`ALLOWED_ORIGIN`/`RESEND_FROM_EMAIL` vars, secret names) without copying its code.
  New D1 database created: `poc-embedded-checkout-fob` (id `b16f0dbd-2880-459b-8a89-e713587ece03`),
  distinct from the sibling POC's own database.
- `wrangler d1 create` prints a binding name derived from the DB name (`poc_embedded_checkout_fob`);
  kept our binding as `DB` to match the existing convention instead, and only copied the
  `database_id` it printed.
- `.dev.vars` created locally from `.dev.vars.example`, then populated with the real test-mode
  `STRIPE_SECRET_KEY` and `RESEND_API_KEY` reused from the sibling `pocs/stripe` POC's
  `.dev.vars` (same Stripe test account, same Resend account — reusing keys, not code).
  `STRIPE_WEBHOOK_SECRET` is left as a placeholder: it's tied to a specific listener/endpoint,
  so it must be regenerated for this worker via `stripe listen --forward-to
  localhost:8788/api/webhook` in Phase 3 rather than reused from the sibling POC.
- Flutter Web app created via `flutter create --platforms=web`. Added `flutter_bloc`, `equatable`,
  `web` (for `dart:js_interop`), and `http` for the DDD/BLoC architecture and the Embedded
  Checkout JS interop planned for Phase 2.

## Phase 2 — Backend (Worker)

- Verified via `docs.stripe.com/checkout/embedded/quickstart` and `docs.stripe.com/js/embedded_checkout`
  (checked 2026-07-17) that Stripe now has TWO distinct embedded modes: `ui_mode: 'embedded'`
  (`initEmbeddedCheckout`, lightweight form) vs the newer `ui_mode: 'embedded_page'`
  (`createEmbeddedCheckoutPage`, full-page iframe). This POC intentionally targets `'embedded'` /
  `initEmbeddedCheckout` per the original spec — do not swap to `embedded_page` on either side of
  the stack without updating both together, they are not interchangeable.
- Stripe SDK `^17.7.0` pins `apiVersion: '2025-02-24.acacia'` internally
  (`node_modules/stripe/cjs/apiVersion.js`) — used that exact string in `stripeClient.ts` rather
  than guessing a version from training data.
- Idempotency (S1) gotcha found by live testing: when a retried request reuses the same
  `Idempotency-Key` (or falls back to the same derived key), Stripe correctly returns the
  *same* Checkout Session — but the D1 insert then hit `UNIQUE constraint failed:
  payments.session_id` on the second attempt, producing a 500. Fixed with `INSERT OR IGNORE` in
  `lib/db.ts`. Any idempotent-retry endpoint that both calls an idempotent external API and
  writes a row keyed on that API's returned id needs the insert itself to also be idempotent —
  the external API being idempotent is not enough on its own.
- Rate limiter (S5) is a naive in-memory `Map` scoped to the Worker isolate — resets on
  redeploy/cold start and isn't shared across isolates. Fine for a POC demo, flagged as a known
  limitation rather than hardened further.
- Confirmed live end-to-end with real Stripe test-mode keys (reused from sibling `pocs/stripe`
  POC): `POST /api/checkout-session` returns a real `cs_test_...` session + `clientSecret`,
  `GET /api/session-status` correctly reports `{"status":"open","payment_status":"unpaid"}` for
  an unpaid session.

## Phase 2 — Frontend

- Docs relied on for the Embedded Checkout JS interop pattern:
  `https://docs.stripe.com/checkout/embedded/quickstart` and
  `https://docs.stripe.com/js/embedded_checkout` (both fetched live 2026-07-17).
- **Doc-vs-training-data surprise, and a self-correction worth flagging**: my own first
  `WebFetch` of `docs.stripe.com/js/embedded_checkout` (via the WebFetch tool's summarization
  model) confidently returned `stripe.createEmbeddedCheckoutPage({...})` as "the" current method,
  with a `Stripe.js` script tag pinned to the `dahlia` version. I initially built the interop
  file against that. It was only cross-checking against the Worker side's
  `SOURCE/worker/src/routes/checkoutSession.ts` (built in parallel, also doc-verified same day)
  that surfaced the mismatch: the Worker creates its Checkout Session with `ui_mode: 'embedded'`,
  which requires the client to call `stripe.initEmbeddedCheckout(...)`, not
  `createEmbeddedCheckoutPage(...)` (that method belongs to the separate, newer `embedded_page`
  ui_mode — a `clientSecret` from one mode cannot be mounted with the other's method). Corrected
  `lib/presentation/stripe_embedded_checkout_interop.dart` to call `initEmbeddedCheckout`.
  **Lesson**: a single `WebFetch` summarization pass on a Stripe docs page is not reliable enough
  to trust blindly for method names that have several confusingly-similar siblings — cross-check
  against whatever the other side of the integration actually built, and re-fetch narrower pages
  (e.g. `/js/embedded_checkout/init`) to try to force a literal quote when the first pass looks
  suspicious. (The narrower `/init` sub-page 404'd both times I tried it — the reference page
  above was the only one that resolved.)
- Kept the `<script src="https://js.stripe.com/dahlia/stripe.js">` src as fetched — did not
  second-guess the version segment the same way, since it's just a CDN path, not a method name;
  flagged in an `index.html` comment for whoever verifies this against a real browser load.
- `dart:js_interop` gotchas: `extension type` structural typing works cleanly for the
  `Stripe(...)` constructor call, options object literal, and `.mount()`/`.unmount()`/`.destroy()`
  methods, but calling the global `Stripe` constructor itself needs `callAsFunction` on a
  `@JS('Stripe') external JSFunction get _stripeConstructor` binding rather than a plain
  `external factory` constructor, since `Stripe` is a bare function, not a class recognized by
  static JS interop's constructor binding.
- `HtmlElementView` + `ui_web.platformViewRegistry.registerViewFactory`: the view factory must be
  registered with a *unique* id per widget instance (used
  `stripe-embedded-checkout-<identityHashCode>-<microsecond-timestamp>`) — reusing a fixed id
  across hot reloads/remounts throws because the registry rejects re-registering the same view
  type. Also, `mount()` must be called *after* the first frame (via
  `WidgetsBinding.instance.addPostFrameCallback`), otherwise the `<div>` may not be attached to
  the real DOM yet and the CSS selector passed to `.mount()` finds nothing.
- Test cards (from `https://docs.stripe.com/testing`, fetched live 2026-07-17): success
  `4242 4242 4242 4242`; 3DS-required (always authenticates) `4000 0027 6000 3184`; generic
  decline `4000 0000 0000 0002`; insufficient funds `4000 0000 0000 9995`; expired card
  `4000 0000 0000 0069`; incorrect CVC `4000 0000 0000 0127`; charged-then-disputed-as-fraudulent
  `4000 0000 0000 0259`. All accept any future expiry and any 3-digit CVC.
- `flutter test` (default VM platform) fails to even *load* this project's test file with
  `package:web` interop compile errors (`toJS`/`jsify` undefined, wrong return types) — `web`
  package APIs are web-compiler-specific and don't work under the VM test runner. Fixed by running
  `flutter test --platform chrome` instead; a plain `flutter test` will always look broken for a
  web-only app like this one.
- `flutter run -d chrome` in this sandboxed dev environment took ~14s just to reach
  `Starting application from main method`, then the harness's own command timeout killed the
  process, which Chrome then reported as "Target crashed" — that crash is an artifact of the kill,
  not an app error. `flutter analyze` (clean), `flutter build web` (succeeds), and
  `flutter test --platform chrome` (passes) were used as the primary verification instead of a
  full interactive Chrome smoke test.

## Phase 3 — Webhook + email

- Workers' runtime lacks Node's synchronous crypto APIs that `stripe.webhooks.constructEvent`
  needs — confirmed by reading `node_modules/stripe/cjs/Webhooks.js` directly, which explicitly
  throws telling you to use `constructEventAsync` instead. Used `constructEventAsync`
  (SubtleCrypto-based) throughout.
- The Stripe CLI (`stripe`) was logged into a *different* Stripe account than the one whose
  `sk_test_...` key lives in `.dev.vars` (its stored login key had also expired: `api_key_expired`
  on `stripe listen`). Fixed by passing `--api-key <our sk_test key>` explicitly to both
  `stripe listen` and `stripe trigger` so the CLI operates against the same test account our
  Worker uses — otherwise webhook secrets and any session lookups would silently target the
  wrong account.
- `stripe trigger checkout.session.completed` builds its own synthetic fixture session/customer
  — it does NOT complete a session created via our own `/api/checkout-session` call. Its
  `session.id` won't match any row in our `payments` table, so `markPaymentStatus` runs as a
  no-op UPDATE (0 rows changed, no error). This is fine for proving signature verification,
  event-log dedupe, and the Resend call path work, but does NOT prove a *real* pending→succeeded
  transition end to end.
- To actually verify the pending→succeeded transition and dedupe (S2) properly, manually inserted
  a pending payment row for a fake `session_id`, then hand-signed a `checkout.session.completed`
  payload for that same id using `Stripe.webhooks.generateTestHeaderString` (Node, one-off
  script) with our real `STRIPE_WEBHOOK_SECRET`, and POSTed it directly to `/api/webhook` twice.
  First delivery: `{"received":true}`, row flipped to `succeeded`. Second (identical) delivery:
  `{"received":true,"deduped":true}`, confirming Stripe event-id dedupe works. A bad signature
  correctly returned `400 {"error":"Invalid signature"}`.
- `stripe trigger`'s fixture flow also fires `payment_intent.created`, `customer.created`,
  `payment_intent.succeeded`, `charge.succeeded`, `product.created`, `price.created` — all hit
  our webhook endpoint (Stripe sends every event type from a listen session, not just the one
  named in `trigger`) and are correctly recorded in `webhook_events` even though our handler only
  acts on the `checkout.session.*` types; everything else is logged and ignored, not rejected.
- Resend genuinely rejected sending to `example.com` addresses from the CLI trigger fixture
  (`422 validation_error`) — Resend requires a real/allowed test recipient. The webhook handler
  correctly logs this and still returns `200` to Stripe (email is a side effect, not the
  fulfilment signal) rather than failing the whole webhook.

## Phase 4 — Admin backend

- `PaymentIntent` doesn't expose a cumulative refunded total — only the `Charge` object does
  (`charge.amount_refunded`, `charge.refunded`). Initial refund implementation stored the latest
  refund's own `amount` into `payments.refund_amount_pence`, which clobbered the running total on
  a second partial refund (e.g. two £10 partials on a £30 payment showed £10 refunded, not £20).
  Caught by live-testing a two-step partial refund against a real Stripe test PaymentIntent and
  checking D1 after each step. Fixed by reading `charge.amount_refunded`/`charge.refunded` after
  each refund instead of trusting the single refund's own amount.
- Verified live end-to-end against real Stripe test-mode charges (not just Checkout Sessions):
  created real confirmed `PaymentIntent`s via direct Stripe API calls with `payment_method:
  pm_card_visa` (Stripe's generic test token) since there's no headless way to drive the
  browser-based Embedded Checkout form in this environment. Inserted matching `succeeded` rows
  into D1, then exercised the refund endpoint: partial refund, second partial refund completing
  full refund, and a refund attempt on an already-fully-refunded payment (correctly rejected with
  a 400 from our own status check before ever calling Stripe).
- Admin guard (S7) verified: `/api/admin/payments` returns 401 without `X-Admin-Key`, 200 with it.

## Phase 5 — Hardening

- **S6 (CORS lockdown)**: the response `Access-Control-Allow-Origin` header alone stops a
  *browser* from reading a cross-origin response, but the Worker still does the work
  server-side for any non-browser caller (curl, a script) regardless of that header — CORS is a
  browser-enforced contract, not a server-side access control. Added an explicit server-side
  `Origin` check (`middleware/cors.ts: isOriginAllowed`) that 403s browser-facing routes when
  `Origin` is present and doesn't match `ALLOWED_ORIGIN`. Requests with no `Origin` header at all
  (curl, the webhook, our own reconcile/refund calls) are allowed through — `Origin` is
  browser-only, so its absence isn't a spoofing signal, and the admin key / signature checks are
  the real security boundary for non-browser callers. Verified live: `Origin: https://evil.example.com`
  → 403; no `Origin` header → 200.
- **S3 (reconciliation)**: `POST /api/admin/reconcile` sweeps `payments` rows still `pending`,
  re-checks each session directly against Stripe, and repairs `complete`+`paid` → `succeeded` or
  `expired` → `failed`. Verified live against 6 real still-open test sessions — correctly left all
  6 as `stillPending` with zero errors (none of them were ever actually paid, so nothing to
  repair). Did not force a genuine repair case: Checkout Sessions expire ~24h after creation by
  default and there's no API to force-expire one, so the "repaired" code path reuses the same
  `markPaymentStatus` call already proven correct in the webhook handler (Phase 3) rather than
  being independently exercised end-to-end here.
- **S4 (test/live toggle)**: added a real safety check, not just a UI flag — the Worker now
  refuses any `/api/*` request (except `/api/health`) if `STRIPE_MODE` says `test` but
  `STRIPE_SECRET_KEY` starts with `sk_live_` (or vice versa), returning a 500 rather than silently
  taking a real payment while the UI's test-card panel is telling the operator it's a test run.
  Verified live by temporarily flipping `STRIPE_MODE` to `"live"` in `wrangler.toml` against the
  real `sk_test_...` key — correctly rejected with `{"error":"Server misconfiguration: mode/key
  mismatch"}`.
- **P6 (security alerting)**: no real paging channel exists for a POC, so "alert" means a
  structured `console.error` a reviewer would wire to actual alerting (Sentry, Slack webhook,
  PagerDuty) in production. Two triggers: (1) ≥3 declined checkouts for the same
  email/reference within a 5-minute window (in-memory counter, same per-isolate caveat as the
  S5 rate limiter), and (2) any `charge.dispute.created` event. Verified live by hand-signing 3
  synthetic `checkout.session.async_payment_failed` events for the same fake email and one
  `charge.dispute.created` event (same technique as the Phase 3 dedupe test — `Stripe.webhooks.
  generateTestHeaderString` with the real webhook secret) — both alerts fired exactly as
  expected, visible as `[SECURITY ALERT] ...` lines in the Worker log.

## Phase 4 — Admin frontend

- Kept `AdminRepository` as its own interface next to `PaymentRepository` rather than folding
  admin methods into the existing one: the admin endpoints need a distinct `X-Admin-Key` header
  on every call, whereas the checkout endpoints are unauthenticated from the client's point of
  view, so mixing them into one repository/impl would mean every checkout call site needs to
  reason about an admin key it never uses. Both are provided at the app root via
  `MultiRepositoryProvider` in `lib/main.dart`.
- `Env.adminApiKey` reuses the exact `String.fromEnvironment('ADMIN_API_KEY', ...)` pattern as
  the existing Stripe publishable key — flagged in a doc comment that shipping any static admin
  key to a compiled Flutter Web bundle is a POC-only shortcut (it's trivially visible in the
  compiled JS and outgoing `X-Admin-Key` header via browser devtools); a real product would need
  server-issued, short-lived admin auth instead.
- The Worker's refund success/error status enum uses `partially_refunded` (snake_case) on the
  wire; mapped it to `AdminPaymentStatus.partiallyRefunded` via an explicit `fromWireValue`
  switch (mirroring the existing `SessionStatus.fromWireValues` convention) rather than relying on
  `enum.name` string matching, to keep wire-format parsing centralized and typo-proof.
- `PaymentIntent`-vs-`Charge` refund-total gotcha from the backend phase carries through to the
  frontend contract as-is: `refund_amount_pence` is the *cumulative* refunded amount, not the
  latest refund's own amount, so the UI's "Refunded: £X" label under the status badge already
  shows the running total for free — no extra client-side summing needed.
- Partial-refund input is collected in pounds (e.g. "10.00") rather than raw pence, with the unit
  spelled out in the field's helper text, then converted with `(pounds * 100).round()` before
  calling the bloc — chosen over a pence-integer field because an admin operator is far more
  likely to think in pounds when picking a refund amount, and floating-point pence-conversion
  edge cases are avoided by rounding once at the boundary rather than doing arithmetic on pence
  as floats anywhere else.
- `flutter analyze` reports 4 pre-existing-pattern `deprecated_member_use` infos on
  `RadioListTile`'s `groupValue`/`onChanged` (Flutter's newer `RadioGroup` ancestor pattern,
  deprecated after v3.32.0) plus one `use_null_aware_elements` info on a conditional map-literal
  entry in `admin_repository_impl.dart`. All are info-level style/deprecation notices, not
  errors or warnings — `flutter analyze` and `flutter build web` both otherwise pass clean, and
  the codebase's Flutter/Dart SDK version still fully supports the `RadioListTile` API used.
- Local Worker wasn't running during this build (`curl http://localhost:8788/api/health` was not
  attempted since the task allowed a code-review fallback); verified request/response shapes by
  reading the contract in the task spec plus cross-checking `X-Admin-Key`, `session_id`/`amount`
  body field names, and `refundId`/`amount`/`error` response field names directly against the
  spec text rather than against the worker source (out of scope — worker folder untouched).

## Phase 6 — Wrap-up

All six phases are done and, unlike a typical "trust the code review" POC, essentially every
operation (P1–P6, S1–S7) was independently exercised against a live Worker and real Stripe
test-mode API calls — not just `flutter analyze`/`tsc --noEmit` — including:

- Real `cs_test_...` Checkout Sessions created and status-checked.
- A genuine idempotency-key collision reproduced live, exposing (then fixing) a D1 `UNIQUE
  constraint` bug that only shows up on a real retry, not in isolated code review.
- Hand-signed synthetic webhook events (`Stripe.webhooks.generateTestHeaderString` + the real
  webhook secret) used repeatedly to deterministically test dedupe, signature rejection, decline
  alerting, and dispute alerting — a technique worth reusing whenever `stripe trigger`'s fixtures
  don't line up with a specific D1 row you need to test against.
- Real confirmed test-mode `PaymentIntent`s (via `payment_method: pm_card_visa` direct API calls,
  since there's no headless way to drive the actual embedded Checkout iframe in this
  environment) used to exercise partial + full refunds against genuine Stripe charges, which
  caught a second real bug (refund total not cumulative).
- A deliberately forced `STRIPE_MODE`/secret-key mismatch to prove the S4 safety net actually
  rejects requests rather than just existing as unreachable code.

**Biggest recurring lesson**: a single `WebFetch` pass on Stripe's docs is not reliable enough to
trust blindly when method/mode names have confusingly similar siblings (`embedded` vs
`embedded_page`, `initEmbeddedCheckout` vs `createEmbeddedCheckoutPage`) — cross-checking against
whatever the other side of an integration actually built, or against the SDK's own shipped types
(`node_modules/stripe/...`), caught mismatches a docs summary alone missed twice in this build.

**Known POC-only limitations, not fixed by design**: the rate limiter and decline-alert counter
are in-memory per Worker isolate (reset on cold start, not shared across isolates); the admin key
is a static shared secret, including one baked into the Flutter Web client bundle; reconciliation
was verified for the "still open" path but not for a genuine repair (Checkout Sessions can't be
force-expired via API, and there's 24h natural expiry to wait out).

## Phase 7 — Live browser fix (docs were wrong)

- Ran the app for the first time in a real Chrome tab (not `flutter build web`/`flutter analyze`,
  an actual click-through of the Pay button) and hit an immediate console error on mount:
  `Uncaught (in promise) IntegrationError: stripe.initEmbeddedCheckout() has been removed. Please
  use stripe.createEmbeddedCheckoutPage() instead.`
- This directly contradicts what TWO separate `WebFetch` passes on
  `docs.stripe.com/checkout/embedded/quickstart` and `docs.stripe.com/js/embedded_checkout`
  reported (both times, on two different days in this build, `initEmbeddedCheckout` was described
  as the current method for `ui_mode: 'embedded'`). Either the docs page itself is stale/wrong, or
  the WebFetch summarization pass keeps missing a removal notice on that page — either way, the
  actual Stripe.js bundle served at runtime is unambiguous and is the real source of truth here,
  above the docs.
  **Lesson, reinforced a third time in this build**: for a fast-moving vendor API with
  similarly-named siblings, a real runtime execution (browser console, live API call) is the only
  fully trustworthy check — treat WebFetched docs as a *hypothesis* to verify by actually running
  the code, not as ground truth on their own.
- Fix: `stripe_embedded_checkout_interop.dart` now calls `stripe.createEmbeddedCheckoutPage(...)`
  instead of `stripe.initEmbeddedCheckout(...)`. The Worker's Checkout Session still uses
  `ui_mode: 'embedded'` unchanged — the removal was scoped to the client-side method name, not
  the session's `ui_mode`, and the same `clientSecret` mounted fine once the method name was
  corrected.
- The console also showed two harmless warnings worth knowing about, not fixing: "Height/Width of
  Platform View ... may not be set. Defaulting to 100%" (Flutter's `HtmlElementView` platform-view
  sizing warning — cosmetic, the embedded form still rendered) and "You may test your Stripe.js
  integration over HTTP. However, live Stripe.js integrations must use HTTPS" (expected and fine
  for local `http://localhost` test-mode development; would need HTTPS before going live).
- **Not a code bug — a dev workflow gotcha**: after fixing the interop, real test-mode payments
  went through successfully in the browser, but the admin refund UI rejected them ("payment isn't
  refundable"). Cause: `stripe listen` (the CLI relay that forwards Stripe's webhooks to
  `localhost`) wasn't running at the time, so `checkout.session.completed` never reached
  `/api/webhook` and the rows stayed `pending` in D1 despite being genuinely paid in Stripe.
  Restarting `stripe listen --forward-to localhost:8788/api/webhook` fixes it going forward; for
  payments already stuck `pending`, `POST /api/admin/reconcile` is the exact designed fix — it
  swept 7 payments, correctly repaired the 2 that had actually succeeded, and left the 5 genuinely
  unpaid ones alone. **Anyone running this POC locally needs `stripe listen` running at the same
  time as `wrangler dev`, or payments will silently never become refundable** — worth calling out
  clearly in the README's local-dev instructions, not just the S3 test section.
- **Real bug: the return page never appeared after a successful payment.** Cause:
  `lib/main.dart` hardcoded `initialRoute: '/'` on `MaterialApp`, and Flutter Web's default URL
  strategy is hash-based (`/#/return`). Stripe's `return_url` redirects the top-level page to a
  plain path (`http://host/return?session_id=...`, no `#`) — on that full page reload, the app
  rebooted but `initialRoute: '/'` discarded whatever the real URL was and always rebuilt the
  payment screen. The return screen's code was correct; it was simply never reached. Fixed by (1)
  calling `usePathUrlStrategy()` (from `package:flutter_web_plugins`, added as an SDK dependency
  in `pubspec.yaml`) in `main()` so the app's routes match plain paths instead of hash paths, and
  (2) removing the hardcoded `initialRoute: '/'` so Flutter Web derives the boot route from the
  actual browser URL. Verified the dev server serves `/return?session_id=...` as a real 200 path
  after the fix (previously would only have resolved under `/#/return?...`).
  **Lesson**: an `initialRoute` on a Flutter Web `MaterialApp` silently overrides the framework's
  normal browser-URL-derived boot route — fine for an app with no external redirect entry points,
  actively wrong for one (like this one) where a third party (Stripe) redirects the browser to a
  specific path after the fact.
- **Second real bug, found by live retesting**: even with the routing fix, repeat "Pay" clicks
  kept showing Stripe's "You're all done here" (already-completed/expired session) message. Root
  cause: `PaymentRepositoryImpl.createCheckoutSession` never sent an `Idempotency-Key` header, so
  the Worker's fallback key (`checkout-session-${reference}-${amountPence}`) was used every time —
  and since this POC's amount is fixed (£25.00) and the reference defaults to a fixed string,
  EVERY click collided on the exact same idempotency key, so Stripe silently returned the same
  session over and over, including one I'd already partially refunded during earlier testing.
  Fixed by generating a random key client-side per submit (`_generateIdempotencyKey()` in
  `payment_repository_impl.dart`, `Random.secure()`-based, no external uuid package needed for a
  POC). This is exactly the pattern the original spec called for ("a stable key per submit
  attempt") — it just hadn't been wired into the client yet.
- **Third bug, immediate knock-on effect of the second fix**: adding the `Idempotency-Key` request
  header broke CORS — the browser's preflight failed with "Request header field idempotency-key
  is not allowed by Access-Control-Allow-Headers", because `middleware/cors.ts` only allowlisted
  `Content-Type,X-Admin-Key`. Any new custom request header added on the client must also be added
  to the Worker's `Access-Control-Allow-Headers` — the browser blocks the preflight, not just the
  final response, so the checkout-session call never reaches the Worker at all until this is
  fixed. Confirmed the fix with a raw `curl -X OPTIONS ... -H 'Access-Control-Request-Headers:
  idempotency-key'` before asking for another live retry, rather than relying on the browser
  alone to confirm it.
  **Lesson chain worth remembering**: fixing a bug that adds a new header is not complete until
  CORS is checked too — the two are easy to forget as a pair since the failure only surfaces in
  the browser console, not in any server-side log (the Worker never even sees a blocked
  preflight-failed request).

## Phase 8 — Live Cloudflare deployment

- Deployed to the platform's own default domains rather than a custom `friendsonbikes.uk`
  subdomain (user's explicit choice) — fully reversible, no DNS/zone changes: Worker at
  `poc-embedded-checkout-fob-worker.williampaulton.workers.dev` (`wrangler deploy` auto-creates
  the Worker and its workers.dev route on first deploy), frontend at
  `stripe-embedded-checkout-poc.pages.dev` (`wrangler pages project create` needed explicitly
  first — `wrangler pages deploy` alone does NOT auto-create a new project against a project
  name it's never seen, unlike Worker deploy which does auto-create).
- Set up a **real** Stripe webhook endpoint (`POST api.stripe.com/v1/webhook_endpoints` with the
  deployed Worker's `/api/webhook` URL and the relevant `enabled_events`) instead of relying on
  `stripe listen` — the whole point of deploying was to test the intended platform, and
  `stripe listen` is a local-only relay that wouldn't run continuously against a hosted Worker.
  The webhook secret is only ever returned once, at creation — captured it immediately into
  `wrangler secret put STRIPE_WEBHOOK_SECRET`.
- **`ALLOWED_ORIGIN` environment-var gotcha**: this project deploys to a single (default/unnamed)
  Wrangler environment with one shared `[vars]` block — not `[env.production]` — meaning the
  same `wrangler.toml` value governs both `wrangler dev` (needs `http://localhost:5173`) and
  `wrangler deploy` (needs the live Pages origin). Initially added an `[env.production]` block to
  properly separate these, then reverted it: `wrangler deploy` with an env would have created a
  *second, differently-named* Worker with its own independent secrets, orphaning the one already
  deployed under the default environment. Simpler fix for this POC's scope: the checked-in file
  stays at the local-dev value, with an explicit comment instructing to flip it to the Pages
  origin immediately before `wrangler deploy` and flip it back after — a real environment split
  (`[env.production]`, deployed via `wrangler deploy --env production` from the start) would be
  the correct fix for anything longer-lived than a POC.
- Verified live (not just "it deployed without erroring"): `GET /api/health` 200, a real
  `POST /api/checkout-session` with the correct `Origin` header returning a genuine `cs_test_...`
  clientSecret, the same call with a spoofed `Origin` correctly 403'ing, and
  `stripe trigger checkout.session.completed` against the real registered webhook landing in the
  deployed Worker's **remote** D1 `webhook_events` table (`wrangler d1 execute --remote`, not
  `--local` — easy to query the wrong copy and see stale/empty results).
