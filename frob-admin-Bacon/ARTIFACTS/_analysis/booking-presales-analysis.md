# Booking & Pre-Sales Analysis

**Phase:** P2 (Analysis)
**Agent:** Talib
**Source:** AORDL requirements REQ-BOOK01..14, REQ-PRE01..08 (`ARTIFACTS/_requirements/`)
**Scope:** 22 requirements decomposed into Features, User Stories, and Acceptance Criteria.

---

## Booking Module

### FUNC-BOOK01 — Create Booking Selection
**Maps to:** REQ-BOOK01

**User Stories**
- As a Customer, I want to select a tour, date, and party size, so that I can hold a slot while I complete my booking.
- As an Owner, I want departures to never be oversold, so that every confirmed booking has a real seat.

**Acceptance Criteria**
- Given a departure with available capacity for my party size, When I select that departure, Then a booking draft is created in the draft state and the departure's available capacity is reduced by my held party size.
- Given a departure with less remaining capacity than my requested party size, When I try to select it, Then I see "This slot doesn't have enough space — try a smaller group or another date" and no draft is created.
- Given a departure with zero remaining capacity, When I try to select it, Then I see "This slot is no longer available — please choose another".
- Given two customers requesting the last space simultaneously, When both submit at the same time, Then only one hold succeeds and the departure's held-plus-confirmed capacity never exceeds its maximum.

---

### FUNC-BOOK02 — Submit Attendee Details
**Maps to:** REQ-BOOK02

**User Stories**
- As a Customer, I want to enter details for everyone in my party plus one emergency contact, so that my booking has everything needed before consent.
- As a Customer, I want to mark exactly one party member as the leader (main point of contact) and optionally mark others as co-leaders, so that FOB knows who to contact (DR-B12a).
- As a Guide, I want emergency-contact details available, so that I can act on them if needed during the tour.

**Acceptance Criteria**
- Given an active booking draft with a slot hold, When I submit one attendee record per party member and a single emergency contact for the whole booking, Then the draft holds complete attendee and emergency-contact data and I proceed to the consent step.
- Given the attendee list, When I assign contact roles, Then exactly one attendee must be `leader`, any number may be `co-leader`, and the rest are `attendee` (DR-B12a).
- Given zero or more than one attendee is marked `leader`, When I try to submit, Then I see "exactly one leader is required" and the draft is not advanced.
- Given a required attendee field is missing, When I try to submit, Then I see "Please complete the missing attendee details before continuing" and the draft is not advanced.
- Given my slot hold expires before I finish submitting, When I attempt to submit, Then I see "Your hold has expired — please re-confirm your slot to continue".

---

### FUNC-BOOK03 — Submit Booking Consent
**Maps to:** REQ-BOOK03

**User Stories**
- As a Customer, I want to accept the waiver and terms and optionally opt into marketing, so that I can proceed to payment.
- As an Owner, I want proof of waiver and terms acceptance recorded, so that I can demonstrate compliance later.

**Acceptance Criteria**
- Given complete attendee details, When I accept the waiver and terms-and-conditions, Then the draft records both acceptances with a timestamp and I proceed to payment.
- Given I have not accepted the waiver or terms, When I try to proceed, Then I see "Please accept the waiver and terms to continue" and the booking is not confirmed.
- Given the marketing consent checkbox, When the consent step loads, Then it is never pre-selected, and any decision I make is appended to the consent-audit record.

---

### FUNC-BOOK04 — Submit Payment
**Maps to:** REQ-BOOK04

**User Stories**
- As a Customer, I want to pay inline without being redirected away, so that checkout feels seamless.

**Acceptance Criteria**
- Given booking consent is recorded and my slot hold is active, When I submit payment, Then a payment session is created for the draft's total price carrying my idempotency key, and a pending payment attempt exists.
- Given my card is declined, When the provider reports this, Then I see "Your card was declined".
- Given I resubmit the identical payment request with the same idempotency key, When it is processed, Then no duplicate payment attempt is created and the same payment session is returned.
- Given a draft, When a new payment is attempted, Then it never has more than one active, non-superseded payment attempt at a time.

---

### FUNC-BOOK05 — Confirm Booking on Payment Success
**Maps to:** REQ-BOOK05

**User Stories**
- As a Customer, I want my booking confirmed as soon as payment succeeds, so that I know my spot is secured.
- As an Owner, I want confirmed bookings and allocated capacity to be reliable regardless of provider retries, so that my schedule is trustworthy.

