---
module: EML            status: Reliable          actors: [Owner, Party Leader, Co-leader, System]
depends-on: [booking, pre-sales]
presumes: [core-notifications]
---

# Friends on Bikes — Email Workflows (EML) — Module Spec

| | |
|---|---|
| **Document** | EML Module Spec |
| **Version** | 0.11 |
| **Date** | 2026-07-25 |
| **Status** | Reliable for all 18 requirements, no open questions remaining. REQ-EML03/REQ-EML15 scope fields updated per DR-12 (self-service surface owned externally). REQ-EML17 added per DR-13 (2026-07-25): Owner may reply in-tool to a linked inbound message, closing a gap the E2E POC's own testing surfaced. REQ-EML02 amended per DR-14 (2026-07-25): missed/already-past reminder milestones fire on the next check rather than being skipped. REQ-EML18 added per DR-15 (2026-07-25): resolves the last open question, D-EML-5 — an Owner-controlled toggle sends a generic holding acknowledgement on Enquiry arrival; REQ-EML09 (the actual reply) is unchanged and still the only path that marks an Enquiry replied |
| **Sources** | `A-gathering/Intake_Note.md` v0.3, `A-gathering/DOMAIN-LEXICON.md` v0.2, `A-gathering/Journey_Index.md` v0.5, `B-documentation/Module_Map.md` v0.6, `B-documentation/Decision_Record_2026-07-23.md`, `B-documentation/Decision_Record_2026-07-24.md` (DR-10/DR-11/DR-12), `B-documentation/Decision_Record_2026-07-25.md` (DR-13, DR-14, DR-15); ROME-GUIDE-001 v1.1; bandy v0.10 |

## 1. Intent
Trigger, template, and send every customer-facing transactional email across the booking lifecycle — from booking confirmation through to the post-tour thank-you — so the Owner no longer hand-drafts routine emails, while retaining a case-by-case free-text path for cancellation explanations. Success: every journey in the Journey Index (UJ-EML-01, 03–09, 16) is served by a templated, triggered send; no routine email is manually composed end-to-end; every send reaches the full currently-opted-in recipient set for its Booking, not just its Party Leader.

