---
module: BOOK   status: PROPOSED   actors: [Customer, Owner, System]
depends-on: [core-data-access, core-auth, core-consent-audit, core-notifications, fleet-equipment]
presumes: [Cloudflare D1, Stripe (Embedded Checkout)]
---

# booking — Module Spec

| | |
|---|---|
| **Document** | booking module spec (Stage 4) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification (`/and-ratify`). First business-function module analysed beyond the Lean-6 core set. |
| **Sources** | `Intake_Note.md` §7 · `DOMAIN-LEXICON.md` (booking/payment terms, states) · `Journey_Index.md` (UJ-BOOK-*) · `Booking_And_Payment_User_Journeys_v1_0.md` · `stripe_embedded_checkout` POC · `core-auth.md`, `core-consent-audit.md`, `core-notifications.md` (depended-on modules) |

## 1. Intent
Take a customer from tour selection through a booking that is either paid-and-confirmed or provisionally-confirmed without payment, created exactly once regardless of retries, and support in-policy modification and cancellation afterward. **Success:** a booking is created exactly once, capacity is never oversold, and every payment/refund is reconciled correctly even under webhook retry or delivery failure.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-14 | Payment mechanism is Stripe Embedded Checkout (`ui_mode: 'embedded'`); fulfilment is driven strictly by the `checkout.session.completed` webhook, never the return page. | `Intake_Note.md` §7.2 |
| F-15/F-16 | A client-supplied `Idempotency-Key` guards checkout-session creation; the D1 insert on the returned session id must independently be idempotent; the server-side idempotency store is the same `webhook_events` D1 pattern already ratified for `core-notifications` (DR-8). | `Intake_Note.md` §7.2 |
| F-19 | Maximum group size is 10 per open tour. | `Intake_Note.md` §7.2 |
| F-20 | Cumulative refund total must be read from `charge.amount_refunded`, never accumulated from a single refund call's own amount. | `Intake_Note.md` §7.2 |
| — | `bookings`, `departures`, `participants`, `payments` are Referenced entities (admin-rome DDL / POC-verified pattern); no attribute table authored here — not Built, per Lexicon §3–4. | `DOMAIN-LEXICON.md` §3–4 |
| — | Manage-booking authentication is `core-auth` JWT+KV (REQ-AUTH02); booking-reference + email is only the lookup identifier presented to find the booking. | `core-auth.md` REQ-AUTH02; DR-2 |
| — | Waiver/T&C/marketing consent is written via `core-consent-audit` (REQ-CNA01); booking does not maintain its own consent ledger. | `core-consent-audit.md` REQ-CNA01 |
| — | Confirmation and owner-alert messages are sent via `core-notifications` (REQ-NOTIF01, REQ-NOTIF04); booking does not send messages directly. | `core-notifications.md` REQ-NOTIF01/04 |

## 3. Decisions needed
All ten resolved — see `Decision_Record_Booking_Aristotle_2026-07-20.md` (DR-B1–B10). Table retained for traceability; Status column is authoritative.

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-BOOK-1 | Provisional (unpaid) booking support. | none \| self-service pay-later \| owner-created only | — | **CLOSED — DR-B1 (amends the same-day ratification).** Owner-created only, triggered by an emailed customer request handled off-system. |
| D-BOOK-2 | Provisional-booking policy: hold duration, deposit requirement, reminder cadence, no-show consequence. | *(no options — policy undefined)* | — | **CLOSED — DR-B2.** No fixed policy; Owner sets all terms per-booking at creation time. |
| D-BOOK-3 | Slot-hold transaction mechanism (KI-6/KI-10, = `core-data-access` D-DATA-3). | D1 transactional decrement \| `held_until`+sweep \| Durable Object | D1 transactional decrement | **CLOSED — DR-B3.** Recommendation confirmed. |
| D-BOOK-4 | Self-service booking modification depth (SQ-10). | full self-service \| limited (date-only) \| contact-owner-only | — | **CLOSED — DR-B4.** Limited: date-change self-service only; other changes route to Owner contact. |
| D-BOOK-5 | Cancellation policy within 48h of departure (SQ-11). | full refund \| partial \| tour credit \| none | — | **CLOSED — DR-B5.** No automated rule; Owner decides manually, case-by-case. |
| D-BOOK-6 | Emergency-contact depth (SQ-12). | per-booking \| per-attendee | — | **CLOSED — DR-B6.** One per booking (whole party). |
| D-BOOK-7 | Waiver timing (SQ-13). | inline only \| paper/QR only \| both | — | **CLOSED — DR-B7.** Both: digital party-level at booking + individual paper on the day (new REQ needed, see §4 note). |
| D-BOOK-8 | Abandonment-recovery email (SQ-14). | none \| send, gated by consent | send, gated by consent | **CLOSED — DR-B8.** Send only if marketing-email consent already granted (new REQ needed, see §4 note). |
| D-BOOK-9 | Production admin payment/refund auth (SQ-15). | static admin key \| `core-auth` operator session | `core-auth` operator session | **CLOSED — DR-B9.** Confirmed; deferred to Stage 6d (no admin-view REQ authored yet). |
| D-BOOK-10 | Security-alert routing (SQ-16). | bespoke channel \| `core-notifications` owner-alert | REQ-NOTIF04 | **CLOSED — DR-B10.** Confirmed; realised via existing REQ-NOTIF04, no new REQ needed. |

