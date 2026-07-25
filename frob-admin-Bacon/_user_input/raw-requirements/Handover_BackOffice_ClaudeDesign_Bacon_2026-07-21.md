# Back-office (BO, run Bacon) — Handover Package for Claude Design

| | |
|---|---|
| **Document** | Distilled mockup/wireframe handover — not a pipeline stage artifact (T0–T9); a derived paste-set for an external generative design tool. The 6e-adjacent deliverable for the Bacon back-office surfaces. |
| **Date** | 2026-07-21 |
| **Sources** | `back-office.md`, `booking.md` (REQ-BOOK11–14), `Data_Dictionary.md` (`departures`, `bike_assignments`, `bookings`), `Surface_Journey_Coverage.md` (A17–A20), `Operational_Workflows.md` (UJ-BO-01–07), `core-design-system.md`, `Decision_Record_Bacon_2026-07-21.md` |
| **How to use** | Paste §1 (shared brief) once at the start of the Claude Design session. Paste one screen brief from §2 at a time, or all 4 together. |
| **Traceability note** | Whatever comes back is checked against the REQ/UJ bindings and declared states (footer of each brief) before being treated as the real 6e wireframe sidecar — this package is an input to that check, not a replacement for it. |

---

## 1. Shared brief (paste once)

**These are all back-office (Owner-facing) screens** — used by **William on his PC/iMac only**. Design for a **fixed wide-screen desktop**, not responsive/mobile: multi-column tables, side-by-side panels, information density is welcome. This is the opposite of the customer booking screens (which are mobile-first) — do not carry mobile constraints here.

**Brand:** Forest palette (`--forest #5a9962` primary, `--charcoal #243320` text/dark), Syne for headings/display, DM Sans for body text, self-hosted variable fonts. Utilitarian and dense, but still on-brand — this is William's daily control room, not a marketing surface.

**Global conventions:**
- Money in pounds (£45.00), never raw pence.
- Dates human-readable ("1 August 2026, 10:00"), not ISO.
- The Owner is "William" in any copy, never "the Owner" or "admin".
- Party size / capacity is capped at 10 per departure — never let a capacity control exceed it.
- **Never show card numbers** — payments appear only as amounts + status + a provider reference.

