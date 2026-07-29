# FOB — Architecture Allocation

| | |
|---|---|
| **Document** | FOB — Architecture Allocation (Stage 6d) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — non-normative background + normative allocation table (§2) |
| **Sources** | `core-auth.md`, `core-consent-audit.md`, `core-notifications.md`, `core-seo.md`, `core-data-access.md`, `core-design-system.md`, `booking.md`, `pre-sales.md`, `tour-operations.md`, `pre-tour.md`, `fleet-equipment.md`, `post-tour.md` (v0.2) (Stage 4) · `Data_Dictionary.md` (Stage 6a) · `Decision_Record_Aristotle_2026-07-20.md` (DR-1, DR-8) · `Decision_Record_Booking_Aristotle_2026-07-20.md` (DR-B1–B10) · `Decision_Record_PreSales_Aristotle_2026-07-20.md` (DR-P1–P4) · `Decision_Record_TourOps_Aristotle_2026-07-20.md` (DR-O1–O5) · `Decision_Record_PreTour_Aristotle_2026-07-21.md` (DR-T1, T4–T9) · `Decision_Record_Fleet_Aristotle_2026-07-21.md` (DR-F1–F10) · `Decision_Record_PostTour_Aristotle_2026-07-21.md` (DR-PT1–PT4) · `Decision_Record_Bacon_2026-07-21.md` (DR-BO1–6, DR-BO2a — run Bacon) |

---

## 1. Layers & devices

| Layer | Technology | Runs on (devices) | Notes |
|---|---|---|---|
| Frontend | Static HTML + Flutter Web islands (customer webapp, back-office); Flutter mobile app (guide app) | Desktop/mobile browser (customer, Owner); issued mobile/tablet device (Guide) | Matches the built `admin-rome` pattern — vanilla HTML/CSS/JS + compiled Flutter widgets, per-locale static dirs (EN/FR/ES). |
| Middle/services | Cloudflare Workers (Hono + Zod) | Cloudflare edge network | `admin-rome/SOURCE/backend` is the built reference implementation for AUTH and NOTIF's send path (DR-1: canonical). |
| Data | Cloudflare D1 (UK region) + Cloudflare KV | Cloudflare edge network | D1 for durable/queryable records (`consents`, `audit_log`, `message`, `webhook_events`); KV for the time-bounded `auth_session` record only. |

## 2. Requirement → layer allocation