## 4. Requirements

### REQ-BOOK01 — Customer creates a booking selection
intent:        create booking-selection
actor:         Customer
preconditions: a departure exists (scheduled via REQ-BOOK11) with available capacity for the requested party size
conditions:    party size does not exceed the departure's remaining capacity (max 10 per departure, F-19); a slot hold is acquired for the duration of the selection-through-payment flow
postconditions: a booking draft exists in the `draft` state; the departure's available capacity is reduced by the held party size
outcomes:
  - Customer sees their selection confirmed and proceeds to provide attendee details
  - Owner never sees a departure oversold beyond its capacity
errors:
  - requested party size exceeds remaining capacity → no draft created; "This slot doesn't have enough space — try a smaller group or another date"
  - departure has no remaining capacity → no draft created; "This slot is no longer available — please choose another"
invariants:    a departure's held+confirmed capacity never exceeds its maximum; a slot hold is time-bounded
non-functional: Reliability — capacity checks and the hold are applied atomically (no race between two customers over the same last space)
scope:         in: tour/date/party-size selection producing a held draft | out: multi-tour cart, partial-tour selection
open-questions: none — D-BOOK-3 closed (DR-B3)
example:
  given:  Departure DEP-HID-2026-08-01-1000 (capacity 10, 6 already held/confirmed) and Tom requesting party size 2
  when:   Tom creates a booking selection
  then:   a draft booking exists holding 2 spaces; the departure shows 2 remaining

### REQ-BOOK02 — Customer submits attendee details
intent:        submit attendee-details
actor:         Customer
preconditions: a booking draft exists with an active slot hold
conditions:    one attendee record per party member; exactly one attendee is the party's `leader` (main point of contact), any number may be `co-leader` (additional points of contact), the rest are plain `attendee` (DR-B12a); an emergency contact is captured for the booking
postconditions: the booking draft holds complete attendee and emergency-contact data, with exactly one attendee marked `leader`
outcomes:
  - Customer proceeds to the consent step with their party's details recorded
  - Guide can later reference emergency-contact details if needed on tour
  - Owner can later contact the leader or any co-leader as the party's points of contact
errors:
  - a required attendee field is missing → draft not advanced; inline indication of what's missing
  - the slot hold expires before submission completes → draft data is preserved; Customer is prompted to re-confirm the slot before continuing
  - zero or more than one attendee marked `leader` → draft not advanced; exactly one leader is required
invariants:    a booking draft is never advanced to the consent step with incomplete attendee data or with anything other than exactly one `leader`
non-functional: Reliability — the customer's in-progress entry survives a hold-expiry interruption
scope:         in: attendee + emergency-contact capture for an existing draft, including leader/co-leader role assignment | out: per-attendee emergency contacts (D-BOOK-6 open)
open-questions: none — D-BOOK-6 closed (DR-B6); leader/co-leader model closed by DR-B12a
example:
  given:  Tom's draft booking for party size 2, slot hold active
  when:   Tom submits attendee details for both party members (himself as leader, his partner as co-leader) and one emergency contact
  then:   the draft holds 2 attendee records (one leader, one co-leader) and 1 emergency contact; Tom proceeds to consent

