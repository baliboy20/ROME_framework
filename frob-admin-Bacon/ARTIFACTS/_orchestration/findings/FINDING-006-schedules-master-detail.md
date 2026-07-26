# FINDING-006 — A18 "Schedules" master/detail consolidation

| | |
|---|---|
| **Date** | 2026-07-26 |
| **Surface** | A18 (admin scheduling) — renamed **Scheduler → Schedules** |
| **Type** | UX / design-fidelity change (presentation). No requirement behaviour, route, data, or contract change. |
| **Affected REQs** | REQ-BOOK11 (create departure), REQ-BOOK12 (edit), REQ-BOOK13 (cancel notice) — behaviour unchanged |
| **UXIS** | Surface inventory updated (A18 = Schedules); new record **UXD-04a** (master/detail layout); UXD-03/04/05 behaviours unchanged |

## Decision
A18 is reworked from a **dropdown-selector + form** into a **classic master/detail** screen and renamed **Schedules**:
- **Master** (left): a selectable list of scheduled departures (tour · date · time · booked/capacity) + a **New** (+) control.
- **Detail** (right): the create/edit form for the selected — or new — departure, carrying the existing capacity guard (UXD-05), change fan-out confirm (UXD-03) and cancellation remediation fan-out (UXD-04).

Selecting a row pre-fills the form (conforms UXC-NAV-4); New clears it. Cancellation remains a notice workflow (REQ-BOOK13), never a silent row delete.

## Rationale (pros)
- Replaces a **dropdown-of-ids** selector — a weak affordance — with a first-class list showing every departure at a glance.
- **Unifies read + write** on one surface; removes the previous split where A17 (calendar) read and A18 (form) wrote with no selection link between them.
- **Matches the app's own idiom** — A19 booking browser is already master/detail; consistency.
- Keeps the list visible while editing (context retained); scales to filtering/sorting on the master later.

## Trade-offs / notes (cons)
- **Schedules are temporal** — a flat list is a weaker master than a calendar. **A17 departure calendar is retained** as the complementary date-oriented view; the master could later gain a list⇆calendar toggle to fully absorb A17 (deferred — see below).
- **Overlap with A17** is now explicit: two surfaces touch departures. Acceptable short-term (A17 = calendar/read, A18 = master/detail CRUD); a future consolidation into a single "Schedules" surface with a list/calendar toggle is the tidier end-state.
- **Detail richness** — a departure fans out to bookings/participants/guide/readiness. Current detail is the create/edit form + cancel; deeper drill-down (bookings tab) can be added to the detail pane later (the A17 overlay already drills into participants).
- **Delete ≠ delete** — the destructive action maps to cancel-with-notice (UXD-04), preserved.

## Implementation
- Re-laid-out `webapp-admin/lib/features/scheduling/presentation/pages/scheduler_page.dart` as master/detail reusing the **existing `SchedulerBloc`** (no bloc/route/data change); added `_SchedulesMaster`.
- Nav label `admin_shell.dart` A18 `Scheduler → Schedules`.
- `flutter analyze` clean; `scheduler_bloc_test` (5) green.

## Follow-up (deferred, sponsor's call)
1. Consolidate A17 (calendar) into A18 as a list⇆calendar master toggle — single Schedules surface.
2. Add a bookings/participants tab to the A18 detail pane (reuse the A17 drill-down).
