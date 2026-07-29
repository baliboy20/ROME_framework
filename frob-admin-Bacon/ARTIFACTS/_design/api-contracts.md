# FOB — API Contracts (P3 Design)

| | |
|---|---|
| **Author** | PMA, dispatch `pma-P3` · **Status** PROPOSED · **Amended** 2026-07-28/29 (FINDING-008 guard behaviour; FR-001 import-html, email-assets, operator settings) — see inline markers |
| **Surface** | Single Cloudflare Worker `api-worker` (Hono + Zod), one origin on `friendsonbikes.uk` |
| **Public exceptions** | `GET /health` and **`GET /email-assets/*`** (FR-001) are deliberately unauthenticated. Mail clients fetch images from the recipient's device with no session of any kind, so anything behind auth would simply not load. Scope is narrow by construction — the key is always prefixed `email-assets/`, so no other object in the bucket is reachable — and the contents are Owner-authored marketing imagery, never customer data. Served immutable (`max-age=31536000`); a fresh import writes new keys rather than editing in place. |
| **Binds** | TDR-06 (Stripe), TDR-07 (auth), TDR-08 (capacity), TDR-05 (idempotency) |

All routes are JSON over HTTPS at the edge; validation via Zod; persistence via `core-data-access` only. Internal (system-actor) operations have no public route and are invoked by cron or by another module's service call — listed for completeness.

## Auth model {#auth}
**satisfies: TDR-07.** Three actor mechanisms, no Cloudflare Access:
- **Owner / secondary-operator:** `POST /auth/owner/login` → validates credentials, mints **JWT (Web Crypto HS256, 1h TTL)**, writes `auth_session` to **KV**. Middleware verifies JWT signature + checks `auth_session.expires_at` **server-side on every request** (AUTH04 — never trusts client expiry).
  > **DEV-5 impact (OPEN — not yet respecified).** The Owner client is now a
  > **Flutter macOS desktop app**, not a browser page. A native client has no
  > web origin and sends no cookies, so the `*.friendsonbikes.uk` CORS
  > reflection ceases to be an access control for this surface, and the bearer
  > token must be held in the **macOS keychain** rather than browser storage.
  > The JWT+KV mechanism itself is unchanged; its delivery, storage, and
  > origin assumptions are not. Respecify in P3 per
  > `architecture-impact-brief-DEV-5.md`.

