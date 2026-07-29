# FOB — Email House Shell (visual spec) — CR-002 (CHG-001)

| | |
|---|---|
| **Document** | P3 design asset (Clara, change-scoped dispatch clara-chg001-p3) |
| **Status** | Draft — additive, CR-002 (CHG-001) |
| **Serves** | REQ-NOTIF10 (CR-002 amendment) · UXD-20/21 (`FOB-UXIS-001_UXIS.md`) · A5c block editor + live preview + multipart send |
| **Sources** | `design-system.md` Track A — Forest (customer-facing brand); CR-002 proposal §2C styling rules |
| **Scope** | The fixed wrapper (header / content area / footer) around every HTML email body. Owner-authored blocks render only inside the content area. Attachments, asset uploads, raw HTML: out of scope. |

Emails are **customer-facing**, so the shell renders from **Track A — Forest** brand
tokens (not the internal Parchment track). Email clients cannot load self-hosted
webfonts or `<style>` blocks, so every token below carries an **email-safe fallback**
— the fallback IS the spec for the emitted HTML; the true token appears only where a
client happens to support it.

## 1. Hard rules (deliverability — invariants, never violated by any block)

- **Inline styles only** — no `<style>` element, no classes, no external CSS.
- **Table-based layout** — nested `<table role="presentation">`; no flex/grid/floats.
- **No scripts**, no forms, no video/audio, no base64 images.
- **Imagery**: emoji + **one hosted logo URL** only (config value, e.g. `https://<customer-site>/assets/email/fob-logo.png`). `alt="Friends on Bikes"` mandatory. No SVG.
- Max content width **600px**, centred; single column.
- Every colour as a 6-digit hex literal; every font stack ends in a generic family.

## 2. Token mapping (Forest → email-safe)

| Purpose | Design-system token | Email value (inline) |
|---|---|---|
| Page background | `--sand` | `background-color:#f7f5ef` |
| Card/content surface | `--paper` | `background-color:#ffffff` |
| Body text | `--charcoal` | `color:#243320` |
| Secondary/meta text | `--ink-muted` | `color:#5a6b57` |
| Brand accent / links | `--forest` | `color:#5a9962` (links underlined — never colour-alone) |
| Button fill (body-size label) | `--forest-700` | `background-color:#3f7347`, text `#ffffff` (AA ≥4.5:1 per design-system §1.4) |
| Header band | `--charcoal` | `background-color:#243320`, text/logo on it `#ffffff` |
| Hairlines/dividers | `--border` | `border-top:1px solid #dde3da` |
| Display font (headings) | Syne | `font-family:'Syne',Georgia,'Times New Roman',serif` |
| Body font | DM Sans | `font-family:'DM Sans',Helvetica,Arial,sans-serif` |

Type scale: body 16px/24px; heading (header tagline) 20px/28px bold; footer/meta 12px/18px.

## 3. Shell anatomy (fixed — the Owner cannot edit the shell itself)

```
┌──────────────────────────────────────────────┐  #f7f5ef page, 24px outer padding
│ ┌──────────────────────────────────────────┐ │
│ │ HEADER  #243320 band, 20px padding       │ │  logo img (max-height 40px, alt set),
│ │  [FOB logo]  optional tagline (Syne)     │ │  centred; tagline #ffffff
│ ├──────────────────────────────────────────┤ │
│ │ CONTENT  #ffffff, 24px padding           │ │  ← Owner blocks render here, in order
│ │  (text · button · divider blocks)        │ │
│ ├──────────────────────────────────────────┤ │
│ │ FOOTER  #f7f5ef, 16px padding, 12px text │ │  #5a6b57; sender identity + footer
│ │  Friends on Bikes · contact line         │ │  block text; links #5a9962 underlined
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘  600px max width, centred
```

- **Header + logo block** (palette) = this header band; its only Owner field is the optional tagline. If the template has no header block, the shell still emits a minimal header band (logo only) so every email stays on-brand.
- **Footer block** = the footer band; Owner-editable footer text appends below the fixed sender-identity line. Absent a footer block, the fixed identity line still renders. Transactional sends: no unsubscribe link required (design-system consent rules govern marketing, which these templates are not).
- **Text block**: 16px `#243320` paragraphs, 16px spacing between; merge fields and emoji inline.
- **Button block**: bulletproof table-cell button — `#3f7347` fill, `#ffffff` bold 16px label, 12px×24px padding, `border-radius:6px`, centred; the `href` is the block's URL field.
- **Divider block**: `#dde3da` 1px rule with 16px vertical margin.

## 4. Preview parity

The A5c live preview renders exactly this shell + blocks with sample merge data, on
the `#f7f5ef` page ground, and is captioned as an approximation (UXD-20). The
test-send emits the same markup in the multipart/alternative message — shell markup
is generated once and shared by preview and send paths, so they can never diverge.

## Revision History

| Version | Date | Summary |
|---|---|---|
| 0.1 | 2026-07-27 | Initial house-shell spec for CR-002 (CHG-001): Forest-brand header/content/footer wrapper with email-safe fallbacks, hard deliverability rules, per-block visual treatments, preview parity note. |
