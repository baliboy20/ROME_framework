# FOB UI/UX Prototype (T2 — clickable static HTML)

Reena, dispatch `reena-P3.5`, phase P3.5. **Throwaway validation artifact** — not the deliverable. No backend, no real data wiring, no production code. Entry point: `index.html`.

Self-contained: no external assets, no network calls, no CDN fonts. Websafe stacks approximate the two design-system type families:

- Track A (Forest, customer webapp/editor): display ~ Syne → `Futura/Century Gothic/system-ui`; body ~ DM Sans → `Segoe UI/system-ui`.
- Track B (Parchment, web-admin + guide app): titles/money ~ Playfair Display → `Georgia/Times New Roman`; functional ~ Plus Jakarta Sans → `Segoe UI/system-ui`; ids/labels ~ mono → `ui-monospace/SF Mono/Menlo`.

Shared files: `shared.css` (reset), `forest.css` (Track A tokens/components), `parchment.css` (Track B tokens/components — admin-shell, overlays, tabs, guide-frame layouts, guard/note/inline-confirm styles, the 11 design-handoff extension components). `admin-shell.js` renders the console shell (rail + top bar) and drives every UXC-* helper (chip/tab single-select, overlay open/close, rail collapse, tree carets). `guide-shell.js` renders the guide-app header and drives step-progress transients (`localStorage`, prototype-only, not a real entity state).

## High-fidelity design-handoff adoption (latest revision)

Sponsor delivered a high-fidelity handoff at `frob-admin-Bacon/_user_input/design-handoff/` (`README.md` = authoritative tokens/structure, `components/` = 11 extension components as `.dc.html` + `components/README.md`, `screenshots/` = visual truth, `FOB-UXIS.md` + `FOB-Guide-App-UXIS.md` = updated authoritative behavioural specs superseding `FOB-UXIS-001`). This revision:

1. **Adopts the final Parchment tokens verbatim** in `parchment.css` — the exact handoff variable names (`--surface-bg`, `--surface-bg-lo`, `--surface-card`, `--surface-raised`, `--surface-rail`, `--text-strong`, `--text-body`, `--text-muted`, `--text-faint`, `--text-label`, `--text-price`/`--text-link`, `--text-link-hover`, the four `--accent-*` hues + `--gradient-brand` + `--pill-ink`, the four `accent-text-light` variants) are now the canonical `:root` declarations, with alpha-ladder fills (`--wb03…--wb16`, `--tx32…--tx75`) replacing hard greys for hairlines. Earlier-revision names (`--paper-hi`, `--panel`, `--body-bg`, `--body-lo`, `--ink`) are kept as in-stylesheet aliases pointing at the new canonical vars so no markup broke — the values were already numerically identical (this prototype used the same hex set from the start), so this pass corrects **naming**, not colour. Page-title size corrected to the handoff's 27px/600 serif (was an approximated 2.1rem).
2. **Reproduces all 11 extension components** as plain HTML/CSS (never shipping the `.dc.html` runtime) — see the component table below for exactly which screen renders each one.
3. **Reconciles UXD behaviours already wired** against the updated `FOB-UXIS.md`/`FOB-Guide-App-UXIS.md` — no behavioural regressions found; the earlier `FOB-UXIS-001` UXD-01…19 records carry forward unchanged in the updated specs, so all previously-wired guards/modals/gates stay as built.
4. **Motion**: kept communicative-only (progress-bar fill, step-row highlight, view-toggle swap) with the existing global `prefers-reduced-motion: reduce` → instant-transition rule in `parchment.css`.

### 11 extension components — reproduced