**Canonical fixtures (use these, don't invent new ones):**
- **Tom** — Customer, booking `BK-1001`, `tom@example.com`, 2 attendees, £90.00 paid.
- **Hidden City** tour — `TOUR-HID`, £45, 90 minutes.
- **Departure** `DEP-HID-2026-08-01-1000` — 1 August 2026, 10:00, capacity 10, 6 booked, guide **Emma**.
- **William** — Owner; these screens are his.
- **Bikes** `FOB-001`, `FOB-002` — in-service, eligible for Hidden City.

---

## 2. Screen briefs

### A17 — Departure calendar
**Purpose:** William sees, across a date range, every scheduled departure — how full each is and whether it's ready to run.
**Must show:** a calendar (month/week) or dense dated list of departures over a chosen range; per departure — tour name, date/time, assigned guide (or a clear "no guide" marker), a **fill count** ("6/10"), and a **readiness indicator** with three parts: scheduled ✓, guide ✓/✗, bikes ✓/partial/✗. A way to open a departure's scheduler (edit) or its bike allocation.
**States:** empty — no departures in the chosen range → "No departures scheduled in this range" (not an error) · loading.
**Flow:** the entry point for planning → drills into **A18** (edit/create) and **A20** (bike allocation).
**Data shown:** per departure — tour, date/time, guide, booked/capacity, readiness. Fixture: Hidden City 1 Aug 10:00, 6/10, guide Emma, bikes partial.
**Layout:** wide-screen; readiness and fill must be glanceable at the row/cell level — colour-code the readiness dot.
*Binds: REQ-BO04 · UJ-BO-04. `departures` (tour, date, time, guide_id, capacity, held+confirmed counts), derived readiness.*

### A18 — Departure scheduler (create / edit / cancel)
**Purpose:** William creates a new bookable departure, edits one, or cancels it.
**Must show:**
- *Create:* tour picker; date; time; capacity (default 10, hard max 10); optional guide picker (leaving it empty is allowed — the departure is then marked "not ready to run").
- *Edit:* the same fields pre-filled, plus the current booked count for context; capacity cannot be set below the booked count.
- *Cancel:* a clearly-separated cancel action.
**States:** create = empty form; edit = pre-filled. **Errors/guards:** capacity >10 → "A departure can hold at most 10 riders"; same tour already at that date+time → "That tour is already scheduled at that time"; capacity below current bookings → blocked, "N riders are already booked — capacity can't go below that". **Confirm-before-acting:** a date/time change on a departure that has bookings → "This will notify N customers — continue?"; cancel with bookings → "This will offer refund/rebook/credit to N customers — continue?"
**Flow:** reached from A17 (or a "new departure" action) → on save returns to A17. Cancel triggers the customer remediation flow behind the scenes (not shown on this screen).
**Data shown:** tour, date, time, capacity, guide; for edit/cancel also the affected booked count.
**Layout:** wide-screen form panel; for edit/cancel, show *who's affected* (the booked count) next to the action.
*Binds: REQ-BOOK11 (create) / REQ-BOOK12 (edit) / REQ-BOOK13 (cancel) · UJ-BO-01/02/03. `departures` (tour_id, date, time, capacity, guide_id, status).*

### A19 — Booking browser (search + detail)
**Purpose:** William finds any booking and reads its full record — enough to answer a customer or decide an action.
**Must show:**
- *Search / list:* search by booking reference, customer name/email, tour, departure date, or status; a results **table** (reference, customer, tour, date, status, total).
- *Detail:* attendees (names, age bands, mobility/dietary/medical notes); the **one** emergency contact (per booking, not per attendee); payment/refund state as **amount + status + provider reference only — never a card number**; waiver + T&C acceptance with timestamps; marketing-consent state; booking status history.
**States:** empty search → "No bookings match these criteria"; detail not found → "No booking found for that reference".
**Flow:** standalone; **read-only** — editing routes elsewhere (booking creation A7, payment/refund A8, or the customer's own manage-booking). Do not put edit controls on this screen.
**Data shown:** ref/customer/tour/date/status/total; attendees; emergency contact; payment references; consent/waiver timestamps. Fixture: BK-1001, Tom, Hidden City, 1 Aug, confirmed, £90.00.
**Layout:** wide-screen list-detail (two-pane) — dense results table on the left, full detail panel on the right.
*Binds: REQ-BO05 (search) / REQ-BO06 (detail) · UJ-BO-05/06. `bookings`, `participants`, `payments` (references only), `consents`/waiver.*

### A20 — Bike allocation to a departure
**Purpose:** William assigns specific bikes to a departure before it runs, so the guide finds them ready.
**Must show:** a **departure header** (tour, date/time, booked party size N, guide); then **two lists side by side** — *Available bikes* (in-service, eligible for this tour, not already out on an overlapping departure) and *Assigned to this departure*; controls to **move bikes between the two lists**; a running **"N of M riders covered"** counter.
**States:** available list empty → "No available bikes for this slot — check the fleet" · loading (live bike-status read). **Errors:** a bike that's gone out of service → "FOB-00X is out of service — choose another"; a bike already out on an overlapping tour → "FOB-00X is already out on another tour at that time". **Warning (not blocking):** fewer bikes assigned than riders → "Under-provisioned: 1 of 2 riders covered" (still saveable; feeds the A17 readiness dot).
**Flow:** reached from a departure on A17 or A18.
**Data shown:** departure tour/date/party-size/guide; bike identifiers + status. Fixture: DEP-HID-2026-08-01-1000, 2 riders, assign FOB-001 + FOB-002 → "2 of 2 riders covered".
**Layout:** wide-screen two-column transfer list (available | assigned) with the coverage counter prominent between/above them.
*Binds: REQ-BOOK14 · UJ-BO-07. `bike_assignments` (bike_id, departure_id), `bikes.status` (read from fleet), `departures` booked count.*

---

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-21T00:00:00Z | Initial handover for the Bacon back-office surfaces: shared brief (all Owner/PC-only, wide-screen) + 4 screen briefs (A17 departure calendar, A18 scheduler, A19 booking browser, A20 bike allocation), distilled from `back-office.md`/`booking.md` REQs, the 6b coverage rows, and the 6c workflows. |
