# FOB (Friends on Bikes) — Design System

| | |
|---|---|
| **Document** | P3 Design System (Clara, dispatch clara-P3) |
| **Status** | APPROVED baseline — **TWO brand tracks**. Track A rewritten under sponsor-approved deviation **DEV-4** (2026-07-28): the **shipped customer-webapp look** (Newsreader/Instrument Sans, cream/ink/green) is now the Track A system of record, superseding TDR-15's forest/Syne-DM-Sans **for `webapp-customer`**; includes NEW approved accessibility defect fixes (§1/§5). Track B unchanged under **DEV-1** (internal apps, sponsor FINAL handoff tokens). `webapp-editor` track assignment: OPEN QUESTION (see DEV-4). |
| **Sources** | `core-design-system.md` (F-10, DR-11, DR-12), `Handover_AllModules_ClaudeDesign_Aristotle_2026-07-21.md` §1, `Handover_BackOffice_ClaudeDesign_Bacon_2026-07-21.md`, `Surface_Journey_Coverage.md`; **Track A SOURCE OF TRUTH (per DEV-4): the shipped `SOURCE/apps/webapp-customer` pages themselves** — inline `<style>` blocks of `en/index.html`, `about.html`, `faq.html`, `contact.html`, `gift-vouchers.html`, `hub.html`, `saved.html`, `cancellation-policy.html`, `privacy-policy.html`, `terms-and-conditions.html`, `tours/index.html`, `tours/detail.html`, `book/index.html` (the stale forest-token `en/styles.css` is to be replaced by `en/site.css`, §7); **Track B token/component SOURCE OF TRUTH: `_user_input/design-handoff/README.md` (final tokens, screen inventory), `_user_input/design-handoff/components/README.md` (11-component library), `_user_input/design-handoff/FOB-UXIS.md` + `FOB-Guide-App-UXIS.md` (authoritative behavioural specs), `_user_input/design-handoff/screenshots/`**; earlier Track B layout corroboration from `_user_input/design-mockups/admin-system/` and `guide-system/` (`_ds` bundle + `scraps/` screens incl. `g4check.png`/`g4done.png`) remains valid as supplementary layout reference. |
| **Binding TDRs** | **TDR-15** — **superseded for `webapp-customer` by DEV-4** (sponsor-approved 2026-07-28): the shipped Cream & Ink / Newsreader / Instrument Sans system (§1–§7) replaces the forest-palette + Syne/DM Sans mandate for the customer webapp; TDR-15's forest system has no remaining shipped consumer and survives only as the unresolved default for `webapp-editor` (OPEN QUESTION, see DEV-4); **DEV-1** remains a scoped deviation covering web-admin AND mobile-guide (Track B) · **TDR-13** (stack split: `webapp-customer` static HTML/CSS/JS + Flutter Web islands; `webapp-admin` **Flutter macOS desktop app — superseded by DEV-5, Web SPA retired**; `webapp-editor` full Flutter Web SPA; `mobile-guide` Flutter Web PWA only per DEV-3) |

## DEV-1 — sponsor-directed deviation from TDR-15 (AIB-P3 redirect; extended)

**Directive (as extended)**: **both internal apps** — web-admin (A-prefixed back-office surfaces, A1–A20) **and mobile-guide** (G-prefixed guide-app surfaces, G1–G13) — use the **sponsor-supplied mockup design system**, in its **Parchment (warm light)** theme, instead of the forest/Syne system otherwise mandated by TDR-15. Both mockups (`admin-system/`, `guide-system/`) ship the identical `_ds` token bundle. The mockup's dark-plum `.fob-console` theme is **explicitly OFF everywhere** — Parchment only, for both internal apps. Only the **customer webapp** (`webapp-customer`) and **editor** (`webapp-editor`) — the two customer/content-facing surfaces — were left on the original TDR-15 forest palette + Syne/DM Sans at the time of DEV-1. *(Historical: DEV-4, below, has since superseded that for `webapp-customer` and reopened the question for `webapp-editor`.)*

**Two brand tracks in this document:**

| Track | Apps | Palette | Type | Section |
|---|---|---|---|---|
| **A — Shipped Cream & Ink (DEV-4)** | `webapp-customer` (W1–W21, P1–P2); `webapp-editor` = OPEN QUESTION | Cream/ink/green (`--cream #f6f4ee`, `--ink #14130f`, `--green #3f6b3f`) | Newsreader (display serif) / Instrument Sans (body) | §1–§7 below |
| **B — Internal Apps Parchment** | `webapp-admin` (A1–A20) **and** `mobile-guide` (G1–G13) | Parchment neutrals + pink/lime/cyan/orange status accents | Playfair Display (titles & money) / Plus Jakarta Sans (functional) / mono (ids/labels) | §8 below |

