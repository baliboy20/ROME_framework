---
module: OPS   status: PROPOSED   actors: [Guide, Rider, Owner, System]
depends-on: [core-data-access, core-auth, core-consent-audit, core-notifications, booking, fleet-equipment]
presumes: [GMT (existing navigation PWA), Met Office API, TfL API, Cloudflare R2]
---

# tour-operations — Module Spec

| | |
|---|---|
| **Document** | tour-operations module spec (Stage 4) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification (`/and-ratify`). GMT's own navigation journeys are presumed, not re-specified here. |
| **Sources** | `Intake_Note.md` §9 · `DOMAIN-LEXICON.md` (Playbook step/Sign-off/Rider/Incident/Hazard-log terms, states) · `Journey_Index.md` (UJ-OPS-*) · `Tour_Operations_User_Journeys_v1_0.md` · `core-auth.md`, `core-consent-audit.md`, `core-notifications.md`, `booking.md` (depended-on modules) |

## 1. Intent
Enforce the operational compliance discipline surrounding a tour — pre-tour checks, rider check-in, briefing, a final departure gate, mid-tour issue/incident handling, and the post-tour review/hazard-log loop — such that no tour departs, and no gate advances, while a safety-critical item is unresolved. **Success:** every sign-off carries a full audit trail; a failed bike, an uncleared rider, or a missing critical item structurally blocks departure; incidents escalate and are reported within statutory windows.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-29 | The playbook (FOB-PB-001, external reference) is the operational source of truth; every checklist/sign-off here derives from it. Digitised only "to the extent required for operational compliance." | `Intake_Note.md` §9.2 |
| F-30 | Waiver is signed twice: full read+sign at booking (`booking` REQ-BOOK03), brief re-confirmation with a fresh digital signature at the meeting point (this module, REQ-OPS05). Corrects DR-B7's original "paper" assumption. | `Intake_Note.md` §9.2; `Decision_Record_Booking_Aristotle_2026-07-20.md` DR-B7 (corrected) |
| F-31 | Max 2 minors (14–17) per party, each with a dedicated accompanying adult — a hard constraint the source doc says belongs in `booking`, not just checked here (SQ-26, emitted as a booking correction, not resolved in this module). | `Intake_Note.md` §9.2 |
| F-33 | Safety blocks sign-off structurally: a failed bike not removed from service, an uncleared rider, or a missing critical kit item each blocks its step's sign-off. | `Intake_Note.md` §9.2 |
| — | `tour_readiness`, `rider_checkins`, `incidents`, `hazard_log` are New entities — no attribute table authored here; designed at Stage 6a. `bikes` is **owned by `fleet-equipment`**, not this module (F-42, corrected 2026-07-21). | `DOMAIN-LEXICON.md` §3 |
| — | Guide device recognition reuses `core-auth` REQ-AUTH03 — this module does not re-specify guide authentication. | `core-auth.md` REQ-AUTH03 |
| — | Money/safety-critical actions arising here (incident records, ride refusals) are audited via `core-consent-audit` REQ-CNA03. | `core-consent-audit.md` REQ-CNA03 |
| — | Owner alerts (incident escalation, bike-service flags, priority notifications) route via `core-notifications` REQ-NOTIF04. | `core-notifications.md` REQ-NOTIF04 |
| — | Rider check-in reads booking/participant/health-declaration data from `booking` (`participants` table) — this module does not duplicate that data. | `booking.md` (Data_Dictionary.md `participants`) |

