# Increment 1 — Customer Website (LBT) · P3 Design: Tours feature

- **Role:** PMA (architecture/API/data) + Clara (design system) · orchestrated by Roma
- **Status:** DRAFT (P3) · realizes REQ-PRE01, REQ-PRE02, REQ-PRE08, REQ-WEB01
- **Inputs:** P1-requirements-tours.md · LBT-UXIS-001 · `London Bike Tours.dc.html`

---

## TDR-WEB-01 — Tour catalogue is a D1 `tours` table, rendered by a dynamic island

| Field | Decision |
|-------|----------|
| **Context** | Increment 0 left the catalogue as a phantom: worker reads `tours/catalogue.json` from R2 (never populated), no `tours` table exists, so PRE01/PRE02 are unsatisfiable. |
| **Decision** | The catalogue is a first-class **D1 `tours` table**. The Tours index (W2) and home showcase (W1) are rendered by a **Flutter "catalogue island"** that reads it live via `GET /tours`. |
| **SEO** | The island is client-rendered → **not crawler-visible**. Sponsor accepted this trade-off for now. SEO via **static generation at publish time** (reuse the SEO03 publish flow to emit crawlable tour HTML) is **DEFERRED** to a later slice. Recorded as a known limitation. |
| **Supersedes** | The R2 `tours/catalogue.json` assumption from increment 0 (`presales.ts` best-effort adapter). `GET /tours` is re-pointed at D1. |
| **Alternatives considered** | (a) static-publish-only (SEO-first) — rejected for now: slower to iterate; (b) keep R2 — rejected: not sponsor-manageable, no live data. |

## Data model — `tours` table (D1 migration)

```sql
CREATE TABLE IF NOT EXISTS tours (
  id            TEXT PRIMARY KEY,            -- slug, e.g. 'hidden-city'
  name          TEXT NOT NULL,               -- 'The Hidden City'
  tagline       TEXT NOT NULL,               -- short description
  description   TEXT,                        -- long-form (tour detail W3)
  duration_min  INTEGER NOT NULL,            -- 90
  max_riders    INTEGER NOT NULL DEFAULT 10,
  difficulty    TEXT NOT NULL,               -- 'Easy' | 'Moderate' | 'Challenging'
  price_pence   INTEGER NOT NULL,            -- 4500
  badge         TEXT,                        -- 'Most Popular' | 'First Timers' | 'Summer Only' | null
  route_highlights TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
  hero_image    TEXT,                        -- asset path/url
  status        TEXT NOT NULL CHECK (status IN ('published','draft','archived')),
  sort_order    INTEGER NOT NULL DEFAULT 0,  -- showcase ordering
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
```

Seed (3 flagship tours, from the mockup):
| id | name | price | badge | duration | difficulty |
|----|------|-------|-------|----------|-----------|
| hidden-city | The Hidden City | £45 | Most Popular | 90 | Easy |
| icons-insights | Icons & Insights | £45 | First Timers | 120 | Moderate |
| golden-hour | Golden Hour City | £55 | Summer Only | 150 | Moderate |

**Departure reconciliation:** re-seed `departures` under these tour ids so booking works against
the real catalogue (currently thames-loop/cotswold-classic/city-night-ride).

## API contract (re-pointed at D1; the client↔server seam the P5 gate checks)

| Method · Path | REQ | Response |
|---|---|---|
| `GET /tours` | PRE01, WEB01 | `{ tours: [{id,name,tagline,duration_min,max_riders,difficulty,price_pence,badge,route_highlights,hero_image,status}] }` — published only |
| `GET /tours/:id` | PRE02 | `{ tour: {..full record..} }` — 404 if missing/unpublished |
| `GET /tours/:id/availability?partySize=N` | PRE03 | (unchanged; already live) |

Client (catalogue island) unwraps `tours`/`tour`. No auth (public read). Prices are pence;
island formats `£{price_pence/100}`.

## Component design (Clara)

1. **`tours-catalogue` Flutter island** — new island under `webapp-customer/flutter` (or a shared
   islands bundle). Reads `GET /tours`, renders the LBT tour-card grid. Mounted into:
   - W1 home "Three Ways to Discover London" (flagship / sort_order, limit 3)
   - W2 Tours index (all published)
   Each card → "Book →" deep-links to `/book/?tour=<id>` (PRE08). SEO-noscript fallback lists
   tour names/links so the mount degrades gracefully.
2. **LBT design system (tokens)** — new customer-website theme, distinct from admin parchment:
   - Fonts: **Newsreader** (serif display/price), **Instrument Sans** (body/UI)
   - Palette: cream `#f4f1e8`/`#faf8f2`/`#efece3`, ink `#14130f`/`#1a1916`, forest green `#3f6b3f`,
     rust `#a8582f`, blue `#2f5d8a`, muted `#8a8778`
   - Card: white, generous radius, image top, meta row (mono-ish caps), serif title, tagline,
     pill highlights, serif price + green "Book →". Matches `London Bike Tours.dc.html`.
   The **booking island is re-themed** to these tokens (replaces ForestTokens) so W4–W7 blend in.

## Gate conditions for this slice (P5)
- `GET /tours`/`GET /tours/:id` exist and return published rows from D1 (reachability).
- The catalogue island's calls match the contract above (contract-conformance).
- Booking still completes against a re-seeded tour/departure (integration, real request).
- requirement→SURFACE edges recorded for W1/W2 (traceability, per REVIEW-traceability).

## Next: P5 generation
Migration + seed (tours + re-seeded departures), re-point `GET /tours[/:id]` at D1, build the
catalogue island + LBT tokens, re-theme the booking island, mount on Home + Tours index.