**Acceptance Criteria**
- Given the payment provider reports a booking's payment attempt succeeded, When the event identifier is checked against the idempotency store, Then the booking is confirmed exactly once and the held capacity becomes permanently allocated.
- Given the same provider event identifier is reported again, When it is processed, Then it is recorded as a duplicate, the original confirmation stands, and no second confirmation occurs.
- Given the provider's report never arrives, When a reconciliation sweep later detects the underlying payment succeeded, Then the booking is confirmed at that point; until then it stays in the draft state.
- Given a customer's post-payment landing view, When it is used as a signal, Then it is never treated as authoritative for confirmation.

---

### FUNC-BOOK06 — Self-Service Date/Time Change
**Maps to:** REQ-BOOK06

**User Stories**
- As a Customer, I want to change my booking's date or time myself when outside the cancellation cut-off, so that I don't need to contact the Owner for simple changes.
- As an Owner, I want party-size or attendee changes to route to me directly, so that I retain control over those exceptions.

**Acceptance Criteria**
- Given a confirmed or provisionally-confirmed booking outside the cancellation cut-off, When I request a date/time change to a slot with available capacity, Then the booking's date and time are updated, the old slot is released, the new slot is held, and any price difference is clearly stated.
- Given the requested change is within the cancellation cut-off, When I attempt it, Then I see "Changes aren't available this close to departure — you can still cancel under the standard policy".
- Given the new date/time has no capacity for my party size, When I attempt the change, Then alternatives are suggested for a date with available capacity.
- Given I request a party-size or attendee change, When I submit it, Then I see "Contact William to change your party size or attendee details" and no self-service change occurs.
- Given a price change results from the date change, When it is applied, Then a refund is triggered if price drops or an additional charge is triggered if price rises.

---

### FUNC-BOOK07 — Cancel Booking
**Maps to:** REQ-BOOK07

**User Stories**
- As a Customer, I want to cancel my booking and understand my refund, so that I know what to expect.
- As an Owner, I want cancelled capacity restored to the departure, so that the slot becomes bookable again.

**Acceptance Criteria**
- Given a confirmed or provisionally-confirmed booking cancelled more than 48 hours before departure, When cancellation is processed, Then a full refund is issued automatically and the departure's capacity is restored.
- Given a booking cancelled within 48 hours of departure, When cancellation is processed, Then I see a note that William will confirm the refund within 48 hours, and the Owner decides the refund amount manually.
- Given a provisionally-confirmed, unpaid booking, When it is cancelled, Then no refund is processed since none is owed.
- Given the refund fails at the payment provider, When this occurs, Then I see "We couldn't process the refund — William will follow up within one business day", and capacity restoration still proceeds unblocked.

---

### FUNC-BOOK08 — Owner-Created Booking from Enquiry
**Maps to:** REQ-BOOK08

**User Stories**
- As an Owner, I want to convert an agreed enquiry into a booking with negotiated terms, so that I can send the customer a payment link.
- As an Owner, I want the customer (not me) to supply attendee details and accept the waiver/terms via a link, so that consent remains the customer's own act (DR-B11/DR-B7).

**Acceptance Criteria**
- Given an enquiry with agreed tour, date, party size, price, and a customer email, When I create the booking, Then a booking draft exists with the agreed terms and a **completion link** is sent to the customer, and the response reports whether it sent.
- Given the customer opens the completion link, When they land on the customer app, Then they supply attendee details (FUNC-BOOK02) and consent (FUNC-BOOK03) themselves — the Owner never enters these.
- Given the agreed price differs from the standard published price by more than a threshold discount, When I try to create the booking, Then I am prompted to confirm before it proceeds.
- Given the booking is paid via the link, When payment succeeds, Then it follows the same confirmation path as a direct booking.

---

### FUNC-BOOK09 — Archive Abandoned Booking Draft
**Maps to:** REQ-BOOK09

**User Stories**
- As an Owner, I want abandoned drafts to release their held capacity automatically, so that unpaid holds never silently block other customers.

**Acceptance Criteria**
- Given a booking draft's slot hold has expired with no payment and no provisional booking taken, When the hold's time limit elapses, Then the draft is marked abandoned and the held capacity is released back to the departure.
- Given a draft is marked abandoned, When 24 hours pass, Then it becomes eligible for permanent removal.

---

### FUNC-BOOK10 — Owner-Created Provisional Booking
**Maps to:** REQ-BOOK10

**User Stories**
- As an Owner, I want to create a provisional, unpaid booking with terms I set myself, so that I can accommodate customers who requested by email outside self-service.
- As a Customer, I want confirmation of my provisional booking's terms, so that I know what's expected of me.
- As a Customer, I want to supply my own attendee details and consent via a link, so that "provisionally-confirmed" doesn't mean the Owner filled in my party or accepted my waiver for me (DR-B11).

