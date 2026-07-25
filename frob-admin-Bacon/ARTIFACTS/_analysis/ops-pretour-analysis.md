# Ops & Pre-Tour Analysis (P2)

**Scope:** REQ-OPS01..14, REQ-TOUR01..10 (24 requirements)
**Source:** `ARTIFACTS/_requirements/REQ-{OPS,TOUR}*.yaml` (AORDL)
**Prepared by:** Talib (P2 Analysis)

---

## FUNC-OPS01 — View Tour Assignment
**Maps to:** REQ-OPS01

**User Stories**
- As a Guide, I want to view today's tour assignment and rider list, so that I can prepare for the tour with accurate, current information.
- As a Guide, I want the rider list to reflect current booking data, so that I never brief or check in a rider based on stale information.

**Acceptance Criteria**
- Given a tour scheduled and assigned to the Guide for today, When the Guide opens the assignment view, Then the Guide sees the tour's party size, status, and each rider's name, age band, accompanying adult (if a minor), declared health flags, and accessibility notes.
- Given the rider list has changed since the last sync, When the Guide views the assignment, Then the displayed list is never older than the last successful sync from the booking record.
- Given the assignment is missing or incorrect, When the Guide attempts to view it, Then the system shows "This tour assignment could not be found or looks incorrect. Contact the Owner before proceeding." and the tour does not proceed until corrected.
- Given a rider's declared health flag may be incompatible with the tour, When the Guide views the assignment, Then the flag is surfaced to the Guide and the Owner is notified.

---

## FUNC-OPS02 — Submit Kit-Check
**Maps to:** REQ-OPS02

**User Stories**
- As a Guide, I want to confirm required kit is packed and sign off, so that I have a timestamped record the tour is equipped correctly.
- As a Guide, I want required quantities calculated from party size, season, and forecast, so that I don't have to work out kit needs manually.

**Acceptance Criteria**
- Given the tour assignment has been reviewed, When the Guide completes the kit check, Then required quantities are derived from party size, season, and forecast, and a timestamped, identity-linked sign-off is recorded.
- Given a critical item (first aid, phone charge, hi-vis, ponchos) is missing, When the Guide attempts sign-off, Then sign-off is blocked with "A critical kit item is missing. Sign-off is blocked until this is resolved."
- Given a required item quantity is only partially packed, When the Guide attempts sign-off, Then the system requires either resolving the shortfall or adding a note with Owner approval before allowing sign-off.
- Given a conditional item (e.g. gloves in warm weather) is not applicable, When the Guide completes the check, Then the item may be skipped with a note, without blocking sign-off.

---

## FUNC-OPS03 — Submit Bike Inspection
**Maps to:** REQ-OPS03

**User Stories**
- As a Guide, I want to inspect each assigned bike against roadworthiness points, so that no faulty bike is used on a tour.
- As a Guide, I want to flag a failed bike into the fleet record, so that the Owner can see which bikes are out of service.

**Acceptance Criteria**
- Given bikes assigned to today's tour, When the Guide inspects each bike against the five roadworthiness points, Then each bike is recorded as passed or flagged, and each check is timestamped.
- Given a bike fails inspection, When the Guide flags it, Then the bike is removed from service for the day and never assigned to a tour while flagged.
- Given a bike fails with no replacement available, When the Guide records the failure, Then the system shows "This bike failed inspection and no replacement is available. Party size will be reduced." and requires confirmation of the reduced party size.
- Given a bike was previously flagged for service and not yet cleared, When the Guide attempts to assign it, Then the system blocks assignment with "This bike is still flagged for service and cannot be assigned to today's tour."
- Given every assigned bike has been processed, When the Guide signs the declaration, Then the declaration is only signable once every bike's status is resolved.

---

## FUNC-OPS04 — Submit Risk Assessment
**Maps to:** REQ-OPS04

**User Stories**
- As a Guide, I want to review weather, route, participant, and readiness conditions and record mitigations, so that day-specific risks are assessed and mitigated before departure.
- As a Guide, I want mitigations tagged for the briefing to auto-populate the briefing step, so that I don't have to re-enter them.

