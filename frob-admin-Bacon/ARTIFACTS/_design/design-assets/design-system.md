# FOB (Friends on Bikes) — Design System

| | |
|---|---|
| **Document** | P3 Design System (Clara, dispatch clara-P3) |
| **Status** | APPROVED baseline — **TWO brand tracks**, conforms to **TDR-15** with sponsor-directed deviation **DEV-1** (AIB-P3 redirect), extended to cover **both internal apps** (web-admin AND guide app), **Track B tokens now sourced from the sponsor's FINAL high-fidelity handoff** (supersedes the earlier mockup-approximated values) |
| **Sources** | `core-design-system.md` (F-10, DR-11, DR-12), `Handover_AllModules_ClaudeDesign_Aristotle_2026-07-21.md` §1, `Handover_BackOffice_ClaudeDesign_Bacon_2026-07-21.md`, `Surface_Journey_Coverage.md`; **Track B token/component SOURCE OF TRUTH: `_user_input/design-handoff/README.md` (final tokens, screen inventory), `_user_input/design-handoff/components/README.md` (11-component library), `_user_input/design-handoff/FOB-UXIS.md` + `FOB-Guide-App-UXIS.md` (authoritative behavioural specs), `_user_input/design-handoff/screenshots/`**; earlier Track B layout corroboration from `_user_input/design-mockups/admin-system/` and `guide-system/` (`_ds` bundle + `scraps/` screens incl. `g4check.png`/`g4done.png`) remains valid as supplementary layout reference. |
| **Binding TDRs** | **TDR-15** (design system = forest-palette tokens + Syne/DM Sans, self-hosted variable woff2; every customer surface renders from it; Flutter component library is to-build) — **still governs Track A in full; DEV-1 is a sponsor-directed, scoped deviation now covering web-admin AND mobile-guide, recorded here, not a repeal of TDR-15** · **TDR-13** (stack split: `webapp-customer` static HTML/CSS/JS + Flutter Web islands; `webapp-admin`/`webapp-editor` full Flutter Web SPA; `mobile-guide` Flutter iOS-native + Web PWA fallback) |

## DEV-1 — sponsor-directed deviation from TDR-15 (AIB-P3 redirect; extended)

**Directive (as extended)**: **both internal apps** — web-admin (A-prefixed back-office surfaces, A1–A20) **and mobile-guide** (G-prefixed guide-app surfaces, G1–G13) — use the **sponsor-supplied mockup design system**, in its **Parchment (warm light)** theme, instead of the forest/Syne system otherwise mandated by TDR-15. Both mockups (`admin-system/`, `guide-system/`) ship the identical `_ds` token bundle. The mockup's dark-plum `.fob-console` theme is **explicitly OFF everywhere** — Parchment only, for both internal apps. Only the **customer webapp** (`webapp-customer`) and **editor** (`webapp-editor`) — the two customer/content-facing surfaces — **keep the original TDR-15 forest palette + Syne/DM Sans unchanged.**

**Two brand tracks in this document:**

| Track | Apps | Palette | Type | Section |
|---|---|---|---|---|
| **A — Forest** | `webapp-customer` (W1–W21, P1–P2), `webapp-editor` | Forest (`--forest #5a9962`, `--charcoal #243320`) | Syne (display) / DM Sans (body) | §1–§7 below |
| **B — Internal Apps Parchment** | `webapp-admin` (A1–A20) **and** `mobile-guide` (G1–G13) | Parchment neutrals + pink/lime/cyan/orange status accents | Playfair Display (titles & money) / Plus Jakarta Sans (functional) / mono (ids/labels) | §8 below |

`webapp-admin` is a **Flutter Web SPA** and `mobile-guide` is a **Flutter iOS-native + Web PWA** app (TDR-13; guide-app PWA emphasis reconfirmed by Roma as DEV-2/DEV-3) — neither runs the mockup's React runtime. The mockups' compiled React component bundles (`window.FOBDesignSystem.*`) are **layout/token reference only**, to be rebuilt as Flutter widgets consuming a ported Flutter `ThemeData`/token set shared by both internal apps (§8.6). Do not attempt to embed or reuse the React bundle or the guide mockup's `ios-frame.jsx` as code — it is a device-frame layout reference.

**Guide app remains offline-first and safety-gated (TDR-16, DR-O1) — this deviation is visual/token-only.** The sequential sign-off flow, full-signature vs. typed-confirm distinction, sembast offline persistence, and no-photo-capture scope cuts are unchanged; only the theme (Parchment + Playfair/Plus Jakarta/mono in place of Forest + Syne/DM Sans) changes.

## 0. Governing decisions (do not deviate)

- **DR-11**: one set of shared brand **tokens**, not shared components. Each app (`webapp-customer`, `webapp-admin`, `mobile-guide`, `webapp-editor`) implements its own component layer on top of the same tokens. **DEV-1 note (extended)**: `webapp-admin` and `mobile-guide` now consume a *different* token set (Track B) than `webapp-customer`/`webapp-editor` (Track A) — DR-11's "own component layer per app" principle still holds; the token source now forks along a customer-vs-internal boundary, per sponsor directive, rather than a single admin-only carve-out.
- **DR-12**: the Flutter component library is **to-build** (this document is its spec) — it does not exist yet in code. This now applies to **two** Flutter widget libraries: Track A (forest, shared by customer islands/editor) and Track B (parchment, shared by web-admin and guide app).
- **TDR-13**: rendering split per surface —
  - `webapp-customer` (W1–W21, P1–P2): vanilla static HTML/CSS/JS pages, per-locale dirs (`en/fr/es`), **plus Flutter Web island widgets** embedded into the static pages for anything stateful/transactional (booking, payment, consent forms, attendee forms, feedback). Simple content pages stay plain static HTML. Track A tokens.
  - `webapp-admin` (A1–A20): **full Flutter Web SPA**, PC/iMac only, fixed wide-screen, not responsive. **Track B (Parchment) tokens per DEV-1.**
  - `webapp-editor`: full Flutter Web SPA. **Track A (Forest) tokens, unaffected by DEV-1.**
  - `mobile-guide` (G1–G13): **Flutter iOS-native** (primary) + Flutter Web PWA (fallback), extension of the existing GMT app shell, offline-critical mid-tour. **Track B (Parchment) tokens per DEV-1 (extended) — visual theme only, offline/native behaviour unchanged.**
- Canonical fixtures for any spec/mock: Tom (customer, `BK-1001`), Marie (prospect, `ENQ-2001`), Sarah (prospect, `SAVE-2001`), William (Owner — always "William" in copy, never "Owner"/"admin"), Emma (guide, `DEV-EMMA-01`), Hidden City tour (`TOUR-HID`, £45, 90 min), Departure `DEP-HID-2026-08-01-1000` (cap 10), Bike `FOB-001`, Helmet `HEL-014`, Feedback `FB-1001` (5★). Same fixtures reused across both tracks (Riverside Loop `TOUR-RVL` also appears in the admin mockup screens as a second tour example).