**Acceptance Criteria**
- Given a customer's off-system provisional request and a customer email, When the Owner creates the booking, Then it is provisionally-confirmed with Owner-set hold duration, deposit, and reminder terms recorded, capacity is held exactly as a paid confirmation would hold it, and a **completion link** is sent to the customer.
- Given "provisionally-confirmed" status, When it is set, Then it describes capacity status only — it does not imply participant/consent data is complete (DR-B11); the customer completes that via the link (FUNC-BOOK02/03).
- Given the requested party size exceeds the departure's remaining capacity, When the Owner tries to create it, Then the booking is not created and the same capacity constraint as a direct booking applies.
- Given a provisional booking exists, When capacity accounting runs, Then it is never treated as lower-priority than a paid confirmation, and its hold duration is never indefinite.

---

### FUNC-BOOK11 — Create Departure
**Maps to:** REQ-BOOK11

**User Stories**
- As an Owner, I want to schedule a dated, timed departure for a published tour, so that customers have something to book against.

**Acceptance Criteria**
- Given a published tour and an authenticated operator session, When I create a departure with capacity up to 10, Then a bookable departure exists with zero bookings and full remaining capacity.
- Given no guide is assigned at creation, When the departure is created, Then it is flagged not-ready-to-run.
- Given I set capacity above the maximum group size of 10, When I submit, Then I see "A departure can hold at most 10 riders".
- Given a departure already exists for that tour at that exact date and time, When I try to create another, Then I see "That tour is already scheduled at that time".

---

### FUNC-BOOK12 — Update Departure
**Maps to:** REQ-BOOK12

**User Stories**
- As an Owner, I want to update a departure's time, capacity, or guide, so that I can keep the schedule accurate.
- As an Owner, I want material changes flagged, so that booked customers can be notified downstream.

**Acceptance Criteria**
- Given a departure exists, When I change its time, capacity, or assigned guide, Then the departure reflects the updated details.
- Given a date or time change on a departure with existing bookings, When I save it, Then a material-change flag is set for downstream notification.
- Given I try to reduce capacity below current held-plus-confirmed bookings, When I submit, Then I see "N riders are already booked — capacity can't go below that" and the change is rejected.
- Given this requirement's scope, When a data change is saved, Then no customer notice is sent directly by it — only the flag is set.

---

### FUNC-BOOK13 — Cancel Departure
**Maps to:** REQ-BOOK13

**User Stories**
- As an Owner, I want to cancel an entire departure, so that it is removed from the bookable schedule and its capacity is released.

**Acceptance Criteria**
- Given a departure exists, When I cancel it, Then it is marked cancelled and unbookable, and its held-plus-confirmed capacity is released atomically.
- Given a cancelled departure, When any new booking is attempted against it, Then it is never accepted.
- Given bookings exist on the cancelled departure, When cancellation completes, Then those bookings are handed to the separate operator-cancellation remediation flow for refund, rebook, or credit — not processed by this feature.

---

### FUNC-BOOK14 — Assign Bikes to Departure
**Maps to:** REQ-BOOK14

**User Stories**
- As an Owner, I want to assign specific in-service, route-eligible bikes to a departure, so that the guide has bikes ready for pre-tour inspection.
- As a Guide, I want assigned bikes visible before I start my pre-tour inspection, so that I know what to check.

**Acceptance Criteria**
- Given a departure and one or more in-service, route-eligible bikes, When I assign them, Then the named bikes are recorded as assigned to the departure.
- Given a chosen bike is flagged or out-of-service, When I try to assign it, Then I see "FOB-00X is out of service — choose another".
- Given a chosen bike is already assigned to an overlapping departure, When I try to assign it, Then I see "FOB-00X is already out on another tour at that time".
- Given fewer bikes are assigned than booked riders, When I save the assignment, Then it is allowed but the departure is flagged under-provisioned until resolved.

---

### FUNC-BOOK15 — Owner-Assisted Booking Edit
**Maps to:** REQ-BOOK15 *(added 2026-07-24, DR-B12b — implements DR-B4's Owner-assisted path)*

**User Stories**
- As an Owner, I want to edit an existing booking's date, attendees, and contact roles directly from the console when a customer asks, so that I can make owner-assisted changes without a customer round-trip (these aren't consent-bearing, unlike the waiver).

