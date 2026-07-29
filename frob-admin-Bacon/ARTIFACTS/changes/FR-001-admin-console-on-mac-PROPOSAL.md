# FR-001 — Admin console on Mac

| | |
|---|---|
| **Type** | Feature request (new capability) — routes through the **increment** mechanism, not a change record |
| **Intent** | `extension` |
| **Raised by** | Roma, on sponsor direction, 2026-07-28 |
| **Status** | PROPOSAL — not yet opened as an increment |
| **Supersedes** | CR-006, CR-007, CR-008, CR-009, CR-010 (drafts retained, not deleted) |
| **Excludes** | FINDING-008 remediation; CR-003 (customer website banner) |

## Why this is one request and not six

Two of the six items below — the command palette and the MCP server — are **new
capability (CT-4)**. `routing.js#routeChange` refuses CT-4 outright by design:
new capability routes through the increment mechanism, never a change record.
So they could never have shipped as CRs however they were written.

The rest genuinely interlock. The macOS decision determines which fonts are
coherent (SF Pro *is* the macOS system face), which keyboard shortcut the
palette binds, and how the operator session works once there is no browser
origin. Splitting them means answering the same questions three times and hoping
the answers agree. Only one increment can be active at a time in any case, so
bundling removes a queue rather than creating one.

**What is deliberately NOT here.** The security remediation is excluded so it
cannot be delayed behind feature decisions. The customer-site banner is excluded
because it is a different app, a different brand track and a different audience,
with no overlap — bundling would only make it inherit this work's delays.

## Scope — six workstreams

### 1. Platform: Flutter Web SPA → Flutter macOS desktop (DEV-5)
Sponsor-approved 2026-07-28. Web is retired for this component — a replacement,
not a fallback. Reinstates the Apple Developer dependency that DEV-3 removed
(signing, notarisation, update distribution), none of which
`_config/infra-impact-brief.md` currently provides for. The Cloudflare Pages
deploy no longer applies and `SOURCE/.github/workflows/ci.yml` still builds the
retired web target. Detail: `_design/architecture-impact-brief-DEV-5.md`.

**Verified feasible:** the `macos/` target is already scaffolded, both
entitlement files already declare `com.apple.security.network.client`, and the
app builds and runs natively against the local worker (confirmed 2026-07-28).

### 2. Typography: Track B → system fonts
All of `webapp-admin` moves to **SF Pro**, with **SF Mono** for micro-labels.
The serif role is **removed**, not reassigned — Georgia was considered and
rejected. `FobText.money` moves from serif to sans.

Rationale and evidence: `_design/design-assets/CR-010-type-specimen.html`.
Georgia has old-style figures (digits at varying heights, some below the
baseline) and no lining alternate set, so the `lnum` feature already in the code
would silently do nothing — reintroducing precisely the defect Source Serif 4
was adopted to fix. It also has no 600 weight, which `pageTitle` requests.

**Scoped to `webapp-admin` only.** `mobile-guide` shares the Track B token set
and is a Web PWA on non-Apple platforms; SF is unavailable there and Apple's
licence restricts it to Apple platforms. `design-system.md` §8.6 must be amended:
the shared Track B tokens cover colour, spacing and radius; the type stack now
forks per app.

### 3. Settings console
Extends an existing, already-routed settings slice. Adds the app version,
workflow configuration (e.g. auto-reply on booking), and a tab structure for
future settings. **One question is unresolved — see OQ-1.**

Drift to fix while here: the settings surface has no A-series surface ID.

### 4. Command palette (typeahead quick-nav)
Icon in the top bar opens a search box; typing "Pay" offers Payments and other
matches; closes with a close button. Single-operator system, so no permission
filtering is needed. `app_router.dart` is the only enumeration of destinations.

Under DEV-5 the binding should follow macOS convention (Cmd-K) and must not
collide with a system or menu-bar shortcut.

### 5. Email template — import a full HTML document
Adds a Blocks / Full HTML toggle to the A5c editor. Decisions taken:
**imported HTML replaces the house shell** (scoped to templates explicitly
flagged raw-HTML, so block templates keep every guarantee), and **no
sanitisation** — stored and sent verbatim.