## 2. Facts
Deferred to `A-gathering/DOMAIN-LEXICON.md` (this project's lexicon) and the inherited FOB lexicon it references. Key facts restated here only because they gate requirement conditions directly:

| ID | Fact | Source |
|---|---|---|
| F-05 | Deposit is 20%, non-refundable | Intake Note F-05 |
| F-06/F-07 | Pay-on-day path: attendance confirmed 24hrs before; cash/on-day only; deposit forfeited if not honoured | Intake Note F-06/F-07 |
| F-12 | All email to `bookings@friendsonbikes.uk` is captured via Cloudflare Email Routing + a Worker, persisted for audit/search/chains, then forwarded to the Owner's personal address for reading/reply | Intake Note F-12 |
| F-13 | Threading groups messages by standard reply-reference headers (`References`/`In-Reply-To`), not a bespoke scheme | Intake Note F-13 |
| F-14 | Retention is indefinite; periodic archival exports to a downloadable backup file are expected, not deletion | Intake Note F-14 |
| F-17 | Every Owner-actor requirement (REQ-EML04, EML05, EML09, EML10) is served by a web admin module surface (built this pass); business-rule enforcement/validation for those actions lives in a presumed Cloudflare Workers API layer, not the client. A second parallel surface (Claude agent interface) is intended but deferred | Intake Note F-17 (DR-6) |
| BR-06 | Customer-initiated cancellation: full refund minus deposit if ≥24hrs before departure; no refund if <24hrs; always routes to Owner for manual approval | Intake Note BR-06 |
| BR-08 | Weather disruption: always full refund, same remedy path as company-initiated cancellation | Intake Note BR-08 |
| BR-09 | Enquiry replies address the specific question(s) asked, not a generic acknowledgement | Intake Note BR-09 |
| BR-10 | Spam-flagged inbound mail is still forwarded to the Owner's personal address, only marked — never silently withheld | Intake Note BR-10 (DR-7) |
| BR-11 | A captured inbound message is categorised against a Booking/Enquiry by an ordered rules cascade; unmatched/ambiguous cases are never dropped and can be manually linked | Intake Note BR-11 (DR-9) |
| F-18 | Every Booking has exactly one Party Leader (the primary contact — this is the actor every prior version of this spec called "Customer") and zero or more Co-leaders, each independently opted in/out (one all-or-nothing switch per Co-leader, no per-email-type granularity). Wherever a requirement below sends a customer-facing message, it reaches the Party Leader and every Co-leader currently opted in on that Booking, at the moment the message is sent | `DOMAIN-LEXICON.md` v0.2 (Party Leader/Co-leader, KI-3), sponsor 2026-07-24 |
| F-19 | A Co-leader has no agency in this system: cannot submit a cancellation-request, reply, or be treated as the recipient of record for a refund — those remain the Party Leader's alone | `DOMAIN-LEXICON.md` v0.2 | 

## 3. Decisions needed
Decisions below are ratified across three Decision Records — `Decision_Record_2026-07-23.md` (D-EML-1..7), `Decision_Record_2026-07-24.md` (D-EML-8/9), and `Decision_Record_2026-07-25.md` (D-EML-5, resolved as DR-15). All nine are now resolved. Table retained for traceability; the Decision Records win over this table for anything not yet repropagated.

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-EML-1 | What is the production sending/reply-to address? | (a) `Claire@friendsonbikes.uk` promoted to production (b) a role address e.g. `bookings@friendsonbikes.uk` (c) other | (b) | **RESOLVED — DR-1: `bookings@friendsonbikes.uk`** |
| D-EML-2 | How does the Explanation Block's free text actually reach the Cancellation email — manual paste by the Owner, or an automated link to an AI/MCP drafting tool? | (a) manual paste (today's process) (b) automated injection via an MCP-server link | (a) for v1 | **RESOLVED — DR-2: manual paste (a)** |
| D-EML-3 | Should the T-24hr reminder be the only scheduled reminder, or should a second earlier milestone (e.g. T-7) be added? | (a) T-24hr only (current, confirmed process) (b) add T-7 | (a) | **RESOLVED — DR-3: add T-7 (b) — REQ-EML02 rewritten to a two-milestone cadence** |
| D-EML-4 | Age/fitness/group-size content (BR-07, UNDEFINED) — does any EML template need to state it? | (a) omit until BR-07 is defined (b) placeholder field reserved now | (a) | **RESOLVED — DR-4: omit (a)** |
| D-EML-5 | Enquiry-reply automation (future web-assistant/Claude Code agent, UJ-EML-09 deferred path) — in scope for a later EML revision, or a separate module? | (a) later EML revision (b) separate module | Open — no recommendation | **RESOLVED — DR-15: neither (a) nor (b) as originally framed — narrowed to an Owner-controlled toggle that sends a generic holding acknowledgement (REQ-EML18, new), not an authored/AI reply; REQ-EML09 unchanged** |
| D-EML-6 | Spam handling for captured inbound email — does a spam-flagged message still get forwarded to the Owner's personal address, or suppressed (captured/searchable only)? | (a) still forward, flagged (b) suppress forwarding, capture only | (b) | **RESOLVED — DR-7: still forward, flagged (a)** |
| D-EML-7 | Archive export cadence (Intake Note F-14, indefinite retention + downloadable backup) — how often does the export run, and is it Owner-triggered or scheduled? | (a) manual, Owner-triggered on demand (b) scheduled (e.g. monthly) | (a) | **RESOLVED — DR-8: manual, Owner-triggered (a)** |
| D-EML-8 | REQ-EML11's sender-address lookup (step 4 of the categorisation cascade) currently matches only a Party Leader's address to a Booking. Should a message from a known Co-leader's address on that Booking also count as a step-4 match? | (a) yes, Co-leader addresses also match (b) no, cascade considers Party Leader addresses only; a Co-leader's inbound mail falls through to `unlinked`/manual-link | (a) | **RESOLVED — DR-10, `Decision_Record_2026-07-24.md`: yes, Co-leader addresses also match (a)** |
| D-EML-9 | Is the `co_leaders` record (DOMAIN-LEXICON.md v0.2, New) stored as part of the external `booking` module's own Booking record, or as new EML-owned storage referencing a Booking by id? | (a) extend the external `booking` module's schema (b) EML owns its own `co_leaders` table, referencing `bookings` externally | (b) | **RESOLVED — DR-11, `Decision_Record_2026-07-24.md`: EML-owned storage (b)** |

## 4. Requirements

**CopilotMode default:** `STRICT` for every requirement below unless a requirement states otherwise (none do at this pass — all 17 requirements carry the default).

### REQ-EML01 — System submits booking-confirmation-message
intent:        submit booking-confirmation-message
actor:         System
preconditions: a Booking has been created and payment (or provisional hold) recorded
conditions:    exactly one confirmation message per Booking; includes a request to complete registration and the liability waiver; sent to the Party Leader and every Co-leader currently opted in on the Booking (F-18) — in practice usually the Party Leader alone, since Co-leaders are typically added after this first send
postconditions: the Party Leader and every then-opted-in Co-leader have received the booking-confirmation-message; the registration/waiver request has been issued
outcomes:
  - Party Leader (and any already-opted-in Co-leader) sees the booking confirmed, with a way to complete registration and accept the waiver
  - Owner sees the confirmation was sent
