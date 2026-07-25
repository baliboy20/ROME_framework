# Decision Record — fleet-equipment (FLEET) — 2026-07-21

| | |
|---|---|
| **Status** | RATIFIED by William (sponsor), 2026-07-21 — until propagation completes, this record wins over any conflicting doc text |
| **Still open** | none |
| **Sources** | `fleet-equipment.md` §3 (Decisions-needed) |

## Resolved

### DR-F1 · Maintenance scheduling trigger — both time and mileage *(closes D-FLEET-1)*
Scheduled maintenance triggers on both a time basis and a mileage basis, in addition to the existing flag-driven (reactive) path from `tour-operations`.
**Rejected alternatives:** purely reactive (the original recommendation, rejected — sponsor wants proactive scheduling too).
**Impacts:** a **new requirement is needed** — REQ-FLEET05 currently only covers logging a maintenance event in response to a flag; a scheduled-trigger path (with mileage capture, presumably logged post-tour) is not yet authored. Flagged for a follow-up spec pass, not invented here.

### DR-F2 · Helmet replacement — annual check, no fixed age policy *(closes D-FLEET-2)*
No automated age-based expiry calculation. Instead, an annual check reminder prompts the Owner to manually assess each helmet's condition. The existing rule that an impacted helmet retires immediately regardless of age is unaffected (a separate safety trigger, not an age policy).
**Rejected alternatives:** 5-years-or-impact (the original recommendation, rejected); 3 years fixed.
**Impacts:** REQ-FLEET02's postcondition "expiry alert date calculated from manufacture date + policy" is replaced with "annual review reminder set" — a real text change at propagation.

### DR-F3 · Bike status state machine — confirmed *(closes D-FLEET-3)*
The proposed 6-state machine is confirmed as drafted in `DOMAIN-LEXICON.md`.
**Rejected alternatives:** none — confirmed as-is. *(Note: DR-F8 below removes the `retired` state's associated workflow richness — see impacts there.)*
**Impacts:** none beyond DR-F8's changes.

### DR-F4 · Compliance tracking scope — core set only *(closes D-FLEET-4)*
PLI, EL, ICO, helmet condition review (per DR-F2), first aid contents review. No business registration, accountant filings, or other extensions this pass.
**Rejected alternatives:** the wider scope option.
**Impacts:** none — REQ-FLEET07/08 already scoped to the core set.

### DR-F5 · Photo capture — not needed *(closes D-FLEET-5)*
No photo capture at any point (onboarding, maintenance, retirement/disposal — moot per DR-F8 anyway).
**Rejected alternatives:** throughout (the original recommendation, rejected); selective.
**Impacts:** REQ-FLEET01 and REQ-FLEET02's photo mentions must be removed at propagation. REQ-FLEET05's photo mention removed too.

### DR-F6 · Combined pre-tour-day fleet certification gate — yes *(closes D-FLEET-6)*
A single "ready to trade" sign-off exists, rolling up PLI/EL validity, helmet condition review status, first aid currency, minimum bikes in service, and recent-inspection status.
**Rejected alternatives:** no combined gate, individual checks only.
**Impacts:** a **new requirement is needed** — not yet authored in `fleet-equipment.md`. Likely consumed by `tour-operations`' REQ-OPS04 as a read. Flagged for a follow-up spec pass.

### DR-F7 · Compliance alert cadence — on-event-only *(closes D-FLEET-7)*
No recurring digest (daily or weekly). The Owner is alerted only at the moment an item's status changes (enters `pending` or `critical`) — a single alert, not repeated.
**Rejected alternatives:** daily digest + immediate critical (the original recommendation, rejected); weekly.
**Impacts:** REQ-FLEET07's postcondition "a digest is sent per the configured cadence" is replaced with "a single on-event alert is sent" — a real text change at propagation. The daily-check mechanism itself (evaluating items) can stay daily internally; only the *notification* is on-event, not the evaluation.

### DR-F8 · Retire/restore workflow — dropped from core scope *(closes D-FLEET-8, supersedes framing of D-FLEET-3)*
The formal retirement/disposal lifecycle (UJ-FLEET-06) is dropped. A bike that fails a pre-tour check is simply flagged unusable with a reason, visible in the fleet inventory (REQ-FLEET04) — no formal `retired` status transition, no historical retirement record beyond what the flag itself carries, no 30-day grace period, no restore flow.
**Rejected alternatives:** 30-day grace period with restore (the original recommendation, rejected); indefinite grace period.
**Impacts:** **REQ-FLEET09 (archive asset) and REQ-FLEET10 (restore asset) are removed** from the module spec. UJ-FLEET-06 is removed from core scope in `Journey_Index.md`. The `retired` state in `bikes`'/`equipment`'s state tables is retained as a theoretical terminal state (DR-F3 confirmed the state machine) but has no REQ driving a transition into it — this is a **declared, deliberate hole**, not an oversight: genuinely disposing of an asset (sold/scrapped) is handled off-system for now.

### DR-F9 · External service provider logging — off-system, not modelled *(closes D-FLEET-9)*
External repairs (beyond in-house capability) are not tracked in the system at all.
**Rejected alternatives:** invoice upload as a maintenance-event attachment (the original recommendation, rejected); a separate tracking workflow.
**Impacts:** REQ-FLEET05's mention of external-service logging (D-FLEET-9) is removed at propagation. The `awaiting-external-service` bike state (from DR-F3's confirmed state machine) now has no REQ driving it either — same declared-hole treatment as DR-F8.

### DR-F10 · Bulk equipment onboarding — line-by-line, no photo *(closes D-FLEET-10)*
Each equipment item is entered individually, one at a time, with a description field. No bulk-entry-with-shared-defaults workflow, no photo (consistent with DR-F5).
**Rejected alternatives:** bulk entry with shared defaults (the original recommendation, rejected).
**Impacts:** REQ-FLEET02's scope line "in: individual + bulk (D-FLEET-10) equipment onboarding" narrows to individual-only; the bulk-onboarding open-question closes as "not built," not "resolved as bulk."

## Still open
None.

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-21T00:00:00Z | Initial FLEET Decision Record: 10 decisions resolved (DR-F1–F10). Six rulings depart from the original recommendations (DR-F1, F2, F5, F7, F8, F9, F10), the largest being DR-F8's removal of the entire retire/restore workflow. Two new requirements identified as needed but not yet authored (scheduled maintenance trigger — DR-F1; combined fleet-certification gate — DR-F6). Two bike/equipment states (`retired`, `awaiting-external-service`) now have no REQ driving them — declared holes, not oversights. |
