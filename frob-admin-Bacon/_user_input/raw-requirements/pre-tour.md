---
module: TOUR   status: PROPOSED   actors: [Customer, Owner, System, Guide]
depends-on: [core-data-access, core-auth, core-consent-audit, core-notifications, booking, tour-operations]
presumes: [Met Office API, TfL API, GMT (existing navigation PWA)]
---

# pre-tour — Module Spec

| | |
|---|---|
| **Document** | pre-tour module spec (Stage 4) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification (`/and-ratify`). Booked-customer concierge (UJ-TOUR-05) deferred. |
| **Sources** | `Intake_Note.md` §10 · `DOMAIN-LEXICON.md` (Tour hub/Reminder milestone/Weather advisory/Operator-initiated change terms, states) · `Journey_Index.md` (UJ-TOUR-*) · `Pre_Tour_User_Journeys_v1_0.md` · `booking.md`, `tour-operations.md`, `core-auth.md`, `core-consent-audit.md`, `core-notifications.md` (depended-on modules) |

## 1. Intent
Sustain customer trust between confirmed payment and tour day through a durable information hub, scheduled reminders, weather advisories, self-service non-financial updates, and clear handling of operator-initiated changes, cancellations, late arrivals, and no-shows. **Success:** the customer always knows the current state of their booking without asking; every operator-initiated change reaches them through every relevant channel; no-shows and cancellations are handled predictably and without surprise.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-35 | The source doc's SendGrid citation is stale — Postmark is canonical (KI-3). | `Intake_Note.md` §10.2 |
| F-36 | The source doc's Cloudflare Queue citation is stale — Cron Triggers + direct provider calls are the actual mechanism (F-01). | `Intake_Note.md` §10.2 |
| F-37 | "Push notification" is unconfirmed as a built mechanism anywhere in this project. | `Intake_Note.md` §10.2 |
| F-38 | Transactional reminders/advisories/changes bypass marketing-consent suppression (distinct consent category, matches `core-notifications` REQ-NOTIF01's existing invariant). | `core-notifications.md` REQ-NOTIF01 |
| — | The tour hub extends `booking`'s manage-booking surface (W10) — this module does not re-implement booking lookup/auth, it reuses `core-auth` REQ-AUTH02. | `core-auth.md` REQ-AUTH02 |
| — | Cancellation remediation (refund/rebook/credit) is executed via `booking`'s own REQ-BOOK07/REQ-BOOK06 — this module triggers those, it does not duplicate payment logic. | `booking.md` REQ-BOOK06, REQ-BOOK07 |
| — | No-show detection reads `tour-operations`' `rider_checkins` records — this module does not own rider check-in data. | `tour-operations.md` REQ-OPS05; `Data_Dictionary.md` `rider_checkins` |
| — | Money/safety-relevant actions here (cancellation remediation) are audited via `core-consent-audit` REQ-CNA03. | `core-consent-audit.md` REQ-CNA03 |

## 3. Decisions needed
Seven resolved, two carried open — see `Decision_Record_PreTour_Aristotle_2026-07-21.md` (DR-T1, T4–T9; D-TOUR-2/3 still open).

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-TOUR-1 | Reminder cadence (SQ-28). | light (T-1 only) \| standard \| heavy | — | **CLOSED — DR-T1.** Light: T-1 only. REQ-TOUR02 corrected (no T-0 milestone). |
| D-TOUR-2 *(= D-NOTIF-1)* | Reminder channels (SQ-29). | *(tied to D-NOTIF-1)* | — | **STILL OPEN — tied to D-NOTIF-1.** Not ratified independently. |
| D-TOUR-3 | Weather-alert thresholds (SQ-30). | *(numeric rules needed)* | informational-only meanwhile | **STILL OPEN — deferred.** No auto-escalation to cancellation-candidate without real thresholds. |
| D-TOUR-4 | Self-service detail-update scope (SQ-31). | all self-service \| safety-significant alerts Owner | safety-significant alerts Owner | **CLOSED — DR-T4.** Confirmed as recommended. |
| D-TOUR-5 | Cancellation remediation options (SQ-32). | single auto-refund \| choose-your-own | — | **CLOSED — DR-T5.** Choose-your-own: refund/rebook/credit. |
| D-TOUR-6 | Late-arrival grace period (SQ-33). | fixed \| configurable per tour | — | **CLOSED — DR-T6.** Configurable per tour. |
| D-TOUR-7 | Day-of guide contact mechanism (SQ-34). | direct guide mobile \| FOB ops number \| in-app GMT push | — | **CLOSED — DR-T7.** FOB ops number. |
| D-TOUR-8 *(ties to DR-B5)* | No-show policy (SQ-35). | forfeit \| partial credit \| tour credit \| nothing | align with DR-B5 | **CLOSED — DR-T8.** Manual, Owner-decided, per DR-B5's precedent. |
| D-TOUR-9 | Calendar invite delivery (SQ-36). | .ics only \| widget only \| both | — | **CLOSED — DR-T9.** Both. |

## 4. Requirements

### REQ-TOUR01 — Customer views the tour hub
intent:        view tour-hub
actor:         Customer
preconditions: a confirmed booking exists; the Customer is authenticated via a manage-booking session (`core-auth` REQ-AUTH02)
conditions:    the hub reflects the booking's current status, meeting point, and any pending changes at the moment it's viewed
postconditions: the Customer has seen current booking details, status, and available next actions
outcomes:
  - Customer sees booking reference, tour name, date/time, meeting point, attendee list, and current status
  - Customer can reach detail-update, question, modify, or cancel actions from the hub
errors:
  - the booking is cancelled → the hub shows cancelled status and remediation outcome
  - the tour date has passed → the hub shows a completed state
invariants:    a non-booker attendee viewing via a shared link never sees the emergency contact or other sensitive fields
non-functional: Reliability — the hub never shows stale status after a change has been processed
scope:         in: read-only tour-day information + status | out: the underlying modify/cancel actions themselves (`booking` REQ-BOOK06/07)
open-questions: none
example:
  given:  Tom's confirmed booking BK-1001, Hidden City, 1 August 2026
  when:   Tom views the tour hub
  then:   he sees the booking reference, meeting point, and `confirmed` status

### REQ-TOUR02 — System submits a scheduled reminder
intent:        submit reminder-message
actor:         System
preconditions: a booking is `confirmed`; the single T-1 milestone (DR-T1 — light cadence) is due and has not yet been sent for this booking
conditions:    content covers final logistics (meeting point, what-to-bring, current weather summary); a booking made within 1 day of departure silently skips the milestone (nothing to send — the booking postdates it)
postconditions: the reminder is sent via `core-notifications` REQ-NOTIF01 and recorded so it is never sent twice for this booking
outcomes:
  - Customer receives one timely reminder the day before their tour
errors:
  - the booking is cancelled before the milestone fires → the reminder is suppressed
  - the booking is modified before the milestone fires → the reminder uses the updated details
invariants:    the T-1 milestone is sent at most once per booking; a cancelled booking never receives it
non-functional: Reliability — the reminder bypasses marketing-consent suppression (F-38), consistent with REQ-NOTIF01's existing invariant
scope:         in: the single T-1 scheduled reminder (DR-T1) | out: a day-of (T-0) reminder — **removed under the light cadence, DR-T1**; the channel choice itself (D-TOUR-2, tied to D-NOTIF-1)
open-questions: D-TOUR-2 (OPEN — channel, tied to D-NOTIF-1)
example:
  given:  Tom's confirmed booking, departure in 1 day, T-1 milestone not yet sent
  when:   the System's scheduled check runs
  then:   the T-1 reminder is sent to Tom and recorded as sent for that milestone

### REQ-TOUR03 — System submits a weather advisory
intent:        submit weather-advisory
actor:         System
preconditions: a booking is `confirmed` and its tour is within the advisory window (e.g. next 72 hours)
conditions:    the forecast is evaluated against threshold rules (D-TOUR-3); classification is informational or action-required; duplicate advisories within a short window are suppressed unless severity escalates
postconditions: an advisory is sent and recorded against the booking; the tour hub reflects the current advisory status
outcomes:
  - Customer is informed of weather impact before arrival, with expectations set appropriately
errors:
  - the weather data source is unavailable → advisory generation falls back to manual Owner review
invariants:    an advisory never contradicts a more severe unresolved advisory already sent for the same booking
non-functional: Reliability — the advisory reflects the forecast for the specific tour time window, not the whole day
scope:         in: automated + Owner-manual weather advisories | out: the escalation into cancellation itself (routes to REQ-TOUR07)
open-questions: D-TOUR-3 (OPEN — deferred, informational-only interim per DR-T3)
example:
  given:  Tom's booking, tour in 48 hours, forecast crosses the informational threshold
  when:   the System evaluates the forecast
  then:   an informational advisory is sent to Tom; the tour hub shows a weather-watch status

### REQ-TOUR04 — Customer updates non-financial booking details
intent:        update booking-details
actor:         Customer
preconditions: a confirmed booking exists; the Customer is authenticated
conditions:    only non-financial fields are editable (attendee names/ages, dietary, allergies, emergency contact, mobility notes); date and party size are never editable here
postconditions: the booking's non-financial details are updated; a safety-significant change alerts the Owner
outcomes:
  - Customer sees their correction reflected immediately in the tour hub
  - Guide sees the updated detail before it matters (via `tour-operations`)
errors:
  - Customer attempts to change date or party size → blocked, routed to `booking` REQ-BOOK06
  - the change is safety-significant (severe allergy added, accessibility flagged, a minor added) → accepted, but the Owner is alerted (`core-notifications` REQ-NOTIF04) for follow-up
invariants:    a financial field (date, party size, price) is never editable through this requirement
non-functional: Reliability — an update is visible in the tour hub and to the Guide before the tour begins
scope:         in: self-service non-financial detail correction | out: financial changes (routes to `booking`)
open-questions: none — D-TOUR-4 closed (DR-T4)
example:
  given:  Tom's confirmed booking, no allergies currently recorded
  when:   Tom adds a severe nut allergy for an attendee
  then:   the booking is updated; William is alerted to review

### REQ-TOUR05 — System submits an operator-change notice
intent:        submit change-notice
actor:         System
preconditions: the Owner has edited a confirmed booking's meeting point, time, or guide
conditions:    the notice states old vs new explicitly; a material change (time, day, meeting point) requires explicit acknowledgement; a guide-only change is informational, no acknowledgement requested
postconditions: the notice is sent via every relevant channel; if material, an acknowledgement is now pending
outcomes:
  - Customer receives a clear old-vs-new comparison of what changed
errors:
  - the change occurs within 24h of the tour → escalated urgency (multiple channels, more aggressive follow-up)
invariants:    a pending material-change acknowledgement is never silently dropped
non-functional: Reliability — the same booking never has one channel succeed and another silently fail without the Owner knowing
scope:         in: operator-change notification | out: the acknowledgement itself (REQ-TOUR06)
open-questions: none
example:
  given:  William changes Tom's meeting point from Barbican East to Barbican Lakeside
  when:   the System sends the change notice
  then:   Tom receives "Was: Barbican East. Now: Barbican Lakeside" and is asked to acknowledge

### REQ-TOUR06 — Customer approves an operator-initiated change
intent:        approve booking-change
actor:         Customer
preconditions: a material operator-change notice is pending acknowledgement (REQ-TOUR05)
conditions:    acknowledgement is a single explicit action
postconditions: the change is acknowledged; the tour hub reflects the new details as confirmed
outcomes:
  - Customer confirms they've seen and accepted the change
  - Owner sees the acknowledgement, or its absence, in their operational view
errors:
  - no acknowledgement within 24h → a reminder is sent; the Owner sees it as outstanding
invariants:    the booking proceeds under the new details regardless of acknowledgement status — acknowledgement is a confirmation, not a gate
non-functional: Reliability — an acknowledgement is recorded exactly once per change notice
scope:         in: customer acknowledgement of a material change | out: rejecting the change (customer may instead cancel via `booking` REQ-BOOK07)
open-questions: none
example:
  given:  Tom's pending meeting-point change notice
  when:   Tom acknowledges it
  then:   the acknowledgement is recorded; the tour hub shows the new meeting point as confirmed

### REQ-TOUR07 — System submits an operator-cancellation notice
intent:        submit cancellation-notice
actor:         System
preconditions: the Owner has cancelled a confirmed booking's tour (weather, guide illness, force majeure)
conditions:    the notice states the reason and available remediation options (D-TOUR-5); sent via every available channel given the urgency
postconditions: the notice is sent; if remediation choice is required, it is now pending
outcomes:
  - Customer is informed of the cancellation through every relevant channel
errors:
  - none declared — this is itself the notification path for an already-decided cancellation
invariants:    a cancellation notice is sent through every channel available for the booking, not just one
non-functional: Reliability — delivery reaches the customer even if one channel fails
scope:         in: cancellation notification | out: the remediation choice itself (REQ-TOUR08), the underlying cancellation decision (Owner, off-system)
open-questions: none — D-TOUR-5 closed (DR-T5)
example:
  given:  William cancels Tom's tour due to severe weather
  when:   the System sends the cancellation notice
  then:   Tom is notified via every available channel with the remediation options

### REQ-TOUR08 — Customer submits a cancellation remediation choice
intent:        submit remediation-choice
actor:         Customer
preconditions: a cancellation notice is pending a remediation choice (REQ-TOUR07) and multiple options were offered (D-TOUR-5)
conditions:    the choice is one of the offered options (full refund / rebook / credit); triggers the corresponding action in `booking`
postconditions: the chosen remediation is actioned via `booking` (REQ-BOOK07 for refund, or an equivalent rebook/credit path); the tour hub reflects the outcome
outcomes:
  - Customer sees their choice confirmed and actioned
errors:
  - no choice made within the configured window → a default remediation is applied per policy
  - rebook chosen but no alternative date available → a tour credit is applied automatically with an apology
invariants:    a remediation choice is actioned exactly once per cancelled booking
non-functional: Reliability — the chosen remediation completes even if the customer doesn't return to confirm receipt
scope:         in: remediation choice + trigger into `booking` | out: the payment/refund mechanics themselves (owned by `booking`)
open-questions: none — D-TOUR-5 closed (DR-T5)
example:
  given:  Tom's cancelled booking, offered full refund / rebook / credit
  when:   Tom chooses full refund
  then:   the refund is triggered via `booking`; the tour hub shows the cancellation with refund outcome

### REQ-TOUR09 — Customer submits a late-arrival notice
intent:        submit late-arrival-notice
actor:         Customer
preconditions: today is tour day; the tour hasn't started; the current time is within the configured late-arrival window (D-TOUR-6)
conditions:    the notice includes an estimated arrival time and optional brief context
postconditions: the Guide and Owner are notified of the expected late arrival
outcomes:
  - Guide knows to expect a late arrival and can decide whether to hold
errors:
  - the Customer cannot reach this surface (e.g. phone issue) → the Owner's phone number on the confirmation is the documented fallback
invariants:    a late-arrival notice never overrides a no-show recorded after the grace period has passed
non-functional: Reliability — the notification reaches the Guide before the tour proceeds without the Customer, wherever possible
scope:         in: late-arrival notification | out: the Guide's hold/proceed decision itself (`tour-operations`'s concern)
open-questions: none — D-TOUR-6 closed (DR-T6, configurable per tour), D-TOUR-7 closed (DR-T7, FOB ops number)
example:
  given:  Tom running 10 minutes behind on tour day, within the grace window
  when:   Tom submits a late-arrival notice with an estimated time
  then:   the Guide and Owner are notified; the Guide decides whether to hold

