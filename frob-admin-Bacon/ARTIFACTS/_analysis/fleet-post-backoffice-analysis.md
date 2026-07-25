# Fleet, Post-Tour & Back-Office Analysis (P2)

**Phase:** P2 (Analysis)
**Agent:** Talib
**Scope:** REQ-FLEET01..08, REQ-POST01/02/03/10, REQ-BO04/05/06 (15 requirements)
**Source:** AORDL requirement files in `ARTIFACTS/_requirements/`

---

## Fleet & Equipment

### FUNC-FLEET01 — Create Bike Record
**Maps to:** REQ-FLEET01

**User Stories**
- As an Owner, I want to create a bike record when a bike is acquired, so that it is immediately available for tour assignment.
- As an Owner, I want the system to enforce a unique bike identifier, so that fleet records stay unambiguous.

**Acceptance Criteria**
- Given a bike has been physically acquired, when the Owner creates a bike record with a unique identifier and route eligibility, then the bike record is saved with status in-service and appears in the fleet view as eligible for tours.
- Given the Owner enters a bike identifier already in use, when the record is submitted, then the system rejects the save with "This bike identifier is already in use" and suggests a next-sequential identifier.
- Given no serial number is provided, when the record is submitted, then the bike is saved successfully with a warning that the serial number is missing.
- Given a bike record has been saved, when the Owner views the fleet, then the bike is immediately available for tour assignment (no delay).

---

### FUNC-FLEET02 — Create Equipment Record
**Maps to:** REQ-FLEET02

**User Stories**
- As an Owner, I want to onboard equipment items individually, so that each item is tracked with its own description and status.
- As an Owner, I want a replacement item to link to the item it replaces, so that retirement history is preserved.

**Acceptance Criteria**
- Given equipment has been physically acquired, when the Owner enters a description and saves, then an equipment record is created and appears as available for use.
- Given a helmet is onboarded, when the record is saved, then an annual review reminder is scheduled at that moment (never left unset).
- Given a replacement item is entered with a reason and a link to the replaced item, when saved, then the prior item's status is set to retired.
- Given a helmet has been involved in an impact, when the Owner attempts anything other than retiring it, then the system blocks with "This helmet has been involved in an impact and must be retired immediately" and requires a replacement record.

---

### FUNC-FLEET03 — View Fleet Readiness
**Maps to:** REQ-FLEET03

**User Stories**
- As an Owner, I want a single view of fleet and equipment status, so that I can judge whether the fleet is ready for tomorrow's tours.
- As an Owner, I want critical alerts surfaced prominently, so that I never miss a compliance lapse or safety issue.

**Acceptance Criteria**
- Given at least one fleet asset exists, when the Owner opens the readiness view, then current status counts of bikes by status and equipment by type and status are shown.
- Given items are failing inspection, expiring within 30 days, or approaching a compliance date, when the Owner opens the view, then those alerts are surfaced, not buried.
- Given a critical condition exists — a compliance lapse, no in-date helmets, or most bikes flagged — when the Owner opens the view, then that condition is never hidden.
- Given the underlying fleet data is stale, when the Owner opens the view, then the system shows "Fleet readiness data may be out of date" with the last-synced timestamp.

---

### FUNC-FLEET04 — Submit Service Flag
**Maps to:** REQ-FLEET04

**User Stories**
- As an Owner, I want to flag a bike for service from an inspection failure, after-ride review, or direct observation, so that unsafe bikes are pulled from rotation immediately.

**Acceptance Criteria**
- Given a bike fails inspection, is flagged in an after-ride review, or the Owner identifies a fault, when the Owner submits a service flag with a reason, source, and optional note or photo, then the bike's status becomes flagged-for-service immediately (not batched).
- Given a bike is flagged-for-service, when any user attempts to assign it to a tour, then the assignment is blocked until the flag is cleared.
- Given a service flag is submitted with no reason, when saved, then the system rejects it with "A service flag requires a reason before it can be saved."
- Given a bike has been flagged, when the Owner opens the fleet readiness view, then the flagged bike and its reason are visible there.

---

### FUNC-FLEET05 — Submit Maintenance Event
**Maps to:** REQ-FLEET05

> **Note — pending sponsor decision:** REQ-FLEET05 carries an open question — whether a scheduled maintenance trigger based on time and mileage should also generate maintenance events, in addition to the flag-driven path described below. This Feature covers only the flag/in-maintenance-driven path that is confirmed in scope; the scheduled-trigger path is **not** decomposed here and awaits a sponsor decision.

**User Stories**
- As an Owner, I want to log in-house repair work performed on a flagged or in-maintenance bike, so that there is a durable, permanent record of what was done.

**Acceptance Criteria**
- Given a bike is flagged-for-service or in-maintenance, when the Owner submits a maintenance event describing the work performed and parts replaced (time and cost optional), then the event is added to the bike's permanent history.
- Given a maintenance event has been saved, when any user attempts to modify or delete it, then the system prevents this — the event is never modified or deleted once saved.
- Given a maintenance event is submitted with no work description, when saved, then the system rejects it with "A maintenance event requires a description of the work performed."
- Given a maintenance event is saved, when the record is viewed, then it is timestamped and attributed to the Owner.
- **Out of scope for this Feature (pending sponsor decision):** external repairs performed off-system, and any scheduled time/mileage-based maintenance trigger.