| Component | Where | CSS |
|---|---|---|
| `StatCard` | `admin-fleet-readiness.html` (A14) — 4-up metric tile row | `.stat-grid`/`.stat-card` |
| `ReadinessBadge` | `admin-calendar.html` (A17) — replaces the earlier dot+stacked-text with real ✓/~/✗ tone pills (`ok`/`partial`/`miss`) | `.readiness-badge` |
| `TreeNav` | `admin-shell.js` console rail (all A-pages) — 6-group collapsible tree + 68px icon rail | `.admin-rail`/`.nav-tree`/`.nav-group` |
| `TransferList` | `admin-bike-allocation.html` (A20) — Available/Assigned move lists + coverage counter | `.two-panel`/`.avail-list`/`.assigned-list`/`.transfer-list-wrap` |
| `CalendarMonth` | `admin-calendar.html` (A17) — real August 2026 7-col month grid with tone-coded day chips (replaces the earlier ad-hoc grid) | `.calendar-month`/`.cal-grid`/`.cal-chip` |
| `StepRow` | `guide-playbook.html` (G2) — now renders true `done`/`current`/`todo` states (current = pink-bordered highlighted card + solid START pill; todo = grey "TO DO" pill), matching the handoff screenshot exactly | `.step-row`/`.step-row.current`/`.step-num.todo` |
| `ProgressBar` | `guide-playbook.html` (G2) hero card — n/6 fill | `.hero-card .progress-track/.progress-fill` |
| `ChecklistRow` | `guide-checklist.html` (G3) — tap-to-tick rows with critical-item chip (replaces earlier plain checkboxes) | `.checklist-row` |
| `SignatureField` | `guide-bike-inspection.html` (G4), `guide-checkin.html` (G6), `guide-complete.html` (G8) — tap-to-sign pad styling layered onto the existing signature panels | `.signature-field` |
| `CategoryChips` | `guide-midtour.html` (G9) — single-select event category row | `.category-chips` |
| `StarRating` | `guide-postride.html` (G11) — 3 independent 1–5 star inputs (pace/route/overall) | `.star-rating` |

## UXIS upgrade (2026-07-22)

This revision **implements `FOB-UXIS-001_UXIS.md`** for the admin console (A1–A20) and guide app (G1–G13). The customer (Forest) flow is unchanged — the UXIS does not cover it. Every surface in UXIS §B's navigation map is now a real, reachable page (no dead links); every UXD-* fine-grained record is wired with real (if minimal) inline JS; every screen without its own UXD record is governed by the §A universal conventions (UXC-*) and rendered as a titled shell page with representative content and, where relevant, an explicit empty state.

### Admin console shell (UXD-18)

One shell (`admin-shell.js` → `renderAdminShell(activeId, eyebrow, title, desc)`) is injected into every A-page via `#rail-mount`/`#topbar-mount`, matching `admin-system/scraps/01-shell.png`/`01-tree.png`/`01-collapse.png` and `Admin System.dc.html`'s `groupsDef`:

- Rail: "Friends on Bikes" (Playfair) + "BACK OFFICE" eyebrow, working **«/» collapse** to a 68px icon rail (labels hidden, `title=` attribute keeps the label available on hover/keyboard per UXC-A11Y-1), 6 groups with working **▾/▸** carets (Bookings & payments · Scheduling · Alerts & records · Content · Safety · Fleet & equipment), footer "William · Owner".
- Top bar: "PC / iMac · wide-screen console" + "William · Owner" + "Sign out" (idempotent — always lands on `admin-signin.html`, UXC-NAV-2).
- Rail collapse, per-group expand state and active-screen are client-only transients (UXC-STA-2) — never written back as entity state.
- **UXC-NAV-3**: the shell persists; only the content region swaps per page (T2 constraint: implemented as one shell-JS module reused across static pages, not a true SPA, but no page re-renders its own nav markup).

### Guide app header (`guide-shell.js`)

Renders the back-chevron + mono eyebrow + Playfair title + identity chip pattern from `Guide App.dc.html`/`g4done.png`/`g4check.png` on every G-page. Step completion (`markStepDone`/`isStepDone`) is `localStorage`-backed so G2's progress bar and DONE/START pills reflect real navigation through the prototype — a prototype convenience, explicitly not a data-model state.

## Surface → UXD coverage ledger

**Fully wired (real inline JS behaviour)**

