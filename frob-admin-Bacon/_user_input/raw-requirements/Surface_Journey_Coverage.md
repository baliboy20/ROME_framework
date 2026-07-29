# FOB — Surface × Journey Coverage Matrix

| | |
|---|---|
| **Document** | FOB — Surface × Journey Coverage Matrix (Stage 6b) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — derived from ratified module specs |
| **Sources** | `core-auth.md`, `core-consent-audit.md`, `core-notifications.md`, `core-seo.md`, `booking.md`, `pre-sales.md`, `tour-operations.md`, `pre-tour.md`, `fleet-equipment.md`, `post-tour.md` (v0.2) (all Stage 4, post Stage 5 propagation) · `Journey_Index.md` · `Decision_Record_Aristotle_2026-07-20.md` (DR-4, DR-10) · `Decision_Record_Booking_Aristotle_2026-07-20.md` (DR-B1–B10) · `Decision_Record_PreSales_Aristotle_2026-07-20.md` (DR-P1–P4) · `Decision_Record_TourOps_Aristotle_2026-07-20.md` (DR-O1–O5) · `Decision_Record_PreTour_Aristotle_2026-07-21.md` (DR-T1, T4–T9) · `Decision_Record_Fleet_Aristotle_2026-07-21.md` (DR-F1–F10) · `Decision_Record_PostTour_Aristotle_2026-07-21.md` (DR-PT1–PT4) · `Decision_Record_Bacon_2026-07-21.md` (DR-BO1–6, DR-BO2a — run Bacon) |

**Purpose:** every journey lands on ≥1 surface; every surface is demanded by ≥1 journey and backed by a requirement. Anything failing either test is a gap, listed in §7.

**Note on scope:** `core-data-access` and `core-design-system` carry zero business-level REQs (presumed shared subsystem / design asset per ROME-GUIDE-001 Part 5) — their journeys are dispositioned as infrastructure/design-asset in their own module specs and are not behavioural surfaces. They are not omitted from this sweep; §5 verifies them explicitly.

---

## 1. Customer webapp (Customer, Prospect — desktop + mobile browser)

*Note: this and §5 (Public marketing site) are the same site, not two deployable properties — split here by rendering profile (interactive/Flutter-Web-island surfaces vs. static/no-script-required surfaces per F-09, `core-seo.md`), matching the built `admin-rome` pattern.*

| # | Surface | Device(s) | Journeys served | Requirements | Notes (incl. empty/error/loading states) |
|---|---|---|---|---|---|
| W1 | Booking access from signed link | desktop, mobile browser | UJ-AUTH-02 | REQ-AUTH02 | Loading: link verification in flight. Error: expired link → "This link has expired — request a new one"; invalid/tampered → "This link isn't valid"; booking not found → "We couldn't find that booking". Also carries REQ-AUTH04's error surface: an expired *session* (not link) mid-visit → "Your session has expired — please sign in again". |
| W2 | Customer session sign-out | desktop, mobile browser | UJ-AUTH-05 | REQ-AUTH05 | Empty state: n/a (single action). No error shown if already signed out (idempotent per REQ-AUTH05). |
| W3 | Marketing-preference / unsubscribe | desktop, mobile browser | UJ-CNA-02, UJ-POST-10 | REQ-CNA02, REQ-POST10 | No error shown even if no prior permission on record — treated as already-suppressed per REQ-CNA02. Reused (not duplicated) for `post-tour`'s granular preference management (REQ-POST10) — signed-link identified, no login. Error (POST): expired/tampered link → "This link has expired — request a new one," rate-limited. |
| W21 | Internal feedback capture (tour hub) | desktop, mobile browser | UJ-POST-03 | REQ-POST03 | A ≤3★ overall rating alerts the Owner directly (DR-PT2). No testimonial-consent field this pass (deferred). |
| W4 | Consent capture at enquiry/contact point | desktop, mobile browser | UJ-CNA-01 | REQ-CNA01 | **Owned by the `pre-sales` business function (presumed), not this Lean-6 run** — listed here because `core-consent-audit` demands it exist somewhere; the form itself is out of this coverage's authorship. Error: neither email nor phone identifies the prospect → "We need a contact detail to record your choice". Marketing checkbox must default unticked (never pre-granted). |