### REQ-BOOK03 — Customer submits booking consent
intent:        submit booking-consent
actor:         Customer
preconditions: attendee details are complete for the booking draft
conditions:    waiver acceptance and terms-and-conditions acceptance are both required before payment; marketing consent is optional and never pre-selected
postconditions: the booking draft records waiver + T&C acceptance; any marketing consent decision is appended via `core-consent-audit` (REQ-CNA01)
outcomes:
  - Customer proceeds to payment having accepted the waiver and terms
  - Owner can later prove waiver/T&C acceptance for this booking
errors:
  - waiver or T&C not accepted → draft not advanced; "Please accept the waiver and terms to continue"
invariants:    a booking is never confirmed without recorded waiver + T&C acceptance; marketing consent defaults to withheld
non-functional: Security — acceptance is recorded with a timestamp
scope:         in: waiver + T&C acceptance, optional marketing consent | out: waiver timing/format choice (D-BOOK-7 open)
open-questions: none — D-BOOK-7 closed (DR-B7); this REQ covers only the party-level digital layer. **CORRECTED 2026-07-20:** the second, on-day layer is a digital signature re-confirmation (not paper as originally assumed), owned by `tour-operations`' UJ-OPS-05 rider check-in — not unowned ground anymore
example:
  given:  Tom's draft booking with attendee details complete
  when:   Tom accepts the waiver and T&C, and grants marketing-email consent
  then:   the draft records waiver+T&C acceptance; a `consents` row is appended for Tom (marketing_email, granted) via REQ-CNA01

### REQ-BOOK04 — Customer submits payment for a booking
intent:        submit payment
actor:         Customer
preconditions: booking consent is recorded for the draft; the slot hold is active
conditions:    a Stripe Embedded Checkout session is created for the draft's total price, carrying a client-supplied idempotency key (F-15)
postconditions: a payment attempt exists, pending the provider's outcome
outcomes:
  - Customer completes payment inline, without being redirected away
errors:
  - card declined → "Your card was declined"; Customer offered retry or an alternative method
  - repeated identical submission (same idempotency key) → the same Stripe session is returned, not a new one; no duplicate payment attempt created
invariants:    a booking draft has at most one active (non-superseded) payment attempt at a time
non-functional: Security — card data is never handled by this system; all sensitive operations flow through Stripe
scope:         in: one payment attempt per submission, idempotent on retry | out: split payments, multi-currency
open-questions: none
example:
  given:  Tom's draft booking, consent recorded, total £90.00
  when:   Tom submits payment with idempotency key k-tom-001
  then:   a Checkout Session is created (`ui_mode: 'embedded'`); a repeat submission with k-tom-001 returns the same session

### REQ-BOOK05 — System updates a booking to confirmed on payment success
intent:        update booking
actor:         System
preconditions: the payment provider reports that a booking's payment attempt succeeded
conditions:    the provider's event id is checked against the idempotency store before processing (F-16); the booking transitions to `confirmed` exactly once regardless of how many times the provider reports the same event
postconditions: the booking is `confirmed`; the held capacity becomes permanently allocated
outcomes:
  - Customer receives their confirmation (via `core-notifications` REQ-NOTIF01)
  - Owner sees the booking as confirmed and its capacity allocated
errors:
  - the same provider event id is reported again → recorded as a duplicate, no second confirmation; original confirmation stands
  - the provider's report never arrives (provider outage) → the booking stays `draft` until a reconciliation sweep detects the underlying payment succeeded and confirms it
invariants:    a booking is confirmed at most once per payment; capacity is decremented exactly once per confirmed booking
non-functional: Reliability — confirmation is correct under repeated, out-of-order, or non-delivery of the provider's report
scope:         in: provider-report-driven, idempotent confirmation | out: treating the customer's post-payment landing view as the fulfilment signal (explicitly never authoritative, per F-14)
open-questions: none
example:
  given:  Tom's draft booking with a completed Checkout Session, provider event evt_001 not previously processed
  when:   the System receives the provider's report of success for evt_001
  then:   the booking becomes `confirmed`; a repeat delivery of evt_001 is recorded as a duplicate and confirms nothing further

