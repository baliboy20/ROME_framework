# Booking (BOOK) — Handover Package for Claude Design

| | |
|---|---|
| **Document** | Distilled mockup/wireframe handover — not a pipeline stage artifact (T0–T9); a derived paste-set for an external generative design tool |
| **Date** | 2026-07-20 |
| **Sources** | `booking.md`, `Data_Dictionary.md`, `Surface_Journey_Coverage.md`, `Operational_Workflows.md`, `core-design-system.md`, `DOMAIN-LEXICON.md` §8 |
| **How to use** | Paste §1 (shared brief) once at the start of the Claude Design session. Paste one screen brief from §2 at a time, or all 8 together if the tool handles a batch well. |
| **Traceability note** | Whatever comes back gets checked against these bindings (REQ/UJ ids, declared states) before being treated as the real Stage 6e wireframe sidecar — this package is an input to that check, not a replacement for it. |

---

## 1. Shared brief (paste once)

**Brand:** Forest palette (`--forest #5a9962` primary, `--charcoal #243320` text/dark), Syne for headings/display, DM Sans for body text, self-hosted variable fonts. Every screen below is part of the customer-facing booking webapp except A7/A8, which are back-office (Owner-facing).

**Devices:** the customer-facing screens (W5–W10) are desktop + mobile browser — design mobile-first, they need to work on a phone. The back-office screens (A7, A8) are used on William's **PC/iMac only** — a fixed wide-screen desktop context, not a responsive/mobile concern. Feel free to use wide-screen layouts there: multi-column tables, side-by-side detail panels, more information density per view than the customer-facing screens would ever want.

**Global conventions:**
- Money shown in pounds (£45.00), never raw pence.
- Dates shown human-readable (e.g. "1 August 2026, 10:00"), not ISO.
- The Owner refers to himself as "William" in copy, never "the Owner" or "admin."
- Party size is capped at 10 per departure — always show remaining capacity, never let a selector exceed it.
- Nothing is ever pre-ticked for marketing consent.

