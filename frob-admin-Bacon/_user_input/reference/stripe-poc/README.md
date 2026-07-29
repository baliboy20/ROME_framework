# Stripe Embedded Checkout POC — Friends on Bikes

Proof-of-concept for **Stripe Embedded Checkout** (Checkout Sessions API, `ui_mode: 'embedded'`)
on our stack: Flutter Web + Cloudflare Workers + D1 + Resend. Fulfilment is driven by the
`checkout.session.completed` webhook, never by the browser return page — a customer can pay and
lose their connection before the return page ever loads, and the booking is still confirmed.

All source lives under `SOURCE/`. This is a throwaway POC — **do not deploy to production.**

## Layout

```
SOURCE/
├── worker/   Cloudflare Worker (TypeScript) — API, D1, Stripe, Resend
└── app/      Flutter Web app (BLoC + DDD)
```

## Status — all phases complete

- [x] Phase 1 — scaffold (Worker, D1, Flutter Web app)
- [x] Phase 2 — core payment (P1, P2)
- [x] Phase 3 — webhook + email (P3, S1, S2)
- [x] Phase 4 — admin (P4, P5, S7)
- [x] Phase 5 — hardening (P6, S3, S4, S5, S6)

See `LEARNINGS.md` for the full gotcha log, doc-verification notes, and every live test performed
during the build.

## Setup

