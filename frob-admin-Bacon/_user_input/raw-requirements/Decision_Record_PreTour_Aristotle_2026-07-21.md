# Decision Record — pre-tour (TOUR) — 2026-07-21

| | |
|---|---|
| **Status** | RATIFIED by William (sponsor), 2026-07-21 — until propagation completes, this record wins over any conflicting doc text |
| **Still open** | D-TOUR-2 (tied to D-NOTIF-1), D-TOUR-3 (deferred) |
| **Sources** | `pre-tour.md` §3 (Decisions-needed) |

## Resolved

### DR-T1 · Reminder cadence — light *(closes D-TOUR-1)*
One reminder only, at T-1 (the day before the tour).
**Rejected alternatives:** standard (T-7/T-1/T-0); heavy (T-14/T-7/T-3/T-1/T-0).
**Impacts:** REQ-TOUR02's milestone schedule is a single T-1 milestone; the day-of (T-0) reminder folded into REQ-TOUR02 (per UJ-TOUR-08) is **removed** — there is no T-0 milestone under a light cadence. This needs a REQ-TOUR02 text correction at propagation.

### DR-T4 · Self-service field scope — confirmed *(closes D-TOUR-4)*
Routine non-financial fields are fully self-service; safety-significant changes (severe allergy, accessibility flag, minor added) save immediately but always alert the Owner for follow-up.
**Rejected alternatives:** none — the original recommendation confirmed as-is.
**Impacts:** REQ-TOUR04 already reflects this — no text change needed, just close the decision tag.

### DR-T5 · Cancellation remediation — choose-your-own *(closes D-TOUR-5)*
Customer chooses between full refund, rebook to another date, or a tour credit.
**Rejected alternatives:** single auto-refund only.
**Impacts:** REQ-TOUR08 already drafted against the choose-your-own model — no text change needed, just close.

### DR-T6 · Late-arrival grace period — configurable per tour *(closes D-TOUR-6)*
No fixed global value; each tour can set its own grace period.
**Rejected alternatives:** a fixed value (e.g. 15 minutes) applied globally.
**Impacts:** REQ-TOUR09/10's timing reference is per-tour, not a constant — Stage 6a should design a per-tour `grace_period_minutes` field, not a fixed value.

### DR-T7 · Day-of guide contact mechanism — FOB ops number *(closes D-TOUR-7)*
A late/lost customer calls William's business number, not the guide's personal mobile, not an in-app GMT push.
**Rejected alternatives:** direct guide mobile (too intrusive/personal); in-app push via GMT (adds scope to GMT, not needed).
**Impacts:** REQ-TOUR09's scope note updates to name the FOB ops number explicitly rather than leaving the mechanism open; no GMT scope addition needed.

### DR-T8 · No-show policy — manual, Owner-decided *(closes D-TOUR-8)*
Same case-by-case approach as `booking`'s DR-B5 (within-48h cancellations) — no automated no-show rule; the Owner decides remediation, if any, per instance.
**Rejected alternatives:** an automated fixed rule (forfeit/partial credit/tour credit/nothing applied uniformly).
**Impacts:** REQ-TOUR10's conditions already say "aligned with DR-B5's precedent" — no text change needed, just close.

### DR-T9 · Calendar invite delivery — both *(closes D-TOUR-9)*
.ics attached to the confirmation email, and an add-to-calendar widget on the confirmation page.
**Rejected alternatives:** .ics-only; widget-only.
**Impacts:** REQ-TOUR01's tour-hub scope should note both delivery mechanisms exist — a minor addition at Stage 6, not a REQ-level change (calendar delivery itself is `booking`'s REQ-BOOK05 confirmation, referenced not owned by TOUR).

## Still open

### D-TOUR-2 · Reminder/advisory channels — tied to D-NOTIF-1
Not resolved independently. Carried forward exactly as D-NOTIF-1 stands: interim default is native integration, no vendor lock, revisit at Stage 6d. **Direction of safety:** no channel commitment made ahead of the project-wide decision.

### D-TOUR-3 · Weather-alert thresholds — deferred
No numeric rules exist yet; William has not supplied them. **Interim default:** advisories are informational-only; the system never auto-escalates to a cancellation-candidate classification without defined thresholds. **Direction of safety:** under-escalating (informational when it maybe should have been urgent) is judged safer than over-escalating to a false cancellation-candidate signal without real numbers behind it — and either way, the Owner retains manual override per REQ-TOUR03's design.

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-21T00:00:00Z | Initial TOUR Decision Record: 7 decisions resolved (DR-T1, T4–T9), 2 carried open (D-TOUR-2 tied to D-NOTIF-1, D-TOUR-3 deferred). DR-T1 requires a REQ-TOUR02 text correction (T-0 milestone removed under light cadence). |
