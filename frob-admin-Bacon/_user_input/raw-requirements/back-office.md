---
module: BO
status: PROPOSED
actors: [Owner, System]
depends-on: [core-auth, booking, fleet-equipment, pre-tour]
presumes: [Cloudflare D1, route-catalogue (tours read)]
---

# back-office — Module Spec

| | |
|---|---|
| **Document** | back-office module spec (Stage 4) — run **Bacon** |
| **Version** | 0.1 |
| **Date** | 2026-07-21T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification (`/and-ratify`). Closes the departure-scheduling / booking-oversight / bike-allocation gap found after the Aristotle run. |
| **Sources** | `booking.md` (REQ-BOOK01 presumes departures exist) · `Module_Map.md` §2, §4 · `Data_Dictionary.md` (`departures`, `bikes.spare`) · `Operational_Workflows.md` UJ-OPS-01/03 · `fleet-equipment.md` · `pre-tour.md` (operator change/cancel) · `architecture/FOB_Modular_Architecture_v1_4.md` §4 (back-office) · `ROME-GUIDE-001` |

## 1. Intent
Give the Owner the **planning and oversight surface every operational module presumes but none provides**: scheduling the departures customers book onto, seeing what is booked across the calendar, browsing/searching booking records, and allocating bikes to a tour before it runs. **Success:** a bookable departure cannot exist without having been deliberately scheduled; the Owner can find and inspect any booking; and every tour-day has its bikes allocated before the guide's pre-tour inspection.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-BO-1 | `departures` is owned by `booking`; `booking` reads and decrements it (REQ-BOOK01) but **no requirement creates or schedules a departure** — the load-bearing gap this module closes. | `booking.md` REQ-BOOK01; `Module_Map.md` §2 |
| F-BO-2 | `bikes` are owned by `fleet-equipment` (F-42); a bike is assignable only while `in-service` (never `flagged`/`out-of-service`). | `Data_Dictionary.md`; `Module_Map.md` §4 |
| F-BO-3 | The guide's UJ-OPS-01/03 presume bikes are already **"assigned"** to the tour-day; no requirement performs that assignment. The `bikes.spare` field's note *"excludes from auto-assignment rotation"* implies an auto-assignment mechanism with **no backing requirement** (a phantom this module resolves — D-BO-2). | `Operational_Workflows.md` UJ-OPS-01/03; `Data_Dictionary.md` |
| F-BO-4 | The Owner authenticates via an operator session (REQ-AUTH01). Maximum group size is 10 per departure (F-19). | `core-auth.md`; `booking.md` F-19 |
| F-BO-5 | The architecture positions `back-office` as owner-admin orchestration with **"no own data"** — but departure scheduling and bike allocation both imply writes, so the ownership of that written state is a genuine open question. | `FOB_Modular_Architecture_v1_4.md` §4 |

## 3. Decisions needed
All six ratified (William, 2026-07-21) — see `Decision_Record_Bacon_2026-07-21.md` (DR-BO1…6, DR-BO2a). Status column is authoritative.

| ID | Question | Recommendation | Status |
|---|---|---|---|
| D-BO-1 | Departure lifecycle ownership. | (B) stays `booking`-owned; REQ-BO01–03 relocate | **CLOSED — DR-BO1.** Stays `booking`; REQ-BO01/02/03 **relocate to `booking` as REQ-BOOK11/12/13**; back-office orchestrates, owns no departure data. |
| D-BO-2 | Bike allocation: manual or automated. | Manual; retire the `spare` phantom | **CLOSED — DR-BO2.** Manual; no auto-assignment built; `bikes.spare` "auto-assignment" note retired. Opened **DR-BO2a** (assignment-entity ownership) → **resolved 2026-07-21**: `booking` owns `bike_assignments`; write is REQ-BOOK14, surface A20. |
| D-BO-3 | Calendar surface. | Dedicated | **CLOSED — DR-BO3.** Dedicated departure calendar (REQ-BO04). |
| D-BO-4 | Recurring departures. | Single-dated at v1 | **DEFERRED — DR-BO4.** Single-dated only; recurring out of v1. |
| D-BO-5 | Guide at creation. | Optional, flag not-ready | **CLOSED — DR-BO5.** Optional at creation; departure flagged "not ready to run" until a guide is assigned. |
| D-BO-6 | Surface vs session (screens vs Claude operator sessions). | Defer to build-phasing | **DEFERRED — DR-BO6.** Requirements stay surface-agnostic; build-form chosen later. |

## 4. Requirements

> **Relocated (DR-BO1, propagation step 2 complete):** the departure create/update/cancel requirements are now authored authoritatively in **`booking.md`** as **REQ-BOOK11 / REQ-BOOK12 / REQ-BOOK13** (`booking` owns the `departures` data). They are **not** duplicated here — see `booking.md` §4. `back-office` owns REQ-BO04–BO06 below (calendar, booking browse/detail); the bike-allocation *write* is also relocated (REQ-BOOK14, booking-owned — DR-BO2a) and surfaced here as A20; plus the notice/remediation orchestration for UJ-BO-02/03 (§5).

### REQ-BO04 — Owner views the departure calendar
intent:        view departure-calendar
actor:         Owner
preconditions: Owner is in an operator session
conditions:    the calendar shows scheduled departures across a date range, each with its tour, time, assigned guide, booked-vs-capacity count, and bike-allocation readiness
postconditions: none (read-only)
outcomes:
  - Owner sees, for any date range, which departures are scheduled, how full each is, and which lack a guide or bikes