**Acceptance Criteria**
- Given the kit check and bike inspection are complete or in progress, When the Guide completes the risk assessment, Then a timestamped assessment with day-specific mitigations is recorded, using current (non-stale) weather and route data.
- Given an unresolved high-risk item exists, When the Guide attempts sign-off, Then sign-off is blocked.
- Given a high-severity weather condition is detected, When the assessment is run, Then the system shows "A high-severity weather condition was detected. Consider escalating to the Owner for a possible cancellation." and requires escalation before proceeding.
- Given a required safety item (e.g. insurance certificate) cannot be confirmed, When the Guide attempts sign-off, Then sign-off is blocked until the item is resolved.
- Given a mitigation is tagged for the briefing, When the risk assessment is signed off, Then the mitigation automatically appears in the briefing confirmation step.

---

## FUNC-OPS05 — Submit Rider Check-In
**Maps to:** REQ-OPS05

**User Stories**
- As a Guide, I want to confirm each rider's fit, health/suitability, and consent at check-in, so that only cleared riders join the tour.
- As a Rider, I want to review my details and re-confirm the waiver, so that my information is accurate and my consent is current for this specific tour.

**Acceptance Criteria**
- Given the kit check, bike inspection, and risk assessment are complete and the rider is present, When the Guide processes check-in, Then bike/equipment fit, health/suitability, and consent are each confirmed, and the rider re-confirms the liability waiver with a fresh signature.
- Given a rider declares a new incompatible medical condition, When check-in is processed, Then the rider is refused with "This rider has declared a medical condition incompatible with the tour. They have been refused." and flagged for Owner-processed refund.
- Given a rider is visibly impaired or intoxicated, When check-in is processed, Then the rider is refused and the refusal recorded.
- Given a minor arrives without their declared accompanying adult, When check-in is processed, Then the minor is refused and the refusal recorded.
- Given a rider refuses to re-confirm the waiver, When check-in is processed, Then the rider is refused and the refusal recorded.
- Given every rider has been processed, When the Guide signs the all-riders declaration, Then the declaration is only signable once every rider's status is resolved, and a rider is never marked cleared without a recorded waiver re-confirmation.

---

## FUNC-OPS06 — Submit Briefing Confirmation
**Maps to:** REQ-OPS06

**User Stories**
- As a Guide, I want to confirm delivery of all six briefing sections including day-specific mitigations, so that there is a timestamped record the group was fully briefed.

**Acceptance Criteria**
- Given all riders are checked in and cleared, When the Guide delivers the briefing, Then all six briefing sections are delivered and day-specific mitigations tagged during the risk assessment are shown inline at the relevant section (never stale).
- Given the briefing confirmation is attempted, When any section of the group present hasn't heard every section, Then the confirmation cannot be signed.
- Given a rider raises an issue mid-briefing (e.g. ill-fitting helmet), When this occurs, Then the briefing pauses with "An issue was raised during the briefing... The briefing has paused." until resolved, then resumes.
- Given a rider refuses to acknowledge a required rule, When this occurs, Then the rider is refused via the check-in refusal path.

---

## FUNC-OPS07 — Submit Departure Sign-Off
**Maps to:** REQ-OPS07

**User Stories**
- As a Guide, I want to confirm every operational gate has passed before departure, so that the tour only proceeds to live tracking when ready.

**Acceptance Criteria**
- Given the kit check, bike inspection, risk assessment, all rider check-ins, and briefing are each complete, When the Guide attempts departure sign-off, Then the readiness summary reflects the current (non-cached) state of every prior gate.
- Given an outstanding flag exists from any prior step, When sign-off is attempted, Then it is blocked with "An outstanding flag remains... Sign-off is blocked." until resolved.
- Given departure is more than 30 minutes past the planned start, When sign-off is attempted, Then the system requires confirming a shortened route or contacting the Owner about cancellation.
- Given sign-off succeeds, When the tour is marked ready to depart, Then a tour-readiness record is saved and the tour is handed to the navigation journey's live tracking start.

---

## FUNC-OPS08 — Submit Issue Log
**Maps to:** REQ-OPS08