| UXD | Surface(s) | File | Behaviour implemented |
|---|---|---|---|
| UXD-01 | A8 | `admin-payments.html` | Blocking refund modal, live "cumulative after this", "Refund £X" label, Cancel/Confirm only (no scrim/Escape dismiss), row status → refunded on confirm. |
| UXD-03 | A18 | `admin-scheduler.html` | Date/time edit → blocking "will notify 6 customers" confirm before save; Back cancels with no change. |
| UXD-04 | A18 | `admin-scheduler.html` | "Cancel departure" → blocking "refund/rebook/credit to 6 customers" confirm, destructive styling. |
| UXD-05 | A18 | `admin-scheduler.html` | Capacity >10 and below-booked (6) both block Save inline, with the message adjacent to the field. |
| UXD-06 | A18, A17 | `admin-scheduler.html`, `admin-calendar.html` | Empty guide field → non-blocking "not ready to run" note; feeds A17's readiness dot as GUIDE ✗. |
| UXD-07 | A17 | `admin-calendar.html` | Composite readiness (guide ✓/✗ + bikes ✓/~/✗) → single lime/orange/cyan dot, always paired with a text label. |
| UXD-08 | A17 | `admin-calendar.html` | List/Calendar toggle (client transient); departure overlay (free-dismiss) → participant overlay (stacks one level, closes back to departure, not to A17). |
| UXD-09 | A20 | `admin-bike-allocation.html` | Available/Assigned move lists, live "N of M riders covered", non-blocking under-provisioned warning, oos/busy bikes disabled with a reason, empty-available state. |
| UXD-10 | A12 | `admin-add-bike.html` | Duplicate id blocks Add + suggests next sequential inline; success shows inline confirmation. |
| UXD-11 | A15 | `admin-flagged-bike.html` | "Clear to service" disabled until ≥1 maintenance event is logged; logging enables it. |
| UXD-12 | A9 | `admin-enquiries.html` | Open/Overdue/Spam tabs (single-active); overdue flagged with no auto-email note; spam tab raises no alert. |
| UXD-13 | G3–G8 | `guide-checklist.html`, `guide-bike-inspection.html`, `guide-risk.html`, `guide-checkin.html`, `guide-complete.html` | Typed-confirm (G3/G5) vs full-signature (G4/G6/G8) are visibly distinct gates — not interchangeable. |
| UXD-14 | G4 | `guide-bike-inspection.html` | Every point on every bike must be checked (no "same as this morning" shortcut exists anywhere in the UI). |
| UXD-15 | G5, G7 | `guide-risk.html`, `guide-briefing.html` | Unresolved high-risk item blocks sign-off; logging a mitigation downgrades it and the same text appears inline on G7 "Today's mitigations". |
| UXD-16 | G6 | `guide-checkin.html` | Per-rider check-in/refuse; refusal → pink needs-action banner, "flagged for William-processed refund, guide never handles money"; all riders must be decided before the guide signature enables Complete. |
| UXD-17 | G8 | `guide-complete.html` | Outstanding G3–G7 steps block sign-off with a stated count; signature enables "Sign off — tour ready to run"; post-signature state is terminal (UXC-NAV-2). |
| UXD-18 | shell (all A-surfaces) | `admin-shell.js` | 68px collapsed icon rail with hover/title tooltips, per-group tree expand/collapse, all as named client transients. |
| UXD-19 | G11 | `guide-postride.html` | "Save draft" persists to `localStorage` and returns home without committing (non-terminal, re-enterable); "Submit" is the terminal commit and clears the draft. |