### REQ-TOUR10 — System submits a no-show record and applies policy
intent:        submit no-show-record
actor:         System
preconditions: the tour has started (via `tour-operations`) with one or more booked attendees missing beyond the grace period, per `rider_checkins`
conditions:    the no-show policy (D-TOUR-8) is applied per the aligned, Owner-decided approach (matching DR-B5's precedent, not an independent automated rule)
postconditions: the no-show is recorded against the booking; the customer is notified of the outcome
outcomes:
  - Customer is notified of the no-show and any applicable remediation
  - Owner can see no-show patterns for a booker over time
errors:
  - a late-arrival notice (REQ-TOUR09) arrives after the tour has started → logged but does not override the no-show
invariants:    a no-show is recorded only after the grace period has genuinely passed, per `tour-operations`' rider check-in data
non-functional: Reliability — the no-show record and customer notification are never both silently skipped
scope:         in: no-show recording + policy application + customer notification | out: the grace-period/hold decision itself (`tour-operations`'s concern)
open-questions: none — D-TOUR-8 closed (DR-T8, manual/Owner-decided per DR-B5)
example:
  given:  Tom's party of 2, only 1 checked in per `tour-operations`' rider check-ins, grace period passed
  when:   the System applies no-show handling
  then:   the missing attendee is recorded no-show; Tom is notified per the applicable policy

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-TOUR-01 | Access the tour-day information hub | REQ-TOUR01 |
| UJ-TOUR-02 | Receive scheduled pre-tour reminders | REQ-TOUR02 |
| UJ-TOUR-03 | Receive a weather advisory | REQ-TOUR03 |
| UJ-TOUR-04 | Update attendee details or special requirements | REQ-TOUR04 |
| UJ-TOUR-06 | Receive an operator-initiated change | REQ-TOUR05 · REQ-TOUR06 |
| UJ-TOUR-07 | Receive an operator-initiated cancellation | REQ-TOUR07 · REQ-TOUR08 |
| UJ-TOUR-08 | Day-of preparation and arrival | **carried hole — DR-T1** (light cadence removed the T-0 milestone that would have driven this; the journey's customer-side travel/arrival steps have no system REQ backing them, which is fine, but the "morning-of reminder" step in the source doc no longer has one either) |
| UJ-TOUR-09 | Notify operator of late arrival | REQ-TOUR09 |
| UJ-TOUR-10 | No-show / non-arrival handling | REQ-TOUR10 |
| *(deferred)* | UJ-TOUR-05 (booked-customer concierge) | **not authored this pass** |

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial module spec: 10 REQs across 9 core journeys (UJ-TOUR-06 and 07 each split into a System-notifies + Customer-responds pair; UJ-TOUR-08's day-of reminder folded into REQ-TOUR02), 9 Decisions-needed (2 are cross-references to already-open/ratified project decisions, not resolved independently), depends-on 4 Lean-6 modules + `booking` + `tour-operations`. |
| 0.2 | 2026-07-21T00:00:00Z | Stage 5 propagation (`Decision_Record_PreTour_Aristotle_2026-07-21.md`, DR-T1, T4–T9): 7 decisions closed; D-TOUR-2 tied to D-NOTIF-1, D-TOUR-3 deferred, both still open. REQ-TOUR02 corrected — light cadence removes the T-0 milestone; UJ-TOUR-08 now carries a hole (no REQ backs the day-of reminder step). |