This **repeals CR-002 (CHG-001)**, whose central rule is that `body_html` is
server-rendered and never client input — enforced in three places. So
`api-contracts.md#cr-002` must be **reissued**, not patched.

Import must also fix what a raw paste cannot: host images on R2 and convert them
(the sponsor's reference file is 707KB, 98% of it inline base64 WebP that Gmail
and Outlook will not render, and 7× Gmail's clipping threshold), and report
unsupplied merge fields — the one failure mode that is silent at send time.
UI: `_design/design-assets/CR-009-editor-mockup.html`.

**Accepted consequence of "no sanitisation":** the editor's live preview renders
Owner-supplied markup, so it must be isolated (sandboxed, scripts disabled) or
the console becomes an execution surface. Merge-value escaping stays.

### 6. MCP server for the admin surface
Exposes admin operations to a Claude session. ~90 operations mapped across 27
routes (~45 read, ~30 safe write, 14 dangerous write). Detail:
`changes/CR-008-admin-mcp-server-PROPOSAL.md`.

**Sequenced last and gated on FINDING-008**, which is a prerequisite, not a
parallel concern. Three questions remain open (OQ-2, OQ-3, OQ-4).

## Decisions already taken

| # | Decision | Date |
|---|---|---|
| 1 | macOS replaces Web for `webapp-admin`; Web retired | 2026-07-28 |
| 2 | All-SF-Pro; serif role removed; no Georgia | 2026-07-28 |
| 3 | `money` moves to SF Pro (sans) | 2026-07-28 |
| 4 | Font change scoped to `webapp-admin`; `mobile-guide` unchanged | 2026-07-28 |
| 5 | Imported HTML replaces the house shell, for flagged templates only | 2026-07-28 |
| 6 | No sanitisation of imported HTML | 2026-07-28 |

## Open questions — blocking

- ~~**OQ-1 (settings):** may the Owner switch the booking-confirmation email
  off entirely?~~ **DECIDED 2026-07-28 — NO.** Content and timing are
  configurable; existence is not. REQ-NOTIF11's invariant and UXC-FBK-1 stand
  unrepealed, so this workstream no longer conflicts with a delivered
  requirement. **Implementation consequence:** the settings UI must not render
  a disabled-looking toggle for it. Transactional sends appear as *configurable*
  (edit wording, edit timing) with no off switch, so the constraint reads as
  deliberate design rather than a broken control. Only genuinely optional
  notifications get an on/off.
  **Tabs — DECIDED 2026-07-28: no additional tabs.** Ship exactly two:
  *About* (app version) and *Notifications* (auto-reply). The tab frame is
  built so further tabs can be added as they arise, per the original request —
  but none are speculated into existence now. Nothing is designed for a setting
  that does not yet have a stated purpose.
- **OQ-2 (MCP):** which authentication path? Three options were assessed;
  *recommendation: a first-class revocable `agent` principal with a capability
  allowlist*, not a static admin key — `lib/auth.ts` already records rejecting
  that pattern (DR-B9), so reopening it is a ratified decision to revisit.
- **OQ-3 (MCP):** read-only for v1, or writes too?
- **OQ-4 (MCP):** may an assistant ever act irreversibly unattended? The 14
  dangerous writes include refunds, insurer dispatch and tour deletion.

## Prerequisites

1. **FINDING-009 — restore the decision register at this increment's intake.**
   Supply `_config/decisions.tdr.yaml` (recovered, 17 TDRs, schema-validated)
   and mark the carrying input **Reliable**, or all 17 downgrade to PROPOSED.
   Until then `tdrConformance` passes trivially and verifies nothing.
2. **Re-file DEV-5** through `guard.recordTdrDeviation` once TDR-13 is back in
   the register; it currently exists only in the design artifacts.
3. **FINDING-008** must be gated before workstream 6.

## Blast radius — TRACED 2026-07-28

`verified: true`. Established by reading the code, not inferred (ROME-AX-31).
Counts below are measured.

### Workstream 2 — fonts: far smaller than it looks

38 files reference `FobText.*` and 49 `fontFamily:` sites exist outside
`tokens.dart` — but **every one references the constants, not string literals**,
so changing `FobText.serif/sans/mono` propagates without touching them.

The decision to **delete** the serif role (rather than repoint it) is what
creates real work, because deleting a constant breaks its call sites. Measured:
**exactly 3 files** use `FobText.serif` inline, and the same 3 use
`moneyFontFeatures` inline rather than the `FobText.money` token:

- `features/bookings/presentation/pages/bookings_master_page.dart`
- `features/bookings/presentation/widgets/booking_record_view.dart`
- `features/scheduling/presentation/pages/tours_page.dart`

Each hand-rolls a money style (`fontFamily: FobText.serif` +
`fontFeatures: FobText.moneyFontFeatures`) instead of using `FobText.money`.
Fixing them to use the token is the right change anyway and removes the
divergence permanently.

**Total:** `lib/theme/tokens.dart`, 3 call-site files, `pubspec.yaml`, and 2
now-dead assets (`assets/fonts/SourceSerif4.ttf`, `PlusJakartaSans.ttf`).

### Workstream 3 — settings: slice exists, both requested settings are new

`lib/features/settings/**` is already a complete clean-architecture slice
(entity, model, repository, datasource, usecases, bloc, page) and
`GET/PUT /admin/settings` already exists in `worker/src/routes/backoffice.ts`
(lines 208-250, backed by the singleton `operator_settings` row).

But the persisted entity holds only `refundCutoffHours`, `reminderMilestones`
and `cancellationRemediationOptions`. **Neither requested setting exists:**
auto-reply is a new persisted field (D1 column + entity + model + route
contract), and the app version is not available to the app at all —
`package_info_plus` is not a dependency, so it needs adding or the version needs
generating into a constant at build time. `pubspec.yaml` says `version: 0.1.0`.

### Workstream 4 — command palette: single source of truth confirmed

`lib/router/app_router.dart` (172 lines) enumerates **26 destinations** through
two helpers, `_shellRoute(path, page)` and `_shellParamRoute(path, builder)` at
lines 104-117. That is the only enumeration, so the palette registry can derive
from it rather than duplicating it.

Note 2 of the 26 are parameterised (`/bookings/:id`, `/bookings/:id/edit`) and
are **not** palette destinations — a palette cannot navigate to them without a
record id, which is the OQ that decides whether the palette searches records.
So 24 static destinations.

### Workstream 5 — email import

Worker: `src/routes/email.ts` (4 `rejectsClientHtml`/`CLIENT_HTML_ERROR` sites
across both schemas), `src/modules/notifications/templates.ts`,
`src/modules/notifications/html-render.ts`. Plus R2 upload for images (the
`ASSETS` binding already exists) and a D1 consideration for larger `body_html`.
Admin: `lib/features/email/**` (editor page, bloc, `template_save_payload.dart`
whose assertion forbids client HTML).

### Workstreams 1 & 6

Platform: `macos/` target (scaffolded, entitlements already correct),
`SOURCE/.github/workflows/ci.yml` (still builds the retired web target),
`_config/infra-impact-brief.md` (no signing/notarisation/distribution).
MCP: new component; gated on FINDING-008.

### Design artifacts

`_design/architecture.md`, `component-specs.md`, `design-assets/design-system.md`
(§8.2 stale Playfair, §8.6 shared-theme rule), `api-contracts.md` (CR-002
section to reissue; auth section for native clients),
`design-assets/user-flows.md`, `design-assets/email-house-shell.md`.

### Requirements

REQ-NOTIF10 (email templates), REQ-NOTIF11 + UXC-FBK-1 (confirmed unrepealed by
the settings decision), AUTH01/AUTH05 (native-client session), plus a new
requirement for the palette (no prior art exists in `_requirements/`).

## Sequencing within the increment

Smallest and most-decided first, so value lands early and the riskiest work has
the most context behind it:

1. Fonts (fully decided, single app, no API surface)
2. Platform/macOS consolidation (build, signing, CI, distribution)
3. Email HTML import (needs the CR-002 contract reissued)
4. Settings console (blocked on OQ-1)
5. Command palette
6. MCP server (blocked on FINDING-008 and OQ-2/3/4)

## Revision History

| Rev | Date | Summary |
|-----|------|---------|
| v1.0 | 2026-07-28 | Initial: folds CR-006…CR-010 into one extension increment; carries six sponsor decisions; excludes FINDING-008 and CR-003. |