errors:
  - no contact address on the Booking → message not sent; gap logged for the Owner
  - Booking is cancelled before the message sends → message is suppressed, not sent
invariants:    exactly one booking-confirmation-message exists per Booking
non-functional: Reliability — a transient send failure does not duplicate the message
scope:         in: one-shot confirmation + registration/waiver request | out: the registration/waiver form itself (owned by `booking`/`pre-sales`, see Module Map §4)
open-questions: none — D-EML-1 RESOLVED (DR-1, `Decision_Record_2026-07-23.md`): sends from `bookings@friendsonbikes.uk`
example:
  given:  Booking BK-1001 (Tom, Party Leader, Hidden City tour) just confirmed, no Co-leaders yet
  when:   System submits the booking-confirmation-message
  then:   Tom receives confirmation + registration/waiver request; Sent Email SE-001-style record logged against BK-1001

### REQ-EML02 — System submits reminder-message
intent:        submit reminder-message
actor:         System
preconditions: a Booking is confirmed and a scheduled reminder milestone (T-7 or T-24hr) has been reached for its Departure, or the milestone has already passed without its reminder having fired (DR-14)
conditions:    message states outstanding-payment status (including the cash-only on-day fallback per F-06/F-07) and includes weather-appropriate packing guidance; the T-24hr send additionally offers a way to adjust or cancel; sent to the Party Leader and every Co-leader currently opted in on the Booking (F-18)
postconditions: the Party Leader and every then-opted-in Co-leader have received the reminder-message for the reached milestone
outcomes:
  - Party Leader and every opted-in Co-leader see the upcoming tour details, packing advice, and payment status at each milestone
  - Party Leader is offered a way to adjust or cancel the Booking at the T-24hr milestone (Co-leaders, having no agency, are not offered this — F-19)
errors:
  - Booking is cancelled before a milestone is reached → that milestone's reminder is suppressed, not sent
  - no contact address on record for the Party Leader → message not sent; gap logged for the Owner
invariants:    exactly one reminder-message per Booking per milestone (T-7, T-24hr) per Departure (DR-3, `Decision_Record_2026-07-23.md`); a milestone whose scheduled check never ran during its window (system downtime, or a Booking created already inside the window) still fires exactly once, on the next check, rather than being skipped (DR-14, `Decision_Record_2026-07-25.md`)
non-functional: Reliability — each reminder fires within its scheduled window even under transient failure (retried); a check that misses a window entirely still catches up on its next run (DR-14)
scope:         in: T-7 and T-24hr reminder content and triggers, including catch-up for a missed check | out: any further milestone beyond T-7/T-24hr
open-questions: none — D-EML-3 RESOLVED (DR-3, `Decision_Record_2026-07-23.md`); catch-up semantics RESOLVED (DR-14, `Decision_Record_2026-07-25.md`)
example:
  given:  Booking BK-1001, confirmed, Departure 24 hours away, £9.00 outstanding (20% deposit already paid on £45), Tom (Party Leader) and Priya (opted-in Co-leader)
  when:   System submits the T-24hr reminder-message
  then:   Tom and Priya both receive packing advice + "£9.00 outstanding, payable by card via the link or in cash on the day"; only Tom's copy includes the adjust/cancel option

### REQ-EML03 — Party Leader submits cancellation-request
intent:        submit cancellation-request
actor:         Party Leader
preconditions: Booking exists with status confirmed or provisionally-confirmed
conditions:    request states whether ≥24hrs or <24hrs before departure (BR-06); only the Party Leader may submit this — a Co-leader has no agency to do so (F-19)
postconditions: a cancellation-request is recorded against the Booking, pending Owner approval
outcomes:
  - Party Leader sees their cancellation request was received and is pending approval
  - Owner sees a pending cancellation-request needing a decision
errors:
  - Booking already cancelled → "This booking is already cancelled"
  - Departure already passed → "This tour has already taken place — contact us directly"
