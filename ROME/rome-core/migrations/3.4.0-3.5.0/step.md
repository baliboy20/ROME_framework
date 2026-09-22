# MIG-3.4.0→3.5.0 — derived traceability (PROP-058)

Document UID: ROME-MIG-3.4.0-3.5.0
Status: Active
Source: ROME-PROP-058 (v3.5.0)

## applies
conventionLevel `3.4.0` → `3.5.0`

## transforms
Applied by `state.js#load` on first load, audited, idempotent:
- `traceability.matrix` is deleted (`MATRIX_FIELD_DROPPED`, with the row count). No version ever wrote it; readers now compute.
- `traceability.testCoverage` is created as the union of every increment's `testManifest`.
- Every increment gains `scope: { requirements: null, source: null }`. Sealed increments keep `null` (AX-19); the active increment needs `guard-cli scope` before its scoped facts can pass.
- Declared `implements`/`enforces`/`validates` edges already in the store are kept as history but are no longer evidence; `trace` reports how many were ignored.

## gaps
- G1 `scope` closes: **orchestrator**
  Run `guard-cli scope <state> --ts <iso> --from-corpus` (or `--req …`) on the active increment. Until then `traceability`, `matrix` and `testAdequacy` are INCONCLUSIVE and the gate cannot pass.
- G2 `scan` closes: **orchestrator**
  Run `guard-cli scan <state> --ts <iso>`. Code/test links come only from source comments; a project whose files carry no requirement ids will read `partial`/`unlinked` until producers annotate them. Unattributed files WARN at 3.5.0 and FAIL from the next MINOR.
- G3 `unknown-ids` closes: **sponsor**
  `scan` lists annotations that name no requirement file (on the originating project: the `REQ-EML` family, imported from an external spec under its old names). The sponsor decides: rename the annotations, or add the requirements.
- G4 `deps` closes: **operator**
  Vendored copies made before 3.5.0 have no `node_modules`. Run `npm install --omit=dev` in `.rome/rome-core/lib` once; new clones and upgrades do it themselves.

## semantics
- Facts recorded before 3.5.0 under recorder-chosen scope are historical and stay as recorded (AX-19). Nothing is re-gated. The proof run on the originating project (ROME-REVIEW-PROP-058) shows what they would read as now.
- A declared code/test edge in an old increment is not a violation; it was the rule then.
- `guard-cli check`/`advance` now recompute the scoped facts for the CURRENT phase and refuse a record that disagrees (AX-40).

## postconditions
- State loads clean; `conventionLevel = 3.5.0`; no `traceability.matrix` key.
- G1 and G2 done before the first post-upgrade gate on the active increment.

## Revision History
| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-09-11 | Shipped with v3.5.0 per ROME-AX-35 (same-release migration step). |