**Declared but explicitly not demonstrable on static fixtures** (per the UXIS's own routed-open-questions list — not a gap introduced here)

| UXD | Note |
|---|---|
| UXD-02 | Within-48h refund deliberately shows no computed amount — this is a customer-side (W10) policy note, out of these mockups; not re-implemented here to avoid inventing an entitlement. |

**Governed entirely by §A conventions (no UXD record; silence = defaults apply, UXIS "silence rule")**

| Surface | File | UXC defaults demonstrated |
|---|---|---|
| A1 Sign in | `admin-signin.html` | Public gate, no session; A2 sign-out lands here idempotently (UXC-NAV-2). |
| A3 Deliverability | `admin-deliverability.html` | UXC-FBK-3 — unreachable channels recorded, not lost. |
| A4 Owner alerts | `admin-alerts.html` | Needs-action treatment + declared empty state (UXC-SCR-3). |
| A5 Audit log | `admin-audit.html` | Incomplete entries flagged, never hidden (UXC-ERR-3). |
| A6 Publish & quality | `admin-publish-quality.html` | Manual-only publish trigger. |
| A7 New booking | `admin-new-booking.html` | Single-active mode tabs (UXC-CMP-3), capacity ≤10 (UXC-FRM-5). |
| A10 Incidents | `admin-incidents.html` | Status progression stubbed per UXIS open question 2 (insurer format unconfirmed). |
| A11 Hazard log | `admin-hazard-log.html` | Dedupe-by-street noted. |
| A13 Equipment | `admin-equipment.html` | Line-by-line, no bulk, no photo. |
| A14 Fleet readiness | `admin-fleet-readiness.html` | Four-hue aggregate counts; `retired`/`awaiting_external_service` counted with no transition control (UXC-STA-3, known gap). |
| A16 Compliance | `admin-compliance.html` | Renewal-due → orange warning treatment. |
| A19 Booking browser | `admin-booking-browser.html` | Read-only; payment shown as provider reference only, never a card number (UXC-CMP-4). |
| G1 Device identity | *(implicit — no page; identity chip rendered on every G-page)* | Per UXIS §B, G1 has no distinct screen. |
| G9 Mid-tour event logger | `guide-midtour.html` | Simple append-only log. |
| G10 Emergency/incident logger | `guide-emergency.html` | Offline-tolerant note; not blocked by connectivity. |
| G12 Incident report | `guide-incident.html` | 2h window note; submit disabled without a narrative (UXC-FRM-3). |
| G13 Hazard observation | `guide-hazard.html` | Feeds A11's dedupe-by-street. |

Every one of the 18 A-surfaces in `ADMIN_PAGES` (`admin-shell.js`) plus the A1 gate, and all 12 built G-surfaces (G2–G13; G1 implicit), are reachable — verified by a static link-integrity pass (no `href` to a non-existent file anywhere in `_prototype/`).

## Customer flow (Track A Forest — unchanged, out of UXIS scope)

| Screen | File | Surface | Maps to |
|---|---|---|---|
| Tour catalogue | `customer-catalogue.html` | W11 | REQ-PRE01–03 |
| Tour detail | `customer-detail.html` | W12 | REQ-PRE04, REQ-PRE05 |
| Date/party selection | `customer-selection.html` | W5 | REQ-BOOK01, REQ-BOOK02 |
| Attendee details (validation-error state) | `customer-attendees.html` | W6 | REQ-BOOK03, REQ-BOOK04 |
| Review, waiver, consent | `customer-review.html` | W7 | REQ-BOOK05, REQ-BOOK06 |
| Payment (mock embedded checkout) | `customer-payment.html` | W8 | REQ-BOOK07 |
| Confirmation | `customer-confirmation.html` | W9 | REQ-BOOK08, REQ-BOOK09 |
| Tour hub (post-confirmation) | `customer-hub.html` | W10/W16 | REQ-BOOK10–14 |

## UX checklist self-check

- **Navigation complete**: every UXIS nav-map surface is a real page; `index.html` links all of them grouped exactly as the console tree groups them; guide G2 links every playbook/during-tour/after-tour surface (UXIS §B "entry points").
- **UXC-NAV conventions**: sign-out is idempotent (A1 always the landing target); G8 sign-off and G11 submit are terminal — re-visiting never re-triggers the commit; G11 "Save draft" is the deliberate non-terminal exception (UXD-19).
- **UXC-MOD conventions**: A8 refund, A18 notify-fan-out and A18 cancel-remediation are all blocking (Cancel/Confirm only, no scrim/Escape handler attached); A17's departure/participant overlays are free-dismiss and stack exactly one level, closing back not out.
- **UXC-CMP-3 (single-active filter/tab groups)**: implemented via `setActiveChip`/`setActiveTab` in `admin-shell.js`, used on A8's status chips, A17's range chips + List/Calendar tabs, A9's Open/Overdue/Spam tabs, A7's enquiry/provisional tabs, A18's create/edit tabs.
- **UXC-FRM conventions**: capacity guards (A18, A7) never exceed 10 and state the blocking reason adjacent; marketing/consent checkboxes remain unticked by default in the (unchanged) customer flow; G3/G5 typed-confirm and G12 narrative fields disable their submit button until populated, with the reason shown.
- **State coverage**: empty (A17 "This week" example, A20 no-available-bikes, A4 empty alerts), validation/guard error (A18 capacity, customer attendee field), populated (all main lists), needs-action/flagged (G6 refusal, A9 overdue, G10 emergency), disabled-until-valid (customer review, G3/G4/G5/G6/G8/G12 gates), draft-vs-terminal (G11).
- **Money & status (UXC-CMP-4, UXC-A11Y-3)**: money is always pence-accurate in the serif face (`£90.00`, never `£90`); card numbers never render anywhere — A8/A19 show provider references only; every StatusPill/readiness dot carries a text label, never colour alone.
- **Responsive**: admin flow is fixed wide-desktop, non-responsive by design (UXC-RSP-1); guide flow is a fixed narrow phone-frame column, ≥44×44px touch targets on its controls (UXC-RSP-2/3); customer flow (unchanged) remains mobile-first.
- **Motion**: `prefers-reduced-motion: reduce` collapses all CSS transitions to near-instant globally (`parchment.css`), per UXC-MOT-2.
- **Accessibility basics**: collapsed-rail nav items keep their label via `title=` (hover/AT-exposed, not pointer-only, UXC-A11Y-1); form errors/guards render inline and adjacent to the field; focus rings defined in both theme CSS files.
- **Design-system consistency**: Track A pages unchanged (forest palette, Syne/DM Sans stack); Track B pages use parchment neutrals, Playfair/Plus Jakarta/mono, the fixed four-hue status-accent system (pink=needs action/cost, lime=settled, cyan=info, orange=warning). `.fob-console` dark theme is not used anywhere, per DEV-1.
