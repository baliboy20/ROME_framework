# MIG-3.3.0→3.3.1 — TDR register integrity

Document UID: ROME-MIG-3.3.0-3.3.1
Status: Active
Source: ROME-PROP-056 (v3.3.1)

## applies
conventionLevel `3.3.0` → `3.3.1`

## transforms
- T1 State gains `tdrsEverPopulated` (derived from register/audit history) and
  `tdrDeviationSeq` (derived from the max existing DEV number) — applied
  automatically and losslessly by `state.js#load`. No file rewrite needed.
- T2 Change-queue entries gain `priority` (defaults NORMAL on load; PROP-054
  v1.4). Automatic, lossless.

## gaps
None mechanical. v3.3.1 changes no artifact format; it tightens existing state
machinery (shrink refusal, non-silent conformance, scoped deviations).

## semantics
- Run `rome-doctor.cjs <projectDir>` after upgrading. Its findings are
  sponsor decisions, not automatic repairs:
  - A LOST register (empty but previously populated, or cited by artifacts)
    must be restored by sponsor-confirmed re-intake from `decisions.tdr.yaml`
    (git history is the source of record).
  - Duplicate DEV ids predating the monotonic counter are re-identified by
    sponsor decision; record the mapping in migration-log.md.
  - SUPERSEDED TDRs closed by an unscoped deviation that in fact changed only
    one component may be reinstated as APPROVED with a carve-out (AX-37);
    sponsor confirms each.
- Conformance passes recorded while a register was empty-after-populated are
  historical false passes — note them in migration-log.md; do not rewrite the
  gate ledger (AX-19).

## postconditions
- State loads clean; `conventionLevel = 3.3.1`; `tdrsEverPopulated` and
  `tdrDeviationSeq` present; `rome-doctor` run and findings dispositioned.

## Revision History
| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-28 | Shipped with v3.3.1 per ROME-AX-35 (same-release migration step). |
