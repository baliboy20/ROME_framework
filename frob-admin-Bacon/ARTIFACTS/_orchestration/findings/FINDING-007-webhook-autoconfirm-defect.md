# FINDING-007 — DEFECT: Stripe webhook does not auto-confirm bookings

| | |
|---|---|
| **Date** | 2026-07-27 |
| **Author** | Hume (ROME run) |
| **Severity** | High — core money path (REQ-BOOK05) |
| **Status** | RESOLVED (CHG-011, 2026-07-28) |
| **Env observed** | production (`api.friendsonbikes.uk`, test Stripe, account "Reena biker") |
| **Workaround** | `POST /admin/payments/reconcile` flips Draft → Confirmed and fires the confirmation email |

## Symptom
A paid booking stays **`draft`** (payment `pending`) after checkout. It only becomes `confirmed` when the reconciliation sweep is run manually. Confirmed via bookings `y77` (6eadea83) and `rrr rrr` (8c746c8a): both paid in Stripe, both stuck Draft until reconcile.

## Evidence
- Stripe: the payments **Succeeded** (£45, descriptor REENA BIKER).
- Stripe events API: `checkout.session.completed` events have **`pending_webhooks: 0`** — i.e. Stripe delivered to `api.friendsonbikes.uk/webhooks/stripe` and received a **2xx**.
- Yet the booking's `status` remained `draft` and no `booking-outcome` message was written until reconcile.
- `POST /admin/payments/reconcile` then confirms the booking and sends the email — so the fulfil logic itself works; the webhook path does not trigger it.

## Conclusion
Not a delivery or signature problem (Stripe got a 200). The defect is inside the webhook handler path (`src/lib/stripe.ts::handleStripeWebhook` → `fulfilCheckoutSession`): it returns 2xx without confirming. Suspected areas, in order:
1. `claimIdempotencyKey(event.id)` returning false (dedupe) on first delivery — event id already present in `webhook_events`.
2. `fulfilCheckoutSession`: `getBySessionId(session.id)` not matching the payments row at webhook time.
3. `session.payment_status !== "paid"` at delivery (async capture) — less likely; reconcile saw it paid.

## Scope / REQ
- REQ-BOOK05 (fulfilment on `checkout.session.completed` only), TDR-05 (idempotency), TDR-06.
- Related: REQ-NOTIF11 (booking-outcome email) — works once the booking confirms.

## Repro
1. Book via `dev.book.friendsonbikes.uk/en/book/?tour=hidden-city`, pay test card.
2. Stripe shows Succeeded; admin A19 shows the booking **Draft**.
3. Run reconcile → booking **Confirmed** + email sent.

## Next (to fix)
Add temporary tracing to `handleStripeWebhook` (log: signature ok, claim result, event.type, payment_status, getBySessionId hit), deploy, watch `wrangler tail --env production` during one booking, pinpoint the early-return, fix, remove tracing. ~1 trace cycle.

## Notes surfaced this session (context)
- `0002_tours.sql` FK fix (guides seeded before departures) — remote D1 enforces FK.
- `seed-inbound-emails.dev.sql` moved out of `migrations/`.
- Checkout now persists customer email to the lead booker (else REQ-NOTIF11 had no recipient).
- prod `ALLOWED_ORIGIN` set to the booking-site base so the Stripe return hits the confirmation page.


## Resolution — CHG-011 (2026-07-28, GATE-P5 APPROVE)

Dual root cause:
1. **Config (the demonstrated production cause):** the Stripe webhook endpoint for
   `api.friendsonbikes.uk` was subscribed ONLY to `checkout.session.async_payment_succeeded`
   — `checkout.session.completed` was never dispatched to it at all. The finding's
   `pending_webhooks: 0` read was a misinterpretation: nothing was pending because
   nothing was subscribed. Fixed: endpoint now subscribes to completed/async
   succeeded/async failed/expired; a staging endpoint (api-staging) was created with
   the same events and its signing secret stored as the staging worker's
   STRIPE_WEBHOOK_SECRET.
2. **Code (latent, test-proven):** `handleStripeWebhook` claimed the event
   idempotency key BEFORE fulfilment with no release on failure — a failed
   fulfilment permanently claimed the event id, so Stripe redeliveries deduped to
   2xx no-ops. Fixed: claim released on fulfilment failure + 500 returned so Stripe
   redelivers; outcome-email failure after successful fulfilment no longer 500s.
   Regression suite test/webhook-flow.test.ts (fail-then-redeliver fails pre-fix,
   passes post-fix; duplicate-after-success still deduped; tampered signature 400).

Deployed: staging afff0d09, production 73613c8b. Reconcile sweep retained as belt-and-braces.