- **Customer:** `POST /auth/customer/verify-link` → verifies a signed link, mints a **booking-scoped** JWT + KV session (`booking_id` set), granting access to exactly one booking (AUTH02). This is the endpoint the **DR-B11 booking-completion link** resolves through: the customer lands on the webapp-customer island at `?mode=complete&token=<link>`, which calls `verify-link` to obtain the session, then runs the standard BOOK02→BOOK03 attendee/consent flow (owner never enters this on the customer's behalf).
- **Guide:** every `/guide/*` request carries **`X-Device-ID`**; middleware matches it to a registered `devices` row → `guides` (AUTH03). No JWT/KV session for guides.
- **Logout:** `POST /auth/logout` deletes the KV `auth_session` synchronously (AUTH05).
- **Guard behaviour (FINDING-008 remediation, 2026-07-28).** Deny-by-default middleware is mounted at the app level BEFORE any sub-app: `/admin/*` and `/internal/*` require an operator session, `/tour-hub/*` a booking-scoped customer session, `/notices/*` a customer session plus an ownership lookup (its `:id` is a notice, not a booking, so the generic param check cannot scope it). Protection no longer depends on each module opting in. Both `lib/auth.ts` guards now verify the JWT signature before the KV lookup, matching `modules/auth/middleware.ts#resolveSession` — previously the token was treated as an opaque KV key, so a forged token needed no valid signature. `POST /auth/owner/login` is rate-limited to 10 attempts per 15 minutes per client, checked before any credential work so a throttled caller learns nothing; the limiter fails OPEN, because a broken limiter must not lock the Owner out of their own back office.

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

### CR-002 (CHG-001) — HTML email templates (REQ-NOTIF10, 2026-07-27) {#cr-002}

Amendments to the existing `/admin/email-templates` surface (operator-guarded, `src/routes/email.ts`). All changes are additive and backward compatible — text-only clients/templates are untouched.

| Route (existing, amended) | CR-002 change |
|---|---|
| `GET /admin/email-templates` | Rows now include `body_blocks` (JSON string or null) and `body_html` (string or null). |
| `POST /admin/email-templates` | Body accepts optional `body_blocks: Block[]` (Zod-validated against the 5 block types; unknown types rejected 422). When present the worker renders it through the canonical block→HTML renderer + house shell and stores **both** `body_blocks` and the derived `body_html`. Clients never submit `body_html` directly (server-rendered only — keeps the email-safe invariant by construction). |
| `PATCH /admin/email-templates/:id` | Same optional `body_blocks`; sending `body_blocks: null` clears both columns (template reverts to text-only). `body_html` is never patchable directly. |
| `POST /admin/email-templates/:id/import-html` | **NEW (FR-001, 2026-07-29).** Operator-guarded. Body `{ html: string }` — a complete HTML document. Stores it as this template's `body_html`, sets `body_source='raw'` and clears `body_blocks`. Returns `{ id, body_source, report }`. This is the ONLY route that accepts client HTML: `POST`/`PATCH` still refuse `body_html` outright, so the block editor's guarantee is untouched and raw HTML has one auditable door. **The document is NOT sanitised** (sponsor decision — the trust boundary is "the Owner is trusted"). The `report` carries: `originalBytes`/`processedBytes`, `imagesHosted`, `unknownFields` (merge fields this use_case does not supply — they resolve to an empty string at send time and therefore fail silently), `knownFields`, and `notes` (e.g. a document still above Gmail's ~102KB clipping threshold, a WebP image classic Outlook cannot display, a `<style>` block some clients strip). Embedded `data:` images are extracted to R2 under `email-assets/<templateId>/<n>-email.<ext>` and every reference rewritten — a repeated image is stored once but keeps all its references, because the bulletproof-background pattern needs each one. |
| `POST /admin/email-templates/:id/test-send` | Unchanged request shape. When the template has `body_html`, the test message is sent `multipart/alternative` (merge-substituted text + HTML from the use_case sample data) — so the Owner sees the HTML version in a real inbox. Still never idempotency-suppressed. |
| internal `send()` / `renderTemplate()` | `renderTemplate` additionally returns `htmlBody` (merge-substituted `body_html`, or null); `send()` passes it to the Cloudflare email client which builds `multipart/alternative` when an HTML body is present, `text/plain` otherwise. |

**Preview endpoint: none (decision).** The live preview is rendered **client-side in the Flutter admin** — the editor mirrors the block→HTML renderer (same shell markup, shipped as a shared spec/fixtures, see component-specs.md) and substitutes the use_case's sample merge data locally, displaying in an `HtmlElementView` iframe. This gives keystroke-latency preview with no server round-trip; the test-send remains the authoritative true-to-inbox check, and parity is pinned by shared golden fixtures. A server `POST …/preview` can be added later without breaking anything if drift ever becomes a problem.

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

### Operator settings (REQ-BO08, FR-001)

| Route | Contract |
|---|---|
| `GET /admin/settings` | Returns the singleton row: `refund_cutoff_hours`, `reminder_milestones[]`, `cancellation_remediation_options[]`, **`reply_mode`** (`auto`\|`manual`), **`deposit_default_pence`** (integer, pence), `updated_at`. |
| `PUT /admin/settings` | All fields optional; only those supplied are written. `reply_mode` is an enum — anything else is 422, so there is no way to reach a value that would stop confirmations sending. `deposit_default_pence` is a non-negative integer. Booleans are persisted as 0/1 (SQLite has no boolean) and always returned as their proper type. |

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

---

## CHG-008 (CT-3) — Resend outbound transport (REQ-NOTIF01, 2026-07-28) {#chg-008}

**External HTTP contracts: unchanged (decision).** CHG-008 swaps the provider *behind* the internal `send()` seam; no admin/customer route shape, status code, or response field changes — so the route tables above are deliberately untouched. Only the internal rows are amended:

| Contract | Amendment |
|---|---|
| internal `send(message)` | Dispatches by `env.EMAIL_TRANSPORT` (`resend` default in staging/production, `cloudflare` rollback, `debug` local). Resend call: `POST https://api.resend.com/emails`, bearer `RESEND_API_KEY`, native `{from,to,subject,text,html?,headers?}` payload. `message.provider` records the transport used; `provider_ref` = Resend message id. |
| internal failure handling | Provider non-2xx / rate limit / network error → `send()` returns `delivery_pending`, message row records `failure_reason` (data-dictionary #chg-008); HTTP-facing behaviour stays REQ-NOTIF01's `202 "Delivery pending"`. One automatic attempt per idempotency key. |
| `POST /admin/email-templates/:id/test-send` | Shape unchanged; now travels the same `EMAIL_TRANSPORT` dispatch (REQ-NOTIF01 invariant: test-sends use the production transport). |

**Payload decision — native fields, not raw MIME:** Resend's `{text, html}` fields let the provider assemble `multipart/alternative` (correct boundaries, encodings, DKIM signing) from the *same* `renderTemplate` outputs the Cloudflare path uses — REQ-NOTIF10 parity is preserved at the rendered-body level, with less hand-built MIME to defend. `buildMime` remains in use for the `cloudflare` rollback path.

---

## CR-004 (CHG-012) — owner-initiated booking email (REQ-NOTIF11, 2026-07-28) {#cr-004}

One new operator-guarded route (lives with the other email routes, `src/routes/email.ts`); everything downstream reuses the delivered CR-002/CHG-008 machinery (`substituteMergeFields[Html]`, `send()`, `EMAIL_TRANSPORT` dispatch).

### `POST /admin/bookings/:id/send-email`

Request body:

```json
{ "templateId": "uuid", "to": "optional@override.example", "personalMessage": "optional text" }
```

| Aspect | Contract |
|---|---|
| Guard | `requireOperatorSession` (same as the template CRUD surface). |
| Booking | `:id` must exist → else `404 {error:"not_found"}`. |
| Template validation | `templateId` must reference a template that is (a) `status='active'` and (b) **booking-aware**: its `use_case` is a key of the booking merge catalogue (`OUTCOME_FIELDS` in `modules/notifications/booking-outcome.ts` — currently the three booking flavours). Violation → `422 {error:"not_booking_aware"}`. No active booking-aware template exists at all → `422 {error:"no_booking_aware_template", message:"No booking-aware templates are active. Publish one before sending."}` (REQ-NOTIF11 error row). |
| Recipient | Defaults to the booking's lead-booker contact email (same `participants … contact_role='leader'` lookup the outcome dispatcher uses); `to` overrides it (editable-before-send requirement). Neither present → `422 {error:"no_recipient"}`. |
| Rendering | The selected template's `subject`, `body` and (when present) `body_html` are merge-substituted with the booking's **real** merge data — the same vars map `sendBookingOutcome` builds (extracted into a shared `buildBookingMergeVars(db, env, bookingId)` helper so the two paths cannot drift) — **plus** `personal_message` = the request's `personalMessage` (empty string when absent). HTML body substitution HTML-escapes merge values as ever (CR-002 invariant — the personal message can never inject markup). |
| Send | Standard `send()`: `messageType:'transactional'`, `event: booking-send:{bookingId}:{templateId}`, `idempotencyKey: booking-send:{bookingId}:{uuid}` — a **fresh key per explicit owner action**, so an owner-initiated send is never idempotency-suppressed (REQ-NOTIF11 invariant; same pattern as test-send and thread-reply). `template_id` recorded on the message row. |
| Booking linkage (decision) | **No schema change.** Sent messages have no `booking_id` column today; booking-outcome sends link via the `event` string (`booking-outcome:{bookingId}:{flavour}`), which the archive/search surfaces match. CR-004 reuses exactly that mechanism with the `booking-send:{bookingId}:…` event prefix — the message appears in A5d/archive and is findable by booking reference like every other booking email. |
| Response | `200 {status, sentTo, messageId}` (mirrors test-send). Transport failure behaves per CHG-008 (`delivery_pending`, `failure_reason` recorded). |

**`{{personal_message}}` discovery (decision):** it is an ordinary merge field — no template-model change. Whether a template "supports" it is defined as *the literal token `{{ personal_message }}` (whitespace-tolerant) appearing in its `subject`, `body`, or `body_html`*. The admin computes this **client-side** from the full template rows `GET /admin/email-templates` already returns (no API change); templates without the token show no personal-message entry (ratified DECIDE-2), and if one were sent anyway the renderer's unknown-token rule (render blank, never leak) makes it harmless.

**Preview endpoint: none (decision, consistent with CR-002).** The pre-send preview is the CR-002 client-side Dart mirror renderer, fed with this booking's real data (already available from `GET /admin/bookings/:id`) plus the typed personal message. The send itself remains the authoritative rendering; parity is pinned by the existing shared golden fixtures.
