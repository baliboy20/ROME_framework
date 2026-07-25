# Architecture & Infrastructure Brief (AIB-P3) — FOB — **Revision 3**

| | |
|---|---|
| **From** | PMA (Principal Architect), dispatch `pma-P3` |
| **For** | Sponsor sign-off at the GATE-P3 checkpoint |
| **Date** | 2026-07-21 · **Revision** 3 · **Length** ~1 page |
| **Change** | Rev 2 + widened DEV-1 (admin **and** guide parchment) + verified Stripe PoC reference for the payment path. |

## Headline: revised GREENFIELD build-from-scratch architecture
FOB is a **greenfield build** (DEV-4) — nothing reused from `admin-rome`/`guide_app`; all DDL and code authored fresh from the requirements, data model, and module specs in P4/P5. Cloudflare-native stack (Workers/Pages/D1-UK/KV/R2/Cron) and 78/78 requirement coverage unchanged.

## The 4 sponsor-directed deviations (headline deltas)
| Dev | TDR | Change |
|---|---|---|
| **DEV-4** | TDR-12 | **Build from scratch.** `admin-rome` no longer canonical; no source/schema reuse. DDL authored fresh. Cloudflare stack + local-D1 Wrangler dev unchanged. |
| **DEV-3** | TDR-13 | **`mobile-guide` = Flutter Web PWA only** (iOS-native dropped). Apple Developer account dependency removed. |
| **DEV-2** | TDR-16 | **Guide PWA storage swap.** FMTC + native `sembast` → **service-worker / Cache-Storage** tiles + **`sembast_web` (IndexedDB)**. `flutter_map`, CyclOSM, `flutter_bloc`, `go_router`, GetIt retained. |
| **DEV-1** | TDR-15 | **Sponsor parchment mockup design system — now covering `webapp-admin` AND `mobile-guide`** (widened this revision). Parchment tokens ported to a Flutter theme (Clara owns detail); mockup React is layout reference only. `webapp-customer` + `webapp-editor` stay forest-palette. |

## Payment path — verified Stripe PoC (reference-only)
A verified Stripe **Embedded Checkout** PoC is staged at `_user_input/reference/stripe-poc/` (worker `checkoutSession`/`sessionStatus`/`webhook`/`reconcile`, pinned `apiVersion 2025-02-24.acacia`, `INSERT OR IGNORE` idempotency, `0001_init.sql`, Flutter Web JS interop, `LEARNINGS.md`). The `api-worker` payment routes + customer checkout island **follow its patterns as REFERENCE ONLY** — no code seeding (greenfield). Two required divergences: **Postmark not Resend** (TDR-09), and a **core-auth operator session not the PoC's static admin-key guard** (DR-B9). This retires the "no confirmed-schema shortcut" caveat **for the payment path specifically**; all other DDL/code remains greenfield-authored from spec.

## Architecture shape (unchanged)
7 components — `webapp-customer` (static HTML + Flutter islands, SEO-first, forest tokens), `webapp-admin` (Flutter Web SPA, **parchment**), `webapp-editor` (Flutter Web SPA, forest), `mobile-guide` (**Flutter Web PWA only, parchment**, offline-critical), `api-worker` (Hono + Zod), `core-data-access` (single D1 layer + migration runner), `cron-workers`. Capacity = atomic D1 decrement (TDR-08); idempotency = D1 store (TDR-05); auth = JWT HS256 1h + KV, guides via `X-Device-ID` (TDR-07); payments = Stripe Embedded Checkout, webhook-only fulfilment (TDR-06); manual static publish (TDR-14). No Durable Objects/Queues/AI/Access (TDR-02).

## Named third-party dependencies / vendors
| Vendor | Why | Swappable |
|---|---|---|
| Cloudflare (Workers/Pages/D1/KV/R2/Cron) | Whole platform | no |
| Stripe (Embedded Checkout) | Money path; verified PoC reference | costly |
| Postmark (email) | Interim v1 email (TDR-09; PoC's Resend explicitly not used) | costly (D-NOTIF-2 open) |
| Twilio (SMS/WhatsApp) | Channel configured; **PROPOSED, deferred** (TDR-10) | yes |
| Met Office DataHub + TfL | Advisory reads via Worker proxy (TDR-17) | yes |

*(Apple Developer account removed after DEV-3.)*

## Remaining real risks
- **Offline-mid-tour under a PWA (DEV-2):** browser storage quota/eviction (Cache-Storage + IndexedDB) is weaker than native — relies on pre-caching before a tour + no eviction under pressure. Validate in P5.
- **Staging D1/KV namespaces do not yet exist** (TDR-11) — create in P4.
- **`OPS08` mid-tour event entity** unnamed upstream — designed as a `mid_tour_events` placeholder.
- Greenfield DDL authored fresh from spec (payment path now has the PoC reference; everything else has no confirmed-schema shortcut).

## Needs the sponsor's confirmation
1. **TDR-10 (PROPOSED):** SMS/WhatsApp stays **deferred** for v1 (interim direct Twilio, no orchestration).
2. **Postmark-as-interim** (D-NOTIF-2) stands for v1.
3. **Must-not-invent holes** stay unbuilt: `retired`/`awaiting_external_service` bike states, scheduled-maintenance & certification-gate REQs, on-day paper waiver (DR-B7), abandonment-recovery email (DR-B8), deferred POST journeys, GDPR erasure beyond `prospects`.
4. **PWA offline-storage trade-off (DEV-2)** acceptable given the quota/eviction caveat.

## Open questions (PROPOSED TDRs / infra)
- TDR-10 messaging vendor. Met Office paid tier for severe-weather (R-D6) — not v1. Staging namespace creation — P4.

**Deviation status:** DEV-1..DEV-4 are sponsor-directed and filed by Roma; this revision conforms to them. No further PMA-originated deviations are proposed.