### REQ-BOOK06 — Customer modifies a booking
intent:        update booking
actor:         Customer
preconditions: the booking is `confirmed` or `provisionally-confirmed`; the modification is requested outside the cancellation cut-off
conditions:    only a date/time change is self-service (DR-B4); party-size or attendee changes are not — Customer is directed to contact the Owner instead; a new date/time must have available capacity for the party size; a price difference triggers a refund (price drops) or additional charge (price rises)
postconditions: the booking's date/time is updated
outcomes:
  - Customer sees the date change confirmed with any price difference clearly stated
  - Owner sees the modification reflected in departure capacity (old slot released, new slot held)
errors:
  - requested change is within the cancellation cut-off → blocked; "Changes aren't available this close to departure — you can still cancel under the standard policy"
  - the new date/time has no capacity for the party size → blocked; alternatives suggested
  - Customer requests a party-size or attendee change → not self-service; "Contact William to change your party size or attendee details"
invariants:    a modification never leaves two departures simultaneously holding capacity for the same booking
non-functional: Reliability — capacity release-and-reacquire is atomic across the old and new departure
scope:         in: self-service date/time changes only | out: party-size/attendee changes (Owner-assisted, not this REQ), splitting one booking into multiple
open-questions: none — D-BOOK-4 closed (DR-B4)
example:
  given:  Tom's confirmed booking for DEP-HID-2026-08-01-1000, party size 2, more than 48h before departure
  when:   Tom modifies the booking to a later date with available capacity
  then:   the original departure's capacity is restored by 2; the new departure's capacity is reduced by 2; Tom sees the change confirmed

### REQ-BOOK07 — Customer cancels a booking
intent:        cancel booking
actor:         Customer
preconditions: the booking is `confirmed` or `provisionally-confirmed`
conditions:    more than 48h before departure → full refund, automatic; within 48h → refund amount is decided manually by the Owner, case-by-case, not calculated by the system (DR-B5); a provisionally-confirmed (unpaid) booking has no refund to process
postconditions: the booking is `cancelled`; held/confirmed capacity is restored to the departure
outcomes:
  - Customer sees the cancellation confirmed with the applicable refund amount (or none, if unpaid, or "William will confirm your refund" within 48h)
  - Owner sees the departure's capacity restored
errors:
  - refund fails at the payment provider → the booking remains `confirmed` (not cancelled) pending resolution; "We couldn't process the refund — William will follow up within one business day"
invariants:    departure capacity restored on cancellation never exceeds what the booking originally held; a refund never exceeds the amount paid
non-functional: Reliability — capacity restoration is not blocked by a refund-provider failure
scope:         in: self-service cancellation; automatic >48h refund; Owner-decided within-48h refund | out: partial cancellation of individual attendees (routes to REQ-BOOK06 instead), an automated within-48h refund calculation (deliberately not built — DR-B5)
open-questions: none — D-BOOK-5 closed (DR-B5)
example:
  given:  Tom's confirmed booking, £90.00 paid, departure in 5 days (>48h)
  when:   Tom cancels the booking
  then:   the booking is `cancelled`; a full £90.00 refund is issued automatically (>48h rule); the departure's capacity is restored by 2

### REQ-BOOK08 — Owner creates a booking from an enquiry
intent:        create booking
actor:         Owner
preconditions: an enquiry exists with agreed tour, date, party size, and price
conditions:    the agreed price may differ from standard published price (negotiated group/corporate rate)
postconditions: a booking draft exists with the agreed terms, pending a payment link sent to the customer
outcomes:
  - Owner sees the booking created and a payment link generated to send to the customer
  - once paid, downstream confirmation is identical to a direct booking (REQ-BOOK05)
errors:
  - agreed price differs from standard by more than a threshold discount → Owner is prompted to confirm before the booking is created, guarding against an accidental near-zero price
invariants:    an owner-created booking follows the same confirmation path as a direct booking once paid
non-functional: Security — the payment link carries the agreed price, not a customer-editable amount
scope:         in: enquiry-to-booking conversion with owner-set terms | out: bank-transfer/manual-payment recording (tracked as unowned ground pending a decision)
open-questions: none
example:
  given:  an enquiry from Marie (Prospect) agreed at a group rate of £400 for 10 people
  when:   William creates a booking from the enquiry
  then:   a draft booking exists at £400 for 10; a payment link is generated for Marie

### REQ-BOOK09 — System archives an abandoned booking draft
intent:        archive booking-draft
actor:         System
preconditions: a booking draft's slot hold has expired with no payment and no provisional booking taken
conditions:    the draft is retained for 24 hours in an `abandoned` state before permanent removal
postconditions: the draft is marked `abandoned`; the held capacity is released back to the departure
outcomes:
  - Owner sees abandonment does not silently retain capacity that should be bookable by someone else
