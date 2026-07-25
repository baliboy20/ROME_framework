# Handoff: Friends on Bikes (FOB) — Back-office console + Guide app

## Overview
Friends on Bikes (FOB) is a group-ride booking & payments service. This package covers two
operator-facing surfaces:

- **Back-office console (A1–A20)** — a single-operator (William, "Owner") admin for bookings,
  payments/refunds, enquiries, scheduling, fleet & equipment, safety, and compliance. Target
  device: **PC / iMac fixed wide-screen** only (no responsive obligation).
- **Guide app (G1–G13)** — an issued mobile/tablet **iOS PWA** for the on-tour guide (Emma):
  a six-step pre-departure playbook plus during-/after-tour logging. Single-column,
  thumb-reachable.

Both are built on one design system (**FOB Booking Admin**, "Parchment" theme) plus an
11-component extension library.

## About the design files
The files in this bundle are **design references created in HTML** — prototypes showing the
intended look and behaviour, **not production code to copy directly**. They are authored as
"Design Components" (`.dc.html`), a streaming-render prototype format; do **not** ship that
runtime.

The task is to **recreate these designs in the target codebase's existing environment**
(React, Vue, SwiftUI, native, etc.) using its established patterns, component library, and
tokens. If no environment exists yet, choose the most appropriate framework and implement
there. The console is a web app; the guide app is an installable iOS PWA.

Pair this README with the two behavioural specs included (`FOB-UXIS.md`,
`FOB-Guide-App-UXIS.md`) — those are the authoritative contract for *behaviour* (triggers,
states, guards, feedback). This README covers *structure and appearance*.

## Fidelity
**High-fidelity.** Final colours, typography, spacing, and interactions are specified. Recreate
the UI faithfully using the target codebase's libraries and patterns, matching the tokens
below. Two deliberate placeholders: the guide-app "signature" is a tap-to-attest pad (real
signature-capture fidelity is an open question — see UXIS), and the iPhone bezel around the
guide app is a preview frame, not part of the product.

---

## Design tokens

Colours, type, spacing come from the FOB design system. Recreate these as your codebase's
token layer. (Parchment/light theme values; a dark "Console" theme also exists — see note.)

### Colour — accent / status (fixed meanings, never decorative)
| Token | Hex | Meaning |
|---|---|---|
| `--accent-pink` | `#ff2d9b` | needs action / cost |
| `--accent-lime` | `#c6ff3f` | settled / money-back |
| `--accent-cyan` | `#22d3ee` | info / trust |
| `--accent-orange` | `#ff7a1a` | warning |
| `--gradient-brand` | `linear-gradient(135deg, #ff2d9b, #ff7a1a)` | primary CTAs, brand headers |
| `--pill-ink` | `#170a26` | text on a solid accent |

### Colour — accent text (readable hue on light surfaces)
`--pink-text-light #b83072` · `--cyan-text-light #0e7490` · `--lime-text-light #4e7a12` ·
`--orange-text-light #c2610a`

### Colour — parchment neutrals & semantic aliases
| Alias | Value |
|---|---|
| `--surface-bg` | `#f8f6ef` |
| `--surface-bg-lo` | `#eeebe1` |
| `--surface-card` | `#ffffff` |
| `--surface-raised` | `#fdfcf8` |
| `--surface-rail` | `#f7f4ec` |
| `--text-strong` | `#33322a` |
| `--text-body` | `#5b584c` |
| `--text-muted` | `#8a8778` |
| `--text-faint` | `#a5a294` |
| `--text-label` | `#9a9788` |
| `--text-price` / `--text-link` | `#b83072` |
| `--text-link-hover` | `#ff2d9b` |

Neutral "alpha ladders" are used instead of hard greys — hairlines/fills `--wb03 --wb05 --wb09
--wb12 --wb16` (white-on-parchment black alphas, ascending), text-ink steps `--tx32…--tx75`.
Reproduce as low-opacity ink/line fills.

### Typography
| Token | Family | Use |
|---|---|---|
| `--font-serif` | **Playfair Display** | titles **and money only** (`£90.00`, pence-accurate) |
| `--font-sans` | **Plus Jakarta Sans** | all functional text |
| `--font-mono` | monospace | ids, codes, micro-labels (uppercase, letter-spaced) |

Common sizes seen: page title 27px/600 serif; card/section titles 14–18px; body 13–14px/500;
mono micro-labels 9.5–11px/600 with `.08–.14em` letter-spacing, uppercase.

