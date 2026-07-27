# MIG-3.1.1→3.2.0 — sponsor architecture agreement + TDR standard

Document UID: ROME-MIG-3.1.1-3.2.0
Status: Draft (retro-authored under ROME-PROP-055; binding once PROP-055 is implemented)
Source: git 658ed35b (v3.2.0); ROME-PROP-051, ROME-PROP-052; ontology v1.5 (AX-27..30)

## applies
conventionLevel `3.1.1` → `3.2.0`

## transforms
- T1 If absent, create an empty canonical TDR store
  `ARTIFACTS/.../decisions.tdr.yaml` (PROP-052: YAML canonical) so post-upgrade
  tooling has its expected file. Empty = "no TDRs extracted", a valid state.
- T2 State gains pass-through slots for `infraConstraints` (null) and
  `sponsorCheckpoint` (default-on) so `routeFromICR` output shape is uniform.

## gaps
- G1 `devRuntimeDiffers` — the delivery manifest field declaring intentional
  dev/prod runtime divergence (AX-28) does not exist in pre-3.2.0 deliveries.
  - closes: `sponsor` — one question ("does the delivered runtime differ from
    the intended production environment?"); answer recorded in the manifest.
    An agent may pre-draft the answer from config diffs (RECONSTRUCTED).
- G2 `infra-constraints` — Surveyor now captures hosting/infra constraints at
  intake. Unknown for old projects.
  - closes: `sponsor` — asked at the next intake (future increments only);
    until then recorded as `UNDEFINED`.

## semantics
- Sealed increments passed GATE-P3/P4 without sponsor architecture consent
  (AX-27 postdates them): their stack/infra choices are historical fact, and
  absence of an AIB/checkpoint record is NOT a gate violation.
- No TDRs exist for pre-3.2.0 inputs: technical decisions embedded in old
  specs were never extracted. If later extracted from old inputs, carrier
  reliability applies (AX-30) — they enter as PROPOSED at best, never
  retroactively APPROVED.
- `tdrConformance` (AX-29) binds only post-upgrade gates; delivered artifacts
  are not re-audited for citations.

## postconditions
- `decisions.tdr.yaml` exists and parses; state loads; trace links resolve;
  G1 closed or pending; `conventionLevel = 3.2.0`.

## Revision History
| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-27 | Retro-authored from v3.2.0 release commit + PROP-051/052 (PROP-055 OQ-2). Boundary is absent from CHANGELOG.md (known gap — changelog stops at v3.1.1); sourced from git history. |
