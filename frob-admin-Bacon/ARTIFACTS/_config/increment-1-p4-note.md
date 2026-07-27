# Increment 1 (Refinement A19/A23) — P4 Config note

**Date:** 2026-07-27
**Author:** Lucien (Configuration Specialist), dispatch `lucien-P4`
**Ref:** `frob-admin-Bacon/_user_input/raw-requirements/Refinement_A19_BookingBrowser_2026-07-27.md`

## Conclusion

**No changes required to `config-manifest.json` or `infra-impact-brief.md` for this increment.**

## Why

This increment is a screen-level restructuring within the existing
`webapp-admin` component:

1. A19 "Booking browser" is renamed "Bookings" and split from one
   inline two-pane screen into two routed screens (Master / Detail).
2. A new screen A23 "Edit booking" is introduced to host the
   owner-assisted edit (REQ-BOOK15) and status-transition (REQ-BOOK16)
   capability, relocated off the (now read-only) A19 Detail screen.

None of this touches the infrastructure surface tracked by P4 config
artifacts:

- **No new component** — everything lives inside the already-listed
  `webapp-admin` component; no new app/service is introduced.
- **No new binding** — D1/KV/R2/cron bindings are unchanged; A23 is a
  client-side route, not a new backend surface.
- **No new secret or vendor** — no new integrations of any kind.
- **No new environment** — dev/staging/production topology unchanged.
- **No new API endpoint** — per the sponsor-confirmed scope, the
  existing PATCH/POST endpoints backing REQ-BOOK15/REQ-BOOK16 are
  unchanged; only which screen (A19 Detail vs. new A23) calls them
  moves. No new data fields.
- **Routes are not tracked in config-manifest.json** — reviewed the
  full file; it tracks `components`, `bindings` (d1/kv/r2/cron),
  `environments`, `secrets`, `vendors`, and `tdrCitations` only. It has
  no route- or screen-level tracking model, so a new client-side route
  (A23) has nothing to add there.
- **No CI/CD, build, or scaffolding-plan changes** —
  `ARTIFACTS/_config/` contains only `config-manifest.json` and
  `infra-impact-brief.md` (confirmed via `find`); neither references
  screens/routes, and no new build targets, secrets, or deploy steps
  are implicated by an admin-webapp-internal navigation change.

## Action

None taken beyond this note. Screen/route relocation of
REQ-BOOK15/REQ-BOOK16 to A23 is a P3 design-artifact concern
(`requirements-coverage.md`, `user-flows.md`, `design-system.md`,
`FOB-UXIS-001_UXIS.md`), not a P4 config concern.