**Canonical fixtures (use these in any example content, don't invent new ones):**
- **Tom** — Customer, booking reference `BK-1001`, `tom@example.com`.
- **Hidden City** tour — `TOUR-HID`, £45, 90 minutes.
- **Departure** `DEP-HID-2026-08-01-1000` — 1 August 2026, 10:00, capacity 10.
- **William** — Owner, back-office screens are his.

---

## 2. Screen briefs

### W5 — Selection
**Purpose:** customer picks a tour, date, time, and party size, and gets a slot held while they continue.
**Must show:** tour name/hero, price, date picker (next 90 days; sold-out dates greyed), time-slot list with remaining capacity per slot (e.g. "10:00 — 4 spaces left"), party-size selector, running total.
**States:** loading (re-querying capacity on every change) · error: party size exceeds remaining capacity → "This slot doesn't have enough space" · error: no capacity left → "This slot is no longer available — please choose another."
**Flow:** entry point of the booking journey → leads to W6.
**Data shown:** tour name/price (fixture: Hidden City £45), departure date/time/remaining capacity, selected party size.

### W6 — Attendee details
**Purpose:** capture who's coming and one emergency contact for the whole party.
**Must show:** one block per attendee (name, age band: under-12/12–17/18+/60+, mobility/dietary/medical notes), a shortcut to reuse the lead booker's own details for attendee 1, one emergency-contact section (name, phone, relationship) — **only one per booking, not per attendee.**
**States:** error: required field missing → inline indicator · in-progress entry must visibly survive an interruption (e.g. if the customer navigates away and back).
**Flow:** follows W5 → leads to W7.
**Data shown:** attendee list, emergency contact fields.

### W7 — Review, waiver, consent
**Purpose:** show a summary, get waiver + terms accepted, offer optional marketing consent.
**Must show:** booking summary (tour, date, attendees, total price), an inline scrollable waiver (not a PDF download — better completion), a waiver-acceptance checkbox, a T&C summary + acceptance checkbox, an unticked-by-default marketing-consent checkbox with copy like "Send me one email about returning customer discounts (unsubscribe any time)."
**States:** error: waiver or T&C not accepted → Continue disabled, "Please accept the waiver and terms to continue."
**Flow:** follows W6 → leads to W8. Note: this is the *digital, party-level* waiver only — there's a separate *individual, paper* waiver signed on the day at the meeting point (not part of this screen, not yet specced elsewhere either — flag if it comes up).
**Data shown:** summary of W5/W6 selections, waiver text, T&C summary.

### W8 — Payment
**Purpose:** take payment inline, without redirecting the customer away from the page.
**Must show:** an embedded payment form (Stripe Embedded Checkout — renders inline, not a redirect, not a popup), payment method options (card / Apple Pay / Google Pay, wallets first if supported).
**States:** loading: payment processing · error: card declined → "Your card was declined" with retry offered; distinguish "insufficient funds" / "card expired" where possible.
**Flow:** follows W7 → on success, leads to W9 (the redirect/landing view is NOT what confirms the booking — confirmation happens behind the scenes; W9 should not visually imply otherwise, e.g. don't show a spinner waiting on the redirect as if it's the source of truth).
**Data shown:** total amount due.

### W9 — Confirmation
**Purpose:** reassure the customer their booking is confirmed and give them what they need next.
**Must show:** booking reference, tour name, date/time, meeting point, party size, total paid, an "add to calendar" action, a link to manage the booking later, William's contact info.
**States:** none unusual — this is a durable confirmation, but note the *email* is the actual durable record (this page can be closed safely).
**Flow:** follows successful W8.
**Data shown:** booking reference (fixture: BK-1001), tour/date/time, total paid.

### W10 — Manage booking (modify / cancel)
**Purpose:** let a customer look up their booking and either change the date or cancel it.
**Must show:** a lookup step (booking reference + email), then booking details, a "change date" action, and a "cancel" action.
**States:**
- Modify: error if within the cancellation cut-off → blocked, "Changes aren't available this close to departure"; error if the new date has no capacity → alternatives suggested; if the customer wants a party-size or attendee change (not just date) → **not self-service**, show "Contact William to change your party size or attendee details."
- Cancel: show the refund amount before confirming — if more than 48h before departure, show the automatic full-refund amount; if within 48h, **do not show a calculated amount** — show "William will confirm your refund" instead (this is a deliberate manual-review case, not a bug).
**Flow:** standalone entry point (from the confirmation email's manage-booking link).
**Data shown:** existing booking details, new-date picker (for modify), refund amount or manual-review message (for cancel).

### A7 — Booking creation (back-office, Owner)
**Purpose:** two related but distinct owner actions on one screen — converting an agreed enquiry into a booking, and creating a provisional (unpaid) booking from a customer's emailed request.
**Must show:**
- *Enquiry-to-booking:* enquiry details pre-filled (tour, party size, dates, prospect details), an editable agreed price field, a "generate payment link" action.
- *Provisional booking:* the same core booking fields, plus three Owner-set fields with **no pre-filled defaults**: hold duration, deposit required (amount or none), reminder cadence — William sets these individually for this booking, there is no system-wide default to show.
**States:** error: agreed price differs from standard by more than a threshold → confirmation prompt before creating, guarding against an accidental near-zero price.
**Flow:** two entry points (from an enquiry record; from an emailed request handled off-system) landing on largely the same form.
**Data shown:** enquiry/prospect details, tour/date/party-size, price, (for provisional) hold/deposit/reminder fields.
**Layout:** wide-screen desktop (PC/iMac) — a side-by-side layout works well here, e.g. enquiry/request details in a left panel, the booking form in a right panel, rather than a single stacked mobile-style form.

### A8 — Payment & refund management (back-office, Owner)
**Purpose:** let William see payments and issue refunds, properly signed in (not a separate admin key — this uses the same operator sign-in as the rest of the back-office).
**Must show:** a list of payments (status, amount, refunded-so-far), a refund action per payment (full or partial, entered in pounds), and the running/cumulative refunded total per payment (not just the latest refund).
**States:** empty: no payments yet · error: refund fails at the payment provider → shown clearly for manual follow-up, not silently dropped.
**Flow:** standalone back-office screen; also where within-48h cancellations (from W10) land for William's manual refund decision.
**Data shown:** payment list, per-payment cumulative refund total.
**Layout:** wide-screen desktop (PC/iMac) — a dense multi-column table (booking ref, customer, amount, status, refunded-so-far, action) suits this better than stacked cards.

---

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial handover package: shared brief + 8 screen briefs (W5–W10, A7, A8), distilled from `booking.md`, `Data_Dictionary.md`, `Surface_Journey_Coverage.md`, `Operational_Workflows.md`, `core-design-system.md`. |
| 0.2 | 2026-07-20T00:00:00Z | Added device/layout guidance: back-office (A7, A8) is PC/iMac-only, wide-screen — multi-column/side-by-side layouts encouraged there; customer-facing (W5–W10) stays mobile-first. |
