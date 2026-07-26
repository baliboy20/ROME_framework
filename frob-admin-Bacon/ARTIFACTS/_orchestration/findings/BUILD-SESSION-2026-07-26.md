# Build Session — Customer Site, In-Site Payment Island & Booking-Outcome Confirmations

| | |
|---|---|
| **Date** | 2026-07-26 |
| **Branch** | `emailmodule-merge` |
| **Scope** | Public customer site build-out, integration of the booking + Stripe-payment island into the themed site, payment-flavoured booking-confirmation emails, and supporting admin/worker fixes. Additive to the ratified 84-REQ baseline (→ 85 with REQ-NOTIF11). |
| **Design brief** | `_user_input/... friendsonbikes Website 20Jul` (Track A / parchment: Newsreader + Instrument Sans, green #3f6b3f) |

## Ratified decisions (sponsor, 2026-07-26)
- **Confirmation flavours** — booking confirmation is payment-state-driven: `booking_confirmed_paid` (paid in full), `booking_deposit_received` (partial), `booking_reserved_unpaid` (nothing paid). Selected by `Σ succeeded payments` vs `price_total_pence`.
- **Allocation model** — the `use_case` IS the process key; "allocate a template to a process" = publish it active for that use_case (activate-per-use_case; one-active invariant already enforced). No new binding table.
- **Removal semantics** — archive-by-default (`status:retired`, soft); hard delete only for an unused draft that no `message` references.
- **Test send** — renders the template (draft included) with the process's sample data to the Owner, with an override address.
- **Scope now** — build paid + unpaid flavours (seed active templates); deposit flavour is wired but falls back to plain text until a template is authored (customer web flow charges in full today).
- **Documentation** — full ROME record (this finding + REQ + design + coverage updates).

## Requirements
- **New** `REQ-NOTIF11` — booking-outcome confirmation email (dispatcher, flavour selection, idempotency, fallback; closes the email half of UXC-FBK-1).
- **Amended** `REQ-NOTIF10` — template delete (drafts-only), test-send, allocate-via-activate, per-process merge-field catalogue.
- **Coverage** `84 → 85`; NOTIF10 row extended (DELETE + test-send routes), NOTIF11 row added.

## Design
- `data-dictionary.md` — `email_template_use_case` enum += the 3 flavours; `bookings` note gains the booking-outcome dispatcher path.
- `architecture.md` §4.1 — step 5 gains the reconciliation sweep; step 6 rewritten as the flavoured dispatcher (NOTIF01/11); step 7 records in-site island hosting via `hostElement` + `<base href>`/`entrypointBaseUrl`, Stripe return → `en/book/return/`.

## Build — api-worker
- **`modules/notifications/booking-outcome.ts`** (new) — `sendBookingOutcome()` flavour dispatcher + per-flavour merge-field catalogue (`OUTCOME_FIELDS`) + plain-text fallbacks. Idempotency-keyed `booking-outcome:{id}:{flavour}`.
- Hooked into `lib/stripe.ts` (`fulfilCheckoutSession` now returns the confirmed booking id; `WebhookResult.confirmedBookingId`) and `routes/payments.ts` (webhook + reconcile dispatch).
- `routes/email.ts` — added `DELETE /admin/email-templates/:id` (draft-only, unreferenced) and `POST /admin/email-templates/:id/test-send`; use_case list extended with the 3 flavours.
- `routes/payments.ts` — checkout `customerEmail` prefill made non-fatal (`.catch(undefined)`); `.dev.vars` `ALLOWED_ORIGIN`/`CUSTOMER_APP_URL` repointed to the integrated `/en/book`.
- `routes/backoffice.ts` — payments ledger (A8) now returns `last_payment_at` (transaction date).
- **Migration `0005_booking_outcome_templates.sql`** — seeds `booking_confirmed_paid` + `booking_reserved_unpaid` as active templates.
- **Tests** — `booking-outcome.test.ts` (8). Full suite **170 green**, typecheck clean.

## Build — webapp-customer (static site + islands, TDR-13)
- New parchment pages: `about`, `contact` (live `POST /enquiries`), `faq`, `gift-vouchers`, `saved`, `hub`, `privacy-policy`, `terms-and-conditions`, `cancellation-policy`; `index.html` rebuilt from the home mockup as a static page.
- Cookie-consent banner (`consent.js`), privacy-first, on every page.
- Booking + payment island integrated **into** `en/book/` (themed chrome kept) via `island-loader.js` `hostElement` mount; island rebuilt `--base-href=/en/book/flutter/ --no-tree-shake-icons`; Stripe return → themed `en/book/return/` R1 page. All "Book" links route in-site (standalone `:5174` retired).
- These pages realise existing frontend REQs (WEB/SEO/PRE/TOUR/POST) — content build-out, not new requirements.

## Build — webapp-admin
- Payments ledger (A8) gains a **Date** column (`Payment.lastPaymentAt`).
- Tree nav: groups collapsed by default + expand/collapse-all.
- macOS desktop target scaffolded.
- **Pending (this session):** template-management UI actions (archive / delete / test-send / "use for this process") wiring to the NOTIF10 routes above — in progress.

## Local-dev notes (not defects)
- Stripe webhooks can't reach `localhost`; use `stripe listen --forward-to localhost:8787/webhooks/stripe`, or the **reconcile** endpoint, to confirm paid bookings and fire the confirmation dispatcher. The dev `EMAIL` binding is a stub (records `message`, does not deliver).
- `seed-inbound-emails.dev.sql` currently sits in `migrations/` and is picked up by `wrangler d1 migrations apply` — harmless (idempotent) but ideally relocated out of `migrations/`.

## Open / follow-up
1. Deposit flavour template (`booking_deposit_received`) — author + activate when partial payments enter the customer flow.
2. Admin template-management UI (archive/delete/test-send/allocate) — building next.
3. Relocate the dev seed out of `migrations/`.