errors:
  - none — this is itself the recovery path for an unresolved draft
invariants:    an abandoned draft never continues to hold departure capacity
non-functional: Reliability — capacity is released when the hold's TTL elapses, not left to accumulate
scope:         in: hold-expiry driven archival + capacity release | out: abandonment-recovery contact (DR-B8: closed as "send, gated by consent" — but the sending REQ itself is not yet authored; belongs to `core-notifications`, consulting `core-consent-audit` REQ-CNA05, not this REQ)
open-questions: none
example:
  given:  a draft booking whose 5-minute slot hold expired with no payment
  when:   the System archives the draft
  then:   the draft is marked `abandoned`; the departure's held capacity is released

### REQ-BOOK10 — Owner creates a provisional booking from a customer's request
intent:        create provisional-booking
actor:         Owner
preconditions: a customer has requested a provisional (unpaid) booking, by email, outside the self-service flow
conditions:    the Owner sets the hold duration, any deposit requirement, and reminder cadence individually for this booking (DR-B2 — no system-wide policy); payment is not required at creation
postconditions: the booking is `provisionally-confirmed`, with Owner-set hold duration/deposit/reminder terms recorded against it; capacity is held against the departure exactly as a paid confirmation would hold it; a participant/consent completion link is generated and sent to the customer, the same way REQ-BOOK08 sends a payment link (DR-B11)
outcomes:
  - Owner sees the booking created with the terms they set
  - Customer receives confirmation of the provisional booking and its terms (via `core-notifications` REQ-NOTIF01), plus the completion link
  - capacity is held even though no payment has been taken
  - Customer independently supplies attendee details and waiver/terms acceptance via the completion link, following the existing REQ-BOOK02 → REQ-BOOK03 draft-booking flow unchanged — the Owner never enters this on the customer's behalf (DR-B11, preserves DR-B7's customer-own-acceptance invariant)
errors:
  - requested party size exceeds the departure's remaining capacity → booking not created; Owner sees the same capacity constraint as REQ-BOOK01
invariants:    a provisionally-confirmed booking holds capacity identically to a paid confirmation — it is never treated as lower-priority in the departure's capacity accounting; every provisional booking has an Owner-set hold duration (never indefinite); "provisionally-confirmed" describes capacity status only — it does not imply participant/consent data is yet complete (DR-B11)
non-functional: Reliability — the same atomic capacity-decrement guarantee as REQ-BOOK01 applies
scope:         in: Owner-created provisional booking with Owner-set terms; generating and sending the customer's completion link | out: a customer-facing self-service pay-later flow (rejected — DR-B1); receipt/handling of the customer's emailed request itself (off-system, not modelled); Owner-side entry of participant/consent data (rejected — DR-B11)
open-questions: none — D-BOOK-1, D-BOOK-2, and DR-B11 closed (DR-B1, DR-B2, DR-B11)
example:
  given:  a customer's emailed request for a provisional booking on DEP-HID-2026-08-01-1000, party size 2
  when:   William creates a provisional booking, setting a 7-day hold and no deposit
  then:   the booking is `provisionally-confirmed` with a 7-day hold and no deposit recorded; the departure's capacity reflects the hold exactly as a paid confirmation would; the customer receives a completion link to supply attendee details and accept the waiver/terms

### REQ-BOOK11 — Owner creates a departure *(relocated from back-office REQ-BO01, DR-BO1)*
intent:        create departure
actor:         Owner
preconditions: a published tour exists to schedule against; Owner is in an operator session
conditions:    a departure is a single dated, timed instance of one tour (recurring patterns out of scope, DR-BO4), with capacity not exceeding the maximum group size (10, F-19) and an optionally-assigned guide (DR-BO5); the same tour may not have two departures at the identical date-and-time
postconditions: a bookable departure exists with zero bookings and full remaining capacity; if no guide is assigned it is flagged not-ready-to-run
outcomes:
  - Owner sees the departure open for booking and available to allocate a guide and bikes against
  - a Customer's booking selection (REQ-BOOK01) can now proceed against a real departure