---

### FUNC-FLEET06 — Update Bike Status (Return to Service)
**Maps to:** REQ-FLEET06

**User Stories**
- As an Owner, I want to clear a flagged or in-maintenance bike back to service, so that it becomes available for tour assignment again once repaired.

**Acceptance Criteria**
- Given a bike is flagged-for-service or in-maintenance, when the Owner attempts to move it to in-service, then the system requires at least one in-house maintenance event logged since the flag before allowing the change.
- Given no maintenance event has been logged since the flag, when the Owner attempts to return the bike to service, then the system rejects it with "This bike cannot return to service until a maintenance event has been logged."
- Given the bike is returned to service, when the status change is saved, then the bike is immediately re-eligible for tour assignment.
- Given the same bike has been flagged 3 or more times in 90 days for the same issue, when the Owner attempts to clear it, then the system warns "This bike has a recurring pattern for this issue — review before clearing" but allows the Owner to proceed.

---

### FUNC-FLEET07 — Submit Compliance Alert (System-Generated)
**Maps to:** REQ-FLEET07

**User Stories**
- As an Owner, I want to be alerted automatically when a tracked compliance item (PLI, EL, ICO, helmet expiry, first aid contents review) becomes pending or overdue, so that I never have to track expiry dates manually.

**Acceptance Criteria**
- Given a tracked compliance item exists, when the daily evaluation runs, then the item is classified as pending if within a configurable horizon of expiry (default 30 days), or critical if past expiry.
- Given an item's classification changes to pending or critical, when the change is detected, then a single alert is sent at that moment — not on a recurring schedule.
- Given a compliance item is critical and overdue, when the daily evaluation completes, then that item is never left silently unalerted.
- Given a compliance item's classification cannot be evaluated, when the daily check runs, then the system records the error "A compliance item could not be evaluated for its current status" and directs the Owner to check the recorded expiry date.
- Given the daily evaluation is scheduled, when each day passes, then the evaluation runs without missed executions.

---

### FUNC-FLEET08 — Update Compliance Item (Renewal)
**Maps to:** REQ-FLEET08

**User Stories**
- As an Owner, I want to record a compliance renewal with its new expiry date, so that the associated alert clears and the item shows as in-date.

**Acceptance Criteria**
- Given a compliance alert exists (pending or critical), when the Owner records a renewal with a new expiry date (and, for insurance or ICO, an attached certificate or confirmation), then the item's expiry date is updated and the alert clears immediately — not after the next daily check.
- Given a new expiry date is not in the future, when the Owner submits the renewal, then the system rejects it with "The renewal date must be after today's date."
- Given a renewed item's classification changes again in the future, when that change occurs, then a new alert fires at that time.

---

## Post-Tour Communications

### FUNC-POST01 — Send Thank-You Message
**Maps to:** REQ-POST01

**User Stories**
- As the system, I want to send a thank-you message after a genuinely completed, reviewed booking, so that the customer is acknowledged and offered a next step.

**Acceptance Criteria**
- Given a booking is marked completed, review request is ticked, and the booking was not a no-show or operator cancellation, when the configured delay elapses (default T+12h), then a thank-you message is sent, including a review link and a private-feedback link, and the send is recorded.
- Given the booking was a no-show, when the completion trigger fires, then no thank-you is sent (no-show communication applies instead).
- Given the booking was operator-cancelled, when the completion trigger fires, then no thank-you is sent (the refund/credit confirmation already covers it).
- Given a booking has already received its thank-you, when the trigger would otherwise re-fire, then the thank-you is sent exactly once per completed booking.
- Given the customer has not consented to marketing, when a completed, reviewed booking triggers the thank-you, then the message is still sent — the thank-you is never gated by marketing consent.

---

### FUNC-POST02 — Send Review Request
**Maps to:** REQ-POST02

**User Stories**
- As the system, I want to send a review request after the thank-you message, so that the customer can leave a public review or be routed to private feedback.

**Acceptance Criteria**
- Given a booking is completed and its thank-you message has been sent, when T+24h is reached, then a review-request message is sent once, with links to both TripAdvisor and Google and a privately-routed feedback option shown with equal visual weight to the public review links.
- Given the review request has already been sent, when a retry or duplicate trigger occurs, then it is not sent again — one-and-done, no reminder.
- Given the customer takes no action, leaves a public review, or routes to private feedback, when any of these occurs, then it is treated as a valid outcome requiring no error handling.

---

### FUNC-POST03 — Submit Feedback
**Maps to:** REQ-POST03

**User Stories**
- As a Customer, I want to submit ratings and optional free-text feedback about my completed tour, so that my experience is recorded.
- As an Owner, I want to be alerted immediately when a customer leaves a low rating, so that I can follow up personally.