**User Stories**
- As a Guide, I want to log a mid-tour issue (mechanical, illness, or early-leave) and its resolution, so that the Owner has visibility into what happened and how it was handled.

**Acceptance Criteria**
- Given the tour is active, When the Guide logs an issue, Then the issue is categorised as mechanical, illness, or early-leave, the chosen resolution is recorded, and the Guide's current location at the time is captured.
- Given the issue is assessed as an emergency, When categorising, Then the Guide is routed to escalate it as a preliminary incident record instead.
- Given an issue is resolved, When the tour continues, Then the issue is never left unlogged, and the tour manifest reflects any change (e.g. a rider leaving early).

---

## FUNC-OPS09 — Submit Incident Record
**Maps to:** REQ-OPS09

**User Stories**
- As a Guide, I want to log a preliminary incident record during a serious incident without it blocking my safety actions, so that the Owner is alerted immediately and a record exists to seed the formal report.

**Acceptance Criteria**
- Given a serious incident occurs (injury, collision, medical emergency) during an active tour, When the Guide logs it, Then the record captures time, location, what happened, who was involved, severity, and action taken, and the Guide's safety actions (e.g. calling emergency services, first aid) are never blocked by logging.
- Given the incident record is logged, When it is saved, Then the Owner is notified on their configured channel, and the record is tamper-evident, fully audited, and never modified or deleted once logged.
- Given no mobile signal is available at the incident location, When the Guide attempts to log, Then the system shows "No signal is available at this location. Seek help via a passer-by; the record will be logged once possible." and the Guide is directed to seek help via a passer-by.

---

## FUNC-OPS10 — Submit Ride-Completion Review
**Maps to:** REQ-OPS10

**User Stories**
- As a Guide, I want to submit a structured post-tour review capturing hazards, incidents, quality, and follow-up actions, so that the Owner has a complete record and downstream flows are triggered automatically.

**Acceptance Criteria**
- Given the tour has ended and been handed back from navigation, When the Guide submits the review, Then structured fields capture hazards/route changes, incidents/near-misses, a quality assessment, and required follow-up actions, and the review is saved and visible to the Owner.
- Given a follow-up action is ticked (e.g. risk-assessment review, incident report, insurer notification, bike-service flag, review request), When the review is submitted, Then each ticked action is queued to trigger its own downstream flow.
- Given a flagged bike from the review, When the review is submitted, Then the bike is excluded from tomorrow's assignment pool automatically before the next tour-day begins.
- Given the review is not completed immediately (e.g. before a back-to-back tour), When this occurs, Then it is saved as a draft with a reminder before the 24-hour deadline, and the draft persists until submitted or the 24-hour window lapses.
- Given a high-severity issue is mentioned in free text but its corresponding action isn't ticked, When the Guide attempts to submit, Then the system requires confirmation: tick the action or confirm the review is correct as written.
- Given a review is submitted, When it is saved, Then it is never lost.

---

## FUNC-OPS11 — Submit Incident Report
**Maps to:** REQ-OPS11

**User Stories**
- As a Guide, I want to submit a full formal incident narrative linked to the originating record, so that the Owner has a complete report to review and dispatch to the insurer.

**Acceptance Criteria**
- Given a preliminary incident record exists (or an incident was flagged in the ride-completion review), When the Guide submits the formal report, Then it includes full narrative, injury nature, third parties, emergency services involved, hospital, witnesses, and post-incident actions, and links back to its originating incident record.
- Given the report is submitted, When it is saved, Then it is available to the Owner within the 24-hour insurer-notification window.
- Given submission occurs beyond the statutory 2-hour window, When the report is submitted, Then it is logged as a process exception for Owner attention.
- **Pending sponsor decision:** the exact incident-report field set and format required by the PLI insurer is not yet specified. Acceptance criteria above reflect the conservative internal record stubbed pending that decision; the report's field set for insurer dispatch cannot be finalised until the insurer's required format is supplied.

---

## FUNC-OPS12 — Approve Incident Report
**Maps to:** REQ-OPS12

**User Stories**
- As an Owner, I want to review, annotate, and approve a formal incident report for insurer dispatch, so that it is submitted within the statutory window and tracked through to closure.