errors:
  - capacity set above the maximum group size → rejected; "A departure can hold at most 10 riders"
  - a departure already exists for that tour at that date and time → rejected; "That tour is already scheduled at that time"
invariants:    a departure's capacity never exceeds the maximum group size; a departure belongs to exactly one tour
non-functional: Security — only an authenticated Owner may create a departure
scope:         in: single-dated departure scheduling with capacity + optional guide | out: recurring patterns (DR-BO4), gift-voucher/OTA departures
open-questions: none — DR-BO1, DR-BO4, DR-BO5
example:
  given:  the Hidden City tour (TOUR-HID) published, William in an operator session
  when:   William creates a departure for 1 August 2026 at 10:00, capacity 10, guide Emma
  then:   departure DEP-HID-2026-08-01-1000 exists — 0 booked, 10 remaining, Emma assigned, open for booking

### REQ-BOOK12 — Owner updates a departure *(relocated from back-office REQ-BO02, DR-BO1)*
intent:        update departure
actor:         Owner
preconditions: a departure exists; Owner is in an operator session
conditions:    time, capacity, or assigned guide may change; capacity may not be reduced below current held+confirmed bookings; a material change (date or time) on a departure with bookings sets a material-change flag — this REQ performs the data change only and does **not** itself send customer notices (that is orchestrated by `back-office` via `pre-tour` REQ-TOUR05, preserving the acyclic dependency direction)
postconditions: the departure reflects the updated details; a material change is flagged for downstream notification
outcomes:
  - Owner sees the departure updated
  - a material change is marked so booked Customers can be notified (orchestrated by `back-office`)
errors:
  - capacity reduced below current bookings → rejected; "N riders are already booked — capacity can't go below that"
invariants:    capacity is never set below current held+confirmed bookings
non-functional: Reliability — a material change is never silently applied without being flagged for notification
scope:         in: time/capacity/guide data edits + material-change flagging | out: sending the customer notices (`pre-tour`, orchestrated by `back-office`); moving a departure to a different tour
open-questions: none — DR-BO1
example:
  given:  departure DEP-HID-2026-08-01-1000 with 2 confirmed bookings, guide Emma
  when:   William updates the assigned guide from Emma to himself
  then:   the departure shows William as guide; no material-change flag set (guide change is non-material), so no notice is triggered

### REQ-BOOK13 — Owner cancels a departure *(relocated from back-office REQ-BO03, DR-BO1)*
intent:        cancel departure
actor:         Owner
preconditions: a departure exists; Owner is in an operator session
conditions:    the departure is marked cancelled and unbookable and its held+confirmed capacity is released; per-booking remediation (refund/rebook/credit) for bookings on it is performed by the operator-cancellation flow (`pre-tour` REQ-TOUR07 → REQ-BOOK07), orchestrated by `back-office` — this REQ performs the departure-level change only (preserving acyclic dependencies)
postconditions: the departure is cancelled and accepts no new bookings; its capacity is released
outcomes:
  - Owner sees the departure removed from the bookable schedule
  - bookings on it are handed to the operator-cancellation remediation flow
errors:
  - none blocking at the departure level — a failed per-booking remediation is handled and flagged by the operator-cancellation flow, not here
invariants:    a cancelled departure never accepts a new booking
non-functional: Reliability — cancelling the departure and releasing its capacity is atomic
scope:         in: departure-level cancellation + capacity release | out: the per-booking remediation itself (`pre-tour` REQ-TOUR07, orchestrated by `back-office`); partial cancellation (reduce capacity via REQ-BOOK12)
open-questions: none — DR-BO1
example:
  given:  departure DEP-HID-2026-08-01-1000 with Tom's confirmed booking BK-1001
  when:   William cancels the departure
  then:   the departure is cancelled and unbookable; Tom's booking is routed to the operator-cancellation remediation flow

### REQ-BOOK14 — Owner records a bike-to-departure assignment *(relocated from back-office REQ-BO07, DR-BO2a — booking owns `bike_assignments`)*
intent:        create bike-assignment
actor:         Owner
preconditions: a departure exists; one or more bikes exist in `fleet-equipment`
conditions:    a bike may be assigned only if it is `in-service` (read from `fleet-equipment`) and route-eligible for the departure's tour, and is not already assigned to another departure overlapping in time; the number assigned should meet the departure's booked party size
postconditions: the named bikes are recorded assigned to the departure (`bike_assignments`), ready for the guide's pre-tour inspection
outcomes:
  - Owner sees which specific bikes are allocated to the tour-day
  - Guide finds those bikes already assigned when starting the pre-tour bike inspection (`tour-operations` REQ-OPS03)
