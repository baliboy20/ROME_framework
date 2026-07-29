# MIG-3.3.1→3.4.0 — formal workflows (FLOW artifacts)

Document UID: ROME-MIG-3.3.1-3.4.0
Status: Active
Source: ROME-PROP-057 (v3.4.0)

## applies
conventionLevel `3.3.1` → `3.4.0`

## transforms
None mechanical. v3.4.0 adds a new artifact kind (FLOW) and a new GATE-P1
required fact (`flowValidation`); no existing state field or artifact format
changes.

## gaps
- G1 `flows-decision` closes: **sponsor**
  Existing projects have no FLOW artifacts. At the next increment or
  change-scoped run that routes through P1, the sponsor decides once:
  (a) generate drafts (`lib/flow/flow-draft.cjs`), route the errors, confirm; or
  (b) record a flows-omission (`state.js#recordFlowsOmission`).
  Sealed increments are untouched (ROME-AX-19) — the fact applies to NEW work
  only; nothing is retro-gated.

## semantics
- Pre-3.4.0 designs derived business flow by inference from requirement
  pre/postconditions — historical fact, not a violation. Do not flag old
  design artifacts for lacking FLOW citations.
- Clara's pre-3.4.0 `user-flows.md` files are legacy drawings, not FLOW
  renderings; treat as reference only.

## postconditions
- State loads clean; `conventionLevel = 3.4.0`.
- The G1 decision is recorded (confirmed flows or omission) before the first
  post-upgrade P1 gate.

## Revision History
| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-29 | Shipped with v3.4.0 per ROME-AX-35 (same-release migration step). |
