# Architecture Impact Brief — DEV-5 — `webapp-admin` target platform: Flutter Web SPA → **Flutter macOS desktop**

| | |
|---|---|
| **From** | Roma (ROME orchestrator), filing a sponsor-directed deviation |
| **For** | Sponsor sign-off; GATE-P3 re-confirmation of the amended TDR-13 |
| **Date** | 2026-07-28 |
| **Deviation** | **DEV-5** — supersedes **TDR-13** for `webapp-admin` only |
| **Change type** | **CT-5 (restructure)** — routes `['P1','P3','P4','P5']` |
| **Status** | **APPROVED — sponsor-directed, 2026-07-28** ("target platform is macos for frob admin"). The deviation itself is now ratified, which resolves the irregularity of design artifacts asserting an unapproved platform. The downstream routing and gate steps below remain outstanding — approval of the deviation is not delivery of the work. |

## The change

`webapp-admin` is no longer a Flutter Web SPA. It is a **Flutter macOS desktop
application**, distributed as a signed `.app`, run locally by the Owner. Web is
**retired** for this component, not kept as a fallback — this is a replacement,
which distinguishes DEV-5 from DEV-3 (where the guide app kept a PWA path).

The three other frontend components are **unaffected**: `webapp-customer`
(static + islands), `webapp-editor` (Flutter Web SPA), and `mobile-guide`
(Flutter Web PWA, DEV-3) all keep their TDR-13 stacks.

## Why this is a deviation and not an edit

TDR-13 is a ratified technical decision. The four prior stack changes
(DEV-1…DEV-4) were each filed as sponsor-directed deviations rather than applied
as direct edits to the design artifacts. Amending the docs without a matching
deviation record is the contract-drift pattern already raised as FINDING-001 and
FINDING-002 on this project. This brief exists so the amended docs have an
authority trail.

## Blast radius (trace-verified — ROME-AX-31)

Eight artifacts, seventeen statements. Verified by trace, not estimated:

| Artifact | Statements amended |
|---|---|
| `_design/architecture.md` | §2 component kind (L31); §3 topology node (L57); §5 TDR-13 row (L142); §6 publish model (L152) |
| `_design/component-specs.md` | Binds line (L6); intro (L8); `webapp-admin` stack (L20) |
| `_design/design-assets/design-system.md` | Binding TDRs (L8); Track B intro (L21); TDR-13 split (L42); §8.5 heading (L380); §8.6 layout note (L430) |
| `_design/design-assets/user-flows.md` | Design-system header row, rendering target (L8) |
| `_design/architecture-impact-brief.md` | Deviation table; architecture shape (L25); deviation status (L53) |
| `_design/api-contracts.md` | Auth/CORS assumptions for the operator session |
| `changes/CR-007-admin-command-palette-DRAFT.yaml` | "responsive (TDR-13)" constraint (L86) |
| `SOURCE/apps/webapp-admin/README.md` | Local dev + build/deploy instructions |

## Consequences beyond wording

These are **not** documentation changes and none are resolved by this brief.

1. **Distribution replaces deployment.** `wrangler pages deploy build/web
   --project-name=fob-webapp-admin` no longer applies. A macOS build requires
   an Apple Developer account, code signing, and notarisation, plus a channel
   for getting updates to the Owner's machine. `_config/infra-impact-brief.md`
   has no provision for any of this, and the Apple Developer dependency was
   **explicitly removed from the project by DEV-3** — DEV-5 reinstates it.
2. **Auth assumptions break.** TDR-07's owner session is a browser mechanism:
   JWT in KV, delivered to a page served from a trusted origin, with CORS
   reflecting `*.friendsonbikes.uk` and `credentials: true`. A native client has
   no origin and sends no cookies, so the CORS layer stops being a control and
   token storage moves to the macOS keychain. The session model needs
   restating in `api-contracts.md`, not just re-describing.
3. **The component name is now wrong.** `webapp-admin` describes a webapp. The
   directory, the pubspec `name: fob_webapp_admin`, the REQ ownership tables and
   every cross-reference use it. Renaming is a larger restructure than the
   platform change itself; this brief **does not** rename it, and flags the
   inconsistency as accepted debt pending a sponsor call.
4. **The publish control (A6, SEO03) now fires from a desktop app.** `POST
   /publish` regenerating the customer site and pushing to Pages/R2 is
   unchanged server-side, but the trigger is no longer same-origin.
5. **FINDING-008 partially changes shape.** The CORS weakness (item 3 of that
   finding) stops protecting the admin surface once the client is native — the
   unauthenticated-route defects it raises are **unaffected** and remain open.

## Recording gap — DEV-5 is not in orchestration state

DEV-5 is approved in this document but is **absent from
`state.tdrDeviations`**. It could not be registered through the sanctioned API:
`guard.recordTdrDeviation` rejects any TDR that is not in `state.tdrs`, and that
registry is empty on this project (zero entries, though DEV-1…DEV-4 reference
four TDRs). See **FINDING-009**. `state.json` was deliberately not hand-edited
to force it through — `CLAUDE.md` reserves that file to `state.js`/`driver.js`.

Until FINDING-009 is resolved, treat this document as the record of DEV-5, and
note that orchestration state does not know the deviation exists.

## What still has to happen

Outstanding, in order:

1. ~~**Sponsor approval** of the deviation itself~~ — **DONE 2026-07-28.**
   Confirmation of the reinstated Apple Developer dependency is still implicit
   rather than explicit; flag if that was not intended.
2. **Route the change** — CT-5 through `routeChange` with this blast radius.
   (The earlier "increment 8 unsealed" blocker no longer applies: all
   increments through 16 are sealed as of 2026-07-28.)
3. **P1** — restate the AUTH01/AUTH05 owner-session requirements for a native
   client.
4. **P3** — reissue `api-contracts.md` auth section; update
   `_config/infra-impact-brief.md` for signing/notarisation/distribution.
5. **P4/P5** — verify the macOS build target, replace the deploy pipeline in
   `SOURCE/.github/workflows/ci.yml`, migrate token storage to the keychain.

## Revision History

| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-28 | Initial: files DEV-5, supersedes TDR-13 for `webapp-admin` (Flutter Web SPA → Flutter macOS desktop, web retired). |