`webapp-admin` is a **Flutter macOS desktop app** (DEV-5 — the Web SPA target is retired) and `mobile-guide` is a **Flutter Web PWA** app (TDR-13; guide-app PWA emphasis reconfirmed by Roma as DEV-2/DEV-3) — neither runs the mockup's React runtime. The mockups' compiled React component bundles (`window.FOBDesignSystem.*`) are **layout/token reference only**, to be rebuilt as Flutter widgets consuming a ported Flutter `ThemeData`/token set shared by both internal apps (§8.6). Do not attempt to embed or reuse the React bundle or the guide mockup's `ios-frame.jsx` as code — it is a device-frame layout reference.

**Guide app remains offline-first and safety-gated (TDR-16, DR-O1) — this deviation is visual/token-only.** The sequential sign-off flow, full-signature vs. typed-confirm distinction, sembast offline persistence, and no-photo-capture scope cuts are unchanged; only the theme (Parchment + Playfair/Plus Jakarta/mono in place of Forest + Syne/DM Sans) changes.

## DEV-4 — sponsor-approved deviation from TDR-15 (CHG-015; shipped look ratified as system of record)

**Directive (sponsor approved 2026-07-28)**: the customer website as shipped (`SOURCE/apps/webapp-customer` — `en/*.html`, `en/tours/*.html`, `en/book/index.html`) diverged from TDR-15's forest/Syne-DM-Sans system. Rather than remediate the pages, the sponsor has formally approved the **SHIPPED look as the Track A system of record**: **Newsreader** (display serif) + **Instrument Sans** (body) over the **cream/ink/green** palette (`--cream #f6f4ee`, `--ink #14130f`, `--green #3f6b3f`). This **supersedes TDR-15's forest palette + Syne/DM Sans for `webapp-customer` only**. §1–§7 of this document now document that shipped reality (plus explicitly-marked NEW accessibility defect fixes, also approved under DEV-4).

- **Scope**: `webapp-customer` only. **Track B (§8, internal Parchment apps) is untouched** by DEV-4.
- **`webapp-editor` — OPEN QUESTION for the sponsor**: the editor never shipped, so it never rendered from either system. TDR-15's forest/Syne remains its *nominal* assignment only by default (nothing in DEV-4 or Track B says otherwise), but with the forest system now retired from every shipped surface, keeping the editor as forest's sole consumer is almost certainly not intended. **Flagged, not decided** — sponsor to rule on whether `webapp-editor` adopts the DEV-4 Cream & Ink system.
- **Flutter booking island — TO-MIGRATE**: `SOURCE/apps/webapp-customer/flutter/lib/theme/tokens.dart` and `lbt_tokens.dart` still carry the old forest tokens (`ForestTokens`, `#5a9962`/`#243320`). See §6.
- **Stylesheet**: the stale forest-token `en/styles.css` will be **replaced by `en/site.css`** in the implementation step, per the §7 consolidation contract.
- **Accessibility defect fixes ride with DEV-4**: shipped `--muted #8a8778` and `--faint #a8a495` fail WCAG AA for text and are replaced by `#6a675a` / `#716e60` (§1.1/§1.4); focus-visible, skip link, disabled/error states and full reduced-motion coverage are specified NEW in §5.
- **Known shipped gap (flagged, not fixed here)**: ≤900px the nav links simply disappear (no hamburger/drawer shipped) — mobile nav needs a decision in a follow-up change.

## 0. Governing decisions (do not deviate)

- **DR-11**: one set of shared brand **tokens**, not shared components. Each app (`webapp-customer`, `webapp-admin`, `mobile-guide`, `webapp-editor`) implements its own component layer on top of the same tokens. **DEV-1 note (extended)**: `webapp-admin` and `mobile-guide` now consume a *different* token set (Track B) than `webapp-customer`/`webapp-editor` (Track A) — DR-11's "own component layer per app" principle still holds; the token source now forks along a customer-vs-internal boundary, per sponsor directive, rather than a single admin-only carve-out.
- **DR-12**: the Flutter component library is **to-build** (this document is its spec) — it does not exist yet in code. This now applies to **two** Flutter widget libraries: Track A (Cream & Ink per DEV-4, for the customer booking island — currently TO-MIGRATE off forest tokens, §6 — and the editor if the sponsor so rules) and Track B (parchment, shared by web-admin and guide app).
- **TDR-13**: rendering split per surface —
  - `webapp-customer` (W1–W21, P1–P2): vanilla static HTML/CSS/JS pages, per-locale dirs (`en/fr/es`), **plus Flutter Web island widgets** embedded into the static pages for anything stateful/transactional (booking, payment, consent forms, attendee forms, feedback). Simple content pages stay plain static HTML. Track A tokens.
  - `webapp-admin` (A1–A20): **Flutter macOS desktop app** (DEV-5 — Web SPA retired), Mac only, fixed wide-screen, not responsive. Native window chrome replaces the browser frame; the fixed-wide-screen layout assumption is unchanged. **Track B (Parchment) tokens per DEV-1.**
  - `webapp-editor`: full Flutter Web SPA. **Track assignment OPEN QUESTION per DEV-4** (never shipped; nominally forest by TDR-15 default, but forest now has no shipped consumer — sponsor to decide).
  - `mobile-guide` (G1–G13): **Flutter iOS-native** (primary) + Flutter Web PWA (fallback), extension of the existing GMT app shell, offline-critical mid-tour. **Track B (Parchment) tokens per DEV-1 (extended) — visual theme only, offline/native behaviour unchanged.**