**Acceptance Criteria**
- Given a formal incident report exists, When the Owner reviews it, Then the Owner may add notes or request more information before approving.
- Given the Owner approves the report, When approval occurs, Then it is dispatched to the insurer within the statutory 24-hour window from the incident, and status advances only forward through submitted, insurer-acknowledged, reviewed, and closed.
- Given the insurer responds with questions, When this occurs, Then the system shows "The insurer has requested more information. Add the requested information and resubmit."
- Given the incident reveals a systemic risk, When this is identified, Then a full risk-assessment review is triggered automatically.
- **Pending sponsor decision:** the exact incident-report format required by the PLI insurer is not yet specified. Dispatch mechanics remain placeholder until the insurer's required format is supplied.

---

## FUNC-OPS13 — Submit Hazard Observation
**Maps to:** REQ-OPS13

**User Stories**
- As a Guide, I want to record a newly observed hazard with location, type, and severity, so that the Owner can review it for inclusion in the route hazard log.

**Acceptance Criteria**
- Given a new hazard is observed during a tour or noted in the ride-completion review, When the Guide submits the observation, Then it records street/location, hazard type, description, severity, date observed, and the Guide's location at the time.
- Given the observation is submitted, When it is saved, Then a hazard-log entry exists in pending-review status and is never lost between submission and Owner review.

---

## FUNC-OPS14 — Approve Hazard-Log Entry
**Maps to:** REQ-OPS14

**User Stories**
- As an Owner, I want to review, deduplicate, and approve pending hazard observations into the route hazard log, so that future tours are forewarned of known hazards.

**Acceptance Criteria**
- Given a hazard observation exists in pending-review status, When the Owner reviews it, Then the Owner deduplicates against existing entries on the same street, sets severity, and decides control measures.
- Given the hazard is a duplicate of an existing entry, When the Owner approves, Then the existing entry's last-confirmed date is bumped rather than creating a new entry; the hazard log never contains two separate entries for the same observed hazard on the same street.
- Given the hazard is approved, When approval completes, Then it becomes available to the navigation journey's proximity-alert mechanism for future tours, and a high-severity or briefing-relevant hazard updates the relevant briefing content.

---

## FUNC-TOUR01 — View Tour Hub
**Maps to:** REQ-TOUR01

**User Stories**
- As a Customer, I want to view my current booking status, meeting point, and available actions in one place, so that I always know where things stand for my upcoming tour.

**Acceptance Criteria**
- Given a confirmed booking and an authenticated manage-booking session, When the Customer opens the tour hub, Then they see booking reference, tour name, date/time, meeting point, attendee list, and current status, reflecting the booking's current state at the moment viewed.
- Given the Customer is a non-booker attendee viewing via a shared link, When they view the hub, Then emergency contact and other sensitive fields are never shown.
- Given the booking is cancelled, When the Customer views the hub, Then it shows "This tour has been cancelled. The remediation outcome is shown below." with the remediation outcome.
- Given the tour date has passed, When the Customer views the hub, Then it shows a completed state with "This tour has already taken place."
- Given a change has just been processed, When the Customer views the hub, Then it never shows stale status.

---

## FUNC-TOUR02 — Submit Reminder Message
**Maps to:** REQ-TOUR02

**User Stories**
- As a Customer, I want to receive a single timely reminder the day before my tour, so that I have final logistics in hand without being over-notified.

**Acceptance Criteria**
- Given a booking is confirmed and the T-1 milestone is due and not yet sent, When the milestone fires, Then a reminder covering meeting point, what-to-bring, and current weather summary is sent and recorded so it is never sent twice for this booking.
- Given a booking is made within one day of departure, When the T-1 milestone would fire, Then it is silently skipped since there is nothing to send.
- Given a booking is cancelled before the milestone fires, When this occurs, Then the reminder is never sent.
- Given a booking is modified before the milestone fires, When the reminder is sent, Then it uses the updated booking details.
- Given the reminder is a transactional notification, When it is sent, Then it bypasses marketing-consent suppression.
- **Pending sponsor decision:** the delivery channel(s) for the T-1 reminder (D-NOTIF-1) are not yet ratified. Acceptance criteria above cover content and timing only; channel selection is out of scope until decided.

