# FOB — API Contracts (P3 Design)

| | |
|---|---|
| **Author** | PMA, dispatch `pma-P3` · **Status** PROPOSED |
| **Surface** | Single Cloudflare Worker `api-worker` (Hono + Zod), one origin on `friendsonbikes.uk` |
| **Binds** | TDR-06 (Stripe), TDR-07 (auth), TDR-08 (capacity), TDR-05 (idempotency) |

All routes are JSON over HTTPS at the edge; validation via Zod; persistence via `core-data-access` only. Internal (system-actor) operations have no public route and are invoked by cron or by another module's service call — listed for completeness.

## Auth model {#auth}
**satisfies: TDR-07.** Three actor mechanisms, no Cloudflare Access:
- **Owner / secondary-operator:** `POST /auth/owner/login` → validates credentials, mints **JWT (Web Crypto HS256, 1h TTL)**, writes `auth_session` to **KV**. Middleware verifies JWT signature + checks `auth_session.expires_at` **server-side on every request** (AUTH04 — never trusts client expiry).
- **Customer:** `POST /auth/customer/verify-link` → verifies a signed link, mints a **booking-scoped** JWT + KV session (`booking_id` set), granting access to exactly one booking (AUTH02). This is the endpoint the **DR-B11 booking-completion link** resolves through: the customer lands on the webapp-customer island at `?mode=complete&token=<link>`, which calls `verify-link` to obtain the session, then runs the standard BOOK02→BOOK03 attendee/consent flow (owner never enters this on the customer's behalf).
- **Guide:** every `/guide/*` request carries **`X-Device-ID`**; middleware matches it to a registered `devices` row → `guides` (AUTH03). No JWT/KV session for guides.
- **Logout:** `POST /auth/logout` deletes the KV `auth_session` synchronously (AUTH05).

| Route | REQ | Notes |
|---|---|---|
| `POST /auth/owner/login` | AUTH01 | JWT+KV owner session |
| `POST /auth/customer/verify-link` | AUTH02 | signed-link → booking-scoped session |
| *(middleware)* `X-Device-ID` check | AUTH03 | on every `/guide/*` route |
| *(middleware)* session-expiry check | AUTH04 | server-side, every request |
| `POST /auth/logout` | AUTH05 | KV delete |

## Consent & audit (CNA)
| Route | REQ |
|---|---|
| `POST /consent` (capture) | CNA01 |
| `POST /consent/withdraw` | CNA02 |
| `GET /admin/audit` + internal `writeAudit()` service | CNA03 |
| *cron* `gdpr-cleanup` | CNA04 |
| internal `consentState(person,purpose)` lookup | CNA05 |

## Notifications (NOTIF)
| Route | REQ | Notes |
|---|---|---|
| internal `send(message)` → Postmark | NOTIF01 | idempotency-keyed; provider = `postmark` v1 (TDR-09) |
| `POST /webhooks/postmark` | NOTIF02 | delivery/bounce/complaint → `email_events`, update `message.status` |
| internal idempotency guard | NOTIF03 | D1 `webhook_events` (**satisfies: TDR-05**) |
| internal `ownerAlert()` | NOTIF04 | `message.message_type=owner_alert` |

## SEO (SEO) {#seo}
| Route | REQ | Notes |
|---|---|---|
| static HTML generation (build) | SEO01 | crawlable per-locale output |
| sitemap/index generation | SEO02 | |
| `POST /publish` | SEO03 | **manual, operator-triggered only (satisfies: TDR-14)** |

## Booking (BOOK) — money path {#capacity} {#stripe}

**Payment path reference (reference-only, no code seeding).** A verified Stripe Embedded Checkout PoC is staged at `_user_input/reference/stripe-poc/` (worker routes `checkoutSession`/`sessionStatus`/`webhook`/`reconcile`, `lib/stripeClient.ts` pinned `apiVersion 2025-02-24.acacia`, `lib/db.ts` `INSERT OR IGNORE` idempotency, `schema/0001_init.sql`, Flutter Web embedded-checkout JS interop, `LEARNINGS.md`). The `api-worker` payment routes (BOOK04/05/07) and the customer checkout island **follow this PoC's patterns and LEARNINGS as REFERENCE ONLY** — no code is copied (greenfield, DEV-4). Use `ui_mode:'embedded'` + `initEmbeddedCheckout` (not `embedded_page`), per the PoC and TDR-06. **Two required divergences from the PoC:** (1) email via **Postmark, not Resend** (TDR-09); (2) guard admin/owner payment actions with a **core-auth operator session, not the PoC's static admin-key guard** (DR-B9).

| Route | REQ | Notes |
|---|---|---|
| `POST /bookings` | BOOK01 | creates `draft` + **atomic D1 transactional decrement** of `departures.held_count` (**satisfies: TDR-08**) |
| `PATCH /bookings/:id/participants` | BOOK02 | attendee details, emergency contact; each attendee carries `contact_role` (`leader`/`co-leader`/`attendee`, DR-B12a) — server enforces exactly one `leader` |
| `POST /bookings/:id/consent` | BOOK03 | waiver/T&C + marketing consent (calls CNA01) |
| `POST /bookings/:id/checkout-session` | BOOK04 | Stripe **Embedded Checkout** `ui_mode:'embedded'`; `payments` insert `INSERT OR IGNORE` on `session_id` (**satisfies: TDR-06, TDR-05**) |
| `POST /webhooks/stripe` | BOOK05 | fulfilment driven **only** by `checkout.session.completed`; idempotency via `webhook_events` (**satisfies: TDR-06, TDR-05**) |
| `PATCH /bookings/:id` (modify) | BOOK06 | atomic release-and-reacquire across departures (TDR-08) |
| `POST /bookings/:id/cancel` | BOOK07 | refund (auto >48h / owner-manual ≤48h); `refund_amount_pence` cumulative from `charge.amount_refunded` (**satisfies: TDR-06**); capacity restored atomically |
| `POST /admin/bookings` | BOOK08 | owner-created booking; requires `customerEmail`; sends the customer a signed **completion link** (DR-B11) so they supply participants/consent themselves via BOOK02→03; returns `completionLinkSent` |
| *cron* abandonment sweep | BOOK09 | expire unpaid drafts, release `held_count` |
| `POST /admin/bookings/provisional` | BOOK10 | owner-set hold/deposit/reminder terms; requires `customerEmail`; sends the same DR-B11 completion link; returns `completionLinkSent` |
| `POST /admin/departures` | BOOK11 | create departure (unique `(tour,date,time)`, cap ≤10) |
| `PATCH /admin/departures/:id` | BOOK12 | edit; capacity floor = current bookings; material change detected by comparison |
| `POST /admin/departures/:id/cancel` | BOOK13 | mark cancelled, release capacity |
| `POST /admin/departures/:id/bike-assignments` | BOOK14 | assign bike (reads `bikes` cross-module; active-overlap forbidden) |
| `PATCH /admin/bookings/:id` | BOOK15 | owner-assisted edit (DR-B12b): change departure (atomic release-and-reacquire, TDR-08) and/or replace attendee list + `contact_role`s; enforces one `leader`; rejects if booking `cancelled`. Direct edit, no customer round-trip (not consent-bearing) |
| `POST /admin/bookings/:id/transition` | BOOK16 | owner status transition (DR-B12c): `confirm`\|`cancel`\|`mark_abandoned`, constrained to a valid-transition set; each reuses the capacity/refund side-effects of its automatic path (never a free-form status write) |

## Back-office (BO)
| Route | REQ |
|---|---|
| `GET /admin/calendar` | BO04 (departures + fill/readiness) |
| `GET /admin/bookings` (search) | BO05 |
| `GET /admin/bookings/:id` (detail incl. consent/waiver) | BO06 — returns the **full per-payment array** (`payments[]`, provider refs only, never card data). Consumed by A19 *and* the A8 Payments drill-down modal (FINDING-005) to show individual transactions rather than the pre-aggregated `GET /admin/bookings` totals |

## Pre-sales (PRE)
| Route | REQ | Notes |
|---|---|---|
| `GET /tours` | PRE01 | reads presumed RCA catalogue |
| `GET /tours/:id` | PRE02 | |
| `GET /tours/:id/availability` | PRE03 | reads `booking`'s `departures` |
| `POST /enquiries` | PRE04 | writes `enquiries`+`prospects`; sets SLA; NOTIF04 owner alert |
| `PATCH /admin/enquiries/:id` | PRE05 | reply status |
| `POST /saved-tours` | PRE06 | writes `saved_tours`; CNA01 nudge-consent |
| *cron* nudge send | PRE07 | re-checks CNA05 consent + deliverability, NOTIF01 |
| client CTA handoff | PRE08 | assembles context → BOOK01 (no server route; client route) |

## Tour operations (OPS)
| Route | REQ | Component |
|---|---|---|
| `GET /guide/departures/:id` | OPS01 | mobile-guide |
| `PATCH /guide/readiness/:id/kit` | OPS02 | typed-confirm |
| `PATCH /guide/readiness/:id/bike-inspection` | OPS03 | full-signature; calls FLEET04 on failed bike |
| `PATCH /guide/readiness/:id/risk-assessment` | OPS04 | |
| `POST /guide/checkins` | OPS05 | waiver re-confirm |
| `PATCH /guide/readiness/:id/briefing` | OPS06 | |
| `PATCH /guide/readiness/:id/final-signoff` | OPS07 | departure gate |
| `POST /guide/events` | OPS08 | `mid_tour_events` (placeholder entity) |
| `POST /guide/incidents` | OPS09 | NOTIF04 owner alert |
| `POST /guide/post-ride-review` | OPS10 | triggers OPS11/13, `bikes.status` service flag |
| `PATCH /guide/incidents/:id/report` | OPS11 | formal narrative |
| `PATCH /admin/incidents/:id/dispatch` | OPS12 | insurer dispatch **stub, D-OPS-5** (webapp-admin) |
| `POST /guide/hazards` | OPS13 | |
| `PATCH /admin/hazards/:id` | OPS14 | dedupe by street, set severity (webapp-admin) |

## Pre-tour (TOUR)
| Route | REQ | Notes |
|---|---|---|
| `GET /tour-hub/:bookingId` | TOUR01 | reads booking/participants |
| *cron* send-reminders (T-1) | TOUR02 | writes `reminders`, NOTIF01 |
| *cron* weather advisory | TOUR03 | Met Office via **Worker proxy** (TDR-17); `informational` only |
| `PATCH /tour-hub/:id/details` | TOUR04 | non-financial; safety-significant → owner alert |
| internal change-notice (BO-triggered) | TOUR05 | `operator_notices` type=change |
| `POST /notices/:id/ack` | TOUR06 | acknowledgement (confirmatory, not a gate) |
| internal cancellation-notice (BO-triggered) | TOUR07 | `operator_notices` type=cancellation + remediation options |
| `POST /notices/:id/remediation` | TOUR08 | triggers BOOK06/07 |
| `POST /tour-hub/:id/late` | TOUR09 | notifies FOB ops number (DR-T7) |
| *cron* no-show | TOUR10 | reads OPS `rider_checkins`, applies manual policy |

## Fleet (FLEET)
| Route | REQ |
|---|---|
| `POST /admin/bikes` | FLEET01 |
| `POST /admin/equipment` | FLEET02 |
| `GET /admin/fleet` | FLEET03 |
| `PATCH /admin/bikes/:id/flag` (cross-module callee of OPS03) | FLEET04 |
| `POST /admin/bikes/:id/maintenance` | FLEET05 |
| `PATCH /admin/bikes/:id/status` (≥1 maintenance event required) | FLEET06 |
| *cron* compliance-check (daily, on-event alert) | FLEET07 |
| `PATCH /admin/compliance/:id/renew` | FLEET08 |

## Post-tour (POST)
| Route | REQ |
|---|---|
| internal completion (OPS10 trigger) | POST01 |
| *cron* send-review-requests (T+24h) | POST02 |
| `POST /feedback` | POST03 (≤3★ → owner alert, DR-PT2) |
| `POST /preferences` (marketing prefs / unsubscribe, via CNA) | POST10 |

## Error & idempotency conventions
- Card declined → `402` `{error:"card_declined"}` (BOOK04). Duplicate idempotency key → same session returned, no new attempt.
- All webhooks (`/webhooks/stripe`, `/webhooks/postmark`) and all cron sends are idempotent via the D1 `webhook_events`/`message.idempotency_key` store (**satisfies: TDR-05**) — safe on retry.
- Unauthorized/expired session → `401`; unregistered `X-Device-ID` → `403`.
