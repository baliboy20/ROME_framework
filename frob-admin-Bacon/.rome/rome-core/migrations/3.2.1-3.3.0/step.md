# MIG-3.2.1→3.3.0 — change-type taxonomy + convention-level model

Document UID: ROME-MIG-3.2.1-3.3.0
Status: Active
Source: ROME-PROP-054, ROME-PROP-055 (v3.3.0)

## applies
conventionLevel `3.2.1` → `3.3.0`

## transforms
- T1 State gains `conventionLevel`, `upgrade`, `changeQueue` — applied
  automatically and losslessly by `state.js#load` (additive defaults; an
  undeclared level defaults to the version that built the project). No file
  rewrite needed.

## gaps
None. v3.3.0 changes no artifact format and adds no required fact to existing
gates; it adds mechanisms (change queue, change-scoped runs, upgrade ladder)
that apply only to NEW work.

## semantics
- Pre-3.3.0 projects have no change queue: amendments made before this level
  (if any) were routed as full increments — historical fact, not a violation.
- The intent labels (`refinement`/`extension`/`migration`) on old increments
  predate the CT taxonomy; do not re-map them retroactively.

## postconditions
- State loads clean; `conventionLevel = 3.3.0`; `changeQueue` present.

## Revision History
| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-27 | Shipped with v3.3.0 per ROME-AX-35 (same-release migration step). |
