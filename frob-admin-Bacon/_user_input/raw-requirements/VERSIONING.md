# FOB A&D Pipeline — Run Versioning

| | |
|---|---|
| **Document** | Run/iteration codename ledger |
| **Purpose** | Every distinct pipeline run (a session or cluster of sessions producing a coherent set of ratified decisions + design artifacts) gets a codename, so iterations are never confused with each other in conversation or in file history. |
| **Scheme** | Famous philosophers, strictly alphabetical order, one per run, never reused. |

**How to use:** when a new run starts (a new round of ratification + design work, not just a small edit), assign the next unused codename in alphabetical order. Reference the codename in conversation and in any new dated files from that run (e.g. `Decision_Record_<codename>_<date>.md`) so it's unambiguous which run a document belongs to, even if two runs happen to touch the same module.

## Ledger

| Codename | Covers | Date | Key outputs |
|---|---|---|---|
| **Aristotle** | Lean-6 core modules (AUTH, CNA, NOTIF, SEO, DATA, DS) ratified + designed through 6a–6d; `booking` (BOOK), `pre-sales` (PRE), `tour-operations` (OPS), `pre-tour` (TOUR), `fleet-equipment` (FLEET), `post-tour` (POST, tight scope) each analysed and specced; BOOK/PRE/OPS/TOUR/FLEET/POST all ratified; BOOK/PRE/OPS designed through 6a–6d; Claude Design handover package for BOOK; a factual correction to DR-B7 (on-day waiver is digital, not paper); an ownership correction moving `bikes` from OPS to FLEET (F-42), formally resolving GAP-6b-3; POST deliberately narrowed to 4 of 9 analysed journeys, 5 deferred to a future phase. | 2026-07-20 to 2026-07-21 | `Decision_Record_Aristotle_2026-07-20.md`, `Decision_Record_Booking_Aristotle_2026-07-20.md`, `Decision_Record_PreSales_Aristotle_2026-07-20.md`, `Decision_Record_TourOps_Aristotle_2026-07-20.md`, `Decision_Record_PreTour_Aristotle_2026-07-21.md`, `Decision_Record_Fleet_Aristotle_2026-07-21.md`, `Decision_Record_PostTour_Aristotle_2026-07-21.md`, `Data_Dictionary.md`, `Surface_Journey_Coverage.md`, `Operational_Workflows.md`, `Architecture_Allocation.md`, `Handover_Booking_ClaudeDesign_Aristotle_2026-07-20.md`, `Handover_AllModules_ClaudeDesign_Aristotle_2026-07-21.md` |
| **Bacon** | `back-office` (BO) — full pass: analysed, ratified, designed through 6a–6d, + Claude Design handover. Closes the gap found after Aristotle: no module scheduled departures (booking only *presumed* they exist), no owner booking-browse/calendar, no bike-to-tour allocation (the `bikes.spare` "auto-assignment" phantom). Departure scheduling relocated to `booking` as REQ-BOOK11–13 (DR-BO1); bike allocation to `booking` as REQ-BOOK14 (DR-BO2a — booking owns `bike_assignments`); back-office keeps the surfaces (A17–A20) + notice/remediation orchestration (acyclic, `booking`↛`pre-tour`). Auto-assignment phantom retired (DR-BO2). Housekeeping: all pipeline doc titles renamed "Tier-1 Core Capabilities" → "FOB". **Ratified + designed 6a–6d.** | 2026-07-21 | `back-office.md`, `Decision_Record_Bacon_2026-07-21.md`, `booking.md` (REQ-BOOK11–14), `Data_Dictionary.md`/`Surface_Journey_Coverage.md`/`Operational_Workflows.md`/`Architecture_Allocation.md` (v0.8–0.9), `Handover_BackOffice_ClaudeDesign_Bacon_2026-07-21.md` |
| *(next)* | — | — | — |

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Ledger created; first run retroactively named **Aristotle**, covering everything produced this session. |
