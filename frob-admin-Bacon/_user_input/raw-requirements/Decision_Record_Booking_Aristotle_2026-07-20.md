# Decision Record — booking (BOOK) — 2026-07-20

| | |
|---|---|
| **Status** | RATIFIED by William (sponsor), 2026-07-20 — until propagation completes, this record wins over any conflicting doc text |
| **Still open** | none |
| **Sources** | `booking.md` §3 (Decisions-needed) |

## Resolved

### DR-B1 · Provisional booking is owner-created, not self-service *(closes/amends D-BOOK-1)*
Amends the same-day-earlier ratification. Provisional (unpaid) booking is **owner-created only**: a customer's emailed request is handled manually by the Owner, who creates the booking directly — not a self-service in-flow option. The emailed request itself is handled off-system (Owner reads the email, then acts); no REQ models the request's receipt.
**Rejected alternatives:** self-service pay-later (the original same-day ratification, superseded here); owner-created-only was actually always one of the original D-BOOK-1 options, now the confirmed one.
**Impacts:** `booking.md` REQ-BOOK10 — actor changes from Customer to Owner; trigger changes from "customer chooses not to pay" to "Owner acts on an emailed customer request"; shape becomes closer to REQ-BOOK08 (owner-created from an enquiry) than to a self-service flow. UJ-BOOK-12's actor list updates to Owner (with Customer as the requester via email, off-system).

### DR-B2 · Provisional-booking terms are set per-booking by the Owner *(closes D-BOOK-2)*
No system-wide policy for hold duration, deposit requirement, or reminder cadence. The Owner sets all three manually, per booking, at creation time.
**Rejected alternatives:** a fixed global policy (e.g. "always 7 days, always 20% deposit") — rejected in favour of full owner discretion per booking.
**Impacts:** REQ-BOOK10's conditions/postconditions must state these as Owner-set fields on the booking record, not constants; Stage 6a (data dictionary) will need `hold_expires_at`, `deposit_required`, `reminder_cadence` (or similar) as per-row fields, not enum/config values.

### DR-B3 · Slot-hold mechanism *(closes D-BOOK-3, = D-DATA-3/KI-6/KI-10)*
D1 transactional decrement — one atomic database operation reduces available capacity when a hold is acquired; capacity is restored the same way on release/cancellation.
**Rejected alternatives:** `held_until`+sweep cron (extra moving parts, two mechanisms that must agree); Durable Object (not used anywhere else in the stack — F-01).
**Impacts:** `booking.md` REQ-BOOK01, REQ-BOOK09 open-questions close; `core-data-access.md` D-DATA-3 cross-references this as its final answer.

### DR-B4 · Self-service modification depth *(closes D-BOOK-4)*
Customers can self-serve **simple modifications only** (date changes), outside the cancellation cut-off. Anything more complex (party-size changes, attendee swaps) routes to contact-owner.
**Rejected alternatives:** full self-service for all modification types; contact-owner-only for everything.
**Impacts:** REQ-BOOK06 scope line narrows to "date-change self-service; other changes route to Owner contact" — needs a rewrite, not just closing the open-question tag.

### DR-B5 · Within-48h cancellation refunds are manual, no fixed policy *(closes D-BOOK-5)*
Every within-48h cancellation refund decision is made manually by the Owner, case-by-case. The system does not calculate or apply an automatic rule for this window (>48h stays full-refund-automatic, unaffected).
**Rejected alternatives:** a fixed automated rule (partial/credit/none) for the within-48h window — rejected in favour of manual case-by-case judgment.
**Impacts:** REQ-BOOK07's conditions must state the within-48h amount as Owner-determined, not system-computed; its example should not imply an automatic within-48h calculation.

### DR-B6 · One emergency contact per booking *(closes D-BOOK-6)*
A single emergency contact covers the whole party, not one per attendee.
**Rejected alternatives:** one emergency contact per attendee.
**Impacts:** REQ-BOOK02 open-questions closes; no REQ text change needed (already drafted as one-per-booking).