### Spacing & geometry
Spacing: `--space-inline 6` · `--space-row 10` · `--space-field 14` · `--space-card 20` ·
`--space-block 26` · `--space-gutter 48` (px).
Radius: `--radius-field 9` · `--radius-button 11` · `--radius-table 12` · `--radius-card 16` ·
`--radius-round 20` (status pills).
Elevation: hairline borders at rest; shadows reserved for lift (modals, popovers) only.
Press feedback is tint/brightness, **never scale**.

### Console (dark) theme
Adding `class="fob-console"` remaps the same aliases to a dark-plum palette (`--plum-bg
#120818`, etc.). We shipped the **Parchment** theme for both surfaces; the console theme is
available if a dark back-office is wanted later.

---

## Core components (design-system primitives)
Recreate these 7 first; everything composes from them.

- **Button** — gradient **primary** (single main action), outline **secondary**, **ghost**,
  **danger**, and small **row** size. Radius 11px. Press = brightness.
- **Card** — white surface, 1px hairline border, 16px radius, optional uppercase mono eyebrow.
- **DataTable** — CSS-grid rows (never inline flow), uppercase mono header, per-column
  `width` (fr units), `align`, optional `money`/`mono` rendering, `render(row)` custom cells,
  `onRowClick`, `getRowKey`.
- **Field** — labelled form field; display or `editable`; `money` variant uses Playfair;
  supports `hint`, `placeholder`.
- **FilterChip** — toolbar filter; active = solid hue. One active per group.
- **Modal** — centred dialog, blurred scrim. Destructive/money confirms dismiss by explicit
  choice only; informational overlays dismiss freely.
- **StatusPill** — six fixed states: `succeeded` `requires_payment` `refunded` `failed`
  `no_show` `draft`. Always a text label + hue, never colour alone.

## Extension components (11 — in `components/`)
Documented with props in `components/README.md`. Summary:

**Admin:** `StatCard` (metric tile + status dot) · `ReadinessBadge` (✓/~/✗ sub-state pill) ·
`TreeNav` (collapsible grouped tree nav + 68px icon-rail mode) · `TransferList` (assign/
unassign + coverage counter, disabled rows with reasons) · `CalendarMonth` (month grid,
tone-coded day events).

**Guide:** `StepRow` (playbook step) · `ProgressBar` (n/max) · `ChecklistRow` (tap-to-tick) ·
`SignatureField` (tap-to-sign pad; prop is `signatory`, not `name`) · `CategoryChips`
(single-select) · `StarRating` (1–5).

---

## Screens / views — Back-office console (A1–A20)

The console is **one persistent shell**: a left sidebar tree-nav (collapsible to a 68px icon
rail) + a top bar (context label left, operator + Sign out right) + a swapping content region
(max-width ~1160px). Sign-in gate (A1/A2) precedes the shell; Sign out returns to it.

- **A1/A2 — Sign-in gate.** Centred 400px card on a radial parchment wash: wordmark, email +
  password Fields, full-width primary Button. Sign-out shows an idempotent "signed out" notice.
- **A7 — Booking creation.** Mode chips (from enquiry / provisional). Two-column: enquiry
  context card + booking-details form (tour, departure, party ≤10, agreed price in Playfair).
  Enquiry mode sends a payment link; provisional mode adds hold/deposit/cadence (no defaults).
- **A8 — Payments & refunds.** FilterChip row (All/Requires payment/Succeeded/Refunded/Failed/
  No-show) + count; DataTable (booking stacked with ref, customer, paid £, refunded £, StatusPill,
  Refund/View action). Row → **refund modal** with live *cumulative* refunded total.
- **A9 — Enquiries.** Tabs Open/Overdue/Spam. Overdue stays flagged; no auto-email to prospect;
  spam raises no alert.
- **A17 — Departure calendar.** List/Calendar toggle. List: range chips + DataTable with a
  **readiness** cell (dot + guide ✓/✗ + bikes ✓/~/✗) and Edit/Bikes actions. Calendar: August
  month grid, departures as tone-coded day chips. Clicking a departure → read-only detail
  overlay (bookings → participants); participant → second overlay (age band, requirements,
  emergency contact, consent).
