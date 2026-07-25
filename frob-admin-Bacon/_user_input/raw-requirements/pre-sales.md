---
module: PRE   status: PROPOSED   actors: [Prospect, Owner, System]
depends-on: [core-data-access, core-consent-audit, core-notifications]
presumes: [Cloudflare D1, RCA tours/routes/waypoints/guides read APIs, booking read API (departure/slot capacity)]
---

# pre-sales — Module Spec

| | |
|---|---|
| **Document** | pre-sales module spec (Stage 4) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification (`/and-ratify`). Bounded to non-AI journeys; concierge deferred to a future module. |
| **Sources** | `Intake_Note.md` §8 · `DOMAIN-LEXICON.md` (Enquiry/Saved tour terms, states) · `Journey_Index.md` (UJ-PRE-*) · `Pre_Sales_User_Journeys_v1_0.md` · `Pre_Sales_Data_Model_v1_0.md` · `core-consent-audit.md`, `core-notifications.md` (depended-on modules) · `booking.md` (presumed read target and REQ-BOOK08 cross-reference) |

## 1. Intent
Take a prospect from first contact through catalogue browsing, tour inspection, availability checking, enquiry submission, and saved-tour follow-up, to conversion into `booking` — with every consent-bearing action recorded via `core-consent-audit` and every owner-facing alert routed via `core-notifications`. **Success:** a prospect always has a low-friction path to the next step (browse, ask, save, enquire, book); the Owner never misses an enquiry's SLA; no prospect is contacted without provable consent.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-23 | Party/group size cap is 10, not the >20 figure the source journey doc uses. | `Intake_Note.md` §8.2 |
| F-24 | PRE's `enquiries` records are the direct input to `booking`'s owner-created-booking path (REQ-BOOK08). | `Intake_Note.md` §8.2 |
| F-25 | `prospects` is Built (confirmed DDL), owned and authored by `pre-sales`. | `DOMAIN-LEXICON.md` §4 |
| F-26 | Anonymous tour saves (no email) live in browser localStorage only, never reach D1; only identified saves persist as `saved_tours`. | `Intake_Note.md` §8.2 |
| — | `enquiries` and `saved_tours` are New entities — no attribute table authored here; designed at Stage 6a from these requirements, not imported from the source doc's DDL verbatim. | `DOMAIN-LEXICON.md` §3 |
| — | Consent decisions (enquiry marketing opt-in, save-by-email nudge opt-in) are written via `core-consent-audit` REQ-CNA01; PRE has no `consents` table of its own (KI-12, resolved). | `core-consent-audit.md` REQ-CNA01 |
| — | The pre-send consent check for the follow-up nudge uses `core-consent-audit` REQ-CNA05. | `core-consent-audit.md` REQ-CNA05 |
| — | Enquiry-notification and nudge-send both route via `core-notifications` (REQ-NOTIF04 for owner alerts, REQ-NOTIF01 for the nudge itself). | `core-notifications.md` |

## 3. Decisions needed
All four resolved — see `Decision_Record_PreSales_Aristotle_2026-07-20.md` (DR-P1–P4).

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-PRE-1 | Owner alert routing for enquiries (SQ-17, source doc D2). | immediate WhatsApp \| daily digest email \| both, configurable | — | **CLOSED — DR-P1.** Daily digest email; WhatsApp isn't built/spec'd yet. |
| D-PRE-2 | Do spam-flagged enquiries (`status=spam`) suppress the owner alert entirely, or just deprioritise it (SQ-18)? | suppress entirely \| deprioritise | suppress entirely | **CLOSED — DR-P2.** Recommendation confirmed. |
| D-PRE-3 | Overdue-SLA auto-email to the prospect at 24h overdue (SQ-19). | in scope this pass \| defer | defer | **CLOSED — DR-P3.** Deferred; overdue enquiries stay visible per REQ-PRE05. |
| D-PRE-4 | Chatbot launch scope (source doc D1). | *(not applicable — concierge deferred)* | — | **CLOSED — DR-P4.** Not a live decision; deferred with the whole concierge module. |

## 4. Requirements

### REQ-PRE01 — Prospect views the tour catalogue
intent:        view tour-catalogue
actor:         Prospect
preconditions: one or more tours exist with status `published` (presumed RCA read)
conditions:    catalogue reflects only currently-published tours; optional filters (theme, duration, time of day, suitability) narrow the list
postconditions: the prospect sees the current published catalogue, filtered per their choices
outcomes:
  - Prospect identifies one or more tours of interest
  - Prospect can proceed to inspect a tour or submit an enquiry if nothing matches
errors:
  - no tours match the applied filters → empty state shown with a reset option and a route to submit an enquiry instead
invariants:    the catalogue never shows an unpublished or archived tour
non-functional: Performance — catalogue content available on first load
scope:         in: filtered listing of published tours | out: personalised ranking, paid placement
open-questions: none
example:
  given:  three published tours including Hidden City (£45)
  when:   Marie (Prospect) views the catalogue with no filters applied
  then:   all three tours are listed, including Hidden City

