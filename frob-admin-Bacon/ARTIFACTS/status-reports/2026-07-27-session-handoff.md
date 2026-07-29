# Session Handoff — 2026-07-27

**Project:** frob-admin-Bacon
**Repo:** `/Users/will/flutterProjects/Exercises/26July/017-frob-dev-v1/ROME_framework`
**state.json (source of truth):** `frob-admin-Bacon/ARTIFACTS/_orchestration/state.json`

---

## 1. Increment status

| Increment | Intent | Status |
|---|---|---|
| 0 | greenfield | **SEALED** — full lifecycle COMPLETE, all gates APPROVE (2026-07-21/22) |
| 1 | refinement | **COMPLETE** — full lifecycle P0→P5, all gates APPROVE (2026-07-27) |

### Increment 1 — what shipped
- **A19** renamed "Booking browser" → **"Bookings"**, split into genuine **Master** (`/bookings`) + **Detail** (`/bookings/:id`) routes, back-navigable, strictly read-only.
- **New screen A23 "Edit booking"** (`/bookings/:id/edit`) — hosts the owner-assisted edit form (REQ-BOOK15) and status-transition buttons (REQ-BOOK16), relocated off A19 per sponsor decision (DR-B12 reversed).
- Mid-flight corrections made and re-gated: a scope correction (Edit button was deliberate REQ-BOOK15/16, not a defect), a screen-ID collision (A21 was already "Bikes" — corrected to A23 everywhere), and a pre-existing test-adequacy gap closed (REQ-BO05/BO06 error paths were never tested; added 2 backend tests).
- Verified: `flutter analyze` clean, `flutter test` 46/46 (webapp-admin), `vitest` 172/172 (worker). Live-verified end-to-end via Playwright (Master → Detail → Edit → back, full loop, no console errors).
- Files: see `frob-admin-Bacon/ARTIFACTS/_requirements/increment-1-p1-delta.md` for the requirements delta; `state.json` `increments[1]` for full gate ledger/dispatch/verification audit trail.

### Known pre-existing items NOT touched (out of scope, flagged not fixed)
- Nav-rail active-highlight doesn't light up for `/bookings/:id` or `/bookings/:id/edit` (shared `tree_nav.dart` does exact-string route matching — likely affects other multi-route screens too, e.g. A20).
- Memory note: FINDING-001/002 (P5 gate-escape / contract drift) remediated for customer/guide/editor apps 2026-07-22 — **admin app still owes a re-gate**. Not part of this session's work.

---

## 2. Local dev processes (running as of this handoff — verify still alive before reusing)

| Process | Port/target | Command used |
|---|---|---|
| Worker (Cloudflare Wrangler, local D1/KV) | `http://localhost:8787` | `cd SOURCE/worker && npm run dev` |
| webapp-admin (native macOS app) | N/A (desktop window) | `cd SOURCE/apps/webapp-admin && flutter run -d macos --dart-define=API_BASE_URL=http://localhost:8787` |

**Target platform note:** local admin dev/deployment target is **macOS native** (`flutter run -d macos`), not web — `flutter run -d web-server` debug mode doesn't paint without the Dart Debug Chrome extension (not installed here); `flutter build web` + static-serve works if a web build is ever needed instead, but macOS is the intended local target.

**Dev credentials** (local only, `.dev.vars`, gitignored): `owner@friendsonbikes.uk` / `admin1234`.

To stop: `kill $(lsof -ti:8787 -sTCP:LISTEN)` for the worker; quit the macOS app window normally or `kill` the `fob_webapp_admin` process.

---

## 3. Open item — CR-002 (not started)

**`frob-admin-Bacon/ARTIFACTS/changes/CR-002-html-email-templates-PROPOSAL.md`** — HTML email templates (UI_CHANGE + SCHEMA_CHANGE).

- Status: **PROPOSAL, decisions ratified, no build yet.**
- Sponsor-ratified decisions (2026-07-27): Block-editor authoring; emoji + one hosted logo (Assets uploader deferred to Phase 2); live preview pane + test-send.
- Next step (per the doc itself): raise the **executable CR-002** (impact/risk/rollback) and drive it through dispatch → build (Reena/Charlie) → gate (Sarah) — same P1–P5-style cycle used for increment 1, but via the Change Request Protocol (`ROME/agents/roma/skills/create-change-request/SKILL.md`) since increment 1 is already sealed... *(check whether CR work opens a new increment or uses the CR branch protocol — not yet determined this session)*.
- **Nothing has been built for this yet** — this is purely a resume pointer, not a status of in-progress work.

---

## 4. How to resume

1. Check `state.json` `activeIncrement` / `increments[].currentPhase` for authoritative lifecycle state (this file is a human-readable snapshot only).
2. For CR-002: read the PROPOSAL doc above in full, confirm with the sponsor whether to proceed to the executable CR, then follow `ROME/agents/roma/skills/create-change-request/SKILL.md`.
3. Local dev: re-check whether the worker/macOS app from §2 are still running before starting new ones (port 8787 for the worker; `lsof -ti:8787` to check).