**Acceptance Criteria**
- Given a booking that isn't cancelled, When I change its departure, Then the old departure's capacity is released and the new departure's is held atomically (never holding two, never zero — same guarantee as FUNC-BOOK06).
- Given I edit the attendee list, When I save, Then exactly one attendee must be `leader`, else I see "exactly one leader is required" and nothing changes.
- Given the new departure has no capacity for the party size, When I save, Then the edit is rejected and the booking is unchanged.
- Given a cancelled booking, When I try to edit it, Then I see "a cancelled booking cannot be edited".

---

### FUNC-BOOK16 — Owner Booking-Status Transition
**Maps to:** REQ-BOOK16 *(added 2026-07-24, DR-B12c)*

**User Stories**
- As an Owner, I want to move a booking through its lifecycle (confirm a provisional, cancel, mark abandoned) from the console, so that I can reflect off-system events — but only via safe, defined transitions.

**Acceptance Criteria**
- Given a booking, When I select a status transition, Then only a constrained valid-transition set is offered (never a free-form status field).
- Given I confirm a transition, When it runs, Then it applies the same capacity/refund side-effects its automatic path already enforces (e.g. confirming a draft moves held→confirmed capacity; cancelling releases capacity and determines refund eligibility per FUNC-BOOK07).
- Given a transition invalid from the current status (e.g. cancelled → confirm), When I attempt it, Then I see "this status change isn't allowed" and nothing changes.

---

## Pre-Sales Module

### FUNC-PRE01 — View Tour Catalogue
**Maps to:** REQ-PRE01

**User Stories**
- As a Prospect, I want to browse and filter published tours, so that I can find one that interests me.

**Acceptance Criteria**
- Given one or more published tours exist, When I view the catalogue, Then I see only currently-published tours, never unpublished or archived ones.
- Given I apply filters for theme, duration, time of day, or suitability, When the filters are applied, Then the list narrows to matching tours and content is available on first load.
- Given no tours match my applied filters, When I view results, Then I see "No tours match your filters. Reset filters or submit an enquiry instead."

---

### FUNC-PRE02 — View Tour Detail
**Maps to:** REQ-PRE02

**User Stories**
- As a Prospect, I want to see complete detail for a tour, so that I can decide to book, ask a question, save, or move on.

**Acceptance Criteria**
- Given a published tour, When I view its detail, Then I see route, waypoint, and guide content matching the current published state, not a stale cache.
- Given a paused tour, When I view its detail, Then I see its status shown instead of a book action, and I can still submit an enquiry.
- Given a tour that does not exist, When I request its detail, Then I see "This tour could not be found. Similar tours are suggested below." with a 404.

---

### FUNC-PRE03 — Search Availability
**Maps to:** REQ-PRE03

**User Stories**
- As a Prospect, I want to check which dates and times have space for my party size, so that I know a date works before committing to book.

**Acceptance Criteria**
- Given a selected tour and a party size up to 10, When I search availability, Then I see dates and times with space, reflecting remaining capacity as of the moment it is checked.
- Given all slots on my selected date are fully booked, When I search, Then I see "No space on this date. Here are the next three available dates."
- Given my party size exceeds 10, When I search, Then I see "Party sizes above 10 need a group enquiry instead of direct availability search." with a 422.
- Given this is a read-only check, When I search availability, Then no hold is acquired on any slot.

---

### FUNC-PRE04 — Submit Enquiry
**Maps to:** REQ-PRE04

**User Stories**
- As a Prospect, I want to submit an enquiry from anywhere in my browsing journey, so that I can get help even when nothing fits directly.
- As an Owner, I want to be alerted to every genuine enquiry with a response-time target, so that I never miss one.

**Acceptance Criteria**
- Given I provide name, preferred contact channel, party size, preferred dates, and message (and phone if my channel is WhatsApp or phone), When I submit, Then an enquiry record is created in open status with a response-time target, and I see an acknowledgement stating that target.
- Given the Owner, When a non-spam enquiry is created, Then they are alerted with party size, dates, channel, message, and source tour.
- Given a required field is missing or invalid, When I submit, Then I see "Please complete all required fields, including a valid phone number if needed." with a 422.
- Given my submission is flagged spam, When it is processed, Then I see "Your enquiry has been received." but no owner alert fires.

---

### FUNC-PRE05 — Respond to Enquiry
**Maps to:** REQ-PRE05

**User Stories**
- As an Owner, I want to mark an enquiry responded via the prospect's preferred channel, so that response performance is tracked against target.

**Acceptance Criteria**
- Given an enquiry in open or acknowledged status, When I reply via the prospect's stated preferred channel and mark it, Then the enquiry moves to responded with the response time recorded against its target, never earlier than its creation time.
- Given an enquiry is overdue, When I view my enquiry list, Then it remains visible as overdue until responded, never silently dropped.

