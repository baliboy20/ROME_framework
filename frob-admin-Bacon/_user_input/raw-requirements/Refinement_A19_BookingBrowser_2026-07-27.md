# Refinement request — A19 Booking browser

**Date:** 2026-07-27
**Sponsor:** William (Owner)
**Type:** UI change to an existing, delivered screen (increment 0, GATE-P5 APPROVE)

## Current state

A19 "Booking browser" (`frob-admin-Bacon/_user_input/raw-requirements/Handover_BackOffice_ClaudeDesign_Bacon_2026-07-21.md`,
section "A19 — Booking browser (search + detail)") is implemented as a single
screen with an inline two-pane layout: a search/results list on the left, a
booking detail panel on the right (see attached screenshot,
`fob_webapp_admin`, Booking browser, ref A19).

## Requested change

1. **Rename** the screen/menu item from "Booking browser" to **"Bookings"**
   (nav label currently reads "A19 Booking browser" in the BOOKINGS & PAYMENTS
   group).
2. **Split into two screens** using an explicit **Master/Detail** pattern,
   rather than one screen with two panes:
   - **Master** — the search + results list (reference, name, tour, status).
   - **Detail** — the full booking record (attendees, emergency contact,
     payment, waiver/consent, status history).

## Sponsor decisions (2026-07-27, resolved at P0.5 intake)

- **Navigation:** separate routes. Master is its own screen; selecting a row
  in Master navigates to a distinct Detail screen with a back action. This is
  a true two-screen split, not a relabeling of the existing wide-screen
  two-pane layout.
- **Read-only constraint — CORRECTED 2026-07-27 (post-P0.5, during P3):** the
  original P0.5 read of this was wrong. The "Edit" button is **not** a
  conformance defect — it is deliberate, already-shipped functionality
  (DR-B12, 2026-07-24, which explicitly *superseded* A19's original read-only
  intent): an edit dialog for departure date/attendees/contact-roles
  (**REQ-BOOK15**) and inline status-transition buttons (Confirm/Cancel/Mark
  abandoned — **REQ-BOOK16**), both currently bound to A19 per
  `ARTIFACTS/_design/requirements-coverage.md` and shipped in
  `SOURCE/apps/webapp-admin/lib/features/bookings/presentation/widgets/edit_booking_dialog.dart`.
  Sponsor was informed of this and, with full knowledge, **confirmed**: A19's
  new Detail screen must still become **read-only** — this is a genuine
  **retirement of REQ-BOOK15/REQ-BOOK16's binding to A19**, not a bug fix.
  The capability itself is **not** dropped: sponsor chose to **relocate** it to
  a **new, dedicated "Edit booking" screen (A23)**, reached via an explicit
  action from the Detail screen. REQ-BOOK15/REQ-BOOK16 remain valid
  requirements, unchanged in content (they are screen-agnostic — no A19
  reference in the REQ-BOOK15.yaml/REQ-BOOK16.yaml files themselves); only
  their **screen binding** moves from A19 to A23 in the P3 design artifacts.
- **Scope — REVISED:** no longer "presentation/navigation only." This is now:
  (a) rename + master/detail navigation split (as before, unchanged), and
  (b) relocating owner-assisted edit + status-transition capability off A19
  onto a new A23 "Edit booking" screen. No change to the underlying data
  fields shown on Detail, no change to REQ-BOOK15/REQ-BOOK16's own content
  (Conditions/Postconditions/Invariants/Errors), and no change to the
  PATCH/POST API endpoints they bind to — only which screen hosts them.

## Traceability

- Screens: A19 "Bookings" (Master + Detail, Bookings & Payments group),
  **new A23 "Edit booking"** (Bookings & Payments group, reached from A19
  Detail).
- Prior spec: Handover_BackOffice_ClaudeDesign_Bacon_2026-07-21.md, "A19 —
  Booking browser (search + detail)"; superseding design decision:
  `ARTIFACTS/_design/design-assets/user-flows.md` §4b item 7 (DR-B12,
  2026-07-24).
- **Binding:** A19 Master/Detail — **REQ-BO05** (search) / **REQ-BO06**
  (detail), unchanged, read-only. **A23 Edit booking** (new) —
  **REQ-BOOK15** (owner-assisted edit) / **REQ-BOOK16** (status transitions),
  relocated from A19; REQ content unchanged, only the screen mapping in
  `requirements-coverage.md` / `user-flows.md` / `design-system.md` /
  `FOB-UXIS-001_UXIS.md` moves.
- No change to REQ-BOOK11/12/13 (A18 Schedules, unrelated).