## 3. Decisions needed
Five resolved, three carried open — see `Decision_Record_TourOps_Aristotle_2026-07-20.md` (DR-O1–O5; D-OPS-5/7/8 still open).

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-OPS-1 | Signature capture mechanism (SQ-20). | full signature every sign-off \| split (full for waivers/declarations, typed-confirm for routine) | split | **CLOSED — DR-O1.** |
| D-OPS-2 | Per-bike inspection on a shared same-day fleet (SQ-21). | full repeat \| delta check \| skip if same-day | — | **CLOSED — DR-O2.** Full repeat, every tour, **no shortcut** (overrides the original recommendation). |
| D-OPS-3 | Bike-service-flag propagation (SQ-22). | manual tracking \| status workflow | status workflow | **CLOSED — DR-O3.** |
| D-OPS-4 | Refusal-to-ride refund handling (SQ-23). | guide flags, Owner processes \| guide auto-refund | guide flags, Owner processes | **CLOSED — DR-O4.** |
| D-OPS-5 | PLI insurer's required incident-report format (SQ-24). | *(unconfirmed)* | — | **STILL OPEN.** Deferred, stubbed with a conservative internal record (REQ-OPS11) until William supplies the format; REQ-OPS12's dispatch mechanics are placeholder. |
| D-OPS-6 | Photo capture scope in incidents/hazard log (SQ-25). | in scope, UX deferred \| out of scope | — | **CLOSED — DR-O5.** Out of scope this pass (overrides the original recommendation) — REQ-OPS10/13 updated to remove photo mentions. |
| D-OPS-7 *(cross-reference)* | Minor party-composition limit in `booking` (SQ-26). | *(emitted against `booking`)* | — | **STILL OPEN — parked**, not applied to `booking.md`. Existing OPS-side check (REQ-OPS04/05) is the interim safety net. |
| D-OPS-8 *(cross-reference)* | Formal Health Declaration section in `booking` (SQ-27). | *(emitted against `booking`)* | — | **STILL OPEN — parked**, not applied to `booking.md`. |

## 4. Requirements

### REQ-OPS01 — Guide views the day's tour assignment
intent:        view tour-assignment
actor:         Guide
preconditions: a tour is scheduled and assigned to the Guide for today
conditions:    the rider list reflects the current booking/participant data at the moment it's viewed
postconditions: the Guide has reviewed the assignment and rider list
outcomes:
  - Guide sees today's tours, party size, and status
  - Guide sees each rider's name, age band, accompanying adult (if a minor), declared health flags, and accessibility notes
errors:
  - assignment is missing or incorrect → Guide contacts the Owner; the tour cannot proceed until corrected
  - a health flag indicates incompatibility with the tour → flagged to the Owner before further preparation