errors:
  - a date range with no departures → empty state ("No departures scheduled in this range"), not an error
invariants:    the calendar reflects the current state of departures and their bookings at read time
non-functional: Usability — a departure's fill level and readiness (guide + bikes assigned) are visible at a glance
scope:         in: read-only calendar of departures with fill + readiness | out: editing from the calendar (routes to `booking` REQ-BOOK12); customer-facing availability (that is `pre-sales` REQ-PRE03)
open-questions: none — D-BO-3 closed (DR-BO3, dedicated calendar)
example:
  given:  departures across August 2026, with DEP-HID-2026-08-01-1000 at 6/10 booked and Emma assigned
  when:   William views the departure calendar for August
  then:   William sees each August departure with its fill (6/10) and readiness (guide ✓, bikes ?)

### REQ-BO05 — Owner searches bookings
intent:        search bookings
actor:         Owner
preconditions: Owner is in an operator session
conditions:    bookings are searchable by booking reference, customer name/email, tour, departure date, and status
postconditions: none (read-only)
outcomes:
  - Owner finds any booking by reference, customer, tour, date, or status
errors:
  - no bookings match → empty state ("No bookings match these criteria"), not an error
invariants:    results never include customer payment-card data (only provider references)
non-functional: Security — card data is never exposed in results
scope:         in: search/filter across bookings | out: cross-customer analytics/reporting (a separate concern)
open-questions: none
example:
  given:  Tom's booking BK-1001 on the Hidden City tour
  when:   William searches bookings for the reference "BK-1001"
  then:   BK-1001 is returned with its tour, departure, status, and total

### REQ-BO06 — Owner views a booking's details
intent:        view booking
actor:         Owner
preconditions: a booking exists; Owner is in an operator session
conditions:    the detail view shows attendees, the emergency contact, payment/refund state (as provider references, not card data), the consent/waiver record with timestamps, and the booking's status history
postconditions: none (read-only)
outcomes:
  - Owner sees the full record of one booking — enough to answer a customer query or decide an action
errors:
  - booking reference not found → "No booking found for that reference"
invariants:    the view reflects the booking's current authoritative state; payment data is shown only as provider references
non-functional: Security — no card data; consent/waiver acceptance shown with timestamps (from `core-consent-audit`)
scope:         in: single-booking read-only detail | out: editing here (owner edits go through `booking` REQ-BOOK06/08 or the payment admin surface)
open-questions: none
example:
  given:  Tom's confirmed booking BK-1001, £90.00 paid, 2 attendees, waiver accepted
  when:   William views BK-1001's details
  then:   William sees both attendees, the emergency contact, £90.00 paid (Stripe reference), waiver+T&C timestamps, status confirmed

> **REQ-BO07 relocated (DR-BO2a, resolved 2026-07-21):** the bike-assignment *write* now lives in **`booking.md` as REQ-BOOK14** — `booking` owns the `bike_assignments` data (mirrors the departure relocation, DR-BO1). `back-office` keeps the allocation **surface (A20)** and drives REQ-BOOK14; the in-service check reads `fleet-equipment`. Not duplicated here — see `booking.md` §4.

## 5. Journeys
| UJ id | Journey | Actor | Requirements (thread) |
|---|---|---|---|
| UJ-BO-01 | Schedule a departure | Owner | **REQ-BOOK11** *(relocated, DR-BO1)* |
| UJ-BO-02 | Update a departure | Owner | **REQ-BOOK12** · back-office orchestrates `pre-tour` REQ-TOUR05 on material change |
| UJ-BO-03 | Cancel a departure | Owner | **REQ-BOOK13** · back-office orchestrates `pre-tour` REQ-TOUR07 → `booking` REQ-BOOK07 |
| UJ-BO-04 | View the departure calendar | Owner | REQ-BO04 |
| UJ-BO-05 | Find a booking | Owner | REQ-BO05 |
| UJ-BO-06 | View a booking's details | Owner | REQ-BO06 · *(reads `core-consent-audit` for waiver/consent record)* |
| UJ-BO-07 | Allocate bikes to a tour | Owner | **REQ-BOOK14** *(relocated, DR-BO2a; surfaced on A20; reads `fleet-equipment` bike status)* |

## 6. Proposed lexicon / dictionary additions (R3 — for ratification)
- **Departure calendar** (term) — the Owner's date-ranged view of scheduled departures with fill and readiness. Distinct from: *availability check* (customer-facing, `pre-sales` REQ-PRE03).
- **Bike assignment** (term + likely `bike_assignments` entity, pending D-BO-2) — the allocation of a specific `in-service` bike to a departure for a tour-day. Distinct from: *rider bike-fit at check-in* (on-the-day, per-rider, `tour-operations` REQ-OPS05) — assignment is pre-tour planning of which bikes go out; check-in fit is which rider gets which of those bikes.
- Retire the `bikes.spare` "auto-assignment rotation" note unless D-BO-2 chooses automated allocation.

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-21T00:00:00Z | Initial spec (run Bacon): 7 REQs closing the departure-scheduling / booking-oversight / bike-allocation gap. 6 decisions-needed (D-BO-1 departure ownership, D-BO-2 bike allocation + `spare`-phantom retirement, D-BO-3 calendar surface, D-BO-4 recurring, D-BO-5 guide-at-creation, D-BO-6 surface-vs-session). Depends-on auth/booking/fleet/pre-tour. Two proposed lexicon additions. |