### REQ-PRE02 — Prospect views a tour's detail
intent:        view tour-detail
actor:         Prospect
preconditions: the requested tour exists (presumed RCA read)
conditions:    detail includes route/waypoint/guide content only when the tour is `published`; a `paused` tour shows its status instead of a book action
postconditions: the prospect sees complete tour detail appropriate to its current status
outcomes:
  - Prospect has enough information to decide to book, ask a question, save, or move on
errors:
  - tour is `paused` → detail still shown, but no route to booking; an enquiry route is offered instead
  - tour does not exist (e.g. archived, bad link) → a clear not-found response, similar tours suggested
invariants:    a `paused` tour never offers a direct booking route
non-functional: Reliability — detail content matches the current published state, not a stale cache
scope:         in: full tour detail incl. route/waypoints/guide bio | out: real-time crowding/weather overlays
open-questions: none
example:
  given:  Hidden City (`TOUR-HID`), status `published`, £45, 90 minutes
  when:   Marie views its detail
  then:   she sees the route, waypoints, guide bio, and a "Book this tour" action

### REQ-PRE03 — Prospect checks availability for a date and party size
intent:        search availability
actor:         Prospect
preconditions: a tour is selected
conditions:    party size does not exceed 10 (F-23); results reflect the remaining capacity at the moment it's checked
postconditions: the prospect sees which dates/times have space for their party size
outcomes:
  - Prospect knows whether their preferred date works before committing to book
  - Prospect is offered alternatives if their first choice is unavailable
errors:
  - all slots on the selected date are fully booked → the next three available dates are suggested as alternatives
  - party size exceeds 10 → blocked at the selector; routed to REQ-PRE04 (group enquiry) instead