### DR-B7 · Waiver is both — party-level digital at booking, individual digital re-confirmation on the day *(closes D-BOOK-7)*
Two layers: the lead booker accepts a waiver digitally, inline, at booking time on behalf of the party (already in REQ-BOOK03); separately, each attendee individually **re-confirms with a fresh digital signature** at the meeting point on the day. Neither substitutes for the other.
**CORRECTED 2026-07-20** (Tour Operations analysis, `tour-operations.md` UJ-OPS-05 / source doc D2): the on-day layer was originally assumed to be a **paper** waiver — it is not. It's a brief re-confirmation captured via signature pad in GMT/OPS, part of the guide's rider check-in flow, not a separate paper artefact.
**Rejected alternatives:** digital-only; paper-only (the original "paper" framing itself, now known incorrect).
**Impacts:** REQ-BOOK03 open-questions closes (party-level digital layer already correctly drafted); the on-day re-confirmation is owned by `tour-operations` (OPS), specifically its rider check-in journey (UJ-OPS-05) — not a separate unowned gap, and not `booking`'s to author.

### DR-B8 · Abandonment-recovery email, gated by consent *(closes D-BOOK-8)*
Sent if an email was captured before abandonment, **only if** marketing-email consent was already granted. Not sent to someone without prior consent, regardless of how far they got in the flow.
**Rejected alternatives:** sending regardless of consent (rejected — would treat a marketing-flavoured recovery email as exempt from consent rules); not sending at all.
**Impacts:** a **new requirement is needed** in `booking.md` (or as a cross-module REQ consulting `core-consent-audit` REQ-CNA05) — not yet authored.

### DR-B9 · Admin payment/refund view uses core-auth *(closes D-BOOK-9)*
Production admin payment/refund access requires a `core-auth` operator session (REQ-AUTH01), not the POC's static admin-key pattern.
**Rejected alternatives:** static admin key (explicitly flagged non-production in the POC itself).
**Impacts:** no `booking.md` REQ currently models the admin payment view directly — flagged for Stage 6 (architecture allocation) to specify this access path when the admin surface is designed, rather than inventing a REQ here ahead of that design work.

### DR-B10 · Security alerts route through core-notifications *(closes D-BOOK-10)*
Repeated-decline and dispute alerts route through `core-notifications`' owner-alert (REQ-NOTIF04), not a bespoke channel.
**Rejected alternatives:** a separate, booking-specific alert channel.
**Impacts:** no new REQ needed in `booking.md` — REQ-NOTIF04 already covers "an event needing the Owner's attention"; Stage 6c (workflows) should show payment-decline/dispute events triggering it.