- Canonical fixtures for any spec/mock: Tom (customer, `BK-1001`), Marie (prospect, `ENQ-2001`), Sarah (prospect, `SAVE-2001`), William (Owner — always "William" in copy, never "Owner"/"admin"), Emma (guide, `DEV-EMMA-01`), Hidden City tour (`TOUR-HID`, £45, 90 min), Departure `DEP-HID-2026-08-01-1000` (cap 10), Bike `FOB-001`, Helmet `HEL-014`, Feedback `FB-1001` (5★). Same fixtures reused across both tracks (Riverside Loop `TOUR-RVL` also appears in the admin mockup screens as a second tour example).

---

# Track A — Shipped Customer Webapp System ("Cream & Ink", per DEV-4)

**Scope**: `webapp-customer` (static pages `en/*.html`, `en/tours/*.html`, `en/book/index.html`, plus the Flutter booking island). **`webapp-editor` is NOT covered — its track assignment is an OPEN QUESTION for the sponsor (see DEV-4).** Everything in §1–§7 is extracted from the shipped pages' inline `<style>` blocks (the system of record per DEV-4), except items explicitly marked **NEW (DEV-4 defect fix)**, which are approved accessibility corrections that go *beyond* what shipped.

## 1. Colour tokens (Cream & Ink palette) — SHIPPED, with two NEW replacements

### 1.1 Canonical `:root` token set

This is the **superset** of the per-page `:root` blocks (some pages omit `--cream-hi`/`--cream-lo`; `en/site.css` will canonicalise the full set — see §7).

| Token | Hex | Status | Usage |
|---|---|---|---|
| `--cream` | `#f6f4ee` | shipped | Page background; light text on dark surfaces (`#f6f4ee` literal) |
| `--cream-hi` | `#faf8f2` | shipped | Raised light surface (= `--card`) |
| `--cream-lo` | `#efece3` | shipped | Recessed band background (promise section, skeleton base) |
| `--card` | `#faf8f2` | shipped | Card/panel/bookcard background |
| `--ink` | `#14130f` | shipped | Footer background, darkest ink |
| `--ink-2` | `#1a1916` | shipped | Default body text colour; dark section backgrounds (stats, reviews) |
| `--body` | `#4a483f` | shipped | Long-form copy, answers, secondary paragraphs |
| `--muted` | **`#6a675a`** | **NEW (DEV-4 defect fix)** — shipped value `#8a8778` fails AA (3.28:1 on `--cream`), replaced | Meta text, card meta rows, form labels, `/ per person` |
| `--faint` | **`#716e60`** | **NEW (DEV-4 defect fix)** — shipped value `#a8a495` fails AA (2.27:1 on `--cream`), replaced | Overline labels (`.tcard-hll`, `.sec-label`) |
| `--hairline` | `#dcd7c9` | shipped | Rules, card foot dividers, accordion borders (non-text UI only) |
| `--green` | `#3f6b3f` | shipped | Brand accent: eyebrows, solid buttons, dots/badges, links, focus ring |
| `--serif` | `'Newsreader',Georgia,serif` | shipped | Display serif |
| `--sans` | `'Instrument Sans','Helvetica Neue',Arial,sans-serif` | shipped | Body sans |

**NEW-token derivation (Clara, verified mathematically)**: the replacements darken the shipped warm olive-grey hue along the same axis rather than shifting to neutral grey — `--muted #6a675a` keeps the green-brown cast of `#8a8778`; `--faint #716e60` stays visibly lighter than `--muted` while clearing AA. Ratios in §1.4. The shipped values `#8a8778`/`#a8a495` may survive **only** as non-text UI (decorative rules, disabled-state fills ≥3:1 not required) — never for text.

### 1.2 Dark-surface and alpha conventions (shipped)

No separate token set exists for dark sections; the pages use consistent literal alphas — carry these into `site.css` as-is:

| Value | Usage |
|---|---|
| `rgba(20,19,17,.82)` + `backdrop-filter: blur(12px)` | Fixed nav background (scrolled/interior state) |
| `rgba(246,244,238,.9)` / `.82` / `.7` / `.6` / `.55` / `.5` | Cream-alpha text ladder on dark surfaces (nav links, hero lede, stats labels, footer text) |
| `rgba(246,244,238,.14)` / `.1` / `.08` | Cream-alpha hairlines on dark (stats divider, review card border, nav shadow line) |
| `rgba(26,25,22,.16)` / `.09`–`.10` / `.07`–`.08` | Ink-alpha borders on light (inputs at .16; cards/panels/tiles at .07–.10) |
| `rgba(20,20,17,.35→.78)` gradient | Hero image scrim |
| `#f4f1e8` + `repeating-linear-gradient(45deg, rgba(26,25,22,.022) …)` | Textured tile/aside/helpcard background (grain motif) |