---

# Track A — Forest brand (customer webapp, editor)

## 1. Colour tokens (forest palette)

### 1.1 Brand primitives

| Token | Hex | Usage |
|---|---|---|
| `--forest` | `#5a9962` | Primary brand colour — primary buttons, active nav, links, focus accents, badges (positive) |
| `--charcoal` | `#243320` | Primary text colour, dark-mode surface base, headings on light backgrounds |

### 1.2 Extended scale — **Clara-derived, PENDING sponsor ratification** (the two brand primitives `--forest #5a9962` / `--charcoal #243320` and Syne/DM Sans are sponsor-ratified per F-10/TDR-15; everything below is Clara's derivation to make those two primitives usable as a full UI palette — needed for states/elevation, not itself sponsor-specified. Unaffected by the Track B handoff, which only supplies FINAL tokens for the internal apps. Build alongside `--forest`/`--charcoal`, canonicalise in `styles.css` per D-DS-1, and flag for sponsor sign-off the same way Track B's motion tokens are flagged in §8.8.)

| Token | Hex (approx.) | Usage |
|---|---|---|
| `--forest-50` | `#f0f7f1` | Subtle backgrounds (selected row, info panel) |
| `--forest-100` | `#dbeadd` | Hover background on light surfaces |
| `--forest-300` | `#8fc498` | Disabled-state fill, secondary borders |
| `--forest-500` | `#5a9962` | = `--forest`, primary |
| `--forest-700` | `#3f7347` | Primary hover/pressed |
| `--forest-900` | `#243320` | = `--charcoal`, darkest text |
| `--sand` | `#f7f5ef` | Page background (light) |
| `--paper` | `#ffffff` | Card/surface background |
| `--ink-muted` | `#5a6b57` | Secondary text, captions, meta |
| `--border` | `#dde3da` | Hairline borders, dividers |

### 1.3 Semantic tokens

| Token | Hex | Usage | Example surfaces |
|---|---|---|---|
| `--success` | `#2f8f4e` | Confirmed booking, sign-off complete, in-service | W9, G8, A14 |
| `--warning` | `#c98a1c` | Weather watch, low capacity, flagged-not-critical | W16, A14, A17 |
| `--error` | `#c0392b` | Declined payment, blocked action, out-of-service | W8, A15, A20 |
| `--info` | `#2f6fa8` | Loading/in-flight, informational advisories | E5 weather, W5 capacity re-query |
| `--focus-ring` | `#5a9962` @ 40% opacity, 2px outline offset 2px | Keyboard focus indicator on all interactive elements (WCAG 2.4.7) |

### 1.4 Contrast (WCAG AA)

