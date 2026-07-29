# Increment 1 — Customer Website (LBT) · P1 Requirements: Tours feature

- **Increment:** 1 — Customer marketing + booking website ("London Bike Tours" design)
- **Role:** Talib (P1, requirements) · orchestrated by Roma
- **Status:** DRAFT (P1)
- **Design inputs (staged):** `_user_input/design-mockups/customer-website-LBT/`
  (`London Bike Tours.dc.html`, `London-Bike-Tours-UXIS.md` [LBT-UXIS-001], hero + screenshots)
- **Feature slice this doc covers:** Tours (catalogue + home showcase). Later slices:
  booking-flow re-theme, tour detail, contact/enquiry, FAQ/About, gift vouchers (stub).

## Scope of the increment (surface inventory, from LBT-UXIS-001)

| id | Surface | Kind | This slice? |
|----|---------|------|-------------|
| W1 | Home (hero, tour showcase, difference, 3-min booking, testimonials, CTA) | marketing | tours showcase = yes |
| W2 | Tours index (all routes) | listing | yes |
| W3 | Tour detail | detail | next slice |
| W4–W7 | Booking flow (choose tour → date → party → payment) | flow | re-theme (built) |
| R1 | Booking confirmation | redirect | built |
| W8 | Gift vouchers | money-flow | STUB (per sponsor) |
| W9 | Contact / private-group enquiry | form | stub → later |
| W10 | FAQ · W11 About | content | stub → later |
| E1–E3 | Sold-out / payment-failed / hold-expired | states | inherited from booking flow |

## Requirements in this slice

| REQ | Intent | Source |
|-----|--------|--------|
| REQ-PRE01 | View tour-catalogue (Tours index, W2) | INHERITED (increment 0) — now realized against a real catalogue |
| REQ-PRE02 | View tour-detail (W3) | INHERITED |
| REQ-PRE08 | Booking-handover (deep-link tour into booking) | INHERITED |
| **REQ-WEB01** | **View home tour-showcase (W1)** | **NEW (this increment)** — see REQ-WEB01.yaml |

## Key requirement-level facts (drive P3 design)

1. **Tours are a managed catalogue entity.** PRE01/PRE02/WEB01 all precondition on
   "tours exist with status published." Increment 0 left tours as a *phantom* — the worker
   reads a `tours/catalogue.json` from R2 that is never populated, and there is **no `tours`
   table** in the D1 schema. This slice makes the catalogue real. Whether it is a D1 table,
   R2 object, or KV is a **P3/TDR design decision**, not a requirement (AORDL is
   implementation-agnostic per ROME-STD-AORDL).
2. **Sponsor decisions carried into P3 (recorded here for traceability):**
   - Catalogue is **sourced from the database** (sponsor, 2026-07-22).
   - Rendered by a **Flutter "catalogue island"** — dynamic/DB-driven now; **SEO via
     static-publish is explicitly deferred** (sponsor accepted the SEO trade-off for now).
   - Booking island is **re-themed** to the LBT design system (cream + Newsreader/Instrument Sans).
   - Domain is **friendsonbikes.uk**.
   - Gift vouchers (W8) **stubbed** this increment.
3. **Flagship set:** the home showcase (WEB01) presents three flagship tours —
   Hidden City (£45), Icons & Insights (£45), Golden Hour City (£55) — each with badge,
   duration, max group, difficulty, route highlights, hero image. The full set is the
   Tours index (PRE01).

## Acceptance (what "done" means for this slice)
- A prospect can see the flagship tours on the home page and the full list on the tours index,
  both sourced live from the catalogue, and deep-link into the (re-themed) booking flow with the
  chosen tour pre-filled (PRE08).

## Traceability note
Per REVIEW-traceability findings, this increment will record real requirement→surface→code→test
edges (including the requirement→SURFACE edge for W1/W2), not just "code exists". Contract
conformance (client island ↔ `GET /tours`) is a P5 gate condition for this slice.

## Next phase
P3 design (PMA + Clara): tours data model, catalogue API contract, catalogue-island component
spec, LBT design-system tokens, and the TDR recording "tours = D1 table, dynamic island, SEO deferred".