---

## FUNC-TOUR03 — Submit Weather Advisory
**Maps to:** REQ-TOUR03

**User Stories**
- As a Customer, I want to be informed of weather impact on my upcoming tour, so that my expectations are set appropriately before arrival.
- As an Owner, I want advisories that the automated forecast source cannot classify to route to me for manual review, so that no advisory silently fails to send.

**Acceptance Criteria**
- Given a confirmed booking within the advisory window (e.g. next 72 hours), When the forecast is evaluated, Then an advisory is sent and recorded against the booking, classified as informational or action-required, reflecting the forecast for the specific tour time window (not the whole day).
- Given a duplicate advisory would be sent within a short window, When evaluated, Then it is suppressed unless severity has escalated.
- Given a more severe unresolved advisory has already been sent for the same booking, When a new advisory is evaluated, Then it never contradicts the more severe one.
- Given the weather data source is unavailable, When advisory generation runs, Then it is routed to manual Owner review with "Advisory generation could not reach the forecast source and was routed to manual review."
- **Pending sponsor decision:** the numeric thresholds classifying an advisory as informational versus action-required (D-TOUR-3) are not yet set. Interim behaviour is informational-only, with no auto-escalation to a cancellation-candidate state until real thresholds are supplied.

---

## FUNC-TOUR04 — Update Booking Details
**Maps to:** REQ-TOUR04

**User Stories**
- As a Customer, I want to self-service correct non-financial booking details (attendee names, ages, dietary needs, allergies, emergency contact, mobility notes), so that my information stays accurate without contacting the Owner.
- As a Guide, I want to see updated rider details before they matter, so that I brief and check in riders on current information.

**Acceptance Criteria**
- Given a confirmed booking and authenticated Customer, When the Customer edits non-financial fields, Then the update is reflected immediately in the tour hub and is visible to the Guide before the tour begins.
- Given the Customer attempts to change date or party size, When submitted, Then the system rejects it with "Date and party size changes must be made through booking modification." and directs them to the booking modification path.
- Given the change is safety-significant (e.g. severe allergy added, accessibility flagged, minor added), When the update is accepted, Then the Owner is alerted for follow-up.
- Given a financial field (date, party size, price), When any update is attempted, Then it is never editable through this requirement.

---

## FUNC-TOUR05 — Submit Change Notice
**Maps to:** REQ-TOUR05

**User Stories**
- As a Customer, I want a clear old-versus-new comparison when the Owner changes my meeting point, time, or guide, so that I understand exactly what changed.

**Acceptance Criteria**
- Given the Owner has edited a confirmed booking's meeting point, time, or guide, When the change notice is generated, Then it states old versus new explicitly and is sent via every relevant channel.
- Given the change is material (time, day, or meeting point), When the notice is sent, Then explicit acknowledgement becomes pending.
- Given the change is guide-only, When the notice is sent, Then it is informational and requests no acknowledgement.
- Given a pending material-change acknowledgement exists, When any downstream processing occurs, Then it is never silently dropped.
- Given the change occurs within 24 hours of the tour, When the notice is sent, Then delivery is escalated to urgent across every available channel.
- Given one channel fails to deliver, When this occurs, Then the Owner is made aware rather than the failure passing silently.

---

## FUNC-TOUR06 — Approve Booking Change
**Maps to:** REQ-TOUR06

**User Stories**
- As a Customer, I want to acknowledge a material operator-initiated change in a single action, so that my confirmation is recorded simply.
- As an Owner, I want to see whether a customer has acknowledged a material change, so that I have operational visibility.

**Acceptance Criteria**
- Given a material operator-change notice is pending acknowledgement, When the Customer acknowledges, Then the acknowledgement is recorded exactly once per change notice and the tour hub reflects the new details as confirmed.
- Given the tour proceeds, When acknowledgement status is checked, Then the booking proceeds under the new details regardless of acknowledgement status, since acknowledgement confirms but does not gate.
- Given no acknowledgement occurs within 24 hours, When this elapses, Then a reminder is sent and the change remains outstanding until acknowledged.
- Given the Customer wishes to reject the change, When this is attempted, Then it is out of scope here and instead routes to booking cancellation.