invariants:    availability shown never exceeds the tour's actual remaining capacity (presumed `booking` read, current as of the check)
non-functional: Reliability — availability reflects capacity as of the moment it's checked; a hold acquired downstream is `booking`'s concern, not this REQ's
scope:         in: read-only availability check by date/party-size | out: acquiring a hold (that's `booking` REQ-BOOK01)
open-questions: none
example:
  given:  Departure DEP-HID-2026-08-01-1000, capacity 10, 6 already held/confirmed, party size 2 requested
  when:   Marie checks availability for 1 August 2026, party size 2
  then:   the 10:00 slot is shown with 4 spaces remaining

### REQ-PRE04 — Prospect submits a group/corporate/private enquiry
intent:        submit enquiry
actor:         Prospect
preconditions: none — reachable from the catalogue, tour detail, or availability check
conditions:    required fields: name, preferred contact channel, party size, preferred date(s), message; phone required if WhatsApp or phone is the chosen channel; an explicit SLA is set at submission
postconditions: an `enquiry` record exists in `open` status with an SLA due time; the Owner is alerted (via `core-notifications` REQ-NOTIF04, unless D-PRE-2 suppresses for spam)
outcomes:
  - Prospect sees an on-screen acknowledgement stating the SLA ("William will reply within one business day")
  - Owner sees the enquiry with party size, dates, channel, message, and source tour
errors:
  - required field missing or invalid (e.g. no country code) → inline validation, submission blocked
  - submission is flagged spam (bot-protection/heuristics) → enquiry stored with `status=spam`; no owner alert fires (D-PRE-2)
invariants:    every non-spam enquiry has an SLA due time set at creation; an enquiry is never silently lost
non-functional: Reliability — the owner alert fires reliably for every non-spam enquiry (via REQ-NOTIF04's own guarantees)
scope:         in: enquiry capture + SLA + owner alert | out: the owner's reply itself (async, off-system), the overdue-SLA auto-email (D-PRE-3, deferred)
open-questions: none — D-PRE-1 closed (DR-P1, daily digest email), D-PRE-2 closed (DR-P2, spam suppresses entirely)
example:
  given:  Marie requests a Hidden City group booking, party size 8, preferred late July, channel WhatsApp
  when:   Marie submits the enquiry
  then:   enquiry ENQ-2001 is created with status `open`, an SLA due time is set, and William is alerted

### REQ-PRE05 — Owner responds to an enquiry
intent:        update enquiry
actor:         Owner
preconditions: an enquiry exists in `open` or `acknowledged` status
conditions:    the reply is sent via the prospect's stated preferred channel, not the Owner's choice
postconditions: the enquiry moves to `responded`, with the response time recorded against its SLA
outcomes:
  - Owner sees the enquiry marked responded, with SLA performance visible (on time / overdue)
errors:
  - none declared — the reply itself happens off-system (email/WhatsApp/phone); this REQ only covers the status update
invariants:    an enquiry's `responded_at` is never earlier than its `created_at`
non-functional: Reliability — overdue enquiries remain visible until responded, never silently dropped from view
scope:         in: marking an enquiry responded, off-system reply | out: automating the reply content itself
open-questions: none
example:
  given:  enquiry ENQ-2001, `open`, SLA due within 1 business day
  when:   William responds via WhatsApp and marks it responded
  then:   ENQ-2001 moves to `responded`; response time is recorded

### REQ-PRE06 — Prospect saves a tour by email
intent:        create saved-tour
actor:         Prospect
preconditions: a tour is being viewed or has been shortlisted
conditions:    the transactional "send me this tour" email requires no consent; the "nudge me in a few days" follow-up is opt-in and never pre-ticked, recorded via `core-consent-audit` REQ-CNA01
postconditions: a `saved_tours` record exists in `pending` nudge status (or with nudge suppressed if consent wasn't given); the tour summary is emailed immediately
outcomes:
  - Prospect receives the tour summary by email with a deep link back
  - Prospect optionally receives one follow-up nudge later, only if they opted in
errors:
  - invalid or missing email → submission blocked, inline indication
invariants:    at most one nudge is ever sent per `(prospect, tour)` pair; a nudge is never sent without recorded consent
non-functional: Reliability — the transactional email sends regardless of the nudge consent choice
scope:         in: identified save + transactional email + optional consent-gated nudge | out: anonymous (no-email) saves, which stay client-side only
open-questions: none
example:
  given:  Sarah views Hidden City and provides her email, declining the nudge
  when:   Sarah saves the tour by email
  then:   saved-tour SAVE-2001 is created; the transactional email sends; no nudge is scheduled (consent not given)

### REQ-PRE07 — System sends a saved-tour nudge
intent:        submit nudge-message
actor:         System
preconditions: a `saved_tours` record is `pending`, at least 3 days old, and its prospect has not since booked that tour
conditions:    current marketing consent must be granted (checked via `core-consent-audit` REQ-CNA05) at send time, not just at save time; suppressed if the prospect's address has bounced (via `core-notifications` REQ-NOTIF02's deliverability state)
postconditions: the nudge is sent via `core-notifications` REQ-NOTIF01 and the saved-tour record moves to `sent`; or moves to `suppressed` if a suppression rule applies
outcomes:
  - Prospect receives at most one low-pressure nudge, with an unsubscribe link
  - Owner is never seen as contacting someone who withdrew consent or already booked
errors:
  - consent withdrawn since the save → nudge suppressed, not sent, no error shown to anyone
  - prospect has since booked the tour → nudge suppressed
invariants:    a nudge is never sent without current (not just historical) consent; at most one nudge per `(prospect, tour)`
non-functional: Reliability — the consent check is re-evaluated at send time, not cached from save time
scope:         in: the +3-day consent-gated nudge | out: repeated/escalating nudges
open-questions: none
example:
  given:  saved-tour for Marie · Hidden City, `pending`, saved 3 days ago, marketing consent currently granted, not yet booked
  when:   the System sends the nudge
  then:   the message is sent via REQ-NOTIF01; the saved-tour record moves to `sent`

### REQ-PRE08 — Prospect converts into the booking flow
intent:        create booking-handover
actor:         Prospect
preconditions: a tour is selected (date/time optional)
conditions:    all context known so far (tour, date, time, party size, prospect email if captured) is carried into the handover
postconditions: a booking-flow session begins pre-filled with known context; Pre-Sales' part is complete
outcomes:
  - Prospect enters `booking` (REQ-BOOK01) with maximum context pre-filled, no re-entry of what's already known
errors:
  - none declared — this is a handover, not a terminal action with its own failure modes
invariants:    Pre-Sales never processes payment or creates a booking itself — the handover is a pre-fill, not a transaction
non-functional: Reliability — pre-filled context is accurate as of the moment of handover
scope:         in: context handover into `booking` | out: anything after the handover (owned entirely by `booking`)
open-questions: none
example:
  given:  Marie has selected Hidden City, checked availability for 1 August 2026 10:00, party size 2
  when:   Marie taps "Continue to booking"
  then:   `booking`'s REQ-BOOK01 begins pre-filled with tour=Hidden City, date=2026-08-01, time=10:00, party_size=2

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-PRE-01 | Land on site and orient | *(no dedicated REQ — orientation itself is presumed static content; first behavioural step is REQ-PRE01)* |
| UJ-PRE-02 | Browse catalogue and shortlist | REQ-PRE01 |
| UJ-PRE-03 | Inspect a single tour in depth | REQ-PRE02 |
| UJ-PRE-05 | Check availability for dates/party size | REQ-PRE03 |
| UJ-PRE-06 | Submit a group/corporate/private enquiry | REQ-PRE04 · *(Owner side: REQ-PRE05)* |
| UJ-PRE-08 | Save/return later | REQ-PRE06 · *(System side: REQ-PRE07)* |
| UJ-PRE-09 | Convert, enter booking flow | REQ-PRE08 |
| *(deferred)* | UJ-PRE-04, UJ-PRE-07 (concierge) | **not authored this pass** |

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial module spec: 8 REQs across 7 core journeys, 4 Decisions-needed, depends-on 3 Lean-6 modules, presumed read-only interface to `booking` (resolves the PRE↔BOOK cross-dependency without a cycle). |
| 0.2 | 2026-07-20T00:00:00Z | Stage 5 propagation (`Decision_Record_PreSales_Aristotle_2026-07-20.md`, DR-P1–P4): all 4 decisions closed, none carried open. |
