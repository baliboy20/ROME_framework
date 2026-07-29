# Decision Record — Bacon run — 2026-07-21

| | |
|---|---|
| **Status** | RATIFIED by William (sponsor), 2026-07-21 — until propagation completes, **this record wins** over any conflicting doc text. |
| **Covers** | `back-office` (BO) module — decisions D-BO-1…6 |
| **Still open** | none — DR-BO2a **resolved 2026-07-21** (booking owns the bike-assignment data); DR-BO4 and DR-BO6 remain deferred with safe defaults |

---

## Resolved

### DR-BO1 · Departure lifecycle stays booking-owned *(closes D-BO-1)*
Creating, updating, and cancelling a departure is owned by the **`booking`** module (the owner of the `departures` data). REQ-BO01/02/03 **relocate into `booking`** as **REQ-BOOK11/12/13**; `back-office` drives them through booking's public API and owns no departure data itself.
**Rejected alternatives:** back-office owning departure scheduling (rejected — would split `departures` writes across two modules and contradict the architecture's "back-office owns no data").
**Impacts:**
- `back-office.md` — REQ-BO01/02/03 marked "relocating to `booking` as REQ-BOOK11/12/13"; UJ-BO-01/02/03 thread those booking REQs; `depends-on: booking` already present.
- `booking.md` — author REQ-BOOK11 (create departure), REQ-BOOK12 (update departure), REQ-BOOK13 (cancel departure) from REQ-BO01/02/03's bodies; REQ-BOOK01's precondition "a departure exists" now traces to REQ-BOOK11.
- `Module_Map.md` §1 (BOOK core features gains "departure scheduling"), §3 (UJ-BO-01/02/03 owning module = BOOK, crossed into by BO), §4 (unowned-ground "departure scheduling" → RESOLVED).
- `Journey_Index.md` — UJ-BO-01/02/03 added, owning module BOOK.

### DR-BO2 · Bike allocation is manual; the auto-assignment phantom is retired *(closes D-BO-2)*
Bikes are allocated to a departure **manually** by the Owner (REQ-BO07 as written). The **`bikes.spare` "excludes from auto-assignment rotation" note is retired** — no auto-assignment mechanism is built; the note referred to a feature no requirement ever defined.
**Rejected alternatives:** automated rotation / spare auto-selection (rejected — unjustified complexity for a solo operator with a small fleet).
**Impacts:**
- `back-office.md` — REQ-BO07 open-question closed; scope confirmed manual.
- `Data_Dictionary.md` — remove/repurpose the `bikes.spare` "auto-assignment rotation" note; add a `bike_assignments` entity (design at Stage 6a) linking a bike to a departure.
- `DOMAIN-LEXICON.md` — add term **bike assignment** (see §6 of `back-office.md`).
- **Opens D-BO-2a** (below).

### DR-BO3 · Dedicated departure calendar *(closes D-BO-3)*
The Owner gets a **dedicated departure calendar** (REQ-BO04) — a date-ranged view with fill and readiness — not merely a filtered booking list.
**Rejected alternatives:** filtered-booking-list-only (rejected — weaker at-a-glance planning, which is the surface's whole point).
**Impacts:**
- `back-office.md` — REQ-BO04 open-question closed.
- `Surface_Journey_Coverage.md` (Stage 6b) — add a calendar surface (next free `A#`), device desktop.
- `DOMAIN-LEXICON.md` — add term **departure calendar**.
- *Note:* delivery form (built screen vs Claude operator-session query) is D-BO-6, deferred.

### DR-BO5 · Guide optional at departure creation, flagged not-ready *(closes D-BO-5)*
A departure may be **created without a guide**, but is **flagged "not ready to run"** until one is assigned. Bookings can open ahead of finalised staffing.
**Rejected alternatives:** mandatory guide at creation (rejected — blocks scheduling ahead of staffing).
**Impacts:**
- `back-office.md` / (post-DR-BO1) `booking.md` REQ-BOOK11 — confirm optional-guide + not-ready flag.
- Readiness (guide + bikes assigned) surfaces on the calendar (REQ-BO04).

## Opened → Resolved

### DR-BO2a · `bike_assignments` entity ownership — RESOLVED 2026-07-21 (William)
The bike-to-departure link entity (`bike_assignments`) is owned by **`booking`** — "the booking side holds the designated bike details."
**Consequence (mirrors DR-BO1):** the assignment-write requirement relocates from `back-office` REQ-BO07 into `booking` as **REQ-BOOK14**; `booking` gains a read-only dependency on `fleet-equipment` (to check a bike is `in-service`/route-eligible). `back-office` keeps only the allocation **surface** (A20) and drives REQ-BOOK14 — it owns no assignment data itself.
**Rejected alternative:** `fleet-equipment` ownership (rejected — the assignment is scheduling/planning data tied to a departure, which is booking's domain; keeping it with `booking` co-locates it with the departure it belongs to).
**Impacts:** `booking.md` (author REQ-BOOK14; `depends-on` += `fleet-equipment`); `back-office.md` (REQ-BO07 → relocated pointer; UJ-BO-07 threads REQ-BOOK14); `Data_Dictionary.md` §2 (design `bike_assignments`, owner `booking`); `Surface_Journey_Coverage.md` A20 (now live, fully defined); `Operational_Workflows.md` UJ-BO-07 (live); `Architecture_Allocation.md` (REQ-BOOK14 row; provider = booking D1); `Module_Map.md` (BOOK→FLEET edge; §4 resolved).

## Still open (restated plainly)

### DR-BO4 · Recurring departures — DEFERRED
Recurring/repeating departure patterns are out of v1. **Interim default:** single-dated departures only (REQ-BO01/BOOK11 scope). **Direction of safety:** manual single creation cannot silently generate many bookable slots — the conservative direction.

### DR-BO6 · Build as screens vs Claude operator sessions — DEFERRED to build-phasing
Whether back-office capabilities are `webapp-admin` screens or Claude Code operator sessions is a build-phase choice. **Interim default:** requirements stay surface-agnostic; no build-form committed now. **Direction of safety:** deferring commits nothing that would be expensive to reverse.

---

## Propagation plan (ordered — DR-first, then docs)

1. **`back-office.md`** — update §3 status column (D-BO-1…6 closed/deferred with DR refs); close REQ open-questions; mark REQ-BO01/02/03 "relocating to booking (REQ-BOOK11–13)". *(done this pass)*
2. **`booking.md`** — author REQ-BOOK11/12/13 from REQ-BO01/02/03; re-point REQ-BOOK01's "a departure exists" precondition. *(booking is already 6a–6d designed — this reopens it; a real cost, flagged.)*
3. **`Journey_Index.md`** — add UJ-BO-01…07 (UJ-BO-01/02/03 owned by BOOK; 04–07 by BO).
4. **`Module_Map.md`** — add the `back-office` (BO) row + dependency edges; move "departure scheduling" from unowned-ground to BOOK; note BO as a new leaf consumer.
5. **`DOMAIN-LEXICON.md`** — add terms *departure calendar*, *bike assignment*; retire the `spare` auto-assignment implication.
6. **`Data_Dictionary.md`** (Stage 6a) — design `bike_assignments` (resolving DR-BO2a ownership); amend `bikes.spare`.
7. **`Surface_Journey_Coverage.md`** (Stage 6b) — add the calendar surface + booking-browse/detail + bike-allocation surfaces, each earning a row.
8. **`Operational_Workflows.md`** (Stage 6c) — add UJ-BO-01…07 step-tables.
9. **`Architecture_Allocation.md`** (Stage 6d) — allocate REQ-BO04–07 (+ relocated BOOK11–13) across layers.

Steps 1 is done in this pass. Steps 2–9 are the outstanding propagation; until they complete, this record is authoritative.

---

## Gate 5 self-check (pass / carried)
- ✅ Every Decisions-needed item (D-BO-1…6) resolved into a DR, or explicitly still-open with an interim default + safe direction (DR-BO4, DR-BO6, DR-BO2a).
- ✅ Each DR names what it closes, rejected alternatives, and an impacts list (= the propagation checklist).
- ✅ Sponsor ratification recorded (William, 2026-07-21).
- ✅ No design artifact started on scope a still-open decision would move (BO is pre-design; DR-BO2a gates only the 6a `bike_assignments` design).
- 🟡 **Carried:** propagation steps 2–9 outstanding — this record's "wins over doc text" banner is active until they complete. REQ-BO01–03 still physically sit in `back-office.md` pending their relocation to `booking` (step 2).

**Gate 5: PASS**, with propagation carried (banner active).
