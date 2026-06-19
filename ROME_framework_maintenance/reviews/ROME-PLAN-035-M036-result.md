# ROME-PLAN-035 — PROP-036 Live Wiring Result (Surveyor / P0.5 Intake)

| Field | Value |
|-------|-------|
| **UID** | ROME-PLAN-035-M036 |
| **Date** | 2026-06-19 |
| **Implements** | ROME-PROP-036 (input characterization & intent-driven routing) |
| **Path** | A (live Claude session + Agent tool; no SDK runner) |
| **Outcome** | ✅ **DONE** — Surveyor role authored + characterization proven live on both branches |

---

## What was built
- **Surveyor role** — `robot-plugins/surveyor/ROBOT.md` + `modes/P0.5-intake.md`
  (capability `characterize-input`). Loads via `loadRoleSpec('surveyor','P0.5')`.

## What was proven live (two real sub-agent runs + real routing)

**Run 1 — Greenfield** (input: `testapps/taskflow/_user_input/raw-requirements/PRD.md`)
- Surveyor verdict: `intent=greenfield`, `qualityVerdict=SUFFICIENT`, `as_is_required=false`, `prototype.enabled=true` (interaction-heavy Kanban UI).
- Correctly found **no existing code** → greenfield; flagged the PRD's open questions as clarifications, not blockers.
- `routeFromICR` → **P0 → P1 → P2 → P3 → P3.5 → P4 → P5** (prototype phase included, forward-only).

**Run 2 — Brownfield/extension** (input: existing code at `m3-proof/taskflow/SOURCE/`, ask: "add labels/tags")
- Surveyor verdict: `intent=extension`, `qualityVerdict=SUFFICIENT`, `as_is_required=true`, `prototype.enabled=false` (no UI in source).
- Correctly inspected the existing modules, identified `validators/` as the primary touch point, and raised real clarifications (free-form tag vs first-class entity; missing task model).
- `routeFromICR` → **P0 → P0.5 → P1 → P2 → P3 → P4 → P5** (intake included, **reverse-first**: derive as-is, then work the delta).

**Guard rule** — an `INSUFFICIENT` ICR is **refused** by `routeFromICR` ("gather clarification before routing"), confirming the do-not-proceed-on-bad-input rule (PROP-036 §2.2).

## Principles demonstrated
- Input **quality** measured and gated at the source (EP-3, upstream).
- **Intent** drives the lifecycle: greenfield forward-only vs brownfield reverse-first (EP-2).
- Surveyor characterizes only — separate from Talib/PMA/Sarah (EP-5).

## Status
PROP-036 live half complete. The as-is *derivation* itself (the deep reverse-
engineering work in the brownfield P0.5→P1 path) runs as normal sub-agent work
under the routed lifecycle; the characterization + routing that triggers it is
now proven.
