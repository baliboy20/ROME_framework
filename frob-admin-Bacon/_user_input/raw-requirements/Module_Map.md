# FOB — Module Map

| | |
|---|---|
| **Document** | FOB — Module Map (Stage 3) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — module boundaries for sponsor agreement; nothing is Reliable until ratification (`/and-ratify`). |
| **Sources** | `Intake_Note.md` · `DOMAIN-LEXICON.md` · `Journey_Index.md` · `architecture/FOB_Modular_Architecture_v1_4.md` §5, §7 (Shared Core + dependency direction) · `AnD_Stage_Templates_v0_1.md` (T3) |

**Scope:** the six Lean-6 core-capability modules. Business-function modules (PRE/BOOK/TOUR/OPS/POST/FLEET) and the App axis are *presumed consumers*, not decomposed here.

---

## 1. Modules
| Code | Module | Intent (one line) | depends-on | presumes | Core features | Deferred |
|---|---|---|---|---|---|---|
| **DATA** | `core-data-access` | Provide one D1 access pattern and a versioned, ordered migration runner. | — | Cloudflare D1 (UK) | Single access layer; migration runner (run-once, in-order); transaction helper | Read-replica / sharding; query metrics |
| **AUTH** | `core-auth` | Authenticate each actor by the mechanism that fits their context, and expose middleware. | DATA | Cloudflare KV | Operator JWT+KV (HS256, 1h); customer signed-link→session; guide `X-Device-ID` validation; auth middleware | Cloudflare Access/SSO; concierge session identity (UJ-AUTH-D1) |
| **CNA** | `core-consent-audit` | Record consent and audit events append-only, and erase dormant PII on schedule. | DATA | Cloudflare Cron (gdpr-cleanup) | Append-only consent record + current-state query; append-only audit log; 90-day anonymisation | Article 30 RoPA inventory (UJ-CNA-D1); non-prospect PII erasure |
| **NOTIF** | `core-notifications` | Deliver required messages once, on the right channel, and track deliverability. | DATA, CNA | Postmark (email); Twilio (SMS/WhatsApp); Cloudflare Cron | Transactional send (idempotent); delivery/bounce state; duplicate suppression; owner alerts; consent-gated marketing send | Knock orchestration (UJ-NOTIF-D1); Cloudflare-native email (UJ-NOTIF-D2) |
| **SEO** | `core-seo` | Make public pages fully crawlable and keep them current with the catalogue. | — *(within Lean-6)* | `marketing` + `route-catalogue` BF read APIs; a static-build mechanism | Meta-tag generation; structured-data (schema.org); sitemap generation | Multilingual structured data beyond marketing (UJ-SEO-D1) |
| **DS** | `core-design-system` | Render every customer surface from one set of shared brand tokens; each app builds its own components on top. *(Reworded per DR-11, Stage 5.)* | — | — (consumed by App modules) | CSS token set (forest palette); type (Syne/DM Sans); per-app component library (Flutter library is to-build — DR-12) | Full theming / dark mode; accessibility (WCAG) pass |