> **Local dev needs THREE things running at once**: the Worker (`wrangler dev`), `stripe listen`
> (relays Stripe's webhooks to your machine — without it, payments succeed in the browser but
> stay `pending` in D1 forever and can't be refunded), and the Flutter app. Skipping `stripe
> listen` is the most common way this POC looks broken when it isn't — see `LEARNINGS.md`
> "Phase 7" for exactly this failure mode and its fix (`POST /api/admin/reconcile` backfills
> anything already paid while the listener was down).

### Worker

```sh
cd SOURCE/worker
npm install
cp .dev.vars.example .dev.vars    # already done in this checkout; fill in real test-mode keys
npm run db:migrate:local           # already applied
npm run db:migrate:remote          # already applied
npm run dev                        # http://localhost:8788
```

In a second terminal, keep this running the whole time you're testing payments:

```sh
stripe listen --api-key <your sk_test_...> --forward-to localhost:8788/api/webhook
```

Secrets required in `.dev.vars` (local) and via `wrangler secret put <NAME>` (deployed):

| Name | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe test-mode secret key (must start `sk_test_` while `STRIPE_MODE=test` — the Worker refuses to serve requests if these disagree) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from `stripe listen` (local) or the dashboard webhook endpoint (deployed) |
| `RESEND_API_KEY` | Resend API key for confirmation emails |
| `ADMIN_API_KEY` | Static header value guarding `/api/admin/*` routes |

`wrangler.toml` vars (not secret): `STRIPE_MODE` (`test`/`live`), `ALLOWED_ORIGIN` (CORS lockdown,
`http://localhost:5173` for local dev), `RESEND_FROM_EMAIL`.

### Flutter Web app

```sh
cd SOURCE/app
flutter pub get
flutter run -d chrome --web-port=5173 \
  --dart-define=API_BASE_URL=http://localhost:8788 \
  --dart-define=STRIPE_PUBLISHABLE_KEY=pk_test_xxx \
  --dart-define=ADMIN_API_KEY=<same value as the Worker's ADMIN_API_KEY>
```

Routes: `/` — payment screen (fixed £25.00 test amount, editable `reference`, defaults to
`booking-poc-001`); `/return` — post-checkout status page; `/admin` — payments list + refunds
(linked from the payment screen's app bar).

## Architecture

Flutter Web (Cloudflare Pages) → Cloudflare Worker (API) → Stripe + D1; Worker → Resend on success.

- **Domain-Driven Design**: `domain/{payment,admin}` hold entities/value objects and repository
  interfaces; `application/{payment,admin}` hold BLoCs; `infrastructure/{payment,admin}`
  implement the repositories against the Worker API; `presentation` holds screens/widgets.
- **Flutter Web + Embedded Checkout interop**: `flutter_stripe` targets mobile only and has no
  Embedded Checkout support. `SOURCE/app/lib/presentation/stripe_embedded_checkout_interop.dart`
  loads Stripe.js and uses `dart:js_interop` (via `package:web`) to call
  `stripe.createEmbeddedCheckoutPage(...)`, mounting into a DOM container via `HtmlElementView`.
  The Worker still creates its Checkout Session with `ui_mode: 'embedded'`
  (`SOURCE/worker/src/routes/checkoutSession.ts`) — only the client-side JS method name changed.
  Two separate Stripe docs pages both described the older `stripe.initEmbeddedCheckout(...)`
  method as current; live browser testing showed Stripe has actually removed it in favour of
  `createEmbeddedCheckoutPage`. See `LEARNINGS.md` for the full account — docs alone weren't
  enough here, it took an actual browser run to catch it.
- **CSP / Stripe domains**: a future Cloudflare Pages `_headers` file must allow `js.stripe.com`,
  `checkout.stripe.com`, and `api.stripe.com` (noted in `SOURCE/app/web/index.html`).

## Exercising every operation

Run the Worker locally first (`npm run dev`, from `SOURCE/worker`) unless noted otherwise.

### P1 — customer pays an agreed amount

1. Run the Flutter app (see Setup) and open `/`.
2. Enter/keep the default reference, click Pay.
3. The embedded Checkout form mounts inline. Use a test card from the panel below the form
   (visible only when `Env.isTestMode`, i.e. `STRIPE_MODE=test`) — e.g. `4242 4242 4242 4242`,
   any future expiry, any 3-digit CVC.
4. Payment completes in the embedded form itself (no redirect away from the page).

### P2 — success/failure feedback to the UI

After paying, Stripe's `return_url` sends the browser to `/return?session_id={id}`. That screen
calls `GET /api/session-status?session_id=...` (polls every ~2s, a few retries) and shows
Paid/Failed/"still processing" — **for UI only**; it never drives fulfilment.

```sh
curl "http://localhost:8788/api/session-status?session_id=cs_test_..."
# {"status":"complete","payment_status":"paid"}
```

### P3 — downstream trigger on success (webhook → email)

1. In one terminal: `wrangler dev` running (`npm run dev`).
2. In another: `stripe listen --api-key <your sk_test_...> --forward-to localhost:8788/api/webhook`
   — copy the printed `whsec_...` into `.dev.vars` as `STRIPE_WEBHOOK_SECRET`, restart `wrangler
   dev`.
3. In a third: `stripe trigger checkout.session.completed --api-key <your sk_test_...>`.
4. Confirm the Worker log shows `POST /api/webhook 200 OK` and (if the fixture's fake email is a
   real Resend-allowed test address) a confirmation email is sent. Real cards paid through the
   embedded form (P1) carry a genuine `customer_details.email` and will actually receive mail.

### S1 — idempotency keys on session creation

Send the same `Idempotency-Key` header twice — the second call returns the *same* Stripe session,
not a new one:

```sh
curl -X POST http://localhost:8788/api/checkout-session \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-key-1' \
  -d '{"amount":1000,"reference":"idem-test"}'
# repeat the exact same command — sessionId in the response is identical both times
```

### S2 — webhook event log in D1

Every received event (whatever its type) is recorded, deduped by Stripe event id:

```sh
cd SOURCE/worker
npx wrangler d1 execute poc-embedded-checkout-fob --local \
  --command "SELECT event_id, type, processing_status FROM webhook_events ORDER BY processed_at DESC LIMIT 10"
```

Replaying the identical signed payload/signature twice returns `{"received":true}` then
`{"received":true,"deduped":true}` on the second delivery.

### P4 — admin queries payments

Open `/admin` in the Flutter app, or directly:

```sh
curl -H "X-Admin-Key: <ADMIN_API_KEY>" http://localhost:8788/api/admin/payments
```

Cross-check any `session_id` against the Stripe Dashboard (test mode) or
`stripe checkout sessions retrieve <id> --api-key <sk_test_...>`.

### P5 — refunds (full and partial)

From `/admin`, click "Refund" on a `succeeded` (or `partially_refunded`) row, choose full or a
partial amount in pounds. Or directly:

```sh
# partial
curl -X POST http://localhost:8788/api/admin/refund \
  -H "X-Admin-Key: <ADMIN_API_KEY>" -H 'Content-Type: application/json' \
  -d '{"session_id":"cs_test_...","amount":1000}'

# full (omit "amount")
curl -X POST http://localhost:8788/api/admin/refund \
  -H "X-Admin-Key: <ADMIN_API_KEY>" -H 'Content-Type: application/json' \
  -d '{"session_id":"cs_test_..."}'
```

`payments.refund_amount_pence` reflects the *cumulative* refunded total (Stripe's
`charge.amount_refunded`, not just the latest refund call) and `status` moves to
`partially_refunded` then `refunded`. A refund attempt on an already-fully-refunded payment
returns `400` before ever calling Stripe.

### P6 — security alerts

- **Repeated declines**: ≥3 declined checkouts for the same email/reference within 5 minutes logs
  `[SECURITY ALERT] N declined payments for "..." ...` to the Worker console. Reproduce with the
  `4000 0000 0000 0002` (generic decline) test card three times in a row, or by replaying signed
  `checkout.session.async_payment_failed` events (see `LEARNINGS.md` Phase 5 for the exact
  technique using `Stripe.webhooks.generateTestHeaderString`).
- **Disputes**: any `charge.dispute.created` event logs `[SECURITY ALERT] Dispute opened: ...`.
  Reproduce with `stripe trigger charge.dispute.created --api-key <sk_test_...>` while `stripe
  listen` is forwarding to the Worker.

### S3 — reconciliation for missed webhooks

```sh
curl -X POST http://localhost:8788/api/admin/reconcile -H "X-Admin-Key: <ADMIN_API_KEY>"
# {"checked":N,"repaired":[...],"stillPending":[...],"errors":[]}
```

Sweeps every `pending` row, re-checks each session directly against Stripe, and repairs
`complete`+`paid` → `succeeded` or `expired` → `failed` — covers a webhook that was never
delivered.

### S4 — test/live toggle via env

`STRIPE_MODE` (in `wrangler.toml`) gates the Flutter test-card panel (never shown when not
`test`) **and** is enforced server-side: the Worker rejects every `/api/*` call (except
`/api/health`) with a `500` if `STRIPE_MODE=test` but the secret key starts with `sk_live_` (or
vice versa) — a deliberate safety net against silently taking real payments while the UI still
says "test".

### S5 — rate limiting on payment endpoints

`POST /api/checkout-session` allows 5 requests/minute/IP; a 6th within the window gets `429`.
In-memory per Worker isolate — a POC-level limiter, not durable across isolates/deploys (see
`LEARNINGS.md`).

```sh
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8788/api/checkout-session \
    -H 'Content-Type: application/json' -H 'Origin: http://localhost:5173' \
    -d '{"amount":100,"reference":"rl-test"}'
done
# 200 200 200 200 200 429
```

### S6 — CORS lockdown

```sh
# wrong origin -> 403 (server-side check, not just the response header)
curl -w "\n%{http_code}\n" -X POST http://localhost:8788/api/checkout-session \
  -H 'Content-Type: application/json' -H 'Origin: https://evil.example.com' \
  -d '{"amount":500,"reference":"cors-test"}'
```

### S7 — admin route guard

```sh
curl -w "\n%{http_code}\n" http://localhost:8788/api/admin/payments        # 401, no header
curl -w "\n%{http_code}\n" -H "X-Admin-Key: <ADMIN_API_KEY>" \
  http://localhost:8788/api/admin/payments                                 # 200
```

### Signature-failure rejection (webhook security)

```sh
curl -w "\n%{http_code}\n" -X POST http://localhost:8788/api/webhook \
  -H 'Stripe-Signature: t=123,v1=bogus' -H 'Content-Type: application/json' \
  -d '{"id":"evt_fake","type":"checkout.session.completed"}'
# {"error":"Invalid signature"} / 400
```

### Test-mode card reference panel

Shown on the payment screen only when `STRIPE_MODE=test`. Current cards (verified against
`docs.stripe.com/testing` — see `LEARNINGS.md` for the fetch date):

| Scenario | Card number |
|---|---|
| Success | `4242 4242 4242 4242` |
| 3D Secure required | `4000 0027 6000 3184` |
| Generic decline | `4000 0000 0000 0002` |
| Insufficient funds | `4000 0000 0000 9995` |
| Expired card | `4000 0000 0000 0069` |
| Incorrect CVC | `4000 0000 0000 0127` |
| Charged then disputed (fraudulent) | `4000 0000 0000 0259` |

All accept any future expiry and any 3-digit CVC.

## Live deployment (Cloudflare)

Deployed for real-platform verification, under the `williampaulton@yahoo.co.uk` Cloudflare
account, using the platform's own default domains (no custom DNS/subdomain — kept fully
reversible: `wrangler delete` / deleting the Pages project removes everything cleanly):

- **Frontend**: https://stripe-embedded-checkout-poc.pages.dev
- **API**: https://poc-embedded-checkout-fob-worker.williampaulton.workers.dev
- A real Stripe webhook endpoint is registered (Dashboard → Developers → Webhooks) pointing at
  the deployed Worker's `/api/webhook` — fulfilment works live without needing `stripe listen`.

Verified live: session creation, CORS origin enforcement (wrong origin → 403), and a real Stripe
webhook delivery landing in the deployed Worker's remote D1 (`webhook_events` table).

**Redeploying**: `wrangler.toml`'s `ALLOWED_ORIGIN` is a single shared var (no `[env.production]`
split in this POC) — it's checked into the repo set to the *local dev* value. Before running
`wrangler deploy` again, change it to `https://stripe-embedded-checkout-poc.pages.dev`, deploy,
then change it back for local `wrangler dev`. See `LEARNINGS.md` for why this project doesn't
use a proper environment split.

## Deploying (optional — this POC was verified entirely via local `wrangler dev`)

```sh
cd SOURCE/worker
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET   # from a dashboard-registered webhook endpoint, not `stripe listen`
wrangler secret put RESEND_API_KEY
wrangler secret put ADMIN_API_KEY
npm run deploy
```

Update `ALLOWED_ORIGIN` in `wrangler.toml` to the deployed Flutter Pages origin before deploying,
and register a webhook endpoint in the Stripe Dashboard pointing at
`https://<worker>.workers.dev/api/webhook` to get a real `STRIPE_WEBHOOK_SECRET`.

## Out of scope

Production auth/accounts, product catalogue/cart, subscriptions, multi-currency, tax, native
mobile. Flutter Web only. This is a throwaway POC — do not deploy to production.