**Rule**: cream-alpha text on dark below `.7` (i.e. `.6`, `.55`, `.5`) is confined to footer meta/legal-bar text at ≥13px — do not extend it to new body copy (`.6` on `--ink-2` ≈ 5.6:1 effective and shrinking with alpha; treat `.7` as the body-text floor on dark).

### 1.3 Semantic states — NEW (DEV-4 defect fix)

The shipped pages carry no error/success tokens (forms were success-path only). Specify:

| Token | Hex | Ratio on `--cream` | Usage |
|---|---|---|---|
| `--error` | `#a03325` | 7.0:1 | Field error border + inline error text |
| `--success` | `#3f6b3f` (= `--green`) | 5.64:1 | Confirmation notices — always with a text label, never colour alone |

### 1.4 Contrast (WCAG AA) — verified against `--cream #f6f4ee` (worst light surface is `--cream-lo #efece3`)

| Foreground | On `--cream` | On `--card` | On `--cream-lo` | Verdict |
|---|---|---|---|---|
| `--ink #14130f` | 16.9:1 | 17.5:1 | 15.7:1 | AAA |
| `--ink-2 #1a1916` | 16.0:1 | 16.6:1 | 14.9:1 | AAA |
| `--body #4a483f` | 8.3:1 | 8.6:1 | 7.8:1 | AAA |
| **`--muted #6a675a` (NEW)** | **5.16:1** | 5.34:1 | 4.80:1 | **AA pass on all light surfaces** |
| **`--faint #716e60` (NEW)** | **4.66:1** | 4.82:1 | 4.33:1 | **AA pass on `--cream`/`--card`; on `--cream-lo` use `--muted` instead (4.33 < 4.5)** |
| `--green #3f6b3f` (text/eyebrows) | 5.64:1 | 5.84:1 | 5.25:1 | AA |
| `#ffffff` on `--green` fill (buttons) | 6.2:1 | — | — | AA |
| *(retired)* shipped `--muted #8a8778` | 3.28:1 | 3.40:1 | 3.06:1 | **FAIL — non-text use only** |
| *(retired)* shipped `--faint #a8a495` | 2.27:1 | 2.35:1 | 2.11:1 | **FAIL — non-text use only** |
| `--green` on `--ink-2` (dark surfaces) | — | — | — | 3.0:1 — icons/large text only; **not** the focus ring on dark (§5.2) |

## 2. Typography — SHIPPED

**Display serif: Newsreader** (weights 400/500, italic 400, optical sizing 6..72). **Body sans: Instrument Sans** (400/500/600). Loaded from **Google Fonts CDN** (`fonts.googleapis.com` + `preconnect`) as shipped — note this diverges from TDR-15's self-hosting convention; DEV-4 ratifies the *look*, and CDN loading is the shipped mechanism of record, but self-hosting the same two families remains an allowed future hardening step (visual no-op).

Display type is Newsreader **weight 500** with tight tracking (`-.01em` to `-.02em`) and tight leading (1.02–1.1). All-caps micro-labels (eyebrows, nav links, buttons, meta) are Instrument Sans with wide tracking (`.1em`–`.22em`).

### 2.1 Type scale (rem, 16px base) — **Clara-derived from the shipped `clamp()`/px values**, not a shipped token set

The pages use raw `clamp()`s that vary a few px page-to-page (hero h1 max ranges 66–88px). This ladder normalises them; `site.css` should expose these as tokens and pages adopt the nearest step.