**Acceptance Criteria**
- Given a completed booking accessible by booking reference and email, or via a link from the thank-you or review-request message, when the Customer submits ratings for overall, guide, value, and would-recommend (with optional free text), then the feedback is stored and the Customer sees a confirmation.
- Given the overall rating is 3 stars or below, when the feedback is submitted, then the Owner is alerted immediately, with full context, and the alert is never delayed or batched.
- Given the overall rating is above 3 stars, when the feedback is submitted, then no low-rating alert is triggered.
- Given any rating and accompanying text is submitted, when received, then it is accepted as submitted (no rejection path declared).

---

### FUNC-POST10 — Update Marketing Preferences
**Maps to:** REQ-POST10

**User Stories**
- As a Customer, I want to update my marketing preferences via a signed link from any retention message, so that future sends respect my choices.

**Acceptance Criteria**
- Given a signed preferences link from any retention message, when the Customer opens it and changes granular preferences (including unsubscribe-all), then the preferences are updated, a consent record is appended, and the Customer sees confirmation.
- Given preferences are updated, when future messages are queued, then they immediately respect the new preferences.
- Given the Customer unsubscribes from marketing, when a transactional message is due — booking confirmation, refund, weather advisory, or completed-tour thank-you — then it is still sent; transactional messages are never affected by a marketing-only unsubscribe.
- Given the signed link is expired or tampered with, when the Customer opens it, then the system shows "This link has expired - request a new one" and allows a new link request subject to rate limiting.

---

## Back-Office

### FUNC-BO04 — View Departure Calendar
**Maps to:** REQ-BO04

**User Stories**
- As an Owner, I want a read-only calendar of scheduled departures across a date range, so that I can see at a glance which departures are full, understaffed, or under-equipped.

**Acceptance Criteria**
- Given the Owner is in an operator session, when the departure calendar is opened for a date range, then each departure shows its tour, time, assigned guide, booked-versus-capacity count, and bike-allocation readiness.
- Given a departure lacks a guide or bikes, when the calendar is viewed, then that readiness gap is visible at a glance.
- Given a date range has no scheduled departures, when the Owner selects that range, then the system shows "No departures scheduled in this range" and prompts a different range.
- Given the calendar is a read-only view, when the Owner wants to edit a departure, then they are routed to the separate departure-update capability (out of scope here).

---

### FUNC-BO05 — Search Bookings
**Maps to:** REQ-BO05

**User Stories**
- As an Owner, I want to search bookings by reference, customer, tour, date, or status, so that I can find any booking quickly.

**Acceptance Criteria**
- Given the Owner is in an operator session, when a search is run by booking reference, customer name or email, tour, departure date, or status, then matching bookings are returned.
- Given search results are returned, when the Owner views them, then no customer payment-card data is included — only provider references.
- Given no bookings match the search criteria, when the search is run, then the system shows "No bookings match these criteria" and prompts the Owner to adjust criteria.

---

### FUNC-BO06 — View Booking Detail
**Maps to:** REQ-BO06

**User Stories**
- As an Owner, I want to view the full detail of a single booking, so that I can answer a customer question or decide an action.

**Acceptance Criteria**
- Given a booking exists and the Owner is in an operator session, when the Owner opens the booking detail view, then attendees, emergency contact, payment/refund state (as provider references, never card data), the consent and waiver record with timestamps, and the booking's status history are shown.
- Given the booking's authoritative state changes, when the Owner views the detail, then it reflects the current authoritative state.
- Given the booking reference is not found, when the Owner searches for it, then the system shows "No booking found for that reference" (404) and prompts the Owner to check the reference.
- Given the detail view is read-only, when the Owner wants to edit the booking, then they are routed to the booking-update or payment-admin capability (out of scope here).

---

## Traceability Summary

| REQ ID | Feature ID | Actor | Notes |
|---|---|---|---|
| REQ-FLEET01 | FUNC-FLEET01 | Owner | |
| REQ-FLEET02 | FUNC-FLEET02 | Owner | |
| REQ-FLEET03 | FUNC-FLEET03 | Owner | |
| REQ-FLEET04 | FUNC-FLEET04 | Owner | |
| REQ-FLEET05 | FUNC-FLEET05 | Owner | Pending sponsor decision on scheduled-trigger scope |
| REQ-FLEET06 | FUNC-FLEET06 | Owner | |
| REQ-FLEET07 | FUNC-FLEET07 | Owner (System-generated) | |
| REQ-FLEET08 | FUNC-FLEET08 | Owner | |
| REQ-POST01 | FUNC-POST01 | System | |
| REQ-POST02 | FUNC-POST02 | System | |
| REQ-POST03 | FUNC-POST03 | Customer / Owner | |
| REQ-POST10 | FUNC-POST10 | Customer | |
| REQ-BO04 | FUNC-BO04 | Owner | |
| REQ-BO05 | FUNC-BO05 | Owner | |
| REQ-BO06 | FUNC-BO06 | Owner | |
