# Friends on Bikes (FOB) — design system conventions

FOB is a group-ride booking & payments service. Every component is real, compiled
React from the library bundle (`window.FOBDesignSystem.*`) and is styled **entirely by
CSS custom properties (tokens)** — there are no utility classes. Style your own layout
glue with the same tokens, never with invented greys, hexes, or fonts.

## Setup — load order matters
Rendered designs already receive `styles.css` (the full token closure, with fonts
embedded locally) and the component bundle. Nothing else is required. There is **no
provider component** — theming is done with a class on a container, not a React wrapper.

## Two themes, one system — swap by container class
- **Parchment** (warm, light) is the `:root` default. Use it for email/marketing/roomy surfaces.
- **Console** (dark plum, dense back-office) turns on by adding `class="fob-console"` to any
  container. The same components and tokens re-map automatically underneath it.

```jsx
// Console back-office screen
<div className="fob-console" style={{ background: 'var(--plum-bg)', padding: 'var(--space-block)' }}>
  <FOBDesignSystem.DataTable columns={cols} rows={rows} />
  <FOBDesignSystem.Button variant="primary">Refund £90.00</FOBDesignSystem.Button>
</div>
```

## Token vocabulary (use these exact names — they all resolve in `styles.css`)
- **Type** — `var(--font-serif)` Playfair Display for **titles & money ONLY**; `var(--font-sans)`
  Plus Jakarta Sans for everything functional; `var(--font-mono)` for ids/codes/micro-labels.
- **Text inks** — `--text-strong`, `--text-body`, `--text-muted`, `--text-label`, `--text-faint`,
  `--text-link` / `--text-link-hover`, and `--text-price` for money.
- **Neutral alpha ladders (never hard greys)** — text ink steps `--tx32 --tx40 --tx50 --tx60 --tx75`;
  hairlines/fills `--wb03 --wb05 --wb09 --wb12 --wb16`.
- **Accent = status, never decoration** — pink `--pink-text-light`/`--pink-text-dark` = action/cost;
  lime `--lime-text-light` = settled/money-back; cyan `--cyan-text-*` = info/trust;
  orange `--orange-text-light` = warning. The signature CTA gradient is `var(--gradient-brand)`.
- **Plum surfaces** — `--plum-bg`, `--plum-panel`, `--plum-hero` (console depths).
- **Radius** — `--radius-pill --radius-round --radius-button --radius-field --radius-card --radius-table`.
- **Spacing** — `--space-inline --space-row --space-field --space-card --space-gutter --space-block`.
- **Elevation (reserved — hairlines rest, shadows are for lift only)** — `--shadow-inline`,
  `--shadow-console`, `--shadow-email`, `--shadow-modal`.

## Rules that keep designs on-brand
- **Money is always Playfair (`--font-serif`) and pence-accurate** (`£90.00`, never `£90`).
- **Accent colour must carry meaning** (a status or a cost), never mood or decoration.
- **Press feedback is tint/brightness, never scale.**
- Reach for `StatusPill` for the six fixed booking/payment states rather than colouring text by hand.

## Where the truth lives
Read `styles.css` and its `tokens/*.css` imports for the full token set, and each component's
`.prompt.md` (usage + examples) and `.d.ts` (prop contract) before composing it.


---

## Components

- **Button** — Gradient primary, outline secondary, row action  
  `window.FOBDesignSystem.Button` · docs: `components/Components/Button/Button.prompt.md`, `Button.d.ts`
- **Card** — Surface panel — hairline resting, reserved elevation  
  `window.FOBDesignSystem.Card` · docs: `components/Components/Card/Card.prompt.md`, `Card.d.ts`
- **DataTable** — Console list standard — grid rows, money, actions  
  `window.FOBDesignSystem.DataTable` · docs: `components/Components/DataTable/DataTable.prompt.md`, `DataTable.d.ts`
- **Field** — Labelled field; money in Playfair  
  `window.FOBDesignSystem.Field` · docs: `components/Components/Field/Field.prompt.md`, `Field.d.ts`
- **FilterChip** — Toolbar filters — active = solid hue  
  `window.FOBDesignSystem.FilterChip` · docs: `components/Components/FilterChip/FilterChip.prompt.md`, `FilterChip.d.ts`
- **Modal** — Overlay dialog with blurred scrim  
  `window.FOBDesignSystem.Modal` · docs: `components/Components/Modal/Modal.prompt.md`, `Modal.d.ts`
- **StatusPill** — Six fixed booking/payment states  
  `window.FOBDesignSystem.StatusPill` · docs: `components/Components/StatusPill/StatusPill.prompt.md`, `StatusPill.d.ts`

## Foundations (specimen cards)

- Brand · Alpha-ladder
- Brand · Wordmark
- Colors · Accent / status
- Colors · Parchment neutrals
- Colors · Plum depths & gradient
- Colors · Accent text variants
- Spacing · Elevation
- Spacing · Radius scale
- Spacing · Spacing rhythm
- Type · Body / sans / mono
- Type · Display / serif
- Type · Type scale