| Token | Font / weight | Size | Shipped basis |
|---|---|---|---|
| `--text-display-1` | Newsreader 500 | `clamp(2.75rem, 6.5vw, 5.5rem)` / 1.02 | Home hero `clamp(44px,6.5vw,88px)` |
| `--text-display-2` | Newsreader 500 | `clamp(2.5rem, 6vw, 4.875rem)` / 1.02 | Interior heroes `clamp(38–42px,5.5–6.5vw,66–82px)` |
| `--text-h1` | Newsreader 500 | `clamp(2rem, 4.5vw, 3.25rem)` / 1.06 | Section heads / page titles `clamp(32px,4.5vw,52px)`, CTA `clamp(34px,5vw,58–60px)` |
| `--text-h2` | Newsreader 500 | `clamp(1.875rem, 4vw, 2.875rem)` / 1.08 | Secondary sections `clamp(30px,4vw,46px)` |
| `--text-h3` | Newsreader 500 | `clamp(1.5rem, 3vw, 2.125rem)` / 1.15 | FAQ category heads `clamp(24px,3vw,34px)` |
| `--text-card-title` | Newsreader 500 | `1.9375rem` (31px) / 1.04 | `.tcard-name` 31px; price `2.0625rem` (33px) |
| `--text-tile-title` | Newsreader 500 | `1.4375rem` (23px) / 1.2 | `.tile h3` 23px, footer brand 22px |
| `--text-stat` | Newsreader 400 | `clamp(2.375rem, 5vw, 3.75rem)` / 1 | Stats numerals `clamp(38px,5vw,60px)` |
| `--text-lede` | Instrument Sans 400 | `clamp(1.0625rem, 2vw, 1.3125rem)` / 1.5 | Hero ledes `clamp(16–17px,2vw,20–21px)` |
| `--text-body-lg` | Instrument Sans 400 | `1.125rem` (18px) / 1.5 | `.sec .sub` |
| `--text-body` | Instrument Sans 400 | `0.9375rem`–`1rem` (15–16px) / 1.55–1.75 | Card desc 15px, answers 15.5px, book-head p 16px |
| `--text-meta` | Instrument Sans 400–600 | `0.8125rem` (13px) / caps, `.13–.16em` tracking | Eyebrows, nav links, stats labels, `.tcard-pp` |
| `--text-micro` | Instrument Sans 600 | `0.6875rem`–`0.75rem` (11–12px) / caps, `.14–.2em` tracking | Card badges, overlines, buttons (`.booknow` 12px), labels |

**Floors**: body copy never below 15px; all-caps micro-labels never below 11px, and at 11–12px always weight 500+ with letter-spacing (as shipped).

## 3. Spacing, radius, elevation — SHIPPED conventions (no formal token scale shipped; Clara-codified)

**Spacing**: page gutter `48px` (nav, heroes) / `40px` (sections), collapsing to `24px` under 700px. Section vertical padding `110px` (`.sec`), dark bands `56px`–`120px`. Card padding `28px`–`46px`; grid gaps `24`–`44px`; small gaps run 6/10/14/16/20/24. Content max-widths: `1200px` (sections), `1100px` (stats), `1000px` (book), `900px` (FAQ/legal prose), `760px` (headline measure), `560px` (lede measure).

**Radius — deliberately sharp**: buttons and CTAs are **square (0)**; inputs `3px`; tour cards/tiles `4px`; panels/tiers/asides `6px`; large panels/island `8px`; review cards `18px` (dark-surface exception); circles `50%` (step dots, initials, remove buttons). Do not import a softer radius scale — the squared button is a brand signature.

**Elevation**:

| Level | Shadow | Usage |
|---|---|---|
| Rest | `0 1px 2px rgba(26,25,22,.04)` (+1px ink-alpha border) | Cards, panels, tiers |
| Tile hover | `0 14px 30px rgba(26,25,22,.09)` + `translateY(-4px)` | `.tile` |
| Card hover | `0 22px 50px rgba(26,25,22,.14)` + `translateY(-8px)` | `.tcard` lift |
| Selected | `0 20px 44px rgba(63,107,63,.16)` + `--green` border | `.tier.sel` (gift vouchers) |

**Motion (shipped)**: reveal-on-scroll `[data-reveal]` (opacity + 22–40px translateY, `.7–.8s cubic-bezier(.16,1,.3,1)`), hero parallax (`translateY(scrollY*0.28)`), nav `.4s` background/shadow transition, card hover `.35–.45s ease`, process line draw `1.1s`, skeleton shimmer `1.3s`. All gated by reduced-motion — §5.5.

## 4. Component inventory — AS SHIPPED

Legend: **[Static]** plain HTML/CSS/JS · **[Island]** Flutter Web island (book flow, W4–W10).

- **4.1 Fixed nav (`nav.top`)** — fixed full-width bar, logo img (52px), uppercase 13px links (cream-alpha `.9`), language switch (`EN | FR | ES`, active `.on` full cream), square `--green` "Book Now" (`.booknow`, 12px/600/caps). Two states: transparent over the home hero, and dark **`.on`** state (`rgba(20,19,17,.82)` + blur + hairline shadow) toggled at `scrollY > 60`; interior pages ship the dark state permanently. Mobile ≤900px: `.nlinks` hidden (shipped has **no** drawer — gap flagged, see DEV-4 open questions).
- **4.2 Footer** — `--ink` background, cream-alpha `.6` text; full variant: 4-column grid (`2fr 1fr 1fr 1fr`: brand serif 22px + address, Explore/Company/Legal link columns) + legal bar over cream-alpha `.1` hairline; compact variant (`.frow`, book/legal pages): single row brand + secure-payments line.
- **4.3 Eyebrow (`.eyebrow`)** — uppercase 13px, `.22em` tracking, `--green` (cream-alpha `.85` over hero imagery). Opens every section/page head.
- **4.4 Buttons** — all square, uppercase or near-caps, Instrument Sans 600:
  - **Solid** (`.solid`, `.booknow`, `button.go`, `button.send`, `.helpcard a`) — `--green` fill, `#fff` text, padding ~13–18px × 26–42px. Hover: `translateY(-2px)` + `filter:brightness(1.08)`.
  - **Ghost** (`.ghost`) — transparent, `1px solid rgba(246,244,238,.5)` + cream text (dark/hero surfaces); hover cream-alpha `.12` fill.
  - **Inverse** (`.cta a`) — `#fff` fill, `--ink-2` text, on the green CTA band.
  - **Text link** (`.tcard-book`, `.routes-note a`) — `--green`, 600, caps 12px, arrow glyph.
  - **Disabled** (shipped: `button.send[disabled]` `opacity:.6`) — **superseded by §5.4's NEW spec**.