| REQ | Frontend does | Middle/services does | Data layer does |
|---|---|---|---|
| REQ-AUTH01 | Renders sign-in form (A1); shows error/success | Validates credentials; creates `auth_session` | KV: write `auth_session` (token, actor_type=owner, expires_at) |
| REQ-AUTH02 | Renders signed-link landing (W1) | Verifies link validity + single-booking scope; mints JWT; creates `auth_session` | KV: write `auth_session` (booking-scoped); D1: read `bookings` (owned by `booking`) |
| REQ-AUTH03 | *(none — implicit per-request header, no dedicated screen)* | Matches `X-Device-ID` to a registered device/guide on every request | D1: read `devices`, `guides` (Referenced) |
| REQ-AUTH04 | Renders "session expired, sign in again" prompt (A1/W1) | Checks `auth_session.expires_at` server-side on every request; never trusts client-supplied expiry | KV: read `auth_session.expires_at` |
| REQ-AUTH05 | Renders sign-out control (A2/W2) | Handles revoke request; removes the KV record synchronously | KV: delete `auth_session` |
| REQ-CNA01 | Renders consent capture point (W4, presumed pre-sales surface) | Validates contact detail present + source supplied; appends the decision | D1: write `consents` |
| REQ-CNA02 | Renders unsubscribe control (W3) | Appends withdrawal; treats missing prior permission as already-suppressed | D1: write `consents` |
| REQ-CNA03 | Renders audit log viewer, read-only (A5) | Exposes an internal "write audit entry" service, called by any module on a money/safety action | D1: write `audit_log`; D1: read for A5 display |
| REQ-CNA04 | *(none — cron-driven; erasure event later visible via A5)* | `gdpr-cleanup` cron job (Cloudflare Cron); checks dormancy, blanks fields | D1: update `prospects` (blank PII, set `deleted_at`); D1: write `audit_log` entry for the erasure |
| REQ-CNA05 | *(none — internal)* | Consent-state lookup service, called by NOTIF's send path before any marketing send | D1: read `consents` (latest row per person+purpose) |
| REQ-NOTIF01 | *(none — trigger is internal; result appears as E1)* | Builds the message + idempotency key; calls the provider | D1: write `message`; provider call to Postmark (interim default, D-NOTIF-2 open) |
| REQ-NOTIF02 | Renders deliverability status, read-only (A3) | Webhook handler ingesting provider delivery/bounce/complaint callbacks | D1: write `email_events`; D1: update `message.status` |
| REQ-NOTIF03 | *(none — internal)* | Idempotency check against the key store before any send proceeds | D1: read/write `webhook_events` (DR-8: D1, not KV) |
| REQ-NOTIF04 | Renders owner alert inbox (A4) | Dispatch + retry logic to the Owner's configured channel | D1: write `message` (type=`owner_alert`) |
| REQ-SEO01 | *(the output IS the frontend — static crawlable HTML)* | Content-export service reading marketing/route-catalogue read APIs (presumed, out of Lean-6) | *(none owned here — reads presumed BF's D1 tables)* |
| REQ-SEO02 | *(the output IS the frontend — static sitemap-equivalent index)* | Index-generation service | *(none owned here)* |
| REQ-SEO03 | Renders manual-publish control (A6) | Publish/rebuild trigger service — regenerates P1/P2 from current content (manual-only, DR-10) | *(none owned here — triggers the static-build mechanism)* |

| REQ-BOOK01 | Renders selection (W5); shows live capacity/price | Atomically checks + decrements departure capacity (DR-B3); creates booking draft | D1: write `bookings` (draft), update `departures.held_count` |
| REQ-BOOK02 | Renders attendee-details entry (W6) | Validates required fields; preserves in-progress entry across hold-expiry | D1: write `participants`, `bookings.emergency_contact_*` |
| REQ-BOOK03 | Renders waiver/T&C/consent (W7) | Records waiver/T&C acceptance; calls `core-consent-audit`'s consent-write service (REQ-CNA01) | D1: write `bookings.waiver_accepted_at`/`terms_accepted_at`; D1 (via CNA): write `consents` |
| REQ-BOOK04 | Renders embedded Checkout (W8) via Stripe.js, mounted client-side | Creates the Checkout Session (`ui_mode: 'embedded'`), carrying the client's idempotency key | D1: write `payments` (idempotent insert, F-15) |
| REQ-BOOK05 | Renders confirmation (W9) | Processes the provider's success report; idempotency check against the store | D1: update `bookings.status=confirmed`, `payments.status=succeeded`; D1: read/write idempotency store (`webhook_events`, DR-8) |
| REQ-BOOK06 | Renders manage-booking modify control (W10) | Checks new-date capacity; atomic release-and-reacquire across departures | D1: update `bookings`, `departures` (both old and new) |
| REQ-BOOK07 | Renders manage-booking cancel control (W10); Owner sees within-48h cases on A8 | Determines refund (automatic >48h; Owner-manual within 48h, DR-B5); calls the payment provider for refund | D1: update `bookings.status=cancelled`, `payments.refund_amount_pence` (cumulative, F-20), `departures` (capacity restored) |
| REQ-BOOK08 | Renders owner booking-creation (A7) | Creates draft at agreed price; generates a payment link | D1: write `bookings` (source=owner-created) |
| REQ-BOOK09 | *(none — internal, hold-expiry driven)* | Archives expired, unpaid drafts on a schedule | D1: update `bookings.status=abandoned`; update `departures.held_count` (release) |
| REQ-BOOK10 | Renders owner provisional-booking creation (A7) | Records Owner-set hold/deposit/reminder terms (DR-B2); no system-wide defaults | D1: write `bookings` (status=provisionally-confirmed, source=provisional) |
| REQ-BOOK11 *(run Bacon)* | Renders departure scheduler — create (A18) | Creates a departure (`status=scheduled`, capacity ≤10, optional guide → not-ready); enforces `(tour,date,time)` uniqueness | D1: write `departures` (`status`, `guide_id`) |
| REQ-BOOK12 *(run Bacon)* | Renders departure scheduler — edit (A18) | Updates time/capacity/guide; capacity floor = current bookings; detects material date/time change (no stored flag). **Does not send notices** — back-office orchestration calls `pre-tour` REQ-TOUR05 (keeps BOOK↛TOUR acyclic) | D1: update `departures` |
| REQ-BOOK13 *(run Bacon)* | Renders departure scheduler — cancel (A18) | Marks `cancelled`+unbookable, releases capacity; per-booking remediation orchestrated externally (back-office → `pre-tour` REQ-TOUR07) | D1: update `departures.status=cancelled`, release capacity |
| REQ-BO04 *(run Bacon)* | Renders departure calendar (A17) | Reads departures + booking counts; derives fill + readiness | D1: read `departures`, `bookings` |
| REQ-BO05 *(run Bacon)* | Renders booking browser — search (A19) | Searches bookings; excludes card data (provider refs only) | D1: read `bookings`/`participants`/`payments` |
| REQ-BO06 *(run Bacon)* | Renders booking browser — detail (A19) | Assembles one booking's full record incl. consent/waiver timestamps | D1: read `bookings`/`participants`/`payments`; read `core-consent-audit` (`consents`, `audit_log`) |
| REQ-BOOK14 *(run Bacon; owned by `booking`, DR-BO2a)* | Renders bike allocation (A20 — a back-office surface) | Reads `fleet-equipment` bike status (`in-service`/route-eligible); validates non-overlap against active assignments; writes the assignment | D1: read `bikes` (status, cross-module); write `bike_assignments` (booking-owned) |

| REQ-PRE01 | Renders tour catalogue (W11), filters | Serves published-tours listing (presumed RCA `tours` read) | *(none owned here — reads RCA's tables)* |
| REQ-PRE02 | Renders tour detail (W12) | Serves detail content by current tour status (presumed RCA read) | *(none owned here)* |
| REQ-PRE03 | Renders availability picker (W13) | Checks capacity via the presumed `booking` read interface | *(none owned here — reads `booking`'s `departures`)* |
| REQ-PRE04 | Renders enquiry form (W14) | Validates fields; sets SLA; triggers owner alert | D1: write `enquiries`; calls `core-notifications` REQ-NOTIF04 |
| REQ-PRE05 | Renders enquiry management (A9) | Records reply status | D1: update `enquiries.status`/`responded_at` |
| REQ-PRE06 | Renders save-by-email modal (W15) | Sends transactional email; calls `core-consent-audit` for nudge-consent write | D1: write `saved_tours`; D1 (via CNA): write `consents` |
| REQ-PRE07 | *(none — internal, schedule-driven)* | Re-checks consent (`core-consent-audit` REQ-CNA05) and deliverability; calls `core-notifications` REQ-NOTIF01 | D1: update `saved_tours.nudge_status` |
| REQ-PRE08 | "Book" CTA on W11–W15 | Assembles known context, hands off to `booking` | *(none owned here — handover only)* |
| REQ-OPS01 | Renders tour-day home (G2) | Serves rider list, weather/route data (presumed Met Office/TfL) | D1: read `booking`'s `bookings`/`participants` |
| REQ-OPS02 | Renders kit checklist (G3) | Derives required quantities from party size/season/forecast; typed-confirm sign-off (DR-O1) | D1: write `tour_readiness.kit_check_signed_at` |
| REQ-OPS03 | Renders bike inspection grid (G4) | Records per-bike checks; full-signature declaration (DR-O1); calls `fleet-equipment` REQ-FLEET04 to flag a failed bike | D1: write `tour_readiness.bike_inspection_signed_at`; D1 (via FLEET, not owned here): `bikes.status` |
| REQ-OPS04 | Renders risk assessment + decisions log (G5) | Pre-populates conditions; typed-confirm sign-off | D1: write `tour_readiness.risk_assessment_signed_at` |
| REQ-OPS05 | Renders rider check-in card (G6) | Records per-rider clearance; full-signature waiver re-confirmation | D1: write `rider_checkins`; D1 (read): `booking`'s `participants` |
| REQ-OPS06 | Renders briefing script (G7) | Surfaces day-specific mitigations tagged in REQ-OPS04 | D1: write `tour_readiness.briefing_confirmed_at` |
| REQ-OPS07 | Renders departure sign-off summary (G8) | Aggregates all prior gate statuses | D1: write `tour_readiness.final_signoff_at`/`status` |
| REQ-OPS08 | Renders mid-tour event logger (G9) | Records issue + resolution | D1: write to a mid-tour event log *(entity not yet named — Stage 6a follow-up)* |
| REQ-OPS09 | Renders incident logger (G10) | Calls `core-notifications` REQ-NOTIF04 for Owner alert | D1: write `incidents` (preliminary) |
| REQ-OPS10 | Renders post-ride review (G11) | Triggers downstream actions per ticked box | D1: update `bikes.status` (service flag), triggers REQ-OPS11/13 |
| REQ-OPS11 | Renders incident report form (G12) | Assembles formal narrative | D1: update `incidents.formal_report` |
| REQ-OPS12 | Renders incident review + dispatch (A10) | Insurer-dispatch mechanics — **stub, D-OPS-5 open** | D1: update `incidents.status`/`insurer_dispatch_at` |
| REQ-OPS13 | Renders hazard observation entry (G13) | Records observation | D1: write `hazard_log` (`pending_review`) |
| REQ-OPS14 | Renders hazard review + approval (A11) | Deduplicates by street; sets severity | D1: update `hazard_log.status`/`severity`/`last_confirmed_at` |
| REQ-TOUR01 | Renders the tour hub (W16) | Reads current booking status/details | D1: read `bookings`, `participants` |
| REQ-TOUR02 | *(none — trigger internal; result appears as E5)* | Scheduled check for the T-1 milestone (DR-T1); calls `core-notifications` REQ-NOTIF01 | D1: write `reminders` |
| REQ-TOUR03 | *(none — trigger internal; result appears as E5)* | Evaluates forecast (presumed Met Office API) against thresholds (D-TOUR-3 deferred) | D1: write `weather_advisories` |
| REQ-TOUR04 | Renders update-details form (W17) | Validates non-financial fields; alerts Owner if safety-significant | D1: update `participants`; calls `core-notifications` REQ-NOTIF04 |
| REQ-TOUR05 | *(none — trigger is an Owner back-office edit, out of this module)* | Composes old-vs-new change notice; calls `core-notifications` REQ-NOTIF01 | D1: write `operator_notices` (type=change) |
| REQ-TOUR06 | Renders change-acknowledgement (W18) | Records acknowledgement | D1: update `operator_notices.status`/`acknowledged_at` |
| REQ-TOUR07 | *(none — trigger is an Owner cancellation, out of this module)* | Composes cancellation notice with remediation options (DR-T5); calls `core-notifications` REQ-NOTIF01 | D1: write `operator_notices` (type=cancellation) |
| REQ-TOUR08 | Renders remediation-choice (W19) | Triggers the chosen remediation via `booking` REQ-BOOK06/07 | D1: update `operator_notices.remediation_choice` |
| REQ-TOUR09 | Renders "running late" notice (W20) | Notifies Guide/Owner (FOB ops number, DR-T7) | D1 (presumed, via `tour-operations`): no dedicated write here |
| REQ-TOUR10 | *(none — trigger internal; result appears as E5)* | Reads `tour-operations`' `rider_checkins`; applies no-show policy (manual, DR-T8) | D1: update `bookings` no-show status *(field TBD, Stage 6a follow-up)* |

| REQ-FLEET01 | Renders "Add bike" (A12) | Validates identifier uniqueness | D1: write `bikes` |
| REQ-FLEET02 | Renders "Add/replace equipment" (A13) | Sets review reminder (DR-F2); retires prior item if replacement | D1: write `equipment` |
| REQ-FLEET03 | Renders fleet readiness view (A14) | Aggregates status counts + alerts | D1: read `bikes`, `equipment`, `compliance_items` |
| REQ-FLEET04 | *(none — cross-module call from `tour-operations` REQ-OPS03, or Owner-direct)* | Records the service flag | D1: update `bikes.status` |
| REQ-FLEET05 | Renders maintenance-event logger (A15) | Validates work-performed fields | D1: write `maintenance_events` |
| REQ-FLEET06 | Renders bike-status control (A15) | Enforces ≥1 maintenance event before clearing | D1: update `bikes.status` |
| REQ-FLEET07 | *(none — trigger internal; result appears as E6)* | Daily evaluation (Cloudflare Cron); on-event alert logic (DR-F7) | D1: update `compliance_items.status`/`last_alert_sent_at` |
| REQ-FLEET08 | Renders compliance renewal action (A16) | Validates new expiry date | D1: update `compliance_items.status`/`expiry_or_due_at`/`renewed_at` |

| REQ-POST01 | *(none — trigger internal; result appears as E7)* | Confirms completion + review-request tick (`tour-operations` REQ-OPS10) | D1: write `bookings` reminder-analogue field *(none owned here — reuses `booking`'s status)* |
| REQ-POST02 | *(none — trigger internal; result appears as E8)* | Scheduled T+24h send | *(none owned here)* |
| REQ-POST03 | Renders feedback capture (W21) | Applies the ≤3★ Owner-alert rule (DR-PT2) | D1: write `feedback` |
| REQ-POST10 | Renders preference management (W3, reused) | Validates the signed link | D1 (via `core-consent-audit`): write `consents` |

*System-actor REQs with no frontend cell (REQ-AUTH03, REQ-CNA04, REQ-CNA05, REQ-NOTIF01, REQ-NOTIF03, REQ-BOOK09, REQ-PRE07, REQ-TOUR02, REQ-TOUR03, REQ-TOUR05, REQ-TOUR07, REQ-TOUR10, REQ-FLEET04, REQ-FLEET07, REQ-POST01, REQ-POST02) match the "no surface by design" verification already run at Stage 6b — consistent, not a new gap.*

## 3. Mechanisms (referenced studies) — non-normative

- **Auth token mechanism:** JWT, Web Crypto HS256, 1h TTL, KV-backed for revocability (DR-2). Reference implementation: `admin-rome/SOURCE/backend/lib/jwt.ts` (canonical per DR-1).
- **Idempotency mechanism:** the Stripe PoC's `webhook_events` D1 pattern, reused for notification idempotency per DR-8 — not a new mechanism, a reused one.
- **Static-build/crawlability mechanism:** static HTML + Flutter islands, per-locale directories (EN/FR/ES), no-script-required rendering for crawlers — matches the built `admin-rome` frontend pattern.
- **Email/SMS send mechanism:** currently Postmark (email, interim default) direct-call, no orchestration layer (interim default for D-NOTIF-1); both remain **open** per the Decision Record and must not be treated as final here.
- **Payment mechanism:** Stripe Embedded Checkout, `ui_mode: 'embedded'`, mounted client-side via `stripe.createEmbeddedCheckoutPage()` (Stripe removed the older `initEmbeddedCheckout` — POC-verified live, F-14). Fulfilment is driven strictly by the provider's success report, never the customer's post-payment landing view. Reference implementation: `pocs/stripe_embedded_checkout/` (Worker + Flutter Web interop).
- **Slot-hold mechanism:** D1 transactional decrement (DR-B3) — one atomic operation per hold/release/confirm, no separate hold table or sweep cron, no Durable Object.
- **Sign-off mechanism:** split per DR-O1 — full signature capture (stylus/finger) for waivers and formal declarations; typed "I confirm" + timestamp for routine checks (kit, risk assessment).
- **Photo capture:** explicitly **out of scope** this pass (DR-O5) — no R2 storage/offline-sync mechanism is needed for `tour-operations` despite being presumed in its original frontmatter; that presumption is now moot.
- **Reminder cadence:** single T-1 milestone only (DR-T1) — no T-7/T-3/T-0 schedule to design against.
- **Weather advisory mechanism:** informational-only classification (D-TOUR-3 deferred) — no numeric threshold logic to design until real rules are supplied.
- **Compliance alerting mechanism:** on-event only (DR-F7) — evaluated daily (Cloudflare Cron) but notified only on a status transition, guarded by `last_alert_sent_at` to prevent re-firing on an unchanged status.
- **Bike-flagging cross-module call:** `tour-operations` REQ-OPS03 calls `fleet-equipment` REQ-FLEET04 rather than writing bike status itself — this is the corrected (F-42) inter-module mechanism, not a shared database write from two modules.

## 4. Presumed shared subsystems — who provides each `presumes` entry

| `presumes` entry (from module frontmatter) | Provider | Status |
|---|---|---|
| Cloudflare KV (`core-auth`) | Cloudflare platform primitive, provisioned via `wrangler.toml` | Reliable — already provisioned in `admin-rome` |
| Cloudflare Cron (`core-consent-audit`, `core-notifications`) | Cloudflare platform primitive; existing triggers `gdpr-cleanup` (03:00), `send-reminders` (08:00), `send-review-requests` (09:00) | Reliable — built |
| Postmark (`core-notifications`) | External vendor, called directly from Workers | **Interim default only** — D-NOTIF-2 still open; final direction is a home-rolled solution to be designed |
| Twilio (`core-notifications`) | External vendor, called directly from Workers (no orchestration layer) | **Interim default only** — D-NOTIF-1 still open |
| Cloudflare D1 (`core-data-access`) | Cloudflare platform primitive (UK region); `core-data-access` provides the single-access-pattern + migration-runner layer on top | Reliable — `admin-rome` D1 schema exists |
| `marketing-read-api`, `route-catalogue-read-api` (`core-seo`) | Presumed to be provided by the `marketing` and `route-catalogue` business functions | **Out of Lean-6 scope** — not designed in this run; `core-seo` only consumes |
| `static-build` (`core-seo`) | Presumed to be provided by a `static-build` service module | **Out of Lean-6 scope** — named as unowned ground in `Module_Map.md` §4 |
| Cloudflare D1 (`booking`) | Same platform primitive as `core-data-access`; `booking` writes `bookings`/`departures`/`participants`/`payments` through it | Reliable — admin-rome D1 schema exists (Referenced, not confirmed DDL) |
| Stripe — Embedded Checkout (`booking`) | External vendor; Worker creates the Checkout Session, client mounts it | Reliable — POC-verified live 2026-07-17 (`pocs/stripe_embedded_checkout/`), not yet the production booking site's own implementation |
| RCA `tours`/`routes`/`waypoints`/`guides` read APIs (`pre-sales`) | Presumed to be provided by RCA (route-pipeline API), out of this pipeline's module set | **Out of scope** — not designed in this run; PRE only consumes |
| `booking` read API — departure/slot capacity (`pre-sales`) | Provided by `booking` itself; read-only, presumed rather than depended-on to avoid a dependency cycle (Module_Map.md §2) | Reliable in direction (D1 transactional decrement, DR-B3) — the read-interface shape itself isn't designed yet |
| GMT (`tour-operations`) | Existing, separately-designed navigation PWA — presumed as the app shell OPS extends with playbook flows | Partially built (per Reconciliation §1(D)) — not re-designed in this run |
| RCA `bikes`/fleet read (`tour-operations`) | Presumed to be provided by RCA | **Out of scope** — not designed in this run; OPS only consumes and updates `bikes.status` |
| Met Office API, TfL API (`tour-operations`) | External vendors, already referenced elsewhere in the corpus (Pre-Tour weather/hazard journeys) | Reliable in direction — same APIs, reused pattern |
| Cloudflare R2 (`tour-operations`) | Presumed in the module's original frontmatter for photo storage | **Now moot — DR-O5** (photo capture out of scope this pass); no provider needed |
| Met Office API, TfL API (`pre-tour`) | Same external vendors reused from `tour-operations` | Reliable in direction — same APIs, reused pattern |
| GMT (`pre-tour`) | Presumed for day-of guide contact (D-TOUR-7) | **Now moot — DR-T7** (FOB ops number chosen instead); no GMT scope addition needed |
| Cloudflare R2 (`fleet-equipment`) | Presumed in the module's original frontmatter for photo storage | **Now moot — DR-F5** (no photo capture ruled anywhere in this module); no provider needed |
| RCA (`fleet-equipment`) | Primary owner-facing surface, per the source doc's own framing — but RCA itself is presumed infrastructure, not designed in this pipeline | Reliable in direction; the back-office surfaces (A12–A16) are this module's own UI, RCA is the umbrella product they live in |
| TripAdvisor, Google Reviews (`post-tour`) | External platforms; manual Owner monitoring this pass — no API/monitoring-tool integration | **Deferred with UJ-POST-06** — in-system logging is out of this pass's scope entirely |
| Cloudflare D1 (`back-office`) | Same platform primitive; `back-office` **reads** `departures`/`bookings`/`bikes` and orchestrates writes through `booking`/`pre-tour`/`fleet` APIs — it owns no data of its own (DR-BO1) | Reliable — reuses existing schema |
| `route-catalogue` tours read (`back-office`) | Presumed RCA read for the scheduler's tour picker | **Out of scope** — same presumed RCA read as `pre-sales` |
| `bike_assignments` store (REQ-BOOK14) | **`booking` (D1)** — DR-BO2a resolved 2026-07-21 | Reliable in direction — `booking` owns the entity and reads `fleet-equipment` `bikes.status` cross-module (new `booking`→`fleet-equipment` read edge, acyclic) |

## 5. Build/POC prompt reference

Most of AUTH's and NOTIF's middle/data layers already exist as working code in `admin-rome` (canonical per DR-1): `backend/lib/jwt.ts` (REQ-AUTH01/02/04/05), `backend/lib/email.ts` (REQ-NOTIF01, Postmark), and the D1 migrations (`consents` for REQ-CNA01/02/05). A module-build session for AUTH or NOTIF should paste `admin-rome/SOURCE/backend/lib/{jwt,email}.ts` alongside its own spec as existing-code context, not greenfield instructions. `audit_log`, `message`, and the guide-auth device-matching logic are **new** — no reference implementation exists yet (per `Data_Dictionary.md` §2).

A module-build session for `booking` should paste `pocs/stripe_embedded_checkout/SOURCE/` (Worker + Flutter Web interop) as existing-code context for REQ-BOOK04/05 (payment creation, idempotent D1 insert, provider-report-driven confirmation, refund cumulative-total handling) — it is a verified, working reference for the payment path specifically, not for the booking/attendee/consent flow around it, which has no reference implementation yet. Two known REQs are explicitly not yet authored and must not be assumed present in a build: the on-day paper waiver (DR-B7) and the consent-gated abandonment-recovery email (DR-B8).

`pre-sales` has no reference implementation anywhere in the corpus — it is greenfield relative to this pipeline (distinct from the concierge, which is greenfield relative to the whole project). A module-build session needs `booking`'s REQ-BOOK01 header/interface (for the handover target, REQ-PRE08) and `core-consent-audit`/`core-notifications`' headers (for REQ-PRE04/06/07's calls), per the module-build isolation rule (pipeline §8.2) — not their internals.

`tour-operations` has no reference implementation either, but it extends GMT (partially built per Reconciliation §1(D)) — a module-build session should paste GMT's existing app-shell interface (not its internals) alongside `tour-operations.md`'s own spec, plus `booking`'s `bookings`/`participants` header (for rider check-in pre-fill, REQ-OPS01/05) and `core-notifications`/`core-consent-audit`'s headers (for REQ-OPS09/11's owner-alert and audit calls). **GAP-6b-3** (no authored REQ for an Owner clearing a flagged bike) should be resolved before this module is built — a build session would otherwise have to invent that behavior.

`pre-tour` has no reference implementation either. A module-build session needs `booking`'s `bookings`/REQ-BOOK06/07 headers (for read/refund-trigger), `tour-operations`' `rider_checkins` header (for no-show detection), and `core-notifications`' headers — not their internals. **UJ-TOUR-08 is deliberately unbuildable as specified** (GAP-6b-4/DR-T1) — a build session must not invent a day-of reminder to fill the gap; if one is wanted, it goes back through Stage 5 as a cadence change, not a build-time addition.

`fleet-equipment` has no reference implementation either. A module-build session needs `tour-operations`' REQ-OPS03 header (the calling side of the flagging relationship) — this module is the callee, `tour-operations` is the caller (F-42). **Two things must not be built from this spec as-is:** a scheduled (time/mileage) maintenance trigger and a combined fleet-certification gate both have a ratified *direction* (DR-F1, DR-F6) but no authored REQ — a build session encountering either should stop and request the missing spec, not invent the behavior. Likewise, `bikes.status` values `retired` and `awaiting_external_service` are valid per the confirmed state machine (DR-F3) but have no REQ driving a transition into them — do not build UI or logic for these transitions from this spec alone.

`post-tour` has no reference implementation either, and is **deliberately the tightest-scoped module in this run** (v0.2, 4 REQs). A module-build session needs `tour-operations`' REQ-OPS10 header (the trigger) and `booking`'s completion-status header — not their internals. **Do not build anything for UJ-POST-05–09** (recovery-contact logging, public-review monitoring, repeat-booking/lapsed nudges, marketing campaigns) or a GDPR deletion/erasure mechanism — all are explicitly deferred to a future phase (sponsor decision 2026-07-21), and `DOMAIN-LEXICON.md`'s `public_reviews`/`recovery_contacts`/`prospects.lifecycle_status` entries are documented for that future phase, not this one.

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial architecture allocation: 17 REQs allocated across 3 layers, 7 `presumes` entries given named providers (2 still-open interim defaults flagged), build/POC reference to existing `admin-rome` code. |
| 0.2 | 2026-07-20T00:00:00Z | Added `booking`'s 10 REQs allocated across 3 layers; 2 new `presumes` entries (D1 reuse, Stripe Embedded Checkout); 2 new mechanism references (payment, slot-hold); build/POC reference to `pocs/stripe_embedded_checkout/`, scoped to the payment path only. |
| 0.3 | 2026-07-20T00:00:00Z | Added `pre-sales`'s 8 REQs allocated across 3 layers; 2 new `presumes` entries (RCA read APIs, `booking` read interface); build reference noting PRE has no existing-code reference anywhere in the corpus. |
| 0.4 | 2026-07-20T00:00:00Z | Added `tour-operations`'s 14 REQs allocated across 3 layers; 4 new `presumes` entries (GMT, RCA bikes, Met Office/TfL, R2 — R2 now noted moot per DR-O5); 2 new mechanism references (sign-off split, photo capture out of scope); build reference flags GAP-6b-3 as blocking before build. |
| 0.5 | 2026-07-21T00:00:00Z | Added `pre-tour`'s 10 REQs allocated across 3 layers; 2 new `presumes` entries (Met Office/TfL reused, GMT now moot per DR-T7); 2 new mechanism references (cadence, weather threshold deferred); build reference flags UJ-TOUR-08 as deliberately unbuildable pending a cadence change through Stage 5. |
| 0.6 | 2026-07-21T00:00:00Z | Added `fleet-equipment`'s 8 REQs allocated across 3 layers; REQ-OPS03 corrected to call FLEET's REQ-FLEET04 rather than own `bikes.status` (F-42); 2 new `presumes` entries (R2 now moot per DR-F5, RCA umbrella noted); 2 new mechanism references (on-event alerting, cross-module flagging call); build reference flags two ratified-but-unauthored REQs (DR-F1, DR-F6) and two undriven state values (`retired`, `awaiting_external_service`) as must-not-invent. |
| 0.7 | 2026-07-21T00:00:00Z | Added `post-tour`'s 4 REQs (tight scope, v0.2) allocated across 3 layers; 1 new `presumes` entry (TripAdvisor/Google, deferred with UJ-POST-06); build reference flags 5 deferred journeys + the GDPR deletion mechanism as must-not-invent. |
| 0.8 | 2026-07-21T00:00:00Z | **Run Bacon (`back-office`).** Allocated 7 REQs across 3 layers — REQ-BOOK11/12/13 (departures, relocated per DR-BO1) and REQ-BO04–07. The BOOK12/13 rows document the acyclic split (booking does the data-op, back-office middle-layer orchestrates the `pre-tour` notice). 3 new `presumes` entries (back-office D1 read/orchestrate, RCA tours read, and the **deferred** `bike_assignments` store — DR-BO2a, no provider until ruled). |
| 0.9 | 2026-07-21T00:00:00Z | **DR-BO2a resolved (booking owns).** REQ-BO07 → REQ-BOOK14 (booking-owned write); its data cell now writes `bike_assignments` and reads `bikes` cross-module; `bike_assignments` provider named (`booking` D1). New `booking`→`fleet-equipment` read edge recorded (acyclic). |