errors:
  - a chosen bike is flagged/out-of-service → rejected; "FOB-00X is out of service — choose another"
  - a chosen bike is already assigned to an overlapping departure → rejected; "FOB-00X is already out on another tour at that time"
  - fewer bikes assigned than booked riders → allowed, departure flagged under-provisioned until resolved
invariants:    only an `in-service` bike is ever assigned; a bike is never assigned to two departures overlapping in time
non-functional: Reliability — assignment reflects live bike status at assignment time
scope:         in: manual assignment of specific in-service bikes to a departure | out: automated assignment/rotation (DR-BO2)
open-questions: none — DR-BO2, DR-BO2a closed (booking owns `bike_assignments`)
example:
  given:  departure DEP-HID-2026-08-01-1000 with 2 booked riders; bikes FOB-001 and FOB-002 in-service and route-eligible
  when:   William assigns FOB-001 and FOB-002 to the departure
  then:   both bikes are recorded assigned to the tour-day; when Emma starts her pre-tour inspection she finds FOB-001 and FOB-002 assigned

### REQ-BOOK15 — Owner edits an existing booking's date, attendees, and contact roles *(DR-B12b, sponsor-directed 2026-07-24; finally implements DR-B4's "Owner-assisted" path)*
intent:        update booking (owner-assisted)
actor:         Owner
preconditions: a booking exists (any status except `cancelled`); DR-B4 already routes party-size/attendee changes and this-close-to-departure date changes to the Owner directly, rather than self-service
conditions:    the Owner may change the booking's departure (date/time — subject to the same capacity constraint as REQ-BOOK01), the attendee list (add/remove/edit attendees, subject to REQ-BOOK02's exactly-one-`leader` invariant), and each attendee's `contact_role`; this is a direct edit — no customer round-trip, since none of these fields are consent-bearing (unlike DR-B11's completion link, which exists specifically because waiver acceptance must be the customer's own act, DR-B7)
postconditions: the booking's departure and/or attendee records reflect the Owner's edit; old departure capacity is released and new departure capacity is held if the departure changed
outcomes:
  - Owner sees the booking updated immediately
  - Customer's booking record (visible via the manage-booking hub) reflects the change
invariants:    a booking edit never leaves two departures simultaneously holding capacity for the same booking (same invariant as REQ-BOOK06); exactly one attendee is `leader` after any attendee edit
errors:
  - the new departure has no capacity for the party size → edit rejected, booking unchanged
  - the edited attendee list leaves zero or more than one `leader` → edit rejected, booking unchanged
  - the booking is `cancelled` → edit rejected, "a cancelled booking cannot be edited"
non-functional: Reliability — capacity release-and-reacquire is atomic across the old and new departure, same guarantee as REQ-BOOK06
scope:         in: Owner-side date, attendee, and contact-role edits for an existing booking | out: payment amount changes (out of scope — handled by refund/additional-charge flows, not this edit); customer-initiated edits (REQ-BOOK06 self-service date-change remains the customer's own path)
open-questions: none — DR-B12b closed
example:
  given:  a confirmed booking for 2, one leader one attendee, on DEP-HID-2026-08-01-1000
  when:   the customer emails William asking to move to next week and add a third rider; William edits the booking's departure and adds the new attendee (as `co-leader`, at the customer's request)
  then:   the old departure's held capacity for 2 is released, the new departure holds capacity for 3, and the booking now lists 3 attendees (1 leader, 1 co-leader, 1 attendee)

### REQ-BOOK16 — Owner transitions an existing booking's status *(DR-B12c, sponsor-directed 2026-07-24)*
intent:        transition booking-status
actor:         Owner
preconditions: a booking exists
conditions:    the Owner selects one of a constrained set of valid transitions for the booking's current status, never an arbitrary status value; each transition runs the same side-effects its equivalent automatic path already enforces (e.g. confirming a provisional booking behaves like REQ-BOOK05's payment-triggered confirmation for capacity purposes; cancelling runs the same capacity-release and refund-eligibility logic as REQ-BOOK07)
postconditions: the booking's status reflects the completed transition, with all of that transition's normal side-effects applied (capacity released/held, refund flagged if applicable)
outcomes:
  - Owner sees the new status reflected immediately
  - departure capacity accounting and payment/refund state stay consistent with the new status