- **4.5 Section head (`.sec`)** — eyebrow → serif `h2` (`--text-h1`, max-width 760px) → `.sub` 18px `--body`-range subhead (max-width 660px); `.center` variant.
- **4.6 Tour card (`.tcard`)** — anchor-wrapped column card: 4/5 image with glass badge (`rgba(20,20,17,.4)` + blur; `.pop` = `--green`), meta row (caps 12px `--muted`, `/` separators), serif name 31px, desc 15px, highlights overline (`--faint`) + list, hairline-topped foot with serif price 33px + `--green` book link. Hover: `-8px` lift + deep shadow.
- **4.7 Textured tile (`.tile`, `.aside`, `.helpcard`, `.byus`, `.visit`)** — `#f4f1e8` grain-gradient surface, numbered `--green` serif badge square (46px), serif h3 23px, 15px body.
- **4.8 Stats band (`.stats`)** — `--ink-2` background, 4-up grid of serif `--green` numerals (count-up on reveal) over caps labels (cream-alpha `.7`); badges row above a cream-alpha `.14` hairline.
- **4.9 Accordion (FAQ `details`/`summary`)** — native `details`, hairline-separated rows, 17px/500 summary with `--green` `+`/`–` glyph (rotating), answer 15.5px/1.7 `--body`. Category = serif h3 + hairline rule.
- **4.10 Forms** (contact, hub lookup, gift vouchers) — label: caps 12px `--muted` (NEW value); input/select/textarea: 15px `--ink-2` on `#fff` or `--card`, `1px solid rgba(26,25,22,.16)`, radius 3px, padding 13×15px; focus: `--green` border + `0 0 0 3px color-mix(in srgb, var(--green) 16%, transparent)` ring; submit = solid button. Error/disabled states: **NEW, §5.4**.
- **4.11 Process steps (`.step`)** — 54px `--green` circle serif numerals, animated `--green` connector line, serif h3 21px.
- **4.12 Review card (`.rcard`)** — dark-surface card (cream-alpha `.05` fill, `.1` border, radius 18px), `--green` stars, serif 20px blockquote, initials disc.
- **4.13 CTA band (`.cta`)** — full-bleed `--green`, serif white headline, inverse button.
- **4.14 Booking island frame (`#booking-island`)** — `--card` panel, radius 8px, viewport-tall; skeleton shimmer bars (`#efece3→#f4f1e8`) until hydration; `noscript` fallback with phone number. Flutter island mounts inside (see §6).
- **4.15 Saved/hub patterns** — empty-state disc (`#efece3` 64px circle + message), remove button (34px dark glass circle), sticky `.bookcard` panel, `.tier` selectable cards (hover lift; `.sel` `--green` border + green-tinted shadow).

## 5. Accessibility (WCAG 2.1 AA) — Track A. Items 5.1–5.5 are **NEW (DEV-4 defect fixes)** unless marked shipped

- **5.1 Text contrast** — governed by §1.4: `--muted`/`--faint` replaced (shipped values fail AA); on `--cream-lo` use `--muted`, not `--faint`. Cream-alpha-on-dark floor `.7` for body text. Never colour-only status.
- **5.2 `:focus-visible` (NEW)** — global rule in `site.css`:
  - Light surfaces: `:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }` — `--green` vs `--cream` 5.64:1, comfortably over the 3:1 non-text minimum.
  - Dark surfaces (nav, stats, reviews, footer, hero): `--green` on `--ink-2` is only 3.0:1 — too marginal for a ring. Scope `nav.top :focus-visible, .stats :focus-visible, .reviews :focus-visible, footer :focus-visible, .hero :focus-visible { outline-color: var(--cream); }` (16:1 on ink). Green CTA band: `outline-color:#fff` (6.2:1).
  - Never `outline:none` without this replacement; shipped `input{outline:none}` must gain the box-shadow focus ring **and** keep `:focus-visible` outline for high-contrast modes.
