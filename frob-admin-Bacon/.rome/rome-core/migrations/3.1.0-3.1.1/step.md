# MIG-3.1.0→3.1.1 — testing declared in tech-stack.yaml

Document UID: ROME-MIG-3.1.0-3.1.1
Status: Draft (retro-authored under ROME-PROP-055; binding once PROP-055 is implemented)
Source: CHANGELOG.md v3.1.1

NOTE — grandfathered anomaly (PROP-055 A.1): v3.1.1 was released as a PATCH
yet changed a convention (required `testing` block). Under A.1 this is no
longer permitted; this real (non-no-op) step exists for the historical
boundary.

## applies
conventionLevel `3.1.0` → `3.1.1`

## transforms
None mechanical — the `testing` block cannot be invented; see G1.

## gaps
- G1 `tech-stack.testing` — every capability in `tech-stack.yaml` requires a
  `testing` block (framework, types, run command). Old projects usually hold
  this information implicitly in delivered P4 test config / CI files.
  - closes: `derive` — reconstruct the block per capability from the delivered
    test config and CI stages (marked RECONSTRUCTED); `sponsor` confirms,
    since v3.1.1's whole point is sponsor visibility of the testing approach.

## semantics
- Pre-3.1.1 tech-stack.yaml files lacking `testing` are compliant for their
  level; the testing approach in delivered P4 config was the ecosystem
  convention of the time, chosen by Lucien, not sponsor-approved — treat it
  as RECONSTRUCTED-grade fact, not sponsor intent.

## postconditions
- Every capability in tech-stack.yaml has a `testing` block (or
  `upgrade.pending` carries G1); `conventionLevel = 3.1.1`.

## Revision History
| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-27 | Retro-authored from CHANGELOG v3.1.1 (PROP-055 OQ-2). |