| W5 | Selection (tour/date/time/party-size) | desktop, mobile browser | UJ-BOOK-01 | REQ-BOOK01 | Loading: capacity re-query on each field change. Error: party size exceeds capacity → "This slot doesn't have enough space"; no capacity → "This slot is no longer available — please choose another". |
| W6 | Attendee details | desktop, mobile browser | UJ-BOOK-02 | REQ-BOOK02 | Error: required field missing → inline indication. In-progress entry is preserved across a hold-expiry interruption (REQ-BOOK02 non-functional). |
| W7 | Review, waiver, consent | desktop, mobile browser | UJ-BOOK-03 | REQ-BOOK03 | Error: waiver/T&C not accepted → "Please accept the waiver and terms to continue". Marketing consent checkbox never pre-ticked (consulted: REQ-CNA01). |
| W8 | Payment (embedded) | desktop, mobile browser | UJ-BOOK-04 | REQ-BOOK04 | Loading: payment in progress, inline, no redirect away. Error: card declined → "Your card was declined", retry offered. |
| W9 | Confirmation | desktop, mobile browser | UJ-BOOK-05 | REQ-BOOK05 | Empty state: n/a. Confirmation is durable via the email (E1), not dependent on this page being seen. |
| W10 | Manage booking (modify date / cancel) | desktop, mobile browser | UJ-BOOK-06, UJ-BOOK-07 | REQ-BOOK06, REQ-BOOK07 | Error (modify): within cancellation cut-off → blocked; party-size/attendee change requested → routed to "contact William" (DR-B4). Error (cancel): refund failure → booking stays confirmed, "William will follow up". Within-48h cancellation shows "William will confirm your refund" (DR-B5) rather than an automatic amount. |
| W11 | Tour catalogue (incl. homepage/orientation entry) | desktop, mobile browser | UJ-PRE-01, UJ-PRE-02 | REQ-PRE01 | Empty state: no tours match filters → reset option + route to enquiry (W14). Loading: skeleton on slow connection. |
| W12 | Tour detail | desktop, mobile browser | UJ-PRE-03 | REQ-PRE02 | Error: tour `paused` → status shown, no book action, enquiry route offered instead; tour not found → similar-tours suggestion. |
| W13 | Availability picker | desktop, mobile browser | UJ-PRE-05 | REQ-PRE03 | Error: date fully booked → next three alternatives suggested; party size >10 → blocked, routed to W14. |
| W14 | Group/private/corporate enquiry form | desktop, mobile browser | UJ-PRE-06 | REQ-PRE04 | Error: required field missing/invalid → inline validation. On submit: explicit SLA shown ("William will reply within one business day"). |
| W15 | Saved tours (drawer/strip + save-by-email) | desktop, mobile browser | UJ-PRE-08 | REQ-PRE06 | Error: invalid/missing email → inline validation. Nudge opt-in checkbox never pre-ticked. |
| W16 | Tour hub (extends W10) | desktop, mobile browser | UJ-TOUR-01 | REQ-TOUR01 | Error: booking cancelled → shows cancelled status + remediation outcome; tour date passed → completed state. Non-booker shared-link view redacts emergency contact. |
| W17 | Update attendee/special-requirements details | desktop, mobile browser | UJ-TOUR-04 | REQ-TOUR04 | Error: date/party-size change attempted → blocked, routed to W10 (`booking` REQ-BOOK06). Safety-significant change → still saves, Owner alerted (DR-T4). |
| W18 | Operator-change acknowledgement | desktop, mobile browser | UJ-TOUR-06 | REQ-TOUR06 | Shows explicit old-vs-new comparison. No error state — booking proceeds regardless of acknowledgement (REQ-TOUR06 invariant). |
| W19 | Cancellation remediation choice | desktop, mobile browser | UJ-TOUR-07 | REQ-TOUR08 | Three options shown (DR-T5: refund/rebook/credit). Error: no alternative date for rebook → tour credit auto-applied with apology. |
| W20 | "Running late" notice | desktop, mobile browser | UJ-TOUR-09 | REQ-TOUR09 | Only visible within the per-tour grace window (DR-T6). Fallback: FOB ops number shown if the surface can't be reached (DR-T7). |