- **5.3 Skip link (NEW)** — first DOM element on every page: `<a class="skip" href="#main">Skip to content</a>`; visually hidden off-canvas until focused; on focus: fixed top-left, `--ink-2` background, `--cream` text, 14px/600, padding 12×20px, square, `z-index` above nav. Every page gains `id="main"` on its first content landmark.
- **5.4 Disabled + error/validation states (NEW)** —
  - **Buttons disabled**: `--cream-lo` fill, `--muted` text (4.8:1 on `--cream-lo`), no shadow/transform, `cursor:not-allowed`, `aria-disabled` where the control stays focusable. Replaces shipped `opacity:.6`.
  - **Inputs disabled**: `--cream-lo` fill, `--muted` text, `rgba(26,25,22,.09)` border.
  - **Input error**: `1.5px solid --error #a03325` border + `0 0 0 3px color-mix(in srgb, var(--error) 14%, transparent)` on focus; inline message below in 13px `--error` (7.0:1), `aria-invalid="true"` + `aria-describedby` to the message. Never colour-only — message text always present.
- **5.5 `prefers-reduced-motion` (partially shipped; NEW = complete coverage)** — shipped pages already gate `[data-reveal]`, hero parallax and skeleton shimmer. `site.css` must extend the rule to **all** motion: `@media (prefers-reduced-motion: reduce){ .tcard, .tile, .tier, button, a { transition: none; } .tcard:hover, .tile:hover, .tier:hover, button:hover { transform: none; } nav.top { transition: none; } .process .line { transition: none; } }` plus the shipped reveal/parallax/shimmer guards. Hover feedback under reduced motion = shadow/brightness change only, no translate.
- **Shipped/carried-forward**: correct `lang` per locale dir; native `details` accordion is keyboard-operable for free; island `noscript` fallback with phone number; touch targets ≥44px on interactive elements (nav "Book Now" 13px×26px padding + text clears it; audit small text links at implementation).

## 6. Flutter booking island — TO-MIGRATE

`SOURCE/apps/webapp-customer/flutter/lib/theme/tokens.dart` (`ForestTokens`) and `lbt_tokens.dart` still carry the **old forest palette** (`#5a9962`/`#243320`, Syne/DM Sans-era scale) superseded by DEV-4. **Status: TO-MIGRATE** — port the §1 Cream & Ink token set (including the NEW `--muted`/`--faint`/`--error` values), Newsreader/Instrument Sans, and §3's radius/shadow conventions into the island theme so the embedded booking flow (W4–W10) matches its host page. Until migrated, the island is a known visual mismatch inside `#booking-island`.

## 7. `site.css` consolidation contract (normative for the implementer)

The shipped per-page inline `<style>` blocks and the stale forest-token `en/styles.css` are replaced by **one shared `en/site.css`** (old `styles.css` deleted). Split:

**Belongs in `site.css` (shared, single source):**
1. `:root` tokens — §1.1 superset (with NEW `--muted`/`--faint`/`--error`) + §1.2 alpha conventions as comments/vars.
2. Reset (`*{box-sizing:border-box;margin:0;padding:0}`, `body` base, `a` base).
3. Type-scale tokens + heading/eyebrow classes (§2.1).
4. Focus-visible rules, skip link, disabled/error states, full reduced-motion block (§5.2–5.5).
5. `nav.top` (both states) — pages keep only the `.on` toggle script or a static `on` class.
6. `footer` (full + compact variants).
7. Buttons: `.solid`, `.ghost`, `.booknow`, `button.go`/`.send` unified as `.btn`/`.btn-ghost`/`.btn-inverse` (+ states).
8. `.eyebrow`, `.sec`/section-head pattern, `.sub`.
9. `.tcard` (full card spec), `.tile` textured surface.
10. Form primitives: `label`, `input`/`select`/`textarea` + focus/error/disabled.

**Stays page-inline (page-specific):**
- Hero variants (home parallax hero, interior grain heroes), scrims, per-page hero `clamp()` overrides.
- Page layouts: stats band, process steps, reviews grid, CTA band, FAQ accordion, gift-voucher tiers, saved/hub panels, booking island frame/skeleton, contact/legal layouts.
- Page-scoped scripts (reveal, count-up, parallax) — unchanged, but honouring the shared reduced-motion block.

Rule of thumb: if it appears on ≥2 pages or is a token/state/a11y rule, it lives in `site.css`; if it styles one page's unique sections, it stays inline. No page may redeclare `:root` after migration.

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