invariants:    a cancellation-request never auto-finalises; Owner approval is always required (BR-06)
non-functional: —
scope:         in: raising the request and its ≥24hr/<24hr classification | out: computing or executing the refund itself (owned by `booking`/admin console); a Co-leader initiating this (out of scope — F-19); the self-service surface/mechanism the Party Leader uses to submit this (owned externally by `booking`/`pre-sales`, DR-12 — same treatment as UJ-EML-02's registration/waiver form)
open-questions: none
example:
  given:  Booking BK-1001, confirmed, Departure in 5 days, Tom is Party Leader
  when:   Tom submits a cancellation-request
  then:   request recorded as "≥24hrs — full refund minus deposit eligible"; Owner sees it pending approval

### REQ-EML04 — Owner approves cancellation-request
intent:        approve cancellation-request
actor:         Owner
preconditions: a cancellation-request exists, pending approval
conditions:    refund amount follows BR-06 (≥24hrs → refund minus deposit; <24hrs → no refund, remedy offer instead); notification sent to the Party Leader and every Co-leader currently opted in on the Booking (F-18)
postconditions: the cancellation-request is approved; the Party Leader and every then-opted-in Co-leader are notified of the outcome
outcomes:
  - Party Leader and every opted-in Co-leader receive confirmation of the cancellation and the applicable refund amount (or, if <24hrs, a rebook-discount-code or voucher offer)
  - Owner sees the cancellation-request marked approved
errors:
  - Owner attempts to approve an already-approved or withdrawn request → "This request has already been resolved"
invariants:    the notified refund amount always matches BR-06's ≥24hr/<24hr rule
non-functional: —
scope:         in: the approval decision and resulting notification | out: refund execution (owned by `booking`/admin console)
open-questions: none
example:
  given:  cancellation-request on BK-1001, classified "≥24hrs — full refund minus deposit", Tom (Party Leader) and Priya (opted-in Co-leader)
  when:   Owner approves it
  then:   Tom and Priya both receive a cancellation confirmation stating refund = £45 − 20% deposit = £36

### REQ-EML05 — Owner cancels booking
intent:        cancel booking
actor:         Owner
preconditions: Booking exists with status confirmed; Owner has decided to cancel for a business reason
conditions:    full refund always applies (BR-04); an Explanation Block must be supplied before the message sends; sent to the Party Leader and every Co-leader currently opted in on the Booking (F-18)
postconditions: the Booking is cancelled; the Party Leader and every then-opted-in Co-leader have been notified with the full-refund confirmation, the Explanation Block, and a rebook-discount-code or voucher offer
outcomes:
  - Party Leader and every opted-in Co-leader see a full refund confirmed, an explanation for the cancellation, and an offer to rebook with a discount code or accept a voucher
  - Owner sees the cancellation recorded and the notification sent
errors:
  - Owner attempts to send without an Explanation Block → send is blocked; "Add an explanation before sending"
invariants:    a company-initiated cancellation is always a full refund (BR-04); the discount code/voucher offered is single-use, tied to the Party Leader (never to a Co-leader — F-19), with an expiry (BR-05)
non-functional: —
scope:         in: the cancellation notice, Explanation Block, and remedy offer | out: authoring/generating the Explanation Block text itself (D-EML-2); refund execution (owned by `booking`/admin console)
open-questions: none — D-EML-2 RESOLVED (DR-2, `Decision_Record_2026-07-23.md`): Owner pastes the text manually
example:
  given:  Booking BK-1001, confirmed, Hidden City departure 2026-08-01, Tom (Party Leader) and Priya (opted-in Co-leader)
  when:   Owner cancels the booking with Explanation Block EB-001 ("unforeseen guide illness with no cover available")
  then:   Tom and Priya both receive full refund (£45) confirmation + EB-001's text; the single-use discount code with an expiry is issued to Tom only

### REQ-EML06 — System submits weather-cancellation-notice
intent:        submit weather-cancellation-notice
actor:         System
preconditions: Owner has determined a Departure cannot proceed due to weather (BR-08)
conditions:    always a full refund; no partial-refund or reschedule-only path exists in this scope; sent to each affected Booking's Party Leader and every Co-leader currently opted in on it (F-18)
postconditions: affected Bookings are cancelled; each Party Leader and every then-opted-in Co-leader has received the weather-cancellation-notice
outcomes:
  - Party Leader and every opted-in Co-leader see their tour was cancelled for weather, with a full refund confirmed
  - Owner sees all affected Bookings marked notified
errors:
  - a recipient's contact address is unreachable → notice logged as undelivered for that recipient; gap flagged for the Owner
invariants:    a weather cancellation is always a full refund (BR-08)
non-functional: Reliability — every currently-opted-in recipient on the affected Departure's Bookings receives the notice, none skipped
scope:         in: the cancellation notice and full-refund statement for a weather event | out: the weather-forecast decision itself (Owner's judgement call, not automated)
open-questions: none
example:
  given:  Departure DEP-HID-2026-08-01-1000 has 3 confirmed Bookings (one, BK-1001, with Tom as Party Leader and Priya as an opted-in Co-leader); Owner cancels it for weather
  when:   System submits the weather-cancellation-notice to each affected Booking's recipients
  then:   all 3 Party Leaders receive full-refund cancellation notices for their respective Bookings; Priya also receives BK-1001's notice

### REQ-EML07 — System submits payment-receipt-message
intent:        submit payment-receipt-message
actor:         System
preconditions: a payment or refund event has been recorded against a Booking
conditions:    one message per payment/refund event; sent to the Booking's Party Leader and every Co-leader currently opted in (F-18)
postconditions: the Party Leader and every then-opted-in Co-leader have received a receipt for the payment or refund event
outcomes:
  - Party Leader and every opted-in Co-leader see confirmation of the amount charged or refunded
errors:
  - payment/refund event references a Booking with no contact address on record for the Party Leader → message not sent; gap logged for the Owner
invariants:    the receipted amount always matches the recorded payment/refund event; no payment card data is ever included in the message
non-functional: Reliability — a transient send failure does not duplicate the receipt
scope:         in: receipt notification for a recorded payment/refund event | out: processing the payment/refund itself (owned by the payment provider / admin console)
open-questions: none
example:
  given:  a £36 refund recorded against Booking BK-1001 (Tom, Party Leader; Priya, opted-in Co-leader) following an approved cancellation
  when:   System submits the payment-receipt-message
  then:   Tom and Priya both receive a receipt stating "£36.00 refunded"

### REQ-EML08 — System submits review-request-message
intent:        submit review-request-message
actor:         System
preconditions: a Booking's Departure has completed
conditions:    sent shortly after the tour, once per Booking; sent to the Party Leader and every Co-leader currently opted in on the Booking (F-18)
postconditions: the Party Leader and every then-opted-in Co-leader have received the thank-you/review-request-message
outcomes:
  - Party Leader and every opted-in Co-leader see a thank-you and an invitation to leave a review
  - Owner sees the review-request marked sent
errors:
  - Booking was cancelled before the Departure occurred → message is suppressed, not sent
invariants:    exactly one review-request-message per completed Booking (per recipient)
non-functional: —
scope:         in: the post-tour thank-you and review-request content | out: any further post-tour marketing (UJ-EML-10, deferred)
open-questions: none
example:
  given:  Booking BK-1001's Departure completed today, Tom (Party Leader) and Priya (opted-in Co-leader)
  when:   System submits the review-request-message
  then:   Tom and Priya both receive a thank-you message inviting them to rate the tour

### REQ-EML09 — Owner submits enquiry-reply
intent:        submit enquiry-reply
actor:         Owner
preconditions: an Enquiry exists from a Prospect or Customer, asking one or more specific questions
conditions:    the reply addresses the specific question(s) asked (BR-09) — not a generic acknowledgement
postconditions: the Enquiry has a recorded reply
outcomes:
  - Prospect/Customer receives a reply addressing their specific question(s)
  - Owner sees the Enquiry marked replied
errors:
  - Owner attempts to send an empty reply → send is blocked; "Add a reply before sending"
invariants:    an enquiry-reply is manual content, never auto-generated in this scope; only an Owner-authored enquiry-reply can mark an Enquiry `replied` — an auto-acknowledgement (REQ-EML18) never does (DR-15)
non-functional: —
scope:         in: manual, Owner-authored replies to specific questions | out: the optional auto-acknowledgement (REQ-EML18, new, DR-15); any further automated/AI-assisted reply-drafting path (not raised again by DR-15, out of scope)
open-questions: none — D-EML-5 RESOLVED (DR-15, `Decision_Record_2026-07-25.md`)
example:
  given:  Enquiry ENQ-2001 (Marie) asking about group size and pricing for Hidden City
  when:   Owner submits an enquiry-reply addressing group size and price
  then:   Marie receives a reply covering both questions; ENQ-2001 marked replied

### REQ-EML10 — Owner creates email-template
intent:        create email-template
actor:         Owner
preconditions: a new template use-case exists with no active template covering it, or an active template needs replacing
conditions:    a template starts as draft and is not used for sending until published to active
postconditions: an email-template exists in the draft state, distinct from any currently active template for the same use-case
outcomes:
  - Owner sees the new template listed as draft
  - Owner can preview the draft before publishing it
errors:
  - Owner attempts to publish a draft with unfilled required variable fields → publish blocked; "Complete all required fields before publishing"
invariants:    at most one active template per use-case at a time
non-functional: —
scope:         in: creating/editing a draft template and publishing it to active, retiring a template | out: the AI/MCP-assisted drafting mechanism for cancellation Explanation Blocks (that is per-send content, not template authoring — see REQ-EML05, D-EML-2)
open-questions: none
example:
  given:  no active template exists yet for "Company Cancellation"
  when:   Owner creates and publishes the "Company Cancellation" template
  then:   template status = active; available for REQ-EML05 to use on the next company-initiated cancellation

### REQ-EML11 — System imports received-email
intent:        import received-email
actor:         System
preconditions: a message arrives addressed to the business's email address
conditions:    the message is checked against a spam filter (DR-7, marker not a gate). It is then categorised against a Booking/Enquiry by a sequential, ordered rules cascade — each step tried in order, first match wins, no step guesses:
                 1. reply-reference threading — `References`/`In-Reply-To` headers match an existing Email Thread
                 2. thread inheritance — a threaded match (step 1) inherits that thread's existing Booking/Enquiry link, if any
                 3. reference-number extraction — a recognisable booking/voucher/enquiry reference found in the subject or body
                 4. sender-address lookup — the From address matches exactly one Party Leader/Co-leader/Prospect with exactly one open Booking/Enquiry (an address with more than one open candidate does NOT auto-link — falls through to ambiguous); a Co-leader's address matches the Booking they're attached to, same as the Party Leader's (DR-10, `Decision_Record_2026-07-24.md`)
                 5. no match — the thread is categorised `unlinked`; a step-4 match against more than one candidate is categorised `ambiguous` (candidates recorded, none chosen automatically)
               The cascade's order and step definitions may change later (DR-9) without altering this requirement's contract, provided `linked`/`unlinked`/`ambiguous` remain the only outcomes and no step ever guesses
postconditions: a Received Email record exists, linked to its Email Thread; the Email Thread carries a categorisation outcome (`linked` with a Booking/Enquiry, `unlinked`, or `ambiguous` with candidates recorded); the message has been forwarded to the Owner's personal address, flagged as spam if the filter classified it so (DR-7)
outcomes:
  - Owner receives the message in their personal inbox as before, marked spam if flagged, but never withheld
  - Owner can later find the message via search (REQ-EML12), grouped into its thread, showing its categorisation outcome
errors:
  - no cascade step produces a match → thread categorised `unlinked`; Owner sees it flagged as needing attention in search, not silently dropped
  - step 4 matches more than one open Booking/Enquiry for the sender → thread categorised `ambiguous`, candidates listed; Owner resolves via REQ-EML14, never auto-chosen
invariants:    every inbound message is captured exactly once and forwarded exactly once, regardless of spam classification (DR-7 — forwarding is never suppressed); a thread's categorisation is always exactly one of `linked`/`unlinked`/`ambiguous`; no cascade step other than an exact, unambiguous match ever sets `linked`
non-functional: Reliability — capture failure never prevents the underlying forward (fail open toward delivery, not silently toward loss)
scope:         in: capture, spam-flagging (as a marker, not a gate), threading, the categorisation cascade, forwarding of inbound email | out: reading/replying itself (happens in the Owner's personal inbox, external to this system); manual re-categorisation (REQ-EML14)
open-questions: none — DR-7 (`Decision_Record_2026-07-23.md`) resolved D-EML-6; cascade steps/order ratified by sponsor 2026-07-23 as a tunable rules sequence; DR-10 (`Decision_Record_2026-07-24.md`) resolved D-EML-8 (step 4 also matches Co-leader addresses)
example:
  given:  Tom replies to Sent Email SE-001 asking to change his meeting point
  when:   the reply arrives at `bookings@friendsonbikes.uk`
  then:   Received Email RE-001 is captured; step 1 matches Email Thread ET-001 by reply-reference; step 2 inherits `BK-1001` from ET-001; categorised `linked`; not flagged spam; forwarded to the Owner's personal address

### REQ-EML14 — Owner updates received-email
intent:        update received-email
actor:         Owner
preconditions: an Email Thread exists categorised `unlinked` or `ambiguous`
conditions:    the Owner selects the correct Booking/Enquiry (or, for `ambiguous`, picks from the recorded candidates or searches for a different one)
postconditions: the Email Thread's categorisation is set to `linked`, with the chosen Booking/Enquiry recorded
outcomes:
  - Owner sees the thread move out of the unlinked/ambiguous filter in search (REQ-EML12)
  - Owner can find this thread going forward by searching the Booking/Enquiry it's now linked to
errors:
  - Owner attempts to link without selecting a Booking/Enquiry → blocked, "Select a booking or enquiry to link this thread to"
invariants:    manual linking never auto-applies to other threads from the same sender — each thread is resolved individually
non-functional: —
scope:         in: manually setting or correcting a thread's Booking/Enquiry link | out: the automated cascade itself (REQ-EML11); re-running the cascade after a manual override
open-questions: none
example:
  given:  Email Thread ET-002 categorised `ambiguous` (sender has two open bookings, BK-1002 and BK-1003)
  when:   Owner selects BK-1003 as the correct booking
  then:   ET-002 categorisation becomes `linked` to BK-1003

### REQ-EML12 — Owner searches Email Archive
intent:        search email-archive
actor:         Owner
preconditions: at least one Sent Email or Received Email record exists
conditions:    search matches on sender, keywords in subject/body, or a domain-entity reference number (e.g. booking reference, voucher id)
postconditions: none (a read operation)
outcomes:
  - Owner sees a list of matching messages, each showing enough context to identify it (sender, subject, date, linked booking/voucher reference if any)
  - Owner can open a matching Email Thread to see the full chain in order
errors:
  - search matches nothing → empty state, "No emails match your search"
invariants:    search results include spam-flagged messages by default, visibly marked as spam — consistent with DR-7's "never silently withheld" principle; search never hides a message the Owner could otherwise find
non-functional: Usability — search returns results without the Owner needing to know which booking/thread a message belongs to in advance
scope:         in: search by sender/keyword/reference number, viewing a thread | out: editing or deleting archived messages
open-questions: none
example:
  given:  Received Email RE-001 exists, referencing booking `BK-1001`
  when:   Owner searches "BK-1001"
  then:   RE-001 and SE-001 (Email Thread ET-001) both appear in the results

### REQ-EML13 — System archives Email Archive
intent:        archive email-archive
actor:         System
preconditions: Owner triggers an archive export (DR-8 — manual only, no scheduled export)
conditions:    the export produces a downloadable backup file; retention itself remains indefinite (Intake Note F-14) — archiving is a backup, not a deletion
postconditions: a downloadable archive file exists, containing Sent Emails and Received Emails as of the export
outcomes:
  - Owner can download a backup file of the Email Archive
errors:
  - export fails partway → no partial file is offered as complete; Owner is told the export failed and may retry
invariants:    archiving never deletes the live, searchable records (REQ-EML12 continues to work against the same data regardless of exports)
non-functional: Reliability — a failed export never corrupts or truncates the live archive
scope:         in: producing a downloadable backup file on Owner-triggered demand | out: automatic/scheduled export (DR-8 — explicitly rejected for now), off-site backup storage
open-questions: none — DR-8 (`Decision_Record_2026-07-23.md`) resolved D-EML-7
example:
  given:  the Email Archive contains SE-001, RE-001 and others
  when:   Owner triggers an archive export
  then:   a downloadable file is produced containing all current records

### REQ-EML15 — Party Leader updates co-leader
intent:        update co-leader
actor:         Party Leader
preconditions: Booking exists with the Party Leader identified; a Co-leader is being added, removed, or has its opt-in state changed
conditions:    a Co-leader is identified by name and email; opt-in is a single all-or-nothing switch per Co-leader (F-18) — no per-email-type granularity
postconditions: the Booking's Co-leader set (and each one's opt-in state) reflects the change
outcomes:
  - Party Leader sees the Booking's current Co-leader list, each with its opt-in state
  - Party Leader sees a newly-added Co-leader appear opted in by default
errors:
  - Party Leader attempts to add a Co-leader with no email → blocked, "Add an email address for this co-leader"
invariants:    a Co-leader always belongs to exactly one Booking; a Co-leader never gains any action beyond receiving/not-receiving that Booking's emails (F-19)
non-functional: —
scope:         in: adding/removing a Co-leader and toggling their opt-in state on the Party Leader's own Booking | out: a Co-leader managing their own opt-in state (not in scope — F-18/F-19 assign this to the Party Leader or Owner only); the Owner performing this on the Party Leader's behalf (REQ-EML16); the self-service surface/mechanism itself (owned externally by `booking`/`pre-sales`, DR-12 — same treatment as UJ-EML-02's registration/waiver form)
open-questions: none
example:
  given:  Booking BK-1001, Tom is Party Leader, no Co-leaders yet
  when:   Tom adds Priya (name + email) as a Co-leader
  then:   Priya appears on BK-1001's Co-leader list, opted in by default; subsequent sends for BK-1001 also reach Priya

### REQ-EML16 — Owner updates co-leader
intent:        update co-leader
actor:         Owner
preconditions: Booking exists; a Co-leader is being added, removed, or has its opt-in state changed on the Party Leader's behalf (e.g. a phone request)
conditions:    identical rules to REQ-EML15 — name + email required, one all-or-nothing opt-in switch per Co-leader
postconditions: the Booking's Co-leader set (and each one's opt-in state) reflects the change
outcomes:
  - Owner sees the Booking's current Co-leader list, each with its opt-in state
  - Owner sees a newly-added Co-leader appear opted in by default
errors:
  - Owner attempts to add a Co-leader with no email → blocked, "Add an email address for this co-leader"
invariants:    same as REQ-EML15 (F-18/F-19) — the Owner acts on the Party Leader's Booking, not a separate record
non-functional: —
scope:         in: the same action as REQ-EML15, performed by the Owner instead of the Party Leader (e.g. a phone-in request) | out: the Party Leader's own self-service path (REQ-EML15)
open-questions: none
example:
  given:  Booking BK-1001, Tom is Party Leader, calls to ask Priya be added as a Co-leader
  when:   Owner adds Priya (name + email) as a Co-leader on Tom's behalf
  then:   Priya appears on BK-1001's Co-leader list, opted in by default; subsequent sends for BK-1001 also reach Priya

### REQ-EML17 — Owner submits thread-reply
intent:        submit thread-reply
actor:         Owner
preconditions: a Received Email exists whose Email Thread is categorised `linked` to a Booking
conditions:    the reply addresses whatever the inbound message raised; free text, no template
postconditions: a new Sent Email is recorded in the same Email Thread as the message being replied to; the reply is delivered to the address that sent the original message
outcomes:
  - Owner sees the reply appear in the thread, alongside the message it answers
  - the original sender receives the reply
errors:
  - Owner attempts to send an empty reply → blocked, "Add a reply before sending"
invariants:    a thread-reply is always attached to an existing `linked` Email Thread; it never creates or infers a Booking association itself (that's REQ-EML11/REQ-EML14's job) — replying to an `unlinked`/`ambiguous` thread is out of scope until it's linked
non-functional: —
scope:         in: composing and sending a free-text reply to a linked thread, recorded in the archive | out: replying to Enquiries (REQ-EML09, pre-booking, separate); replying to an unlinked/ambiguous thread (link it first, REQ-EML14); attachments; anything beyond plain text
open-questions: none — DR-13 (`Decision_Record_2026-07-25.md`) closes the gap this requirement was raised to fix (the adopted mockup depicted a reply/forward action, `UXIS.md` BC-03, that was never itself specified as a requirement)
example:
  given:  Email Thread ET-001 (Tom asking to change his meeting point), linked to BK-1001
  when:   Owner replies "No problem, meet at the north gate instead"
  then:   the reply is recorded in ET-001 and delivered to Tom's address

### REQ-EML18 — System submits enquiry-acknowledgement
intent:        submit enquiry-acknowledgement
actor:         System
preconditions: an Enquiry has just been recorded; the `enquiry_auto_acknowledge_enabled` setting is on
conditions:    generic holding content only — never addresses the specific question(s) asked; sent once per Enquiry, immediately on creation
postconditions: the Prospect/Customer has received a holding acknowledgement; the Enquiry's `acknowledged` flag is set — its `replied` flag is untouched
outcomes:
  - Prospect/Customer sees confirmation their question arrived and a real reply is coming
  - Owner sees the Enquiry marked acknowledged, still awaiting a real reply (REQ-EML09)
errors:
  - the setting is off → nothing sent, no error; this is the default
invariants:    an enquiry-acknowledgement never marks an Enquiry `replied` and never counts as satisfying BR-09 (DR-15); at most one acknowledgement per Enquiry
non-functional: —
scope:         in: the generic holding acknowledgement and the on/off setting that gates it | out: authoring the real reply (REQ-EML09, unchanged); any content that addresses the specific question asked
open-questions: none — added by DR-15 (`Decision_Record_2026-07-25.md`), resolving D-EML-5
example:
  given:  the auto-acknowledge setting is on; Enquiry ENQ-3001 (Priya) asking about bike sizes just recorded
  when:   System submits the enquiry-acknowledgement
  then:   Priya receives "thanks, we got your question, a real reply is coming"; ENQ-3001 shows acknowledged but not yet replied; the Owner still owes her a specific answer

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-EML-01 | Booking confirmation + registration/waiver request sent | REQ-EML01 |
| UJ-EML-02 | Customer completes registration and waiver | *(unowned — see Module Map §4)* |
| UJ-EML-03 | Reminder sent per cadence (T-7, T-24hr) | REQ-EML02 |
| UJ-EML-04 | Customer adjusts or cancels booking | REQ-EML03 → REQ-EML04 |
| UJ-EML-05 | Company-initiated cancellation | REQ-EML05 |
| UJ-EML-06 | Weather-disruption cancellation | REQ-EML06 |
| UJ-EML-07 | Payment / refund receipt | REQ-EML07 |
| UJ-EML-08 | Thank-you / review-request | REQ-EML08 |
| UJ-EML-09 | Enquiry reply (optional auto-acknowledgement on arrival, toggle-gated) | REQ-EML09 (+ REQ-EML18 if the toggle is on) |
| — | Template lifecycle (draft/active/retired) — supports all sends above | REQ-EML10 |
| UJ-EML-12 | Inbound email captured, threaded, and forwarded | REQ-EML11 |
| UJ-EML-13 | Owner searches the email archive | REQ-EML12 |
| UJ-EML-14 | Email archive exported for backup | REQ-EML13 |
| UJ-EML-15 | Owner manually links an unlinked/ambiguous email thread | REQ-EML14 |
| UJ-EML-16 | Party Leader (or Owner) manages Co-leaders on a Booking | REQ-EML15 → REQ-EML16 |
| UJ-EML-17 | Owner replies in-tool to a linked inbound message | REQ-EML17 |
| UJ-EML-10 | Post-tour marketing campaign | *(deferred, unowned)* |
| UJ-EML-11 | Multi-role/permission-scoped sending | *(deferred, unowned)* |