| **BOOK** | `booking` | Take a customer from tour selection through a confirmed (paid or provisionally-confirmed), booked-exactly-once tour, and support in-policy modification/cancellation. | DATA, AUTH, CNA, NOTIF, **PRE** | Cloudflare D1; Stripe (Embedded Checkout) | Selection + slot hold; attendee details; waiver/T&C consent (writes via CNA); payment (Stripe Embedded Checkout); exactly-once confirmation; modify/cancel within policy; owner-created bookings; abandonment handling; provisional (unpaid) booking (D-BOOK-1); **departure scheduling — create/update/cancel (REQ-BOOK11–13, run Bacon, DR-BO1); bike-to-departure allocation (REQ-BOOK14, DR-BO2a)** | OTA bookings (UJ-BOOK-08, v2); gift vouchers (UJ-BOOK-11) |
| **PRE** | `pre-sales` | Take a prospect from first contact through catalogue browsing, availability checking, enquiry, and saved-tour follow-up, to conversion into `booking`. | DATA, CNA, NOTIF | Cloudflare D1; RCA `tours`/`routes`/`waypoints`/`guides` read APIs; `booking` read API (departure/slot capacity) | Catalogue browse; tour detail; availability check; group/private/corporate enquiry; save-by-email + one consent-gated nudge; convert-to-booking handover | Concierge/AI chatbot (UJ-PRE-04, UJ-PRE-07 — own future module) |
| **OPS** | `tour-operations` | Enforce the operational compliance discipline surrounding a tour — pre-tour checks, rider check-in, briefing, departure sign-off, mid-tour issue/incident handling, post-tour review and hazard log. | DATA, AUTH, CNA, NOTIF, **BOOK**, **FLEET** | GMT (existing navigation PWA); Met Office API; TfL API; Cloudflare R2 | Kit/bike checks; dynamic risk assessment; per-rider check-in incl. waiver re-confirmation; safety briefing; departure gate; mid-tour issue log; incident response + formal report + insurer dispatch; post-ride review; hazard log | None within OPS — GMT (navigation) is a separate, presumed module |
| **FLEET** | `fleet-equipment` | Track bikes and safety equipment through onboarding and maintenance; be the destination for `tour-operations`' service flags; track compliance dates. | DATA, AUTH, NOTIF | *(none — photo capture ruled out, DR-F5)* | Bike/equipment onboarding (individual only); fleet readiness view; flagged-bike maintenance loop (in-house only); compliance date tracking (on-event alerts) | Retire/dispose workflow (UJ-FLEET-06, dropped — DR-F8); scheduled maintenance trigger and combined certification gate (ratified direction, REQs not yet authored) |
| **POST** | `post-tour` | Close the loop after a completed tour: thank-you, review request, internal feedback with a direct low-rating alert, and marketing preferences. **Deliberately tight scope** (sponsor decision, 2026-07-21). | DATA, CNA, NOTIF, **BOOK**, **OPS** | TripAdvisor, Google Reviews (external, manual — no in-system monitoring this pass) | Thank-you (transactional); review request (one-shot); internal feedback + direct Owner alert on low rating; marketing preferences/unsubscribe | Shared tour photos (UJ-POST-04, v2 sketch); recovery-contact logging, public-review monitoring, repeat-booking/lapsed nudges, marketing campaigns, GDPR deletion mechanism (all UJ-POST-05–09 + erasure — deferred to a future phase, not this pass) |
| **TOUR** | `pre-tour` | Sustain customer trust between payment and tour day — tour hub, scheduled reminders, weather advisories, self-service updates, operator-change/cancellation handling, late-arrival/no-show management. | DATA, AUTH, CNA, NOTIF, **BOOK**, **OPS** | Met Office API; TfL API; GMT (day-of guide contact) | Tour hub; scheduled reminders; weather advisories; non-financial self-service updates; operator-change/cancellation notices + response; late-arrival notice; no-show recording + policy | Booked-customer concierge (UJ-TOUR-05 — own future module) |
| **BO** | `back-office` | Give the Owner the planning/oversight surface the other modules presume: departure calendar, booking browse/detail, and bike-to-tour allocation. *(Departure create/update/cancel relocated to BOOK, DR-BO1.)* Run **Bacon**. | core-auth, **BOOK**, **FLEET**, **pre-tour** | Cloudflare D1; `route-catalogue` (tours read) | Departure calendar (REQ-BO04); booking search + detail (REQ-BO05/06); bike-to-departure allocation **surface** (A20 — the write is booking's REQ-BOOK14, DR-BO2a) | Recurring departures (DR-BO4); automated bike rotation (DR-BO2); build-as-screens-vs-sessions (DR-BO6) |

**Confidence note (R4):** every row is `PROPOSED`. Facts underpinning them (built JWT+KV, `consents` DDL, Postmark, design tokens) are `Reliable` and live in the lexicon/intake — the *module packaging* of those facts is what's proposed here.

## 2. Dependency direction (acyclic, one-directional)

```
AUTH  ─▶ DATA          (auth reads devices/guides; sessions in KV)
CNA   ─▶ DATA          (consents + audit_log tables)
NOTIF ─▶ DATA          (message log + idempotency keys)
NOTIF ─▶ CNA           (marketing sends consult consent state — UJ-CNA-05)
SEO   ─▶ (marketing / route-catalogue BF, static-build)   [presumed; out of Lean-6]
DS    ─▶ (nothing)     (leaf; consumed by App modules)
BOOK  ─▶ DATA          (bookings/departures/participants/payments tables)
BOOK  ─▶ AUTH          (manage-booking session — REQ-AUTH02)
BOOK  ─▶ CNA           (waiver/T&C/marketing consent writes — REQ-CNA01)
BOOK  ─▶ NOTIF         (confirmation + owner alerts — REQ-NOTIF01/04)
BOOK  ─▶ PRE           (reads `enquiries` to convert one into a booking — REQ-BOOK08)
BOOK  ─▶ FLEET         (reads bike status to validate a bike-to-departure assignment — REQ-BOOK14, DR-BO2a; acyclic, FLEET knows nothing of BOOK)
PRE   ─▶ DATA          (prospects/enquiries/saved_tours tables)
PRE   ─▶ CNA           (consent writes — REQ-CNA01; nudge-send gate — REQ-CNA05)
PRE   ─▶ NOTIF         (owner alerts for enquiries — REQ-NOTIF04; nudge send — REQ-NOTIF01)
OPS   ─▶ DATA          (tour_readiness/rider_checkins/incidents/hazard_log tables)
OPS   ─▶ AUTH          (guide device recognition — REQ-AUTH03)
OPS   ─▶ CNA           (audit trail for incidents/refusals — REQ-CNA03)
OPS   ─▶ NOTIF         (owner alerts — REQ-NOTIF04)
OPS   ─▶ BOOK          (reads booking/participant/health-declaration data for rider check-in)
OPS   ─▶ FLEET         (bike status read + flagging call — corrected 2026-07-21, F-42)
FLEET ─▶ DATA          (bikes/equipment/maintenance_events/compliance_items tables)
FLEET ─▶ AUTH          (Owner operator session — reuses REQ-AUTH01)
FLEET ─▶ NOTIF         (compliance alerts, flagged-bike notifications)
POST  ─▶ DATA          (`feedback` table only, this pass — `public_reviews`/`recovery_contacts` deferred with their journeys)
POST  ─▶ CNA           (consent writes — REQ-CNA01)
POST  ─▶ NOTIF         (thank-you + review-request messages)
POST  ─▶ BOOK          (reads booking-completion status)
POST  ─▶ OPS           (trigger from REQ-OPS10's "review request" tick)
TOUR  ─▶ DATA          (reminders/weather_advisories/operator_notices tables)
TOUR  ─▶ AUTH          (manage-booking session — reuses REQ-AUTH02)
TOUR  ─▶ CNA           (audit trail for cancellation remediation — REQ-CNA03)
TOUR  ─▶ NOTIF         (all reminders/advisories/notices — REQ-NOTIF01/04)
TOUR  ─▶ BOOK          (reads/updates booking status; triggers refund/rebook via REQ-BOOK06/07)
TOUR  ─▶ OPS           (reads rider check-in data for no-show detection)
BO    ─▶ AUTH          (operator session — REQ-AUTH01)
BO    ─▶ BOOK          (owns departures + bookings; BO drives REQ-BOOK11/12/13, reads bookings)
BO    ─▶ FLEET         (reads bike status for the A20 allocation picklist — surfaces booking's REQ-BOOK14)
BO    ─▶ TOUR          (orchestrates operator change/cancel notices on departure edit/cancel — REQ-TOUR05/07)
```

- **DATA** is the base — it knows nothing of AUTH/CNA/NOTIF/BOOK/PRE.
- **CNA** knows nothing of NOTIF (NOTIF calls CNA's public API, not the reverse).
- **DS** and **SEO** are independent of the backend trio; DS is a frontend leaf, SEO presumes BF read APIs that sit outside this run.
- **BOOK** depends on PRE (reads enquiries to convert them) — PRE does **not** depend back on BOOK. PRE's need to read departure/slot capacity (UJ-PRE-05) is handled as a **presumed** read-only interface (§1), not a `depends-on` edge — this is what keeps the graph acyclic despite both modules needing data from each other's domain.
- **OPS** depends on BOOK (reads booking/participant data for rider check-in) — extending the chain PRE ← BOOK ← OPS. BOOK knows nothing of OPS. The refusal-to-ride refund flag (D-OPS-4) is an Owner reading OPS's flag and acting in `booking`'s own admin surface (A8) — a human cross-surface workflow, not a system dependency running the other way.
- **TOUR** depends on both BOOK (parallel to OPS's own edge — both are leaves off booking, not sequential) and OPS (reads rider check-in data for no-shows). Neither BOOK nor OPS depends back on TOUR.
- **POST** depends on BOOK and OPS — narrower than originally scoped (the PRE edge, needed only for the now-deferred repeat-booking/lapsed nudges, is dropped from this pass). Still strictly one-directional; neither BOOK nor OPS knows POST exists.
- **BO** (run Bacon) is a **leaf consumer** — nothing depends on it. It depends on AUTH/BOOK/FLEET/TOUR. Critically, the departure create/cancel work lives in **BOOK** (which does *not* depend on TOUR), while the customer-notice orchestration lives in **BO** (which does): this is what keeps BOOK ↔ TOUR acyclic. Had cancel-departure stayed a BOOK REQ that called TOUR, it would have formed BOOK→TOUR→BOOK — the refinement noted in DR-BO1's propagation.
- No cycles.

## 3. Journey → module allocation
| UJ id | Owning module | Crosses into |
|---|---|---|
| UJ-AUTH-01 · operator sign-in | AUTH | DATA (session/actor), CNA (audit the sign-in — optional) |
| UJ-AUTH-02 · customer signed-link session | AUTH | DATA |
| UJ-AUTH-03 · guide device recognised | AUTH | DATA (`devices`, `guides`) |
| UJ-AUTH-04 · session renewed on expiry | AUTH | — |
| UJ-CNA-01 · record marketing permission | CNA | DATA (`consents`) |
| UJ-CNA-02 · withdraw permission | CNA | DATA; NOTIF (suppression) |
| UJ-CNA-03 · audit money/safety action | CNA | DATA (`audit_log`) |
| UJ-CNA-04 · erase dormant PII (90d) | CNA | DATA (`prospects`), **presumes Cron** |
| UJ-CNA-05 · check permission before contact | CNA | *(consulted by NOTIF)* |
| UJ-NOTIF-01 · transactional send | NOTIF | DATA (log/idempotency), **presumes Postmark/Cron** |
| UJ-NOTIF-02 · delivery outcome → contactability | NOTIF | DATA, **presumes provider webhook** |
| UJ-NOTIF-03 · suppress duplicate send | NOTIF | DATA (idempotency key) |
| UJ-NOTIF-04 · owner actionable alert | NOTIF | **presumes Postmark/Twilio** |
| UJ-SEO-01 · crawler reads full page | SEO | marketing/route-catalogue BF *(presumed)* |
| UJ-SEO-02 · advertise crawlable index | SEO | static-build *(presumed)* |
| UJ-SEO-03 · regenerate on content change | SEO | static-build *(presumed)* |
| UJ-DS-01 · surface renders from design system | DS | App modules *(presumed consumers)* |
| UJ-DS-02 · token change propagates | DS | App modules *(presumed)* |
| UJ-DATA-01 · apply migration in order | DATA | — |
| UJ-DATA-02 · persist via one access pattern | DATA | *(used by all BFs — infrastructure)* |
| UJ-BOOK-01 · enter booking flow, confirm selection | BOOK | DATA (slot hold, draft) |
| UJ-BOOK-02 · provide attendee details | BOOK | DATA |
| UJ-BOOK-03 · review terms, sign waiver, give consent | BOOK | CNA (REQ-CNA01, marketing consent) |
| UJ-BOOK-04 · pay | BOOK | DATA (payment record); presumes Stripe |
| UJ-BOOK-05 · receive confirmation | BOOK | NOTIF (REQ-NOTIF01), DATA |
| UJ-BOOK-06 · modify an existing booking | BOOK | AUTH (session), DATA |
| UJ-BOOK-07 · cancel a booking and request refund | BOOK | AUTH, DATA, NOTIF (cancellation email) |
| UJ-BOOK-09 · owner creates a booking from an enquiry | BOOK | AUTH (operator session), DATA, NOTIF, **PRE** (reads `enquiries`) |
| UJ-BOOK-10 · handle payment failure or abandonment | BOOK | DATA |
| UJ-BOOK-12 · complete a booking without payment | BOOK | DATA, AUTH; **policy hole — D-BOOK-2** |
| UJ-PRE-01 · land on site and orient | PRE | *(presumed RCA `tours` read)* |
| UJ-PRE-02 · browse catalogue and shortlist | PRE | *(presumed RCA `tours` read)* |
| UJ-PRE-03 · inspect a single tour in depth | PRE | *(presumed RCA `tours`/`routes`/`waypoints`/`guides` read)* |
| UJ-PRE-05 · check availability for dates/party size | PRE | *(presumed `booking` read — departure/slot capacity)* |
| UJ-PRE-06 · submit a group/corporate/private enquiry | PRE | DATA (`enquiries`), CNA (REQ-CNA01, consent), NOTIF (REQ-NOTIF04, owner alert — SQ-17) |
| UJ-PRE-08 · save/return later | PRE | DATA (`saved_tours`), CNA (REQ-CNA01/05, consent + nudge gate), NOTIF (REQ-NOTIF01, nudge send) |
| UJ-PRE-09 · convert, enter booking flow | PRE | **BOOK** (handover — presumed target, not a PRE dependency; BOOK is the one that later reads PRE's enquiry data if applicable) |
| UJ-OPS-01 · receive tour assignment and prepare | OPS | BOOK (rider list read) |
| UJ-OPS-02 · travel kit check | OPS | DATA |
| UJ-OPS-03 · bike inspection | OPS | DATA; **FLEET** (bike status read + flagging call, corrected 2026-07-21) |
| UJ-OPS-04 · dynamic risk assessment and decisions log | OPS | DATA; presumed Met Office/TfL APIs |
| UJ-OPS-05 · rider check-in | OPS | BOOK (participant/health-declaration read), DATA |
| UJ-OPS-06 · safety briefing delivery | OPS | DATA |
| UJ-OPS-07 · final pre-departure sign-off | OPS | DATA; presumed GMT (tour-start handover) |
| UJ-OPS-08 · manage a mid-tour participant issue | OPS | DATA |
| UJ-OPS-09 · respond to an incident | OPS | NOTIF (REQ-NOTIF04), CNA (REQ-CNA03) |
| UJ-OPS-10 · complete post-ride review | OPS | DATA |
| UJ-OPS-11 · file incident report and insurer notification | OPS | NOTIF, CNA |
| UJ-OPS-12 · update the route hazard log | OPS | DATA; presumed GMT (proximity-alert consumer) |
| UJ-TOUR-01 · access the tour-day information hub | TOUR | AUTH (session), BOOK (booking read) |
| UJ-TOUR-02 · receive scheduled pre-tour reminders | TOUR | NOTIF (REQ-NOTIF01), BOOK (booking status read) |
| UJ-TOUR-03 · receive a weather advisory | TOUR | NOTIF; presumed Met Office API |
| UJ-TOUR-04 · update attendee details or special requirements | TOUR | BOOK (`participants` update), NOTIF (safety-significant alert) |
| UJ-TOUR-06 · receive an operator-initiated change | TOUR | NOTIF |
| UJ-TOUR-07 · receive an operator-initiated cancellation | TOUR | BOOK (REQ-BOOK07 refund trigger), NOTIF, CNA (REQ-CNA03) |
| UJ-TOUR-08 · day-of preparation and arrival | TOUR | *(folded into UJ-TOUR-02's thread)*; presumed GMT/TfL |
| UJ-TOUR-09 · notify operator of late arrival | TOUR | FOB ops number (DR-T7) |
| UJ-TOUR-10 · no-show / non-arrival handling | TOUR | OPS (`rider_checkins` read), NOTIF |
| UJ-FLEET-01 · onboard a bike | FLEET | DATA |
| UJ-FLEET-02 · onboard/replace equipment | FLEET | DATA |
| UJ-FLEET-03 · view fleet dashboard | FLEET | DATA |
| UJ-FLEET-04 · handle a flagged bike | FLEET | DATA; **consulted by OPS** (REQ-OPS03's flagging call) |
| UJ-FLEET-05 · track compliance dates | FLEET | NOTIF (alerts); consulted by OPS (REQ-OPS04 RA reads PLI status) |
| UJ-FLEET-06 · retire/dispose an asset | FLEET | DATA |
| UJ-POST-01 · receive thank-you and tour summary | POST | OPS (trigger), BOOK (completion read), NOTIF |
| UJ-POST-02 · submit a public review | POST | NOTIF |
| UJ-POST-03 · submit internal feedback | POST | DATA; alerts Owner directly on low rating (no separate recovery-logging module this pass) |
| UJ-POST-10 · manage marketing preferences / unsubscribe | POST | CNA (REQ-CNA01 consent write) |
| UJ-POST-05, 06, 07, 08, 09 | *(deferred to a future phase — sponsor decision 2026-07-21, not allocated this pass)* | — |
| UJ-BO-01 · schedule a departure | **BOOK** (REQ-BOOK11) | BO (Owner-facing surface/orchestration) |
| UJ-BO-02 · update a departure | **BOOK** (REQ-BOOK12) | BO → TOUR (material-change notice) |
| UJ-BO-03 · cancel a departure | **BOOK** (REQ-BOOK13) | BO → TOUR → BOOK (per-booking remediation) |
| UJ-BO-04 · view the departure calendar | BO | BOOK (departure/booking read) |
| UJ-BO-05 · search bookings | BO | BOOK (booking read) |
| UJ-BO-06 · view a booking's details | BO | BOOK, CNA (waiver/consent read) |
| UJ-BO-07 · allocate bikes to a tour | **BOOK** (REQ-BOOK14 — owns `bike_assignments`, DR-BO2a) | BO (A20 surface), FLEET (bike status read) |

Every core journey from the Journey Index is allocated to exactly one owning module; cross-module steps are marked in the right-hand column.

## 4. Unowned ground (declared, not discovered later)
| Concern | Belongs to | Status |
|---|---|---|
| `audit_log` entity schema | `core-consent-audit` | **DEFERRED — DR-6, to design at Stage 6a** (no DDL exists; P-05). |
| auth-session `revoked` (logout) transition | `core-auth` | **RESOLVED — DR-4.** REQ-AUTH05 authored. |
| PII erasure for **non-prospect** entities (bookings/participants) | not allocated — `post-tour` considered as a future owner, not this pass | **STILL DEFERRED — DR-7.** `post-tour`'s tight scope (2026-07-21) deliberately excludes building any deletion/erasure mechanism; DR-7's interim default (retain, never auto-erase) continues to stand. |
| Static-build / rebuild trigger (UJ-SEO-03) | `core-seo` | **RESOLVED — DR-10.** Manual publish only (not automated); REQ-SEO03 rewritten. |
| Marketing consent-gate integration point | `core-notifications` ↔ `core-consent-audit` | **STILL OPEN — D-NOTIF-1** (`Decision_Record_Aristotle_2026-07-20.md`). Interim default: native integration, PoC-validated, no vendor lock. |
| Idempotency-key store (D1 vs KV) | `core-notifications` / webhooks | **RESOLVED — DR-8.** D1, `webhook_events` pattern. |
| SMS/WhatsApp channel | `core-notifications` | **STILL OPEN — D-NOTIF-1**, same as above. |
| Deliverability suppression list | `core-notifications` | **PRESUMED — not yet modelled.** |
| Canonical booking-site source (`rome-dev` vs `admin-rome`) | DATA/AUTH/NOTIF (shared libs) | **RESOLVED — DR-1.** `admin-rome` canonical; `rome-dev` treated as spurious. |
| Slot-hold transaction pattern (KI-6/KI-10) | `booking` | **RESOLVED — DR-B3** (`Decision_Record_Booking_Aristotle_2026-07-20.md`). D1 transactional decrement. |
| Provisional (unpaid) booking — owner-created, per-booking terms | `booking` | **RESOLVED — DR-B1, DR-B2.** Owner-created only (not self-service); Owner sets hold/deposit/reminder terms per booking. |
| On-day individual waiver re-confirmation | `tour-operations` (OPS), UJ-OPS-05 rider check-in | **CORRECTED 2026-07-20 — DR-B7.** Not paper, as originally assumed — a digital signature-pad re-confirmation, part of OPS's rider check-in flow. Party-level digital waiver stays `booking`'s (REQ-BOOK03). |
| Consent-gated abandonment-recovery email | `core-notifications` (consulting `core-consent-audit` REQ-CNA05) | **NEW — DR-B8.** Direction ratified (send, gated by consent); the REQ itself is not yet authored in either module. |
| Gift vouchers (UJ-BOOK-11) | `booking` | **DEFERRED from this pass** — confirmed in business scope, not analysed yet. |
| OTA bookings (UJ-BOOK-08) | `booking` | **DEFERRED — v2 sketch**, per source doc. |
| Concierge/AI chatbot (UJ-PRE-04, UJ-PRE-07) | not yet allocated — own future module | **DEFERRED** — 100% greenfield stack (Durable Objects, Vectorize, Claude API); sponsor decision 2026-07-20. |
| Overdue-enquiry-SLA auto-email (source doc: apology + extended SLA at 24h overdue) | `pre-sales` / `core-notifications` | **DEFERRED — DR-P3** (`Decision_Record_PreSales_Aristotle_2026-07-20.md`). Overdue enquiries stay visible to the Owner (REQ-PRE05); no auto-email built. |
| WhatsApp owner-alert channel | `core-notifications` | **NOT BUILT/SPEC'D — DR-P1.** Daily digest email is the only owner-alert path for enquiries until this exists. |
| Minor party-composition limit (max 2 per party, dedicated adult each) | `booking` (correction) | **PARKED — D-OPS-7** (`Decision_Record_TourOps_Aristotle_2026-07-20.md`). Not applied to `booking.md`; OPS's own risk-assessment/check-in checks (REQ-OPS04/05) are the interim safety net. |
| Formal Health Declaration section | `booking` (correction) | **PARKED — D-OPS-8.** Same treatment as above. |
| Signature capture mechanism (stylus vs typed-confirm) | `tour-operations` | **RESOLVED — DR-O1.** Split: full signature for waivers/declarations, typed-confirm for routine sign-offs. |
| Per-bike vs per-fleet inspection on shared same-day fleets | `tour-operations` | **RESOLVED — DR-O2.** Full repeat, every tour, no shortcut. |
| Bike-service-flag propagation workflow | `tour-operations` → **`fleet-equipment`** | **RESOLVED — DR-O3, ownership corrected 2026-07-21 (F-42).** Status workflow lives in `fleet-equipment` (UJ-FLEET-04); OPS calls into it rather than owning `bikes` itself. GAP-6b-3 (Owner-clears-flagged-bike) is now formally FLEET's own UJ-FLEET-04, not an open OPS gap. |
| Refusal-to-ride refund handling | `tour-operations` ↔ `booking` (A8) | **RESOLVED — DR-O4.** Guide flags, Owner processes via `booking`'s existing admin surface. |
| PLI insurer incident-report format | `tour-operations` | **STILL OPEN — D-OPS-5** (`Decision_Record_TourOps_Aristotle_2026-07-20.md`). Deferred/stubbed; conservative internal record meanwhile, Owner to confirm real format. |
| Photo capture in incidents/hazard log | `tour-operations` | **RESOLVED — DR-O5.** Out of scope this pass. |
| Reminder cadence | `pre-tour` | **RESOLVED — DR-T1.** Light: T-1 only. Day-of (T-0) reminder removed as a result (carried hole against UJ-TOUR-08). |
| Reminder/advisory channel choice | `pre-tour` (= `core-notifications` D-NOTIF-1) | **STILL OPEN — D-TOUR-2** (`Decision_Record_PreTour_Aristotle_2026-07-21.md`). Tied to D-NOTIF-1, not ratified independently. |
| Weather-alert thresholds | `pre-tour` | **STILL OPEN — D-TOUR-3.** Deferred; informational-only interim, no auto-escalation to cancellation-candidate without real numbers. |
| Self-service detail-update field scope | `pre-tour` | **RESOLVED — DR-T4.** Routine self-service; safety-significant changes alert the Owner. |
| Cancellation remediation options | `pre-tour` | **RESOLVED — DR-T5.** Choose-your-own: refund/rebook/credit. |
| Late-arrival grace period | `pre-tour` | **RESOLVED — DR-T6.** Configurable per tour. |
| Day-of guide contact mechanism | `pre-tour` | **RESOLVED — DR-T7.** FOB ops number. |
| No-show policy | `pre-tour` (ties to `booking` DR-B5) | **RESOLVED — DR-T8.** Manual, Owner-decided, per DR-B5's precedent. |
| Calendar invite delivery | `pre-tour` | **RESOLVED — DR-T9.** Both .ics and an add-to-calendar widget. |
| Day-of (T-0) reminder / morning-of prep step (UJ-TOUR-08) | `pre-tour` | **NEW carried hole — DR-T1.** Removed under the light cadence; the source doc's morning-of reminder step has no REQ backing it now. |
| Booked-customer concierge (UJ-TOUR-05) | not yet allocated — joins the future concierge module | **DEFERRED** — same AI-stack dependency as UJ-PRE-04/07. |
| Maintenance scheduling trigger (scheduled, time+mileage) | `fleet-equipment` | **RESOLVED (direction) — DR-F1**, but **no REQ authored yet** — a real follow-up gap, not just a ratified decision. Both time- and mileage-based, on top of the existing reactive flag path. |
| Helmet replacement policy | `fleet-equipment` | **RESOLVED — DR-F2.** No fixed age policy; annual check reminder instead. |
| Bike status state machine confirmation | `fleet-equipment` | **RESOLVED — DR-F3.** Confirmed as drafted (2 of 6 states now have no REQ driving them — see below). |
| Compliance tracking scope | `fleet-equipment` | **RESOLVED — DR-F4.** Core set only (PLI/EL/ICO/helmet review/first aid). |
| Photo capture policy (bikes/equipment) | `fleet-equipment` | **RESOLVED — DR-F5.** Not needed — no photo capture anywhere in this module. |
| Pre-tour-day fleet certification gate | `fleet-equipment` ↔ `tour-operations` | **RESOLVED (direction) — DR-F6**, but **no REQ authored yet** — a real follow-up gap. Yes to a combined gate, likely consumed by REQ-OPS04. |
| Compliance alert cadence | `fleet-equipment` | **RESOLVED — DR-F7.** On-event-only, no recurring digest. |
| Retire/restore workflow | `fleet-equipment` | **DROPPED FROM CORE SCOPE — DR-F8.** UJ-FLEET-06 removed; a bike is just flagged unusable with a reason (REQ-FLEET04). Genuine disposal handled off-system. |
| `retired` and `awaiting-external-service` bike states | `fleet-equipment` | **DECLARED HOLES — DR-F8, DR-F9.** Confirmed in the state machine (DR-F3) but no REQ drives a transition into either; deliberate, not an oversight. |
| External service provider logging | `fleet-equipment` | **RESOLVED — DR-F9.** Off-system, not modelled at all. |
| Bulk equipment onboarding workflow | `fleet-equipment` | **RESOLVED — DR-F10.** Line-by-line only, no bulk, no photo. |
| Negative-experience trigger criteria | `post-tour` | **RESOLVED (simplified) — D-POST-1.** Rating threshold only (≤3★), no keyword/sentiment detection. |
| Thank-you email classification | `post-tour` | **RESOLVED — D-POST-9.** Transactional, always sent. |
| GDPR retention period reconciliation (KI-16) | `post-tour` ↔ `core-consent-audit` (DR-7) | **RESOLVED (policy stated, process not built) —** `post-tour` aligns with DR-7's 90-day rule; no separate 24-month figure, no deletion mechanism built this pass. |
| Recovery-contact formal logging, public-review monitoring, repeat-booking/lapsed nudges, marketing campaigns, discount codes, newsletter cadence, testimonial consent scope, cross-tour promotion realism | `post-tour` | **DEFERRED TO A FUTURE PHASE — sponsor decision 2026-07-21.** These correspond to UJ-POST-05–09, dropped from this pass's core scope entirely, not just their underlying decisions (D-POST-2–8, D-POST-10 no longer apply to anything built now). |
| **Departure scheduling** (create/update/cancel a bookable departure) | `booking` | **RESOLVED — run Bacon, DR-BO1.** Was an *undeclared* gap (booking only presumed departures existed); now REQ-BOOK11/12/13. This is the load-bearing hole found after Aristotle. |
| **Owner booking-browse / departure calendar / bike-to-tour allocation** | `back-office` (BO) | **RESOLVED — run Bacon.** New BO module (REQ-BO04–07). |
| `bike_assignments` entity ownership (fleet vs booking) | `booking` | **RESOLVED — DR-BO2a (2026-07-21).** `booking` owns it; the assignment-write REQ relocated to `booking` as REQ-BOOK14; `booking` gains a read-only edge to `fleet-equipment`. Entity designed in `Data_Dictionary.md`; A20 surface live. |

---

## Gate 3 self-check (pass / carried)
- ✅ Every module declares `depends-on` and `presumes`.
- ✅ Dependency graph acyclic and one-directional (§2); DATA/CNA are depended-on and know nothing of dependents.
- ✅ Every journey allocated to exactly one owning module; cross-module steps marked (§3).
- ✅ Core vs deferred marked per module (§1).
- ✅ Unowned ground declared (§4) — 9 concerns named, not left for later discovery.

**Gate 3: PASS.** (Gate 4 not run — requirements not yet authored; blocked on ROME-GUIDE-001.)

---

*Stage 4 (per-module requirement specs, template T4 / GUIDE Part 4) is not started: it requires `pipeline/kit/REQUIREMENTSAUTHORINGGUIDE.md` (ROME-GUIDE-001), which is absent. Add it (README install step 2), then authoring can proceed against agreed boundaries.*
