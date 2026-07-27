# MIG-3.0.0→3.1.0 — design authority ("Marcus")

Document UID: ROME-MIG-3.0.0-3.1.0
Status: Draft (retro-authored under ROME-PROP-055; binding once PROP-055 is implemented)
Source: CHANGELOG.md v3.1.0; ROME-PROP-037; ontology v1.4 (AX-26)

## applies
conventionLevel `3.0.x` → `3.1.0`

## transforms
None. All v3.1.0 changes are engine-side (owner matrix P3 = `pma|clara`,
P3.5 = `reena|charlie`; Charlie's design conditionals removed; prototype
recommendation in intake). No existing artifact changes shape.

## gaps
- G1 `design-assets` (ui projects only) — v3.1.0 requires P3 fact
  `designAssets` (AX-26): a project with a `ui` capability cannot gate P3 with
  an empty `design-assets/` directory. Sealed increments are NOT re-gated
  (AX-19); this gap blocks only NEW post-upgrade work on ui scope.
  - closes: `derive` — Clara reconstructs a design system from the delivered
    UI (marked RECONSTRUCTED), then `sponsor` sign-off.
  - skip-if: project has no `ui` capability → gap auto-closed.
- G2 `prototype-decision` — prototype is now default-recommended when inputs
  carry UI intent. For future increments only.
  - closes: `sponsor` — one question at next intake; recorded in the ICR.

## semantics
- Pre-3.1.0 ui artifacts were legitimately gated without design assets; their
  absence in delivered increments is NOT a defect (AX-26 postdates them).
- "Clara optional, on PMA request" was the rule when these artifacts were
  produced; generator styling decisions in delivered code are historical fact,
  not violations.

## postconditions
- State loads; trace links resolve; `conventionLevel = 3.1.0`.
- If ui capability present: either G1 closed or `upgrade.pending` carries G1.

## Revision History
| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-27 | Retro-authored from CHANGELOG v3.1.0 (PROP-055 OQ-2). |