---

### FUNC-PRE06 — Save Tour with Optional Nudge
**Maps to:** REQ-PRE06

**User Stories**
- As a Prospect, I want to save a tour and receive its summary by email, so that I can revisit it later.
- As a Prospect, I want to optionally opt into a follow-up nudge, so that I'm reminded without being pressured if I don't want to be.

**Acceptance Criteria**
- Given a tour being viewed or shortlisted, When I save it with a valid email, Then a saved-tour record is created, the tour summary is emailed immediately with a deep link back, regardless of my nudge consent choice.
- Given the nudge opt-in checkbox, When the save form loads, Then it is never pre-ticked.
- Given I opt in, When the save completes, Then the record is in pending nudge status; given I did not opt in, Then nudge is suppressed on that record.
- Given an invalid or missing email, When I try to save, Then I see "Please provide a valid email address to save this tour." with a 422.

---

### FUNC-PRE07 — Send Saved-Tour Nudge
**Maps to:** REQ-PRE07

**User Stories**
- As a Prospect who opted in, I want at most one low-pressure nudge about a tour I saved, so that I'm reminded without being spammed.
- As an Owner, I want nudges suppressed the moment consent is withdrawn or the prospect books, so that I never appear to contact someone inappropriately.

**Acceptance Criteria**
- Given a saved-tour record pending at least 3 days, with current marketing consent granted at send time and the prospect not since booked, When the nudge job runs, Then the nudge is sent with an unsubscribe link and the record moves to sent.
- Given consent was withdrawn since the save, When the nudge job runs, Then the nudge is suppressed silently with no error shown to anyone, and the record moves to suppressed.
- Given the prospect has since booked the tour, When the nudge job runs, Then the nudge is suppressed silently.
- Given the prospect's email address has bounced, When the nudge job runs, Then the nudge is suppressed.
- Given a prospect-tour pair, When nudges are evaluated over time, Then at most one nudge is ever sent for that pair.

---

### FUNC-PRE08 — Hand Off to Booking
**Maps to:** REQ-PRE08

**User Stories**
- As a Prospect, I want to enter the booking flow pre-filled with everything I've already told the system, so that I never re-enter what's already known.

**Acceptance Criteria**
- Given a selected tour and any known context (date, time, party size, and prospect email if captured), When I proceed to book, Then a booking-flow session begins pre-filled with that context, accurate as of the moment of handover.
- Given the handover completes, When Pre-Sales' part is done, Then Pre-Sales never processes payment or creates a booking itself — the handover is a pre-fill only, and everything after it is owned entirely by the booking module.

---

## Traceability Summary

| REQ ID | Feature ID |
|---|---|
| REQ-BOOK01 | FUNC-BOOK01 |
| REQ-BOOK02 | FUNC-BOOK02 |
| REQ-BOOK03 | FUNC-BOOK03 |
| REQ-BOOK04 | FUNC-BOOK04 |
| REQ-BOOK05 | FUNC-BOOK05 |
| REQ-BOOK06 | FUNC-BOOK06 |
| REQ-BOOK07 | FUNC-BOOK07 |
| REQ-BOOK08 | FUNC-BOOK08 |
| REQ-BOOK09 | FUNC-BOOK09 |
| REQ-BOOK10 | FUNC-BOOK10 |
| REQ-BOOK11 | FUNC-BOOK11 |
| REQ-BOOK12 | FUNC-BOOK12 |
| REQ-BOOK13 | FUNC-BOOK13 |
| REQ-BOOK14 | FUNC-BOOK14 |
| REQ-BOOK15 | FUNC-BOOK15 |
| REQ-BOOK16 | FUNC-BOOK16 |
| REQ-PRE01 | FUNC-PRE01 |
| REQ-PRE02 | FUNC-PRE02 |
| REQ-PRE03 | FUNC-PRE03 |
| REQ-PRE04 | FUNC-PRE04 |
| REQ-PRE05 | FUNC-PRE05 |
| REQ-PRE06 | FUNC-PRE06 |
| REQ-PRE07 | FUNC-PRE07 |
| REQ-PRE08 | FUNC-PRE08 |

All 24 requirements have zero open questions (all resolved in AORDL). No sponsor-owned open questions were raised during this analysis.

*(Update 2026-07-24: REQ-BOOK15/BOOK16 added — FUNC-BOOK15/16 — and FUNC-BOOK02/08/10 amended for DR-B11 completion link + DR-B12a `contact_role`. Count 22 → 24. See `Decision_Record_Booking_Aristotle_2026-07-20.md` DR-B11/B12 and findings FINDING-004/005.)*