- **A18 — Scheduler.** Create/Edit modes. Capacity capped at 10 with guards ("at most 10", "can't
  go below N booked"); empty guide → non-blocking "not ready to run". Editing a booked departure
  → "notify N customers" confirm; Cancel → refund/rebook/credit remediation confirm.
- **A19 — Booking browser.** Read-only list-detail: search + results DataTable, full record
  (attendees, one emergency contact, payment as amount+status+provider ref — **no card number**,
  waiver/T&C/consent timestamps, status history).
- **A20 — Bike allocation.** TransferList (Available/Assigned) + "N of M riders covered" counter;
  under-provision allowed but flagged; out-of-service / overlapping bikes disabled with reasons.
- **A4 Owner alerts** (ack-able list, unreachable-channel fallback) · **A3 Deliverability**
  (bounce/complaint table) · **A5 Audit log** (read-only; incomplete entries shown flagged).
- **A6 Publish & quality** (manual publish list + content-quality flags) · **A10 Incidents**
  (review + insurer dispatch stub — format TBC) · **A11 Hazard log** (approve; deduped by street).
- **A14 Fleet readiness** (StatCards + active alerts) · **A12 Add bike** (duplicate-id guard +
  next-id suggestion) · **A13 Equipment** (line items; helmet impact retires) · **A15 Flagged-bike**
  (clear-to-service gated behind ≥1 logged maintenance event) · **A16 Compliance** (renewals table).

## Screens / views — Guide app (G1–G13)

Single-column iOS PWA. App bar shows the screen eyebrow + title, a back chevron (non-home), and
the device-identity chip (`DEV-EMMA-01 · Emma · guide`). No sign-in — device identity is implicit.

- **G2 — Tour-day home.** Gradient tour header (Hidden City, date, code, duration) with a live
  n/6 ProgressBar; then the **pre-departure playbook** (6 StepRows), a **During the tour** group
  (G9 log event, G10 report emergency), and an **After the tour** group (G11/G12/G13).
- **G3 — Travel kit** (ChecklistRows + typed-confirm sign-off).
- **G4 — Bike inspection** (per-bike check points + full SignatureField; no same-day shortcut).
- **G5 — Risk assessment** (risk cards low/med/high; an unresolved **high** blocks sign-off until
  a mitigation is logged; typed confirm). Mitigations flow into G7.
- **G6 — Rider check-in** (per-rider check/refuse; refusals flagged for William — guide never
  handles money; guide signature completes).
- **G7 — Safety briefing** (numbered script + "Today's mitigations" pulled from G5; acknowledge).
- **G8 — Pre-departure sign-off** (checklist of G3–G7; any outstanding blocks; signature to
  "sign off — ready to run"). Completing a step returns home and advances the next step.
- **G9 Event logger** (category chips + note) · **G10 Emergency** (nature/location/account →
  alerts William; danger styling) · **G11 Post-ride review** (StarRating ×3 + notes; draft-save;
  due 24h) · **G12 Incident report** (formal narrative, min length) · **G13 Hazard** (street +
  type + notes → A11 hazard log). Each logging screen has a terminal "submitted" confirmation.

---

## Interactions & behaviour
The **UXIS specs are authoritative** here — read them. Highlights:
- **Money-moving / customer-impacting confirms are blocking** (A8 refund, A18 notify & cancel);
  informational overlays (A17 detail/participant) dismiss freely.
- **Submit is disabled only for unmet blocking conditions**, with the reason stated adjacent
  (A12 duplicate, A18 capacity, G3/G5 typed name, G8 outstanding, G12 narrative min).
- **Derived, not stored:** A17 readiness, G2 progress, TransferList coverage — compute from data.
- **Client-only transients:** nav collapse, tree expand, calendar view, active screen — never
  entity state.
- **Motion** is communicative only (progress fill, sidebar width, view swap), token durations,
  and must honour `prefers-reduced-motion` (instant).

## State management
Console: `session` (operator), `activeScreen`, per-group nav open, nav collapsed, `payFilter`,
`enqTab`, A18 form + mode, A20 assignment set, A17 view/range + open overlay. Guide: `screen`,
per-step status (`todo`/`current`/`done`), checklist/signature/risk-resolution/rider maps, and
per-form `form`→`submitted` flags. All the interactivity shown runs on local component state;
wire to real services per the module specs.

## Assets
No raster/image assets — all UI is CSS + text + the two fonts (Playfair Display, Plus Jakarta
Sans; load from your font provider). Icons are text glyphs (chevrons, ✓/✗, ★). The iPhone frame
around the guide app is a preview device bezel, not a product asset.

## Files in this bundle
- `Admin System.dc.html` — the console (A1–A20).
- `Guide App.dc.html` — the guide app (G1–G13); uses `ios-frame.jsx` (preview bezel).
- `components/` — the 11 extension components, `Gallery.dc.html`, and `README.md`.
- `FOB-UXIS.md` — whole-system behavioural spec (A + G).
- `FOB-Guide-App-UXIS.md` — guide-app behavioural spec.
- `screenshots/` — rendered reference images of the key screens.
- `support.js` — the `.dc.html` prototype runtime (reference only; do not ship).

> The FOB design-system source (tokens, the 7 core components) is not copied here — the token
> values above are sufficient to recreate it. If you have access to the FOB Booking Admin design
> system package, prefer building against that directly.