---

## FUNC-TOUR07 — Submit Cancellation Notice
**Maps to:** REQ-TOUR07

**User Stories**
- As a Customer, I want to be informed of a tour cancellation through every relevant channel, so that I don't miss the news regardless of which channel I check.

**Acceptance Criteria**
- Given the Owner has cancelled a confirmed booking's tour (e.g. weather, guide illness, force majeure), When the notice is generated, Then it states the reason and available remediation options, and is sent via every available channel given the urgency.
- Given the notice is sent, When delivery is attempted, Then it reaches the customer even if one channel fails.
- Given a remediation choice is required, When the notice is sent, Then the choice becomes pending.

---

## FUNC-TOUR08 — Submit Remediation Choice
**Maps to:** REQ-TOUR08

**User Stories**
- As a Customer, I want to choose full refund, rebook, or credit after a cancellation, so that my preferred remediation is actioned.

**Acceptance Criteria**
- Given a cancellation notice is pending a remediation choice with multiple options offered, When the Customer selects full refund, rebook, or credit, Then the choice triggers the corresponding action in booking, is actioned exactly once, and the tour hub reflects the outcome.
- Given no choice is made within the configured window, When the window elapses, Then a default remediation is applied per policy.
- Given rebook is chosen but no alternative date is available, When this occurs, Then a tour credit is applied with an apology instead.
- Given the chosen remediation is actioned, When processing occurs, Then it completes even if the customer doesn't return to confirm receipt.

---

## FUNC-TOUR09 — Submit Late-Arrival Notice
**Maps to:** REQ-TOUR09

**User Stories**
- As a Customer, I want to notify the Guide I'll be late with an estimated arrival time, so that the Guide can decide whether to hold the tour for me.

**Acceptance Criteria**
- Given today is tour day, the tour hasn't started, and the current time is within the configured late-arrival window, When the Customer submits a late-arrival notice, Then it includes an estimated arrival time and optional brief context, and the Guide and Owner are notified.
- Given the notification is sent, When delivery is attempted, Then it reaches the Guide before the tour proceeds without the Customer, wherever possible.
- Given the Customer cannot reach this surface (e.g. phone issue), When this occurs, Then they are directed to "Contact the Owner directly using the phone number on your booking confirmation."
- Given a no-show has already been recorded after the grace period passed, When a late-arrival notice arrives, Then it never overrides the recorded no-show.

---

## FUNC-TOUR10 — Submit No-Show Record
**Maps to:** REQ-TOUR10

**User Stories**
- As the System, I want to record a no-show once the grace period has genuinely passed and notify the customer, so that the Owner has an accurate record and the customer is informed of any remediation.

**Acceptance Criteria**
- Given the tour has started with one or more booked attendees missing beyond the grace period per rider check-in records, When this is detected, Then the no-show policy is applied per the aligned, Owner-decided approach (not an independent automated rule), the no-show is recorded against the booking, and the customer is notified of the outcome.
- Given the no-show is recorded, When processing completes, Then the record and customer notification are never both silently skipped.
- Given a late-arrival notice arrives after the tour has already started, When this occurs, Then it is logged but does not override the recorded no-show.
- Given no-show history exists, When the Owner reviews a booker, Then the Owner can see no-show patterns for that booker over time.

---

## Summary

24 requirements decomposed into 24 Features (FUNC-OPS01..14, FUNC-TOUR01..10), each with 1–3 user stories and Given/When/Then acceptance criteria derived directly from AORDL Outcomes, Postconditions, Invariants, and Errors.

Three Features carry an explicit pending-sponsor-decision note in their acceptance criteria rather than an invented answer:
- **FUNC-OPS11 / FUNC-OPS12** — PLI insurer's required incident-report format (shared open question across both).
- **FUNC-TOUR02** — T-1 reminder delivery channel(s) (D-NOTIF-1).
- **FUNC-TOUR03** — weather-advisory classification thresholds (D-TOUR-3).

All other requirements had their open questions already RESOLVED in the source AORDL and required no further flagging.