### DR-B11 · Provisional bookings capture participants/consent via the same customer-facing link as REQ-BOOK08, not Owner-side entry *(closes FINDING-004 / unowned ground surfaced 2026-07-24)*
`booking.md`/REQ-BOOK10 never addressed how a provisionally-confirmed booking gets attendee details, waiver/terms acceptance, or an emergency contact — silently unowned ground, not a decision this record originally closed. Surfaced during a P5-delivered-app review: the admin "New booking" screen (A7) can create a provisional booking (departure + party size + price + hold/deposit/reminder terms) but nothing in the requirement, design, or code ever collects `participants`, waiver/terms acceptance, or emergency-contact for it — yet DR-B2/the postcondition already claims capacity is "held exactly as a paid confirmation would."
**Decision:** REQ-BOOK10 is amended to match REQ-BOOK08's existing shape (per DR-B1's own note that provisional "becomes closer to REQ-BOOK08... than to a self-service flow"): on creation, the system generates and sends the customer a completion link; the customer supplies participants and waiver/terms acceptance themselves via the existing REQ-BOOK02/REQ-BOOK03 flow, unchanged. The Owner-set fields (hold duration, deposit, reminder cadence) are unaffected. "Provisionally-confirmed" means capacity is held pending that customer follow-through, not that the booking is fully populated.
**Rejected alternative:** Owner-side capture of participants/waiver/emergency-contact on the customer's behalf (operator-session variants of the REQ-BOOK02/03 endpoints). Rejected because DR-B7's waiver invariant requires the *customer's own* digital acceptance ("the lead booker accepts... on behalf of the party") — an Owner ticking that box during a phone call is not the customer accepting anything, and would silently weaken the consent record BOOK03 exists to protect.
**Impacts:** `booking.md` REQ-BOOK10 postconditions/outcomes need a new line ("a participant/consent completion link is generated and sent to the customer"); no data-model change (link delivery reuses REQ-BOOK02/03's existing draft-booking target, keyed by the booking id already created). Design (webapp-admin A7) needs a "link sent / awaiting customer completion" status indicator, not new form fields. Downstream: re-check REQ-BOOK08 for the same gap in reverse (it already has this pattern — verify code actually sends the link, not just the requirement).

### DR-B12 · Owner-assisted booking edit: multi-contact parties, direct date/attendee edit, constrained status transitions *(sponsor-directed, 2026-07-24)*

Three linked decisions, requested directly by the sponsor for the admin console's booking-edit
capability (no prior REQ covered any of this — genuinely new ground, not a correction).

**(a) A booking party has one leader and zero-or-more co-leaders, not just one lead booker.**
`participants.is_lead_booker` (boolean, DR-B6-adjacent) is replaced by a `contact_role`
(`leader | co-leader | attendee`). Exactly one `leader` per booking (the sole point of
contact this replaces); any number of `co-leader`s (additional customer points of contact);
the rest are plain `attendee`. This is distinct from the FOB-employed tour guide (`guides`
table, `departures.guide_id`) — "leader"/"co-leader" here are customers within the party, the
guide is staff running the tour. **Rejected alternative:** a second boolean
(`is_co_leader`) alongside `is_lead_booker` — rejected in favour of a single enum column,
simpler to enforce "exactly one leader" against and cleaner to extend if a third role is ever
needed.
**Impacts:** `bookings` migration: rename/replace `participants.is_lead_booker` with
`contact_role` (backfill `leader` from the true row, `attendee` elsewhere). REQ-BOOK02
(attendee capture) and REQ-BOOK15 (new, below) both reference this field.

**(b) Owner-assisted booking edits are a direct admin-side form, not a customer link.**
Unlike DR-B11's consent completion link (which must be the customer's own act per DR-B7),
editing an existing booking's date/attendees/contact-role assignment is not consent-bearing —
it's operational correction (a customer calls/emails asking the Owner to fix something). The
Owner edits the booking record directly; no customer round-trip. This finally implements
DR-B4's "Owner-assisted" path for party-size/attendee changes, which was closed in DR-B4 but
never given its own REQ.
**Rejected alternative:** reusing the DR-B11 completion-link pattern for edits — rejected
because these edits aren't consent-sensitive, and forcing a customer round-trip for something
the Owner is doing on their behalf (per the customer's own phone/email request) adds friction
with no integrity benefit.
**Impacts:** new REQ-BOOK15 (Owner edits an existing booking's date, attendees, and contact
roles).

**(c) Owner-side booking status changes are constrained transitions, not a free-form field.**
The Owner needs to move a booking through its lifecycle (e.g. confirm a provisional booking
once payment/terms are settled by other means, cancel a confirmed booking, mark one abandoned)
from the admin console, but never by writing an arbitrary `status` value directly — every
transition must run the same capacity/refund side-effects the existing automatic paths already
enforce (oversell guard, held-capacity release, refund triggering), so an accidental status
edit can never orphan held capacity or silently skip a refund.
**Rejected alternative:** a plain status dropdown writing `bookings.status` — rejected as
unsafe; it bypasses every invariant REQ-BOOK01/05/07/09 already enforce around capacity and
payment state.
**Impacts:** new REQ-BOOK16 (Owner transitions an existing booking's status through a
constrained set of valid moves).

## Still open
None — all fourteen BOOK decisions are now resolved (DR-B12 covers three new decisions: 12,
13, 14, tracked as one entry since they were requested and resolved together).

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial BOOK Decision Record: 10 decisions resolved (DR-B1 amends the same-day D-BOOK-1 ratification; DR-B2–B10 newly resolved). Two new requirements identified as not-yet-authored (on-day paper waiver, abandonment-recovery email) — carried to propagation, not invented here. |
| 0.2 | 2026-07-24T00:00:00Z | DR-B11 resolved: provisional bookings (REQ-BOOK10) must send the customer a REQ-BOOK08-style completion link for participants/consent, rather than Owner-side entry — closes unowned ground surfaced by FINDING-004. |
| 0.3 | 2026-07-24T00:00:00Z | DR-B12 resolved: multi-contact parties (`contact_role`: leader/co-leader/attendee, replacing `is_lead_booker`), direct Owner-side booking edit (new REQ-BOOK15, finally implementing DR-B4's "Owner-assisted" path), and constrained Owner-side status transitions (new REQ-BOOK16). |