## 2. Back-office / admin (Owner, Secondary operator — PC/iMac desktop browser, wide-screen fixed layout, not responsive/mobile)

| # | Surface | Device(s) | Journeys served | Requirements | Notes (incl. empty/error/loading states) |
|---|---|---|---|---|---|
| A1 | Operator sign-in | desktop browser | UJ-AUTH-01 | REQ-AUTH01 | Error: invalid credentials → "Sign-in failed — check your details"; session store unavailable → "Sign-in is temporarily unavailable — try again". Also carries REQ-AUTH04's expired-session redirect. |
| A2 | Operator sign-out | desktop browser | UJ-AUTH-05 | REQ-AUTH05 | Same idempotent behaviour as W2. |
| A3 | Deliverability status (bounced/complaint addresses) | desktop browser | UJ-NOTIF-02 | REQ-NOTIF02 | Empty state: no bounce/complaint history yet. Unmatched provider callback → flagged, never silently dropped. |
| A4 | Owner alert inbox | desktop browser | UJ-NOTIF-04 | REQ-NOTIF04 | Empty state: no pending alerts. Error: Owner channel unreachable → retried, then recorded here for in-app pickup as the fallback. |
| A5 | Audit log viewer | desktop browser | UJ-CNA-03, UJ-CNA-04 (erasure is itself audited) | REQ-CNA03, REQ-CNA04 | Empty state: no audited actions yet (unlikely in practice, declared for completeness). Incomplete entries (missing subject/actor) are shown flagged, not hidden. |
| A6 | Content-change → manual publish trigger | desktop browser | UJ-SEO-03 | REQ-SEO03 | **Manual-only per DR-10** — no automatic trigger exists; this control is the sole way published content changes. Loading: publish/rebuild in progress. No error state for "unpublished changes exist" — that is expected behaviour until the operator triggers publish (REQ-SEO03 rewrite). |
| A7 | Booking creation (from enquiry, or provisional from an emailed request) | desktop browser | UJ-BOOK-09, UJ-BOOK-12 | REQ-BOOK08, REQ-BOOK10 | Two entry points, one surface: enquiry-to-booking (REQ-BOOK08) and provisional-booking creation (REQ-BOOK10, Owner sets hold/deposit/reminder terms per booking — DR-B2, no defaults pre-filled). Error: agreed price differs from standard by more than a threshold → confirmation prompt (REQ-BOOK08). |
| A8 | Payment & refund management | desktop browser | *(supports UJ-BOOK-04, UJ-BOOK-07 from the Owner side)* | REQ-BOOK07; **auth per DR-B9** | Requires a `core-auth` operator session (REQ-AUTH01), not a standalone key (DR-B9 — corrects the POC's static-admin-key pattern). Empty state: no payments yet. Error: refund fails at provider → shown for manual follow-up. |
| A9 | Enquiry management (view + respond) | desktop browser | UJ-PRE-06 | REQ-PRE05 | Owner alert arrives as a daily digest email (DR-P1 — WhatsApp not built). Spam-flagged enquiries visible on a separate Spam tab, no alert fires (DR-P2). Overdue enquiries stay visibly flagged (no auto-email to the prospect — DR-P3). |
| A10 | Incident review & insurer dispatch | PC/iMac desktop browser, wide-screen | UJ-OPS-11 | REQ-OPS12 | Insurer dispatch mechanics are a stub — D-OPS-5 still open, format unconfirmed. Status tracked submitted→insurer_ack→reviewed→closed. |
| A11 | Hazard log review & approval | PC/iMac desktop browser, wide-screen | UJ-OPS-12 | REQ-OPS14 | Deduplicates against existing entries by street; a duplicate bumps `last_confirmed_at` rather than creating a new row. |
| A12 | Add bike | PC/iMac desktop browser, wide-screen | UJ-FLEET-01 | REQ-FLEET01 | Error: duplicate identifier → blocked, next-sequential suggested. No photo capture (DR-F5). |
| A13 | Add/replace equipment | PC/iMac desktop browser, wide-screen | UJ-FLEET-02 | REQ-FLEET02 | Line-by-line entry only, no bulk, no photo (DR-F10, DR-F5). Error: helmet impact → immediate retirement regardless of review status. |
| A14 | Fleet & equipment readiness view | PC/iMac desktop browser, wide-screen | UJ-FLEET-03 | REQ-FLEET03 | Empty state: n/a (fleet always has ≥1 asset once onboarded). Critical alerts never buried. |
| A15 | Flagged-bike maintenance (detail + event log + status update) | PC/iMac desktop browser, wide-screen | UJ-FLEET-04 | REQ-FLEET04, REQ-FLEET05, REQ-FLEET06 | No photo capture (DR-F5); external-service repairs not logged here (DR-F9, off-system). `retired`/`awaiting_external_service` transitions have no REQ (declared holes). |
| A16 | Compliance review & renewal | PC/iMac desktop browser, wide-screen | UJ-FLEET-05 | REQ-FLEET08 | On-event alert only, no recurring digest to check against (DR-F7) — this view is the primary way to see current state between alerts. |
| A17 | Departure calendar (read-only) | PC/iMac desktop browser, wide-screen | UJ-BO-04 | REQ-BO04 | *(run Bacon)* Date-ranged view of departures with fill (6/10) + readiness (guide ✓, bikes ?). Empty state: no departures in range → "No departures scheduled in this range". Editing routes to A18 (not inline). |
| A18 | Departure scheduler (create / update / cancel) | PC/iMac desktop browser, wide-screen | UJ-BO-01, UJ-BO-02, UJ-BO-03 | REQ-BOOK11, REQ-BOOK12, REQ-BOOK13 | *(run Bacon; departure REQs relocated to `booking`, DR-BO1)* Error (create): capacity >10 → "A departure can hold at most 10 riders"; duplicate `(tour,date,time)` → "That tour is already scheduled at that time". Error (update): capacity below current bookings → blocked; material date/time change on a booked departure → confirm "this will notify N customers" (notice sent via E5, orchestrated by back-office). Cancel with bookings → each booking routed to remediation (W19/E5). Guide optional at create → departure flagged "not ready to run" (DR-BO5). |
| A19 | Booking browser (search + detail) | PC/iMac desktop browser, wide-screen | UJ-BO-05, UJ-BO-06 | REQ-BO05, REQ-BO06 | *(run Bacon)* Search by ref/customer/tour/date/status; empty state → "No bookings match these criteria". Detail shows attendees, emergency contact, payment/refund as **provider references only** (never card data), consent/waiver timestamps (from `core-consent-audit`), status history. Not-found → "No booking found for that reference". Read-only — edits route to A7/A8 or `booking` REQ-BOOK06. |
| A20 | Bike allocation to a departure | PC/iMac desktop browser, wide-screen | UJ-BO-07 | REQ-BOOK14 *(booking-owned write, DR-BO2a resolved)* | *(run Bacon)* **Reached from** a departure on the calendar (A17) or scheduler (A18). **Layout (wide-screen):** left panel — departure header (tour, date/time, booked party size N, assigned guide); right — two lists: *Available bikes* (`in-service`, route-eligible for this tour, not already out on an overlapping departure — read from `fleet-equipment`) and *Assigned to this departure* (the departure's active `bike_assignments`). Owner moves bikes between the two lists; a running **"N of M riders covered"** counter shows provisioning. **States:** empty → "No available bikes for this slot — check the fleet"; loading → live bike-status read in flight. **Errors:** bike flagged/out-of-service → "FOB-00X is out of service — choose another"; already assigned to an overlapping departure → "FOB-00X is already out on another tour at that time". Under-provisioned (bikes < riders) → saves, flagged, and feeds the A17 calendar readiness indicator. |

## 3. Guide app (Guide — issued mobile/tablet device; G2–G13 are `tour-operations`' playbook extensions within the presumed GMT app shell)

| # | Surface | Device(s) | Journeys served | Requirements | Notes (incl. empty/error/loading states) |
|---|---|---|---|---|---|
| G1 | Device-identity recognition on app use | issued mobile/tablet device | UJ-AUTH-03 | REQ-AUTH03 | Implicit on every request via `X-Device-ID`, not a distinct screen. Error: device not registered → "This device isn't registered — contact the owner"; identity missing → "This device can't be identified". |
| G2 | Tour-day home / playbook overview | issued mobile/tablet device (GMT extension) | UJ-OPS-01 | REQ-OPS01 | Error: assignment missing/wrong → Guide contacts Owner, tour blocked; health flag incompatible → flagged to Owner before proceeding. Also surfaces a read-only bike-status snapshot from `fleet-equipment` (consumed, not a distinct FLEET surface). |
| G3 | Travel kit checklist | issued mobile/tablet device | UJ-OPS-02 | REQ-OPS02 | Error: critical item missing → sign-off blocked; partial required quantity → blocked or noted with Owner approval. Typed-confirm sign-off (DR-O1). |
| G4 | Bike inspection grid | issued mobile/tablet device | UJ-OPS-03 | REQ-OPS03 | Full signature declaration (DR-O1). No shortcut for same-day repeat fleets (DR-O2) — every bike, every tour. |
| G5 | Risk assessment + decisions log | issued mobile/tablet device | UJ-OPS-04 | REQ-OPS04 | Error: unresolved high-risk item → sign-off blocked, escalation to Owner prompted. Typed-confirm (DR-O1). |
| G6 | Rider check-in card | issued mobile/tablet device | UJ-OPS-05 | REQ-OPS05 | Full signature for waiver re-confirmation (DR-O1). Error: refusal cases (medical, intoxication, minor unaccompanied, waiver refused) → refused, flagged for Owner-processed refund (DR-O4). |
| G7 | Safety briefing script | issued mobile/tablet device | UJ-OPS-06 | REQ-OPS06 | Day-specific mitigations from G5 shown inline. Error: rider raises a mid-briefing issue → pause, resolve, resume. |
| G8 | Pre-departure sign-off summary | issued mobile/tablet device | UJ-OPS-07 | REQ-OPS07 | Error: any outstanding flag → sign-off blocked; significant delay (>30 min) → confirm shortened route or contact Owner. |
| G9 | Mid-tour event logger | issued mobile/tablet device | UJ-OPS-08 | REQ-OPS08 | No error states declared — every categorised outcome is a valid resolution. |
| G10 | Emergency / incident logger | issued mobile/tablet device | UJ-OPS-09 | REQ-OPS09 | No mobile signal → Guide seeks help via passer-by, logs once possible. Photo capture explicitly out of scope (DR-O5). |
| G11 | Post-ride review form | issued mobile/tablet device | UJ-OPS-10 | REQ-OPS10 | Error: not completed immediately → saved as draft, reminder before 24h deadline; un-flagged mentioned issue → confirmation prompt. Photo capture out of scope (DR-O5). |
| G12 | Incident report form (Guide submission) | issued mobile/tablet device | UJ-OPS-11 | REQ-OPS11 | Error: submission beyond the 2h statutory window → logged as a process exception. |
| G13 | Hazard observation entry | issued mobile/tablet device | UJ-OPS-12 | REQ-OPS13 | Photo capture out of scope (DR-O5). |

## 4. Email / SMS / WhatsApp (System-triggered, device-agnostic)

| # | Surface | Device(s) | Journeys served | Requirements | Notes (incl. empty/error/loading states) |
|---|---|---|---|---|---|
| E1 | Transactional message (confirmation, reminder) | device-agnostic (mail/SMS client) | UJ-NOTIF-01 | REQ-NOTIF01 | Never gated by marketing consent. Error: no contact address → not sent, gap logged for Owner (surfaces at A4/A3); provider rejects → "delivery pending", retried. |
| E2 | Marketing message | device-agnostic | *(consulted: UJ-CNA-05)* | REQ-NOTIF01 (marketing path), REQ-CNA05 | Sent only if current consent state is granted (REQ-CNA05); suppressed silently otherwise — no customer-visible error, by design. |
| E3 | Owner alert message | device-agnostic (Owner's configured channel) | UJ-NOTIF-04 | REQ-NOTIF04 | Same channel-unreachable fallback as A4. |
| E4 | Save-tour transactional email + nudge email | device-agnostic (mail client) | UJ-PRE-08 | REQ-PRE06, REQ-PRE07 | Transactional (tour summary) sends regardless of consent. Nudge sends only if marketing consent is current at send time (REQ-CNA05) and the tour isn't already booked; unsubscribe link prominent. |
| E5 | Pre-tour message (reminder, weather advisory, change/cancellation notice, no-show notice) | device-agnostic | UJ-TOUR-02, 03, 05 *(via REQ-TOUR05)*, 07 *(via REQ-TOUR07)*, 10 | REQ-TOUR02, REQ-TOUR03, REQ-TOUR05, REQ-TOUR07, REQ-TOUR10 | All bypass marketing-consent suppression (F-38). Channel choice pending D-TOUR-2. Calendar delivery: .ics attached + confirmation-page widget (DR-T9, `booking` REQ-BOOK05). |
| E6 | Compliance alert (on-event only) | device-agnostic | UJ-FLEET-05 | REQ-FLEET07 | Fires only when a compliance item's status changes (DR-F7) — no recurring digest. |
| E7 | Thank-you message | device-agnostic | UJ-POST-01 | REQ-POST01 | Transactional (DR-PT3) — sent regardless of marketing consent. Not sent for a no-show or operator-cancelled booking. |
| E8 | Review-request message | device-agnostic | UJ-POST-02 | REQ-POST02 | TripAdvisor + Google links, private-feedback option with equal visual weight. One-shot, no reminder this pass. |

## 5. Public marketing site (Prospect, search crawler — device-agnostic / no-script)

*Same site as §1 (Customer webapp) — see note there.*

| # | Surface | Device(s) | Journeys served | Requirements | Notes (incl. empty/error/loading states) |
|---|---|---|---|---|---|
| P1 | Crawlable tour/marketing page | device-agnostic; must render without executing scripts | UJ-SEO-01 | REQ-SEO01 | Error: incomplete content (missing title/description) → location still served, flagged for Owner (surfaces at A6/A3-style gap list — no dedicated surface yet, see §7 gap note). |
| P2 | Crawlable index (sitemap-equivalent) | device-agnostic | UJ-SEO-02 | REQ-SEO02 | Error: a published location absent from the index → treated as a gap, flagged for Owner. |

---

## No surface by design (verified, not forgotten)

| Requirement | Why no surface |
|---|---|
| REQ-NOTIF03 (reject duplicate send) | Purely internal idempotency check; its only externally observable effect is that the customer receives exactly one message via E1/E2/E3 — not a distinct surface. |
| REQ-CNA05 (read consent state) | Internal pre-send gate consulted by REQ-NOTIF01's marketing path; no actor interacts with it directly. |
| `core-data-access` (all journeys) | Presumed shared subsystem — infrastructure, not behaviour (ROME-GUIDE-001 Part 5). No REQs authored; realised at Stage 6d, not here. |
| `core-design-system` (all journeys) | Presumed shared design asset — tokens/components, not a journey surface. No REQs authored; realised at Stage 6e, not here. |
| REQ-BOOK09 (archive abandoned booking draft) | Purely internal hold-expiry cleanup; its only externally observable effect is that the departure's capacity becomes available again on W5 — not a distinct surface. |
| REQ-BOOK05 (confirm booking on payment success) | Provider-report-driven, internal; its observable effects land on existing surfaces (W9 confirmation, E1 email), not a surface of its own. |
| REQ-PRE08 (create booking-handover) | A "Book" CTA reachable from W11–W15, not a distinct screen — its only effect is starting `booking`'s W5 pre-filled. |
| REQ-TOUR10 (submit no-show-record and apply policy) | Internal, driven by `tour-operations`' rider check-in data; its only observable effect is the no-show notice landing on E5 — not a surface of its own. |
| REQ-FLEET07 (submit compliance-alert) | Internal daily evaluation; its only observable effect is the on-event alert landing on E6, not a surface of its own. |

---

## Gaps found

| ID | Gap | Severity | Proposed fix |
|---|---|---|---|
| GAP-6b-1 | REQ-SEO01's and REQ-SEO02's "flagged for the Owner" error outcomes (incomplete content; published-but-unindexed location) have no named surface to land on — A3/A6 cover notifications/messaging and publish-triggering, not a content-quality gap list. | Low — behaviourally covered (the flag exists per the REQ), just not yet given a home | **RESOLVED at Stage 6c** (`Operational_Workflows.md`) — folded into A6 as a content-quality panel alongside the publish trigger. |
| GAP-6b-2 | The consent-gated abandonment-recovery email (DR-B8) has a ratified *direction* but no owning REQ yet — cannot be given a surface here because it has no requirement to trace to. *(The on-day waiver half of this gap is resolved — DR-B7 correction identifies it as OPS's REQ-OPS05, now covered by G6.)* | Low — direction is set, not silently dropped | Not this stage's to fix — carried as unowned ground in `Module_Map.md` until `core-notifications`/`core-consent-audit` authors the REQ. |
| GAP-6b-3 | DR-O3 ratifies a bike-service-flag status workflow requiring an Owner action to clear a flagged bike, but no REQ in `tour-operations.md` authors that Owner-side action — no surface can be given for it here. | Low — direction is set, not silently dropped | **RESOLVED 2026-07-21** — ownership corrected (F-42): `fleet-equipment`'s REQ-FLEET06 is the Owner-clears-flagged-bike action, now covered by A15. |
| GAP-6b-4 | UJ-TOUR-08 (day-of preparation and arrival) has no REQ backing it at all — DR-T1's light-cadence ruling removed the T-0 milestone that would have driven its morning-of reminder step. The journey exists in `Journey_Index.md` but traces to nothing. | Low — a deliberate policy consequence, not a missed requirement | Carried as a known hole (`Module_Map.md`); no surface authored here since no REQ exists to trace to. Revisit only if the cadence is reopened. |

No journey is left without a surface *undeclared* — UJ-TOUR-08 is the one exception, and it is explicitly named as a carried hole rather than silently absent. No surface here is undemanded. GAP-6b-1 and GAP-6b-2 are placement/authoring gaps in already-declared decisions, not missing requirements discovered here.

---

## Coverage verdict

**Two-way sweep: PASS, with four carried refinements (GAP-6b-1–4) — GAP-6b-3 is now formally resolved.** Every core journey from `Journey_Index.md` — including all 10 of `booking`'s, 7 of `pre-sales`', 12 of `tour-operations`', 9 of `pre-tour`'s, 5 of `fleet-equipment`'s (UJ-FLEET-06 correctly excluded, dropped from scope), and 4 of `post-tour`'s tight-scope set (UJ-POST-05–09 correctly excluded, deferred to a future phase) — and every module's §5 journey table lands on at least one surface above (or is verified "no surface by design"), with the single explicit exception of UJ-TOUR-08 (GAP-6b-4, a deliberate policy consequence, not a missed requirement). Every surface listed is demanded by a named journey and traces to a requirement. `core-data-access` and `core-design-system` are confirmed to legitimately produce zero surfaces at this stage. All gaps found are placement/authoring/policy details for already-declared decisions, not coverage holes discovered fresh.

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial coverage matrix: 5 surface-owner groups, 13 surfaces, two-way sweep pass with one carried refinement (GAP-6b-1, content-quality-flag placement). |
| 0.2 | 2026-07-20T00:00:00Z | Added `booking`'s 6 customer-webapp surfaces (W5–W10) and 2 back-office surfaces (A7, A8); 2 new "no surface by design" entries (REQ-BOOK05, REQ-BOOK09); GAP-6b-2 logged (on-day waiver + abandonment email have no owning REQ yet). |
| 0.3 | 2026-07-20T00:00:00Z | Added `pre-sales`'s 5 customer-webapp surfaces (W11–W15), 1 back-office surface (A9), 1 email surface (E4); 1 new "no surface by design" entry (REQ-PRE08, handover CTA). |
| 0.4 | 2026-07-20T00:00:00Z | Added `tour-operations`'s 12 Guide-app surfaces (G2–G13) and 2 back-office surfaces (A10, A11). GAP-6b-2 narrowed (waiver half resolved by DR-B7's correction); GAP-6b-3 logged (Owner-clears-flagged-bike has no authored REQ yet). |
| 0.5 | 2026-07-21T00:00:00Z | Added `pre-tour`'s 5 customer-webapp surfaces (W16–W20) and 1 message surface (E5); 1 new "no surface by design" entry (REQ-TOUR10). GAP-6b-4 logged (UJ-TOUR-08 has no REQ, DR-T1 consequence) — the one journey in this coverage matrix without a surface, explicitly named rather than silently absent. |
| 0.6 | 2026-07-21T00:00:00Z | Added `fleet-equipment`'s 5 back-office surfaces (A12–A16) and 1 message surface (E6); 1 new "no surface by design" entry (REQ-FLEET07). **GAP-6b-3 resolved** — the ownership correction (F-42) means the Owner-clears-flagged-bike action is now A15, covered by REQ-FLEET06. UJ-FLEET-06 correctly excluded (dropped from scope, DR-F8). |
| 0.7 | 2026-07-21T00:00:00Z | Added `post-tour`'s tight-scope surfaces: 1 new customer-webapp surface (W21, feedback capture), 1 reused surface (W3 extended for REQ-POST10), 2 message surfaces (E7, E8). UJ-POST-05–09 correctly excluded (deferred to a future phase, not this pass). |
| 0.8 | 2026-07-21T00:00:00Z | **Run Bacon (`back-office`).** Added 4 back-office surfaces: A17 departure calendar (REQ-BO04), A18 departure scheduler (REQ-BOOK11/12/13, relocated per DR-BO1), A19 booking browser (REQ-BO05/06), A20 bike allocation (REQ-BO07, persistence pending DR-BO2a). All 7 UJ-BO journeys land on a surface; every new surface traces to a REQ. Two-way sweep still PASS. |
| 0.9 | 2026-07-21T00:00:00Z | **DR-BO2a resolved (booking owns).** A20 fully defined as a two-list allocation screen (available vs assigned, riders-covered counter) and now live — its write is REQ-BOOK14 (booking-owned), no longer pending. Surface→REQ trace updated REQ-BO07 → REQ-BOOK14. |