- Body text `--charcoal` (#243320) on `--sand`/`--paper`: contrast ratio ≈ 12.9:1 — passes AA and AAA.
- `--forest` (#5a9962) on white as button fill with white text: text must be white (`#ffffff`) — ratio ≈ 3.1:1 for large/bold text only; **use `--forest-700` (#3f7347)** as the button fill for body-sized button labels to clear 4.5:1 for normal text (ratio ≈ 4.6:1). `--forest` itself is reserved for large text (≥18px/24px bold), icons, and non-text UI (borders, focus rings, badges ≥3:1 requirement).
- Never place body text in `--forest-300` or lighter on white — falls below 3:1.
- Error/warning/success text on `--paper`: verify each at implementation time against the AA 4.5:1 (normal text) / 3:1 (large text, UI components) thresholds; the hexes above were chosen to clear this on white/`--sand` backgrounds.

## 2. Typography

**Display: Syne** (self-hosted variable woff2, `font-display: swap`) — headings, hero copy, nav wordmark, call-to-action button labels on marketing surfaces.
**Body: DM Sans** (self-hosted variable woff2, `font-display: swap`) — all body copy, form labels/inputs, table content, back-office UI, guide-app UI.

### 2.1 Scale (rem, 16px base)

| Token | Font | Size / Line-height | Weight | Usage |
|---|---|---|---|---|
| `--text-display-1` | Syne | 3.0rem / 1.1 | 700 | Marketing hero (W11 homepage) |
| `--text-h1` | Syne | 2.25rem / 1.2 | 700 | Page titles (W12 tour detail, A-screen headers) |
| `--text-h2` | Syne | 1.75rem / 1.25 | 600 | Section headers |
| `--text-h3` | Syne | 1.375rem / 1.3 | 600 | Card/panel titles, G-app step headers |
| `--text-h4` | Syne | 1.125rem / 1.35 | 600 | Sub-panel titles, table group headers |
| `--text-body-lg` | DM Sans | 1.125rem / 1.5 | 400 | Lead paragraphs, waiver text (W7) |
| `--text-body` | DM Sans | 1rem / 1.5 | 400 | Default body, form inputs, table cells |
| `--text-body-sm` | DM Sans | 0.875rem / 1.45 | 400 | Meta text, timestamps, helper text |
| `--text-caption` | DM Sans | 0.75rem / 1.4 | 500 | Badges, labels, overlines |
| `--text-button` | DM Sans | 1rem / 1 | 600 | Button labels (all apps) |

Minimum body text size on any surface: 16px (1rem).

## 3. Spacing

Base unit **4px**. Scale: `--space-1 4px · --space-2 8px · --space-3 12px · --space-4 16px · --space-6 24px · --space-8 32px · --space-12 48px · --space-16 64px`.

- Form field vertical rhythm: `--space-4` between fields, `--space-6` between form sections.
- Customer-webapp touch target: **min 44×44px** hard floor (mobile touch).
- Card padding: `--space-6` desktop, `--space-4` mobile.

> **Note (DEV-1, extended)**: guide-app (G1–G13) spacing/touch-target/outdoor-legibility requirements (44×44px hard floor, ≥16px minimum text, gloved-use tolerance) still apply as **usage constraints** on the guide app regardless of its now-Parchment visual theme — see §8.3/§8.7. They are no longer specified with Track A's forest tokens because the guide app no longer renders from Track A.

## 4. Radius & elevation

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Inputs, badges, small buttons |
| `--radius-md` | 8px | Cards, modals, panels |
| `--radius-lg` | 16px | Hero panels, bottom sheets (mobile) |
| `--radius-full` | 999px | Pills, avatar, status dots |

| Elevation | Shadow | Usage |
|---|---|---|
| `--elev-0` | none | Flat page background |
| `--elev-1` | `0 1px 2px rgba(36,51,32,.08)` | Cards at rest |
| `--elev-2` | `0 2px 8px rgba(36,51,32,.10)` | Hover cards, dropdowns |
| `--elev-3` | `0 8px 24px rgba(36,51,32,.14)` | Modals, popovers |
| `--elev-4` | `0 16px 40px rgba(36,51,32,.18)` | Toasts/alert overlays (A4 owner alert inbox) |

## 5. Component inventory (Track A — Forest)

Legend: **[Static]** = plain HTML/CSS (webapp-customer non-interactive pages) · **[Island]** = Flutter Web island embedded in a static page (webapp-customer interactive) · **[SPA]** = full Flutter Web SPA (webapp-editor). Per TDR-13, the *tokens* below are shared across Track A apps; each rendering target implements its own widget/CSS for the same look. **`webapp-admin` (A-screens) and `mobile-guide` (G-screens) are NOT part of Track A as of DEV-1 (extended) — see §8 for the shared Parchment component inventory.**

### 5.1 Buttons
- **Primary** — `--forest-700` fill, white `--text-button` label, `--radius-sm`, min 44×44px. States: default / hover (`--forest-900` fill) / pressed / disabled (`--forest-300` fill, `--ink-muted` text, no pointer) / loading (spinner replaces label, button stays same width) / focus (`--focus-ring`).
- **Secondary** — transparent fill, `--forest-700` 1.5px border + text. Same state set.
- **Destructive** — `--error` fill/border (cancel booking W10).
- **Text/link button** — no fill/border, `--forest-700` text, underline on hover.
- Used on: [Island] W5–W10 CTAs, W13, W14, W15, W19, W21 · [Static] W11/W12 "Book now"/"Enquire" links (styled as buttons, plain anchor under the hood).

### 5.2 Forms — inputs, selects, checkboxes, radios, date/slot pickers
- **Text input** — `--paper` fill, `--border` 1px, `--radius-sm`, `--space-3` padding. States: default / focus (`--focus-ring` + `--forest-700` border) / error (`--error` border + inline message below in `--text-body-sm`/`--error`) / disabled (`--forest-100` fill) / filled.
- **Checkbox** — 20×20px, `--radius-sm`. **Marketing/consent checkboxes must render unticked by default everywhere** (W4, W7, W14, W15, W3) — this is a hard invariant, not a style preference.
- **Radio group** — used for remediation choices (W19: refund/rebook/credit).
- **Date picker** (W5 tour selection, W13 availability) — [Island]. Calendar grid, 90-day horizon, sold-out dates greyed + non-interactive, selected date `--forest` fill. Live capacity label per date/slot ("10:00 — 4 spaces left"), re-queries on every field change (loading: skeleton shimmer on the slot list, not the whole page).
- **Slot/time picker** — pill list under the selected date, same greyed/disabled treatment for full slots.
- **Party-size stepper** — numeric stepper, hard cap at 10 (Global convention), blocks input above cap with inline error rather than allowing then rejecting.

> **Note (DEV-1, extended)**: signature-capture and typed-confirm form components (formerly specified here for G3–G6) now live in **§8.5 (Track B)**, rebuilt in Parchment tokens — see also the guide mockup's `g4check.png` full-signature declaration pattern.

### 5.3 Cards
- **Standard card** — `--paper`, `--elev-1`, `--radius-md`, `--space-6` padding. Tour catalogue tiles (W11).
- **Status card** — card + top-edge colour bar (success/warning/error) — tour hub status (W16: Confirmed/Change pending/Weather watch/Cancelled).
- **Summary card** — booking review (W7), confirmation (W9): label/value rows, `--border` divider between sections.

### 5.4 Navigation
- **[Static/Island] Customer webapp top nav** — logo (Syne wordmark), tour catalogue, saved tours, manage-booking entry point. Mobile: hamburger → drawer.
- **[SPA] Editor side nav** — fixed left rail, wide-screen only, content-authoring sections. Active item `--forest-50` background + `--forest-700` left border accent.

### 5.5 Tables
- **[SPA] Dense data table** (editor content lists) — `--text-body-sm`, rely on `--border` hairlines, sortable column headers, sticky header on scroll. Row min-height 44px. Flagged rows get a `--warning` left-edge bar, never hidden.
- Empty state: centered icon + message + primary action where applicable.

### 5.6 Badges / status pills
- `--radius-full`, `--text-caption`, colour-coded by semantic token: Confirmed (`--success`), Change pending / Weather watch (`--warning`), Cancelled (`--error`), In-service (`--success`), Flagged (`--warning`), Out-of-service/Retired (`--error`).

### 5.7 Modals / dialogs
- `--elev-3`, `--radius-md`, max-width 560px.

### 5.8 Alerts / toasts / inline banners
- **Inline banner** — full-width, semantic colour background at 10% tint + matching border, icon + message.
- **Toast** — `--elev-4`, top-right (SPA)/top (Native), auto-dismiss 5s except errors (manual dismiss).

### 5.9 Progress / loading
- **Skeleton shimmer** — content-shaped placeholder blocks, `--forest-50` base with shimmer sweep. Used wherever "loading" is documented in `Surface_Journey_Coverage.md` (W5 capacity re-query, W11 catalogue on slow connection).
- **Spinner** — inline in buttons during submit (W8 payment in progress — stays on-page, no redirect).

> **Note (DEV-1, extended)**: the A20 two-panel bike-allocation pattern, dense back-office data tables, status-pill sets, guide-app step nav/progress bar, and signature/typed-confirm components previously specified here for A-screens and G-screens now live in **§8 (Track B — Internal Apps Parchment)**, since `webapp-admin` and `mobile-guide` no longer render from Track A tokens.

## 6. Accessibility (WCAG 2.1 AA) — Track A

- **Contrast**: all body text combinations verified §1.4; never rely on colour alone for status (badges always carry a text label, not just colour — e.g. "Confirmed" text + green, not a bare green dot).
- **Focus**: every interactive element has a visible `--focus-ring` (2px, `--forest` @40%, 2px offset); focus order follows visual/DOM order; no `outline: none` without a replacement.
- **Touch targets**: minimum 44×44px on every customer-webapp interactive element (editor SPA may use denser desktop-pointer targets ≥32px given it's PC/iMac-only, but table row actions still resolve to ≥44px clickable hit area via padding).
- **ARIA**:
  - Form errors: `aria-invalid="true"` + `aria-describedby` pointing at the inline error message.
  - Live-updating regions (capacity counters W5): `aria-live="polite"`.
  - Modal dialogs: `role="dialog"`, `aria-modal="true"`, focus trapped, `Esc` closes, focus returns to trigger element.
  - Status badges: text content is the accessible name, not decorative-only colour.
- **Language**: static public-site pages (P1, P2, most of W11–W12) render with correct `lang` attribute per locale dir (en/fr/es).
- **Reduced motion**: shimmer/skeleton and toast animations respect `prefers-reduced-motion: reduce` (cross-fade or instant swap instead).
- **No-script baseline**: P1/P2 and simple static content pages must be fully readable/navigable with JS disabled — Flutter islands degrade to a "content unavailable without JavaScript, please..." notice rather than a blank void, on the *interactive* portions only.

## 7. Where components live (per TDR-13, informative — not a P5 implementation spec)

| App | Rendering | Screens | Component tech | Brand track |
|---|---|---|---|---|
| `webapp-customer` | Static HTML/CSS/JS + Flutter Web islands | W1–W3, W11, W12, W20, P1, P2 = static; W4–W10, W13–W15, W17–W19, W21 = islands | Static: plain CSS using the tokens in this doc. Islands: Flutter Web widgets (to-build, DR-12) consuming the same tokens via a shared theme. | **A — Forest** |
| `webapp-admin` | Full Flutter Web SPA | A1–A20 | Flutter widget library (to-build) ported from the sponsor-supplied Parchment mockup tokens; wide-screen fixed layout, no responsive breakpoints needed. | **B — Internal Apps Parchment (DEV-1)** |
| `webapp-editor` | Full Flutter Web SPA | (editor/content surfaces, unaffected by DEV-1) | Flutter widget library (to-build), wide-screen fixed layout. | **A — Forest** |
| `mobile-guide` | Flutter iOS-native + Web PWA fallback | G1–G13 | Flutter widget library (to-build) ported from the same sponsor-supplied Parchment mockup tokens as `webapp-admin`; offline-first (works with `flutter_map`/CyclOSM/FMTC/sembast per TDR-16), PWA emphasis per DEV-2/DEV-3. Visual theme only — offline/sign-off behaviour unchanged. | **B — Internal Apps Parchment (DEV-1, extended)** |
| Messages | Rendered HTML email / SMS / WhatsApp text | E1–E8 | Email-safe inline-CSS templates using the same colour/type tokens where the medium supports it (SMS/WhatsApp are plain text, brand carried via copy tone only). | **A — Forest** |

---

# Track B — Internal Apps Parchment (web-admin + mobile-guide, DEV-1 extended)

**SOURCE OF TRUTH (sponsor-final, supersedes the earlier mockup-derived approximation below in §8.1–8.3)**: `frob-admin-Bacon/_user_input/design-handoff/README.md` §"Design tokens" — the sponsor's high-fidelity handoff package. This is **final**, not derived: token names, hex values, and sizes below are copied verbatim from that README, not re-approximated. Companion files in the same handoff: `components/README.md` (11-component library, §8.5a), `FOB-UXIS.md` + `FOB-Guide-App-UXIS.md` (authoritative **behavioural** specs — see §8.4a), `screenshots/` (rendered reference images), `Admin System.dc.html` / `Guide App.dc.html` / `components/*.dc.html` (prototype-runtime design references — **do not ship the `.dc` runtime or `support.js`**; recreate faithfully in Flutter per TDR-13). Applies to **A1–A20 (web-admin) and G1–G13 (mobile-guide)**. `.fob-console` (dark plum) theme is **off in both apps** — Parchment is the only theme in scope; the console theme exists in the source and may be revisited later for a dark back-office, but is out of scope now.

*(Earlier sourcing, superseded)*: the prior revision of this section approximated tokens from `_user_input/design-mockups/admin-system/` and `guide-system/` (`_ds` bundle + screenshots `g4check.png`/`g4done.png`, `scraps/02-shell.png` etc.) — those mockups are consistent with the handoff and remain valid **layout** reference (§8.4), but the handoff README is now the token source of record.

## 8.1 Colour tokens (Parchment) — FINAL, per handoff README

### Parchment neutrals & semantic aliases (`:root` default — light theme)

| Token | Hex | Usage |
|---|---|---|
| `--surface-bg` | `#f8f6ef` | App/page background |
| `--surface-bg-lo` | `#eeebe1` | Lower app background band |
| `--surface-card` | `#ffffff` | Standard card background |
| `--surface-raised` | `#fdfcf8` | Modal, raised card, elevated surface |
| `--surface-rail` | `#f7f4ec` | Sidebar / left nav rail |
| `--text-strong` | `#33322a` | Primary text |
| `--text-body` | `#5b584c` | Secondary/body text |
| `--text-muted` | `#8a8778` | De-emphasised text |
| `--text-faint` | `#a5a294` | Placeholder / faint text |
| `--text-label` | `#9a9788` | Field labels, table head labels |
| `--text-price` / `--text-link` | `#b83072` | Money figures and links (shared value) |
| `--text-link-hover` | `#ff2d9b` | Link hover state (= `--accent-pink`) |

> Naming note: the handoff's canonical aliases are `--surface-*`/`--text-strong` (above). The prior mockup-derived draft used `--body`/`--panel`/`--paper-hi`/`--ink` as working names for the same values — **retire those in favour of the handoff names** for any P5 implementation; they are numerically identical (`--body`=`--surface-bg`, `--panel`=`--surface-rail`, `--paper-hi`=`--surface-raised`, `--ink`=`--text-strong`).

### Status accent system — "accent = status, never decorative" (fixed meanings)

| Token | Hex | Fixed meaning |
|---|---|---|
| `--accent-pink` | `#ff2d9b` | **Needs action / cost** — e.g. Refund button, "requires_payment" status |
| `--accent-lime` | `#c6ff3f` | **Settled / money-back** — e.g. "succeeded" payment, refund complete |
| `--accent-cyan` | `#22d3ee` | **Info / trust** — e.g. readiness dot, informational badges |
| `--accent-orange` | `#ff7a1a` | **Warning** — e.g. "no guide" flag, under-provisioned departure |
| `--gradient-brand` | `linear-gradient(135deg,#ff2d9b,#ff7a1a)` | Primary CTAs, brand headers |
| `--pill-ink` | `#170a26` | Text colour on a solid accent-hue pill |

### Accent text variants (readable hue on light surfaces)

| Token | Hex |
|---|---|
| `--pink-text-light` | `#b83072` |
| `--cyan-text-light` | `#0e7490` |
| `--lime-text-light` | `#4e7a12` |
| `--orange-text-light` | `#c2610a` |

**Rule (verbatim from handoff README, binding on P5)**: accent colour must carry meaning (a status or a cost), never mood or decoration. Reach for the `StatusPill` core component (§8.5) for the six fixed states (`succeeded`/`requires_payment`/`refunded`/`failed`/`no_show`/`draft`) rather than hand-colouring text — always a text label + hue, never colour alone.

### Alpha ladders (neutral, in place of hard greys) — FINAL, per handoff README

- **Hairlines/fills**: `--wb03 --wb05 --wb09 --wb12 --wb16` — ascending white/black-on-parchment alphas used for borders and subtle fills instead of invented greys.
- **Text-ink steps**: `--tx32…--tx75` — ink-alpha steps (e.g. `--tx32` through `--tx75`) used to derive muted/faint text tones from `--text-strong` rather than separate hex values.
- P5 note: reproduce both ladders as low-opacity fills/strokes over the base ink/white, not as separately chosen hex greys — this is a hard "no invented colours" rule from the handoff.

### Plum (console) theme — declared present in the source, explicitly NOT used

Adding `class="fob-console"` remaps the same semantic aliases to a dark-plum palette (`--plum-bg #120818`, etc.) — shipped in the source bundle but **not activated**; both surfaces ship Parchment only. **Per Roma/sponsor directive, `.fob-console` stays OFF for this build.** Do not port the plum tokens into the Flutter theme now; carry them as a documented-but-unused reference only, in case a future dark-mode admin theme is commissioned.

## 8.2 Typography (Parchment) — FINAL, per handoff README

**Titles & money: Playfair Display** (serif — money always pence-accurate, `£90.00` never `£90`). **Functional text/controls: Plus Jakarta Sans** (sans). **IDs/codes/micro-labels: monospace** (uppercase, letter-spaced).

| Token | Family | Use |
|---|---|---|
| `--font-serif` | Playfair Display | titles **and money only** |
| `--font-sans` | Plus Jakarta Sans | all functional text |
| `--font-mono` | monospace | ids, codes, micro-labels |

**Common sizes observed/specified in the handoff** (use as the working scale until a formal token-per-size list is ratified):

| Usage | Size / weight / family |
|---|---|
| Page title | 27px / 600 / serif |
| Card / section titles | 14–18px / serif or sans per context |
| Body text | 13–14px / 500 / sans |
| Mono micro-labels (ids, table heads, eyebrows) | 9.5–11px / 600 / mono, `.08–.14em` letter-spacing, uppercase |

> P5 note: the earlier mockup-derived draft proposed a more granular named scale (`--type-display 46px`, `--type-h2 30px`, `--type-surface 21px`, `--type-price 20px`, `--type-body 15px`, `--type-ui 12.5px`, `--type-button 13px`, `--type-label 9.5px`) — those are **Clara-derived approximations**, not sponsor-specified; the handoff README gives ranges/observed sizes (above), not a locked token-per-size list. Where the two conflict, the handoff's page-title (27px) and micro-label (9.5–11px) figures govern; the rest of the granular scale remains a reasonable working interpolation pending sponsor sign-off on exact intermediate sizes.

**Hard rules (verbatim from handoff)**: money is always Playfair Display and pence-accurate (`£90.00`, never `£90`). Minimum functional text size is **11px**, never smaller.

## 8.3 Spacing, radius, elevation (Parchment) — FINAL, per handoff README

| Token | Value | Usage |
|---|---|---|
| `--space-inline` | 6px | Inline gap |
| `--space-row` | 10px | Chip/button row gap |
| `--space-field` | 14px | Field gap |
| `--space-card` | 20px | Card padding |
| `--space-block` | 26px | Section block spacing |
| `--space-gutter` | 48px | Page gutter |

| Token | Value | Usage |
|---|---|---|
| `--radius-field` | 9px | Form fields |
| `--radius-button` | 11px | Buttons |
| `--radius-table` | 12px | Tables |
| `--radius-card` | 16px | Cards |
| `--radius-round` | 20px | Status pill capsule |

Elevation: **hairline borders at rest; shadows reserved for lift only** (modals, popovers) — never a resting shadow. Press feedback is **tint/brightness, never scale** (hard rule, verbatim from handoff).

| Token | Value | Usage |
|---|---|---|
| `--shadow-inline` | none | Resting surfaces use a 1px hairline border, not a shadow (elevation is reserved for overlays) |
| `--shadow-console` | `0 24px 70px rgba(0,0,0,.4)` | Floating panel (unused while console theme is off, kept for reference) |
| `--shadow-email` | `0 18px 50px rgba(0,0,0,.28)` | N/A to admin (email surfaces are Track A) |
| `--shadow-modal` | `0 40px 100px rgba(40,30,20,.35)` | Modal/dialog (e.g. A8 "Issue refund" modal) |
| `--overlay-scrim` | `rgba(46,44,36,.42)` | Light-theme modal scrim |
| `--overlay-blur` | `blur(4px)` | Modal backdrop blur |

## 8.4 Layout reference (grounded in the mockup screenshots + handoff screens)

Confirmed from `scraps/02-shell.png`, `scraps/02-a17ok.png`, `scraps/04-sched.png`, `scraps/05-cal.png` (nav tree, calendar, scheduler, shell, departure detail), corroborated by the handoff's own screen descriptions (`design-handoff/README.md` §"Screens / views") and `design-handoff/screenshots/` (`admin-01-payments.png`, `01-admin-cal.png`, `01-guide-home.png`, `components-gallery.png`, etc.):

- **App shell**: fixed left sidebar tree-nav (`--surface-rail` bg, collapsible to a **68px icon rail**), wordmark "Friends on Bikes" (Playfair) + "BACK OFFICE" mono eyebrow at top; grouped nav sections with mono uppercase section headers ("BOOKINGS & PAYMENTS", "SCHEDULING", "ALERTS & RECORDS", "CONTENT", "SAFETY") each listing surface-ID-prefixed items (e.g. "A7 New booking", "A17 Departure calendar"); active item gets a `--surface-bg-lo`-ish highlighted row. Bottom-of-rail: William's avatar (initial-in-circle, `--gradient-brand` or accent fill) + name + role ("William · Owner"). Top bar: context label left, operator identity + "Sign out" right. Content region swaps under the shell, max-width ~1160px.
- **A1/A2 Sign-in gate**: precedes the shell — centred 400px card on a radial parchment wash, wordmark, email+password Fields, full-width primary Button. Sign-out shows an idempotent "signed out" notice (matches handoff exactly).
- **Content header pattern**: mono eyebrow (surface ID + section, e.g. "A17 · SCHEDULING") above a Playfair page-title (~27px/600 per §8.2), above a Plus Jakarta descriptive subtitle.
- **A17 Departure calendar**: **List/Calendar toggle** (handoff adds a calendar-grid view alongside the list). List: range chips + DataTable with a readiness cell (dot + guide ✓/✗ + bikes ✓/~/✗, i.e. `ReadinessBadge`) and Edit/Bikes row actions. Calendar: month grid, departures as tone-coded day chips (`CalendarMonth`). Clicking a departure opens a read-only detail overlay (bookings → participants); a participant opens a second overlay (age band, requirements, emergency contact, consent).
- **A18 Departure scheduler**: create/edit modes, same shell, capacity guards ("at most 10", "can't go below N booked"); empty guide → non-blocking "not ready to run"; editing a booked departure → "notify N customers" confirm; cancel → refund/rebook/credit remediation confirm.
- **A8 Payment & refund management**: FilterChip row (All/Requires payment/Succeeded/Refunded/Failed/No-show) + count; DataTable (booking stacked with ref, customer, paid £, refunded £, StatusPill, Refund/View action) — money in Playfair pink-text. Row → refund modal with a live **cumulative** refunded total (money-moving confirm — blocking, dismiss by explicit choice only per UXIS).
- **A19 Bookings**: renamed from "Booking browser"; genuinely read-only **master/detail** (two routes, not two panes) matching A18's master/detail idiom. Master: search + results DataTable. Detail: full record (attendees, one emergency contact, payment as amount+status+provider-ref **never a card number**, waiver/T&C/consent timestamps, status history), reached from a Master row with a back action; no Edit dialog or status-transition controls here — see A23.
- **A23 Edit booking**: owner-assisted edit form (departure date, attendee list, contact roles) plus status-transition buttons (Confirm/Cancel/Mark abandoned), reached via an explicit action from A19 Detail; relocated off A19.
- **A20 Bike allocation**: `TransferList` (Available/Assigned) + "N of M riders covered" counter; under-provision allowed but flagged; out-of-service/overlapping bikes disabled **with a stated reason** (not just greyed out).
- **A4/A3/A5/A6/A9/A10/A11/A12/A13/A14/A15/A16**: owner alerts (ack-able list), deliverability (bounce/complaint table), audit log (read-only, incomplete entries flagged), publish & quality (manual list + content-quality flags), enquiries (Open/Overdue/Spam tabs — overdue stays flagged, no auto-email; spam raises no alert), incidents (review + insurer stub), hazard log (approve, deduped by street), fleet readiness (`StatCard`s + alerts), add bike (duplicate-id guard + next-id suggestion), equipment (line items, helmet impact retires), flagged-bike (clear-to-service gated behind ≥1 logged maintenance event), compliance (renewals table).

### Guide app (mobile-guide, G1–G13) — confirmed from `guide-system/scraps/g4check.png`, `g4done.png` and handoff `README.md` §"Screens / views — Guide app"

- **iOS status bar frame**: mockup screens are shown inside an iOS device frame (`ios-frame.jsx`, layout reference only — not portable code); real Flutter build uses native/PWA chrome instead, content region below is what's spec'd here.
- **Screen header pattern**: back chevron + mono eyebrow (surface ID + interaction mode, e.g. "G4 · FULL SIGNATURE") above a Playfair `--type-surface`/`--type-h2`-scale screen title ("Bike inspection"), a pill row showing device/guide identity ("DEV-EMMA-01" mono chip + "Emma · guide" label).
- **G2 Tour-day home / playbook overview** (`g4done.png`): mono eyebrow "SIX STEPS BEFORE YOU ROLL" above Playfair title "Tour-day playbook"; below the identity row, a full-width **gradient hero card** (`--gradient-brand`) showing the day's tour (Playfair tour name, mono meta line "1 Aug 2026, 10:00 · TOUR-HID · 90 min"), a thin progress bar, and a "1/6" step counter; below that, a numbered step list ("PRE-DEPARTURE PLAYBOOK") — each row: step number in a coloured circle (pink = not started, lime = done), Playfair-ish step title + mono "G3 · Typed confirm"/"G4 · Full signature" sub-label, right-aligned status pill ("START" outline pink / "DONE" solid lime).
- **G4 Bike inspection grid** (`g4check.png`): body copy in Plus Jakarta ("Every bike, every tour — no shortcut for a same-day repeat fleet. Check each point, then sign the declaration."); one white card per bike, mono bike ID heading ("FOB-001") + a row of small lime-filled check chips ("✓ Brakes", "✓ Tyres", "✓ Chain", "✓ Lights"); below the bike cards, a "SIGNATURE DECLARATION" mono eyebrow above a lime-tinted signature panel with the guide's typed/signed name rendered large in Playfair italic ("Emma Hart").
- **Typed-confirm surfaces** (G3 kit checklist, G5 risk log): same header pattern, lighter-weight text-match confirm field in place of the signature panel, consistent with §8.1's status-accent usage (unresolved/high-risk items get orange treatment).
- **Refusal / escalation states** (G6 rider check-in refusal, G10 emergency logger): pink (needs-action) banner treatment, consistent with the admin app's "needs action / cost" semantic.

## 8.4a Behaviour is governed elsewhere — UXIS specs are authoritative

**This design-system document governs appearance (tokens, type, spacing, component visual spec) for Track B. It does NOT govern behaviour.** The two handoff behavioural specs are the authoritative contract for triggers, states, guards, and feedback:

- **`frob-admin-Bacon/_user_input/design-handoff/FOB-UXIS.md`** — whole-system behavioural spec (admin console + guide app): interaction rules, blocking vs. dismiss-freely confirms, derived-vs-stored state, client-only transients.
- **`frob-admin-Bacon/_user_input/design-handoff/FOB-Guide-App-UXIS.md`** — guide-app-specific behavioural spec.

P5 robots implementing Track B screens **must read both UXIS documents directly** — this design-system document does not restate their content, only cross-references the highlights that affect visual state (e.g. §8.5a's Modal dismiss-freely-vs-blocking distinction, StatusPill's "always label + hue" rule). Where a screen's *appearance* is spec'd here and its *behaviour* is spec'd in UXIS, both must be satisfied — this document never overrides UXIS on a behavioural question, and UXIS never overrides this document on a purely visual one. Selected behavioural highlights (verbatim from the handoff README, for orientation only — not a substitute for reading the UXIS files):

- Money-moving / customer-impacting confirms are **blocking** (A8 refund, A18 notify & cancel); informational overlays (A17 detail/participant) **dismiss freely**.
- Submit is disabled only for unmet blocking conditions, with the reason stated adjacent (A12 duplicate, A18 capacity, G3/G5 typed name, G8 outstanding, G12 narrative min).
- Derived, not stored: A17 readiness, G2 progress, TransferList coverage — compute from data, don't persist as separate fields.
- Client-only transients (never entity state): nav collapse, tree expand, calendar view, active screen.

## 8.5 Component inventory (Track B — Internal Apps Parchment) [all Flutter — TDR-13; web-admin = SPA, guide app = iOS-native/PWA]

All components below are **Flutter widgets to-build**, theme-driven off the ported token set in §8.1–8.3. The `.dc.html` prototypes (`Admin System.dc.html`, `Guide App.dc.html`, `components/*.dc.html`) and their `support.js` runtime are **design references only — do not ship the `.dc` runtime**; recreate faithfully in Flutter per TDR-13.

### 8.5a Core components (7) — recreate first, everything else composes from these

Per `design-handoff/README.md` §"Core components": these are the design-system primitives, shipped as the compiled `_ds_bundle.js` core in the handoff — **rebuild as Flutter widgets, not reused code.**

| Component | Purpose | Key spec |
|---|---|---|
| **Button** | Primary action, secondary, tertiary | Variants: gradient **primary** (single main action), outline **secondary**, **ghost**, **danger**, small **row** size. `--radius-button` (11px). Press feedback = brightness shift, **never scale**. |
| **Card** | Surface container | White (`--surface-card`) surface, 1px hairline border, `--radius-card` (16px), optional uppercase mono eyebrow. |
| **DataTable** | Dense list standard | CSS-grid rows (never inline flow), uppercase mono header, per-column `width` (fr units), `align`, optional `money`/`mono` cell rendering, `render(row)` custom cells, `onRowClick`, `getRowKey`. Used: A8 payments, A17 calendar, A19 booking browser, A16 compliance. |
| **Field** | Labelled form field | `display` or `editable` mode; `money` variant renders in Playfair; supports `hint`, `placeholder`. |
| **FilterChip** | Toolbar filter | Active = solid hue fill; **one active per group**. |
| **Modal** | Overlay dialog | Centred, blurred scrim (`--overlay-blur`), `--shadow-modal`, `--radius-card`. **Destructive/money confirms dismiss by explicit choice only** (A8 refund, A18 notify & cancel); informational overlays (A17 detail/participant) dismiss freely — this distinction is UXIS-governed, see §8.4a. |
| **StatusPill** | Six fixed booking/payment states | `succeeded` `requires_payment` `refunded` `failed` `no_show` `draft`. Always a **text label + hue**, never colour alone. `--radius-round` (20px) capsule, `--pill-ink` text on solid accent fill. Reused for readiness dots (A17) and fleet status (A14/A15) mapped onto the same four-hue system. |

### 8.5b Extension components (11) — the P5 Flutter build targets

Per `design-handoff/components/README.md` — documented with full prop contracts there; summarised below. These extend the 7 core components and were extracted from patterns hand-built across the admin console and guide app. **Rebuild each as a Flutter widget consuming the Track-B token set — do not import the `.dc.html` source or `components/support.js`.**

**Admin console:**

| Component | Purpose | Key props |
|---|---|---|
| `StatCard` | Big-number metric tile with a status dot | `value`, `label`, `tone` (lime/orange/cyan/pink/neutral) |
| `ReadinessBadge` | ✓ / ~ / ✗ sub-state pill | `state` (ok/partial/miss), `label` |
| `TreeNav` | Collapsible grouped nav treeview + 68px icon-rail mode | `groups`, `active`, `collapsed`, `onSelect` |
| `TransferList` | Two-column assign/unassign with coverage counter | `items` (`{id,status,reason}`), `assigned`, `need`, `onChange` — disabled rows carry a stated `reason` (e.g. out-of-service, double-booked) |
| `CalendarMonth` | Month grid with tone-coded day events | `year`, `month` (0-indexed), `events` (`{day,label,sub,tone}`), `onSelect` |

**Guide app:**

| Component | Purpose | Key props |
|---|---|---|
| `StepRow` | Playbook step: number/tick, title, status chip | `num`, `title`, `sub`, `status` (todo/current/done), `onClick` |
| `ProgressBar` | n/max fill; `onDark` variant for gradient headers | `value`, `max`, `label`, `onDark` |
| `ChecklistRow` | Tap-to-tick row, optional sub + chip | `label`, `sub`, `chip`, `checked`, `onChange` |
| `SignatureField` | Tap-to-sign declaration pad (tap-to-attest, not true signature capture — a deliberate placeholder per handoff §Fidelity, real signature-capture fidelity is an open UXIS question) | `signatory` (not `name`), `label`, `placeholder`, `signed`, `onSign` |
| `CategoryChips` | Single-select chip row | `options` (string[]), `value`, `onChange` |
| `StarRating` | 1–5 star input | `value`, `count`, `onChange` |

**Statefulness note (from handoff)**: `TreeNav`, `TransferList`, `ChecklistRow`, `SignatureField`, `CategoryChips`, `StarRating` work uncontrolled out of the box in the source and become controlled when a value prop + change callback are passed — carry the same controlled/uncontrolled duality into the Flutter widget API where it maps cleanly (e.g. optional `ValueChanged<T>?` callback + optional initial value).

**Gallery reference**: `components/Gallery.dc.html` mounts every component with live sample data (also captured in `screenshots/components-gallery.png`) — useful for visual QA against the Flutter rebuild, not for code reuse.

## 8.6 Flutter theme porting notes (for P5 — Charlie/Ashok)

- Build **one shared** Track-B `ThemeData`/`ColorScheme` + `TextTheme` (Internal Apps Parchment) consumed by both `webapp-admin` and `mobile-guide`, separate from the Track A forest `ThemeData` used by `webapp-customer`/`webapp-editor`. **Do not merge Track A and Track B into one theme with a runtime switch** — DEV-1 scopes Parchment strictly to the two internal apps, and each app still builds its own widget layer on the shared token set per DR-11.
- `webapp-admin` is a wide-screen desktop SPA; `mobile-guide` is a narrow-viewport iOS-native/PWA app — the same colour/type/spacing *tokens* apply, but layout composition (fixed left rail vs. single-column step screens) differs per app, consistent with TDR-13's per-app component-layer principle.
- Port `--font-serif` (Playfair Display) and `--font-sans` (Plus Jakarta Sans) as self-hosted variable fonts (consistent with the `font-display: swap`-equivalent loading pattern already used for Track A, per TDR-15's asset-hosting convention) — do not rely on Google Fonts CDN at runtime, including in the guide app's offline-first build (fonts must be bundled, not fetched at runtime, given TDR-16's offline-critical requirement).
- Represent the alpha ladders (`--tx32…--tx75` text-ink steps, `--wb03…--wb16` hairline/fill steps — FINAL per handoff README §8.1) as Flutter `Color.withOpacity`/`Color.fromRGBO` helpers keyed off `--text-strong` (text ladder) and a neutral white/black base (hairline ladder) rather than hard-coded greys — this preserves the handoff's "no invented colours, type, or spacing" rule in Flutter.
- `StatusPill` and `FilterChip` should be built as shared Track-B widgets consumed by every A-screen and by the guide app's step/status indicators, not re-implemented per screen — the handoff explicitly calls out `StatusPill` as the canonical way to render fixed states rather than colouring text by hand; carry that discipline into Flutter for both apps.
- Guide-app-specific: signature capture and typed-confirm widgets must work fully offline (sembast-backed, per TDR-16) — the Parchment re-skin does not change this; it's a token/visual change only, layered on the same underlying offline widget behaviour. Note `SignatureField`'s tap-to-attest fidelity (not true signature capture) is itself an open question per the handoff's own §Fidelity — flag to Roma/sponsor if higher-fidelity capture is later required.

## 8.7 Accessibility (WCAG 2.1 AA) — Track B

- **Contrast**: `--text-strong` (#33322a) on `--surface-bg`/`--surface-raised` clears AA comfortably (~10:1). Status-pill text-on-light variants (`--pink-text-light`, `--lime-text-light`, `--cyan-text-light`, `--orange-text-light`) were selected by the sponsor for on-light legibility — verify each at implementation against 4.5:1 for pill body text; where a pill uses a **solid accent fill** with `--pill-ink` (#170a26) text, confirm 4.5:1 per accent hue (lime `#c6ff3f` background is light — `--pill-ink` on lime clears AA; pink/cyan/orange solid fills should be spot-checked the same way before shipping).
- **Focus**: visible focus ring required on every interactive element (rail nav items, table row actions, filter chips, modal controls, guide-app step rows/signature controls) — the handoff's `.dc.html` prototypes don't show a focus state; P5 must add one consistent with Track A's focus-ring approach (2px ring, accent-cyan or pink, 2px offset) since none is specified upstream.
- **Touch/click targets**: web-admin is PC/iMac pointer-only (not touch) — no 44px hard floor required, but table row actions should still resolve to a comfortable ≥32px clickable hit area. **Guide app is mobile touch (and outdoor/gloved use, per Track A's original constraint carried forward) — the 44×44px hard floor and ≥16px minimum text size from §3's note still apply**, notwithstanding the Parchment re-skin.
- **ARIA**: dense DataTable needs `scope="col"` header semantics (or Flutter Semantics equivalent), live readiness/counter regions (A17 fill counts, A20 "N of M riders covered", guide-app step progress) as `aria-live="polite"`/Semantics live-region, modal dialogs trap focus and restore it on close (same pattern as Track A §6). Guide-app signature/typed-confirm blocks must be labelled explicitly ("Sign to confirm kit check complete"), not just an icon — carried forward unchanged from the pre-DEV-1 spec.
- **Money legibility**: Playfair at handoff-specified sizes must stay comfortably above the 11px functional-text floor; never use Playfair below 14px (consistent with the earlier `--type-price` range of 14–34px).
- **Offline/outdoor legibility (guide app only)**: Parchment's warm-light palette must remain legible in outdoor daylight conditions equivalent to the forest theme's prior guarantee — verify `--text-strong` on `--surface-bg` contrast holds under bright-outdoor simulated testing, not just standard indoor contrast checking.

## 8.8 Motion tokens (PROPOSED — pending sponsor ratification)

The handoff states motion is **"communicative only"** (progress fill, sidebar collapse/expand width, view swap on nav change) and must be **token-driven, honouring `prefers-reduced-motion` (instant)** — but the handoff gives **no numeric duration/easing scale**. The following is a **Clara-proposed minimal scale**, not sponsor-specified — flag to Roma/sponsor for ratification before P5 hard-codes it:

| Token (proposed) | Value (proposed) | Usage |
|---|---|---|
| `--motion-fast` | 120ms | Micro-interactions: button press tint, checkbox/chip toggle, hover state |
| `--motion-base` | 200ms | Standard transitions: modal open/close, filter-chip active-state swap, tab switch |
| `--motion-slow` | 320ms | Larger movements: sidebar collapse/expand (68px icon-rail toggle), progress-bar fill animation, view swap between screens |
| `--motion-ease-standard` (proposed) | `cubic-bezier(0.4, 0, 0.2, 1)` | Default easing for most transitions (standard "ease-in-out"-family curve) |
| `--motion-ease-out` (proposed) | `cubic-bezier(0, 0, 0.2, 1)` | Entrances (modal open, overlay appear) — quick start, gentle settle |

**Reduced-motion rule (hard, non-negotiable — carried verbatim from handoff intent)**: when `prefers-reduced-motion: reduce` is set, all of the above become **instant** (0ms, no easing curve) — progress bars jump to their end state, modals appear/disappear without transition, sidebar collapse snaps rather than animates. This applies identically to both `webapp-admin` and `mobile-guide`.

**Status**: this scale is a Clara-authored placeholder sized to typical UI-motion conventions (not derived from any handoff artifact) so P5 has *something* concrete to build against; it should be treated as **PROPOSED, not final**, and swapped for sponsor-ratified values if/when supplied. Do not treat these numbers as equivalent in authority to the colour/type/spacing tokens in §8.1–8.3, which are sponsor-final.

---

## Revision History (design-system.md)

| Version | Date | Summary |
|---|---|---|
| 1.0 | 2026-07-21 | Initial P3 design system: single forest-palette track covering all apps per TDR-15/TDR-13. |
| 2.0 | 2026-07-21 | **DEV-1 (sponsor-directed, AIB-P3 redirect)**: split into Track A (Forest — customer webapp, editor, guide app, unchanged) and Track B (Admin Parchment — web-admin only, sponsor-supplied mockup tokens: Playfair Display/Plus Jakarta Sans/mono, parchment neutrals, pink/lime/cyan/orange status-accent system, `.fob-console` dark theme off). Track B grounded in the mockup's `tokens/*.css`, `README.md`, and reference screenshots (shell, nav tree, calendar, scheduler, departure/participant detail). Component inventory, accessibility, and Flutter-porting notes added for Track B (§8). A-screen references removed from Track A's §5/§6/§7 and relocated to §8. |
| 2.1 | 2026-07-21 | **DEV-1 extended (sponsor-directed)**: Track B renamed "Internal Apps Parchment" and now covers **mobile-guide (G1–G13) in addition to web-admin (A1–A20)** — same `_ds` token bundle, guide-specific mockup at `_user_input/design-mockups/guide-system/`. Track A narrowed to customer webapp + editor only (forest/Syne/DM Sans). Guide-app G-screen references (signature capture, typed-confirm, step nav, outdoor/gloved touch-target constraints) removed from Track A §2/§3/§5/§6 and relocated/rebuilt in Parchment tokens under §8.4 (layout, grounded in `g4check.png`/`g4done.png`), §8.5 (component inventory), §8.6 (Flutter porting, incl. offline-bundled fonts per TDR-16), §8.7 (accessibility, incl. outdoor-legibility and 44×44px touch-floor carried forward despite the re-skin). Guide app's offline-first, safety-gated behaviour (DR-O1, TDR-16) is explicitly unchanged — this deviation is visual/token-only. |
| 3.0 | 2026-07-22 | **Sponsor high-fidelity handoff integrated** (`_user_input/design-handoff/`) — now the **authoritative source of truth for Track B**, superseding the earlier mockup-approximated tokens: §8.1 colour tokens replaced with the handoff's FINAL semantic aliases (`--surface-bg/-bg-lo/-card/-raised/-rail`, `--text-strong/-body/-muted/-faint/-label/-price/-link/-link-hover`, accent/status hues, alpha ladders `--wb03..16`/`--tx32..75`); §8.2 typography updated to the handoff's observed sizes (27px page title, 14–18px section, 13–14px body, 9.5–11px mono), with the prior granular named scale flagged as a Clara-derived approximation where it goes beyond the handoff's stated ranges; §8.3 spacing/radius/elevation re-cited as FINAL (radius-pill token dropped — not in the handoff). Added §8.4a (behaviour is governed by the two authoritative UXIS specs, `FOB-UXIS.md`/`FOB-Guide-App-UXIS.md`, not this document). Added §8.5a (7 core components) and §8.5b (11 extension components: StatCard, ReadinessBadge, TreeNav, TransferList, CalendarMonth, StepRow, ProgressBar, ChecklistRow, SignatureField, CategoryChips, StarRating) as explicit P5 Flutter build targets, with a hard "do not ship the `.dc` runtime" note. Added §8.8 Motion tokens (PROPOSED — the handoff specifies motion qualitatively only; Clara-proposed fast/base/slow duration scale + easing + reduced-motion rule, flagged for sponsor ratification). §1.2 (Track A extended colour scale) reworded to explicitly flag it as Clara-derived pending sponsor ratification, unaffected by this handoff. |