errors:
  - the requested transition is not valid from the booking's current status (e.g. `cancelled` → `confirmed`) → rejected, "this status change isn't allowed"
invariants:    a status transition never bypasses the capacity or refund side-effects its equivalent automatic path would apply; only a defined, valid transition is ever permitted (never a free-form status write)
non-functional: Reliability — the same atomic capacity guarantees applied to the automatic paths (REQ-BOOK01/05/07/09) apply to an Owner-triggered transition
scope:         in: Owner-side transitions between the booking's defined statuses (`draft`, `confirmed`, `provisionally-confirmed`, `cancelled`, `abandoned`), constrained to a valid-transition set | out: a free-form status field; inventing new statuses beyond the five already defined on `bookings.status`
open-questions: none — DR-B12c closed
example:
  given:  a provisionally-confirmed booking where the customer has since paid by bank transfer (off-system)
  when:   William transitions the booking to `confirmed`
  then:   the booking's status becomes `confirmed`, `confirmed_at` is set, and departure capacity accounting is unchanged (it was already held as confirmed-equivalent per REQ-BOOK10's invariant)

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-BOOK-01 | Enter booking flow, confirm selection | REQ-BOOK01 |
| UJ-BOOK-02 | Provide attendee details | REQ-BOOK02 |
| UJ-BOOK-03 | Review terms, sign waiver, give consent | REQ-BOOK03 · *(consults REQ-CNA01)* |
| UJ-BOOK-04 | Pay | REQ-BOOK04 |
| UJ-BOOK-05 | Receive confirmation | REQ-BOOK05 · *(consults REQ-NOTIF01)* |
| UJ-BOOK-06 | Modify an existing booking | REQ-BOOK06 |
| UJ-BOOK-07 | Cancel a booking and request refund | REQ-BOOK07 · *(consults REQ-NOTIF01 for cancellation email)* |
| UJ-BOOK-09 | Owner creates a booking from an enquiry | REQ-BOOK08 |
| UJ-BOOK-10 | Handle payment failure or abandonment | REQ-BOOK09 |
| UJ-BOOK-12 | Owner creates a provisional booking from a customer's emailed request | REQ-BOOK10 |
| UJ-BO-01 | Owner schedules a departure | REQ-BOOK11 |
| UJ-BO-02 | Owner updates a departure | REQ-BOOK12 · *(material change → `back-office` orchestrates `pre-tour` REQ-TOUR05)* |
| UJ-BO-03 | Owner cancels a departure | REQ-BOOK13 · *(`back-office` orchestrates `pre-tour` REQ-TOUR07 → REQ-BOOK07 per booking)* |
| UJ-BO-07 | Owner allocates bikes to a departure | REQ-BOOK14 · *(surfaced on `back-office` A20; reads `fleet-equipment` bike status)* |
| UJ-BO-08 | Owner edits an existing booking's date/attendees/contact roles | REQ-BOOK15 |
| UJ-BO-09 | Owner transitions a booking's status | REQ-BOOK16 |
| *(deferred)* | UJ-BOOK-08 (OTA), UJ-BOOK-11 (gift vouchers) | **not authored this pass** |

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial module spec: 10 REQs across 10 core journeys, 10 Decisions-needed (D-BOOK-1 ratified inline by sponsor; D-BOOK-2–10 open), depends-on 4 Lean-6 modules. |
| 0.2 | 2026-07-20T00:00:00Z | Stage 5 propagation (`Decision_Record_Booking_Aristotle_2026-07-20.md`, DR-B1–B10): all 10 decisions closed. REQ-BOOK10 rewritten (actor Customer→Owner, per DR-B1 amendment + DR-B2). REQ-BOOK06 narrowed to date-change self-service only (DR-B4). REQ-BOOK07's within-48h refund changed from policy-driven to Owner-manual (DR-B5). Two new REQs identified as needed but not yet authored: an on-day individual paper waiver (DR-B7, likely a Pre-Tour module concern) and a consent-gated abandonment-recovery email (DR-B8, a `core-notifications`/`core-consent-audit` concern) — carried as unowned ground, not invented here. |