invariants:    the rider list shown is never older than the last successful sync from `booking`
non-functional: Reliability — the assignment reflects the current state, not a stale cache
scope:         in: assignment + rider-list review | out: route/waypoint review (GMT's territory)
open-questions: none
example:
  given:  Guide Emma assigned to Hidden City departure DEP-HID-2026-08-01-1000, 2 riders including Tom
  when:   Emma views today's tour assignment
  then:   Emma sees the tour, party size 2, and Tom's declared details

### REQ-OPS02 — Guide submits the travel kit check
intent:        submit kit-check
actor:         Guide
preconditions: the tour assignment has been reviewed (REQ-OPS01)
conditions:    required quantities are derived from party size, season, and forecast; critical items (first aid, phone charge, hi-vis for participants, ponchos) must be confirmed present before sign-off; conditional items (e.g. gloves in warm weather) may be skipped with a note
postconditions: the kit check is signed off, or blocked pending resolution
outcomes:
  - Guide has a recorded, timestamped confirmation that required kit is packed
errors:
  - a critical item is missing → sign-off blocked until resolved
  - partial packing of a required quantity → blocked until resolved or a note is added with Owner approval
invariants:    the kit check is never signed off with a missing critical item
non-functional: Security — the sign-off is recorded with a timestamp and the Guide's identity
scope:         in: kit-item confirmation + sign-off | out: procuring missing kit
open-questions: none — D-OPS-1 closed (DR-O1, typed-confirm for this routine sign-off)
example:
  given:  Emma's Hidden City tour, party size 2, mild weather
  when:   Emma confirms all critical and required kit items and signs off
  then:   the kit check is complete, timestamped, and unlocks the bike inspection step

### REQ-OPS03 — Guide submits the bike inspection
intent:        submit bike-inspection
actor:         Guide
preconditions: bikes assigned to today's tour exist, read from `fleet-equipment` (which owns bike condition/status, **corrected 2026-07-21** — this REQ no longer owns or writes bike status itself)
conditions:    each bike is checked against five roadworthiness points; any failed check calls `fleet-equipment`'s flagging capability, removing that bike from service for the day
postconditions: every assigned bike is recorded as passed or flagged, via `fleet-equipment`; a declaration is signed once all bikes are processed
outcomes:
  - Guide has a per-bike record of roadworthiness, with any failures excluded from today's tour
  - Owner can see which bikes are out of service (in `fleet-equipment`'s own view)
errors:
  - a bike fails with no replacement available → party size is reduced (logged in REQ-OPS04's mitigations)
  - a bike was previously flagged for service and not yet cleared by the Owner (`fleet-equipment`'s own workflow) → cannot be assigned
invariants:    a failed bike is never assigned to a tour; the declaration is never signed while any bike's status is unresolved
non-functional: Security — each check is timestamped
scope:         in: per-bike roadworthiness check + declaration + flagging call to `fleet-equipment` | out: bike repair, clearance, and status ownership itself (now `fleet-equipment`'s — GAP-6b-3 resolved there, not here)
open-questions: none — D-OPS-2 closed (DR-O2, full repeat, no shortcut), D-OPS-3 closed (DR-O3, status workflow, now realised via `fleet-equipment`)
example:
  given:  2 bikes assigned to Emma's Hidden City tour, both previously in-service
  when:   Emma inspects both bikes and finds no faults
  then:   both bikes are recorded passed; Emma signs the declaration

### REQ-OPS04 — Guide submits the dynamic risk assessment and decisions
intent:        submit risk-assessment
actor:         Guide
preconditions: the kit check and bike inspection are complete or in progress
conditions:    weather/route/participant/readiness conditions are reviewed; any unresolved high-risk item blocks sign-off; day-specific mitigations are recorded and optionally tagged for inclusion in the safety briefing
postconditions: conditions are assessed, mitigations recorded, and the assessment signed off
outcomes:
  - Guide has a recorded, timestamped risk assessment with day-specific mitigations
  - Mitigations tagged for the briefing automatically populate REQ-OPS06
errors:
  - a high-severity weather condition is detected → Guide is prompted to escalate to the Owner for a possible cancellation
  - an item required for safe departure cannot be confirmed (e.g. an expired insurance certificate) → sign-off blocked, tour cannot proceed
invariants:    the assessment is never signed off with an unresolved high-risk item
non-functional: Reliability — weather/route data reflects the current forecast at assessment time, not a stale cache
scope:         in: condition review + day-specific mitigations + sign-off | out: the formal static risk assessment document itself (external reference, FOB-RA-001)
open-questions: none
example:
  given:  Emma's Hidden City tour, clear forecast, no route closures
  when:   Emma completes the assessment and records no special mitigations
  then:   the assessment is signed off; the briefing (REQ-OPS06) shows no day-specific additions

### REQ-OPS05 — Guide submits a rider's check-in
intent:        submit rider-checkin
actor:         Guide
preconditions: the kit check, bike inspection, and risk assessment are complete; the rider is present at the meeting point
conditions:    bike/equipment fit, health/suitability, and consent are each confirmed per rider; the rider re-confirms the liability waiver with a fresh signature (F-30) — a lighter re-confirmation than the full booking-time acceptance
postconditions: the rider is recorded `cleared` or refused; once every rider is processed, an all-riders declaration is signed
outcomes:
  - Guide has a per-rider record confirming fitness, suitability, and consent
  - Rider sees their details reviewed and confirms them correct
errors:
  - rider declares a new incompatible medical condition → refused; refusal flagged for Owner-processed refund (D-OPS-4)
  - rider is visibly impaired or intoxicated → refused
  - a minor arrives without their declared accompanying adult → refused
  - rider refuses to re-confirm the waiver → refused
invariants:    a rider is never marked `cleared` without a recorded waiver re-confirmation; the all-riders declaration is never signed while any rider's status is unresolved
non-functional: Security — the re-confirmation signature and timestamp are recorded per rider
scope:         in: per-rider check-in + waiver re-confirmation + all-riders declaration | out: the full waiver acceptance itself (that's `booking` REQ-BOOK03)
open-questions: none — D-OPS-1 closed (DR-O1, full signature for waiver re-confirmation), D-OPS-4 closed (DR-O4, guide flags/Owner processes)
example:
  given:  Tom (Rider), booking BK-1001, waiver accepted at booking, present at the meeting point
  when:   Emma checks Tom in and Tom re-confirms the waiver with a fresh signature
  then:   Tom is marked `cleared`; once all riders are processed, Emma signs the all-riders declaration

### REQ-OPS06 — Guide submits the safety briefing confirmation
intent:        submit briefing-confirmation
actor:         Guide
preconditions: all riders are checked in and cleared (REQ-OPS05)
conditions:    all six briefing sections are delivered; day-specific mitigations tagged in REQ-OPS04 are shown inline at the relevant section
postconditions: the briefing is confirmed delivered, with questions addressed
outcomes:
  - Guide has a recorded, timestamped confirmation that the full briefing was delivered
errors:
  - a rider raises an issue requiring action mid-briefing (e.g. ill-fitting helmet) → briefing pauses, issue resolved, briefing resumes
  - a rider refuses to acknowledge a required rule → refused (recorded via REQ-OPS05's refusal path)
invariants:    the briefing confirmation is never signed while the group present hasn't heard every section
non-functional: Reliability — day-specific mitigations shown are exactly those tagged in REQ-OPS04, never stale
scope:         in: briefing delivery confirmation | out: the briefing script's content itself (external reference, playbook Step 4)
open-questions: none
example:
  given:  all riders on Emma's Hidden City tour cleared, no day-specific mitigations tagged
  when:   Emma delivers all six briefing sections and confirms
  then:   the briefing confirmation is signed; REQ-OPS07 unlocks

### REQ-OPS07 — Guide submits the final pre-departure sign-off
intent:        submit departure-signoff
actor:         Guide
preconditions: the kit check, bike inspection, risk assessment, all rider check-ins, and the briefing are each complete
conditions:    any outstanding flag from a prior step blocks this sign-off
postconditions: the tour is marked ready to depart; a `tour_readiness` record is saved
outcomes:
  - Guide has confirmed every operational gate passed before departure
  - the tour is handed over to GMT's live-tracking start (presumed, out of this module)
errors:
  - an outstanding flag exists (failed bike not removed, rider not cleared, missing kit item, briefing not confirmed) → sign-off blocked until resolved
  - departure is significantly delayed (>30 min past planned start) → Guide is prompted to confirm proceeding with a shortened route, or to contact the Owner about cancellation
invariants:    the tour never proceeds to GMT's live tracking while any prior gate is unresolved
non-functional: Reliability — the readiness summary reflects the current state of every prior gate, not a cached one
scope:         in: aggregated final gate + readiness record | out: GMT's own tour-start/GPS activation (presumed)
open-questions: none
example:
  given:  Emma's Hidden City tour with kit, bikes, risk assessment, all riders, and briefing all signed off
  when:   Emma completes the final pre-departure sign-off
  then:   `tour_readiness` is saved; the tour is ready to hand over to GMT's tour start

### REQ-OPS08 — Guide submits a mid-tour issue log
intent:        submit issue-log
actor:         Guide
preconditions: the tour is active (handed over from REQ-OPS07 into GMT)
conditions:    the issue is categorised (mechanical, illness, or early-leave) and the chosen resolution recorded; an issue assessed as an emergency escalates to REQ-OPS09 instead
postconditions: the issue and its resolution are logged; the tour manifest reflects any change (e.g. a rider leaving early)
outcomes:
  - Owner can see what happened, when, and how it was resolved
  - the group continues appropriately adjusted
errors:
  - none declared — every categorised outcome (repair, bike removed, pace adjusted, rider exits, escalate) is itself a valid resolution, not an error state
invariants:    an issue is never left unlogged once resolved
non-functional: Reliability — the issue's location is captured from the Guide's current position at the time
scope:         in: non-emergency mid-tour event logging | out: emergency response (REQ-OPS09)
open-questions: none
example:
  given:  Emma's tour active, one rider's bike suffers a repairable puncture
  when:   Emma repairs it and logs the event
  then:   the issue is logged with time lost; the tour resumes

### REQ-OPS09 — Guide submits a preliminary incident record
intent:        submit incident-record
actor:         Guide
preconditions: a serious incident occurs (injury, road traffic collision, medical emergency) during an active tour
conditions:    the Guide's safety actions (calling emergency services, applying first aid) happen before or alongside logging, never blocked by it; the record captures time, location, what happened, who was involved, severity, and action taken
postconditions: a preliminary incident record exists; the Owner is notified via `core-notifications` REQ-NOTIF04
outcomes:
  - Owner is alerted to the incident on their configured channel
  - a preliminary record exists to seed the formal report (REQ-OPS11)
errors:
  - no mobile signal at the incident location → the Guide seeks help via a passer-by; the record is logged once possible, not blocked
invariants:    an incident record, once logged, is never modified or deleted (audited via `core-consent-audit` REQ-CNA03)
non-functional: Security — the record is tamper-evident, consistent with REQ-CNA03's audit guarantee
scope:         in: preliminary incident logging + owner notification | out: the formal report and insurer dispatch (REQ-OPS11)
open-questions: none
example:
  given:  a rider falls and is injured on Emma's active tour
  when:   Emma calls 999, applies first aid, and logs the preliminary incident
  then:   the incident record exists; William is notified

### REQ-OPS10 — Guide submits the post-ride review
intent:        submit post-ride-review
actor:         Guide
preconditions: the tour has ended (handed back from GMT)
conditions:    structured fields capture hazards/route changes, incidents/near-misses, a quality assessment, and required follow-up actions; each ticked action triggers its own downstream flow (risk-assessment review, incident report, insurer notification, bike-service flag, review request)
postconditions: the review is saved and visible to the Owner; ticked actions are queued
outcomes:
  - Owner sees a complete structured record of how the tour went
  - any flagged bike is excluded from tomorrow's assignment pool automatically
errors:
  - the review is not completed immediately (e.g. a back-to-back tour) → saved as a draft, with a reminder before the 24h deadline
  - a high-severity issue is mentioned in free text but the corresponding action isn't ticked → the Guide is prompted to confirm before submitting
invariants:    a submitted review is never lost; an incomplete draft still exists until submitted or the 24h window lapses
non-functional: Reliability — a flagged bike is excluded from assignment before the next tour-day begins
scope:         in: structured post-tour review + downstream action triggers | out: photo capture (out of scope, DR-O5), the incident report's full narrative (REQ-OPS11), the hazard log entry's full detail (REQ-OPS14)
open-questions: none — D-OPS-6 closed (DR-O5, out of scope)
example:
  given:  Emma's Hidden City tour just ended, no incidents, one bike flagged for a loose brake
  when:   Emma submits the post-ride review, ticking the bike-service-flag action
  then:   the review is saved; that bike is excluded from tomorrow's fleet selection

### REQ-OPS11 — Guide submits a formal incident report
intent:        submit incident-report
actor:         Guide
preconditions: a preliminary incident record exists (REQ-OPS09) or was flagged in the post-ride review (REQ-OPS10)
conditions:    the report includes full narrative, injury nature, third parties, emergency services involved, hospital, witnesses, and post-incident actions
postconditions: the formal report is submitted to the Owner
outcomes:
  - Owner has a complete formal report to review and dispatch
errors:
  - submission occurs beyond the statutory window (2h to FOB ops) → logged as a process exception for Owner attention
invariants:    a formal report is never submitted without linking back to its originating incident record
non-functional: Reliability — the report is available to the Owner within the 24h insurer-notification window
scope:         in: formal incident narrative + submission to Owner | out: insurer dispatch itself (REQ-OPS-11b below)
open-questions: D-OPS-5 (OPEN — insurer report format)
example:
  given:  the preliminary incident record from REQ-OPS09
  when:   Emma submits the formal incident report with full narrative
  then:   the report is submitted to William for review

### REQ-OPS12 — Owner approves an incident report for insurer dispatch
intent:        approve incident-report
actor:         Owner
preconditions: a formal incident report exists (REQ-OPS11)
conditions:    the Owner may add notes or request more information before approving
postconditions: the report is approved and dispatched to the PLI insurer within the statutory 24h window; status is tracked through to closure
outcomes:
  - Owner has dispatched the report and can track its status (submitted → insurer ack → reviewed → closed)
errors:
  - the insurer responds with questions → the Owner adds information and resubmits
  - the incident reveals a systemic risk → a full risk-assessment review is triggered (external process)
invariants:    an incident's status only ever advances forward through submitted → insurer_ack → reviewed → closed
non-functional: Reliability — dispatch happens within the statutory 24h window from the incident
scope:         in: insurer dispatch + status tracking | out: the insurer's own review process
open-questions: D-OPS-5 (OPEN — insurer report format)
example:
  given:  Emma's formal incident report submitted to William
  when:   William reviews and approves it for dispatch
  then:   the report is sent to the insurer; status moves to `insurer_ack` once acknowledged

### REQ-OPS13 — Guide submits a hazard observation
intent:        submit hazard-observation
actor:         Guide
preconditions: a new hazard is observed during a tour or noted in the post-ride review
conditions:    the observation records street/location, hazard type, description, severity, and date observed
postconditions: a hazard-log entry exists in `pending_review` status
outcomes:
  - Owner has a new hazard observation to review
errors:
  - none declared — every observation is logged, never rejected at submission
invariants:    a hazard observation is never lost between submission and Owner review
non-functional: Reliability — the observation captures the Guide's location at the time observed
scope:         in: hazard observation submission | out: photo capture (out of scope, DR-O5), approval into the log (REQ-OPS14)
open-questions: none — D-OPS-6 closed (DR-O5, out of scope)
example:
  given:  Emma notices a new pothole on today's route
  when:   Emma submits a hazard observation
  then:   a `pending_review` hazard-log entry exists for William to review

### REQ-OPS14 — Owner approves a hazard-log entry
intent:        approve hazard-log-entry
actor:         Owner
preconditions: a hazard observation exists in `pending_review` status
conditions:    the Owner deduplicates against existing entries on the same street, sets severity, and decides control measures
postconditions: the hazard is approved into the route hazard log, or the existing entry's "last confirmed" date is bumped if it's a duplicate
outcomes:
  - future tours are forewarned of the hazard
  - a high-severity or briefing-relevant hazard updates the relevant briefing content (consumed by REQ-OPS06)
errors:
  - none declared — every reviewed observation resolves to either a new entry or a bumped duplicate
invariants:    the hazard log never contains two separate entries for the same observed hazard on the same street
non-functional: Reliability — an approved, location-bound hazard becomes available to GMT's proximity-alert mechanism (presumed, out of this module)
scope:         in: hazard review, deduplication, and approval | out: GMT's proximity-alert mechanism itself
open-questions: none
example:
  given:  the pothole observation from REQ-OPS13, no existing entry for that street
  when:   William reviews and approves it, setting severity Medium
  then:   the hazard is added to the route hazard log

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-OPS-01 | Receive tour assignment and prepare | REQ-OPS01 |
| UJ-OPS-02 | Travel kit check | REQ-OPS02 |
| UJ-OPS-03 | Bike inspection | REQ-OPS03 |
| UJ-OPS-04 | Dynamic risk assessment and decisions log | REQ-OPS04 |
| UJ-OPS-05 | Rider check-in | REQ-OPS05 |
| UJ-OPS-06 | Safety briefing delivery | REQ-OPS06 |
| UJ-OPS-07 | Final pre-departure sign-off | REQ-OPS07 |
| UJ-OPS-08 | Manage a mid-tour participant issue | REQ-OPS08 |
| UJ-OPS-09 | Respond to an incident | REQ-OPS09 |
| UJ-OPS-10 | Complete post-ride review | REQ-OPS10 |
| UJ-OPS-11 | File incident report and insurer notification | REQ-OPS11 · REQ-OPS12 |
| UJ-OPS-12 | Update the route hazard log | REQ-OPS13 · REQ-OPS14 |

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial module spec: 14 REQs across 12 core journeys (UJ-OPS-11 and 12 each split into a Guide-submits + Owner-approves pair, per Rule 1), 8 Decisions-needed (2 are cross-references to `booking`, not resolved here), depends-on 4 Lean-6 modules + `booking`. |
| 0.2 | 2026-07-20T00:00:00Z | Stage 5 propagation (`Decision_Record_TourOps_Aristotle_2026-07-20.md`, DR-O1–O5): 5 decisions closed; D-OPS-5 deferred/stubbed; D-OPS-7/8 parked against `booking`. REQ-OPS10/13 updated to exclude photo capture (DR-O5). |
| 0.3 | 2026-07-21T00:00:00Z | **Ownership correction (F-42):** `bikes` moved to `fleet-equipment` ownership; REQ-OPS03 rewritten to call FLEET's inspection-recording/flagging capability instead of owning bike status itself. Resolves GAP-6b-3 (now FLEET's UJ-FLEET-04, not an OPS gap). `depends-on` gains `fleet-equipment`; `presumes` drops the RCA bikes/fleet read. |