> ### TYPOGRAPHY: TRACK B NOW FORKS BY APP (FR-001, 2026-07-29)
>
> Everything in §8.2 below described ONE type stack shared by both internal
> apps. That is no longer true, and part of it was already out of date. Read
> this first; where it conflicts with the text below, this governs.
>
> | App | Serif | Functional text | Mono | Bundled? |
> |---|---|---|---|---|
> | `webapp-admin` | **none — the serif role is removed** | **SF Pro** (platform face) | **SF Mono**, Menlo fallback | no — nothing bundled |
> | `mobile-guide` | Source Serif 4 | Plus Jakarta Sans | monospace | yes, bundled |
>
> **Two corrections to the record.**
>
> 1. **Playfair Display has not been in use for some time.** It was replaced by
>    **Source Serif 4** before FR-001, because Playfair's old-style figures made
>    currency read badly in columns — the very thing §8.2's hard rule cares
>    about. Every "Playfair" below should be read as Source Serif 4 for
>    `mobile-guide`, and as "not applicable" for `webapp-admin`.
> 2. **`webapp-admin` has no serif at all.** Under DEV-5 it is a macOS desktop
>    app, so it renders in the platform's own faces. Georgia was evaluated as a
>    serif and rejected: it also has old-style figures and, unlike Source Serif
>    4, no lining alternates, so the `lnum` feature would silently do nothing —
>    reintroducing the defect Source Serif 4 was adopted to fix. It also has no
>    600 weight, which the page-title style asks for. Evidence:
>    `design-assets/CR-010-type-specimen.html`.
>
> **Money still governs the decision.** `webapp-admin` renders money in SF Pro
> with **tabular lining figures**, so amounts stay column-aligned — the property
> the serif existed to provide is preserved, not traded away.
>
> **Scope.** `mobile-guide` is untouched: it is a Web PWA on non-Apple
> platforms, where SF is neither available nor licensed.

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

## 8.5 Component inventory (Track B — Internal Apps Parchment) [all Flutter — TDR-13; web-admin = **macOS desktop app** (DEV-5), guide app = PWA (DEV-3)]

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

- Build **one shared** Track-B `ThemeData`/`ColorScheme` + `TextTheme` (Internal Apps Parchment) consumed by both `webapp-admin` and `mobile-guide`, separate from the Track A `ThemeData` used by the `webapp-customer` booking island (Cream & Ink per DEV-4; editor TBD). **Do not merge Track A and Track B into one theme with a runtime switch** — DEV-1 scopes Parchment strictly to the two internal apps, and each app still builds its own widget layer on the shared token set per DR-11.
- **TYPE NO LONGER SHARED (FR-001).** The single shared Track-B `ThemeData` above still holds for colour, spacing and radius — those remain identical across both apps and must not diverge. **The type stack forks**: `webapp-admin` uses the macOS platform faces (SF Pro / SF Mono, nothing bundled, no serif role); `mobile-guide` keeps its bundled faces. This is not a relaxation of the "do not branch the theme" rule but a scoped exception with a stated cause — SF is unavailable and unlicensed off Apple platforms, so the alternative would be a guide app falling back to arbitrary local fonts.
- `webapp-admin` is a wide-screen **macOS desktop app** (DEV-5); `mobile-guide` is a narrow-viewport PWA — the same colour/type/spacing *tokens* apply, but layout composition (fixed left rail vs. single-column step screens) differs per app, consistent with TDR-13's per-app component-layer principle.
- **`webapp-admin` bundles NO fonts (FR-001)** — it passes a null font family so the engine resolves the macOS platform face, which is the durable spelling (`-apple-system` is CSS and means nothing in Flutter; the leading-dot Apple internals are undocumented and have changed across OS releases). The instruction below now applies to `mobile-guide` only, where offline-first genuinely requires bundling.
- Port `--font-serif` (Source Serif 4, formerly Playfair Display) and `--font-sans` (Plus Jakarta Sans) as self-hosted variable fonts (self-hosting per TDR-15's asset-hosting convention — note Track A as shipped uses Google Fonts CDN per DEV-4 §2; Track B must still bundle) — do not rely on Google Fonts CDN at runtime, including in the guide app's offline-first build (fonts must be bundled, not fetched at runtime, given TDR-16's offline-critical requirement).
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
| 4.0 | 2026-07-28 | **DEV-4 (sponsor-approved, CHG-015)**: Track A (§1–§7) rewritten to document the **shipped customer-webapp system of record** ("Cream & Ink": Newsreader/Instrument Sans over `--cream #f6f4ee`/`--ink #14130f`/`--green #3f6b3f`), superseding TDR-15's forest/Syne-DM-Sans for `webapp-customer`; old forest §1–§7 content removed. Tokens, dark-surface alpha conventions, Clara-derived type scale (from shipped `clamp()`s), spacing/radius/shadow conventions and as-shipped component inventory extracted from the inline `<style>` blocks of the 13 shipped pages. **NEW approved accessibility defect fixes**: `--muted` `#8a8778→#6a675a` (3.28:1→5.16:1 on cream) and `--faint` `#a8a495→#716e60` (2.27:1→4.66:1); `--error #a03325`; `:focus-visible` spec (green ring on light, cream ring on dark); skip-to-content link; button/form disabled + error states; full `prefers-reduced-motion` coverage; updated AA contrast table (§1.4). `webapp-editor` track assignment flagged OPEN QUESTION (never shipped); Flutter booking-island tokens (`tokens.dart`/`lbt_tokens.dart`) marked TO-MIGRATE (§6); `en/styles.css` to be replaced by `en/site.css` per the new §7 consolidation contract. Track B (§8) untouched except stale cross-references to Track A updated. |
