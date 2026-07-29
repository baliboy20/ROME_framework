# FOB — Technical Specification

| Field | Value |
|-------|-------|
| **Document UID** | FOB-TSPEC-001 |
| **Status:** | Reliable |
| **Date** | 2026-07-21T00:00:00Z |
| **Companion** | ROME-GUIDE-002 (TDR format) · the AORDL requirement set (Baseline B1) |
| **Purpose** | The **binding** technical decisions for the ROME build — the *how*, so the AORDL requirements (the *what*) build on the stack the sponsor already settled, not one the design agent invents. `prose suggests; TDRs bind.` |

**Constitution note:** every decision below was already settled — in built code, the corpus, or a ratified Decision Record — but lived as *prose* in Facts sections and DRs, which carries no build authority. This document promotes them to TDRs. `APPROVED` = build within it; `PROPOSED` = genuinely open, surfaces at the design checkpoint.

---

## Decisions (TDR table)

| id | status | scope | decision | binds | rationale | reopenIf |
|---|---|---|---|---|---|---|
| TDR-01 | APPROVED | stack | The platform is Cloudflare-native: Workers (Hono) for APIs, Pages for frontends, D1 (UK region) for data, KV for sessions/tokens, R2 for objects, Cron Triggers for scheduled jobs. | P3,P4,P5 | free-tier at launch volumes; already built | — |
| TDR-02 | APPROVED | stack | Do NOT use Durable Objects, Cloudflare Queues, AI Gateway, Vectorize, Workers AI, or Cloudflare Access. | P3,P4 | none in use; D1+KV+Cron cover the cases | concierge/AI scope re-opens |
| TDR-03 | APPROVED | data | Persistence is Cloudflare D1 (UK); all access goes through the `core-data-access` layer + a run-once, in-order migration runner. | P3,P4,P5 | UK data residency; one access pattern | — |
| TDR-04 | APPROVED | data | Money is stored as integer pence; timestamps are ISO-8601 UTC. | P5 | avoids float rounding on currency | — |
| TDR-05 | APPROVED | pattern | Idempotency (webhooks, cron sends, checkout-session creation) uses a D1 store keyed by the provider event / idempotency key (`INSERT OR IGNORE`) — not KV, not a queue. | P5 | proven in the Stripe PoC (DR-8) | — |
| TDR-06 | APPROVED | vendor | Payments use Stripe **Embedded Checkout** (`ui_mode:'embedded'`); fulfilment is driven strictly by the `checkout.session.completed` webhook, never the return page; cumulative refunds read from `charge.amount_refunded`. | P3,P5 | built pattern; POC-verified | Stripe drops Embedded Checkout |
| TDR-07 | APPROVED | pattern | Auth is JWT (Web Crypto HS256, 1h) + KV sessions for Customer (signed link) and Owner; Guides authenticate by `X-Device-ID` validated per guide. No Cloudflare Access. | P3,P5 | built in admin-rome | — |
| TDR-08 | APPROVED | pattern | Departure capacity is enforced by an atomic D1 transactional decrement of held/confirmed counts — NOT Durable Objects, NOT `held_until`+sweep. | P3,P5 | DR-B3; no DOs available | — |
| TDR-09 | APPROVED | vendor | Outbound transactional email is **Postmark** for v1. | P4,P5 | built; deliverability history | a Cloudflare-native / home-rolled email path is ready (D-NOTIF-2) |
| TDR-10 | PROPOSED | vendor | SMS/WhatsApp delivery: **direct Twilio vs Knock-orchestrated Twilio** — undecided (D-NOTIF-1). Interim: direct Twilio, no orchestration lock-in. | P4 | messaging is non-critical at v1 | — |
| TDR-11 | APPROVED | deployment | Deploy to Cloudflare Pages (customer/admin/editor) + Workers (API) on `friendsonbikes.uk`; prod D1+KV namespaces exist; **staging namespaces to be created**; secrets (Stripe, Postmark, JWT) set via Wrangler. | P4 | real prod IDs exist, un-deployed | — |
| TDR-12 | APPROVED | dev-env | Canonical source repo is **`admin-rome`** (carries CI); `rome-dev` is spurious/superseded (DR-1). Local dev runs Wrangler against a **local D1** — no in-memory substitute. | P4,P5 | dev/prod parity | — |
| TDR-13 | APPROVED | stack | `webapp-customer` is vanilla static HTML/CSS/JS + Flutter Web island widgets, per-locale static dirs (en/fr/es); `webapp-admin`/`webapp-editor` are full Flutter Web SPAs; `mobile-guide` is Flutter iOS-native (primary) + Flutter Web PWA (fallback). | P3,P5 | SEO on the public site; internal apps have none | iOS-native vs PWA at v1 (A-D1) |
| TDR-14 | APPROVED | pattern | Static publish is **manual-only** (operator-triggered rebuild of the customer site); no automated on-content-change trigger. | P3,P5 | DR-10 | — |
| TDR-15 | APPROVED | dependency | Design system = forest-palette CSS tokens + **Syne** (display) / **DM Sans** (body), self-hosted variable woff2; every customer surface renders from it; a Flutter component library is to-build. | P3,P5 | built `styles.css`; DR-11/12 | — |
| TDR-16 | APPROVED | dependency | The guide app (`mobile-guide`/GMT) stack is `flutter_map` + CyclOSM tiles + FMTC offline caching + **sembast** persistence + `flutter_bloc` + `go_router` + GetIt; offline-critical once a tour starts. | P3,P5 | built in `guide_app`; Hive explicitly rejected | — |
| TDR-17 | APPROVED | vendor | Advisory APIs: Met Office DataHub (forecast, free tier, via a **Worker proxy** so the JWT never ships to the browser) and TfL Unified API (use the `street` field — `road` is often null); both read-only, informational at v1. | P4,P5 | registered/working PoCs | Met Office paid tier for severe-weather (R-D6) |

## `decisions.tdr.yaml` (canonical — what the build machinery reads)

```yaml
tdrs:
  - {id: TDR-01, status: APPROVED, scope: stack, binds: [P3,P4,P5], decision: "Cloudflare-native: Workers(Hono)/Pages/D1(UK)/KV/R2/Cron"}
  - {id: TDR-02, status: APPROVED, scope: stack, binds: [P3,P4], decision: "No Durable Objects, Queues, AI Gateway, Vectorize, Workers AI, or Cloudflare Access", reopenIf: "concierge/AI scope re-opens"}
  - {id: TDR-03, status: APPROVED, scope: data, binds: [P3,P4,P5], decision: "Persistence is Cloudflare D1 (UK) via core-data-access + run-once in-order migration runner"}
  - {id: TDR-04, status: APPROVED, scope: data, binds: [P5], decision: "Money stored as integer pence; timestamps ISO-8601 UTC"}
  - {id: TDR-05, status: APPROVED, scope: pattern, binds: [P5], decision: "Idempotency via a D1 store keyed by provider event/idempotency key (INSERT OR IGNORE)", rationale: "DR-8"}
  - {id: TDR-06, status: APPROVED, scope: vendor, binds: [P3,P5], decision: "Stripe Embedded Checkout; fulfilment driven by checkout.session.completed webhook only; refunds read from charge.amount_refunded", reopenIf: "Stripe drops Embedded Checkout"}
  - {id: TDR-07, status: APPROVED, scope: pattern, binds: [P3,P5], decision: "JWT HS256 1h + KV sessions (Customer via signed link, Owner); Guides via X-Device-ID; no Cloudflare Access"}
  - {id: TDR-08, status: APPROVED, scope: pattern, binds: [P3,P5], decision: "Departure capacity via atomic D1 transactional decrement; not Durable Objects, not held_until+sweep", rationale: "DR-B3"}
  - {id: TDR-09, status: APPROVED, scope: vendor, binds: [P4,P5], decision: "Outbound transactional email is Postmark for v1", reopenIf: "Cloudflare-native/home-rolled email ready (D-NOTIF-2)"}
  - {id: TDR-10, status: PROPOSED, scope: vendor, binds: [P4], decision: "SMS/WhatsApp: direct Twilio vs Knock-orchestrated — undecided (D-NOTIF-1)", alternatives: ["direct Twilio: lean, no template mgmt", "Knock: orchestration if template fan-out grows"]}
  - {id: TDR-11, status: APPROVED, scope: deployment, binds: [P4], decision: "Cloudflare Pages (customer/admin/editor) + Workers (API) on friendsonbikes.uk; prod D1+KV exist; staging to create; secrets via Wrangler"}
  - {id: TDR-12, status: APPROVED, scope: dev-env, binds: [P4,P5], decision: "Canonical repo admin-rome (has CI); rome-dev superseded; local dev = Wrangler + local D1, no in-memory substitute", rationale: "DR-1"}
  - {id: TDR-13, status: APPROVED, scope: stack, binds: [P3,P5], decision: "webapp-customer = static HTML/CSS/JS + Flutter Web islands (en/fr/es dirs); webapp-admin/editor = full Flutter Web SPA; mobile-guide = Flutter iOS-native + Web PWA fallback", reopenIf: "iOS-native vs PWA at v1 (A-D1)"}
  - {id: TDR-14, status: APPROVED, scope: pattern, binds: [P3,P5], decision: "Static publish is manual-only; no automated on-change trigger", rationale: "DR-10"}
  - {id: TDR-15, status: APPROVED, scope: dependency, binds: [P3,P5], decision: "Design system = forest CSS tokens + Syne/DM Sans (self-hosted woff2); Flutter component library to-build"}
  - {id: TDR-16, status: APPROVED, scope: dependency, binds: [P3,P5], decision: "Guide app stack: flutter_map + CyclOSM + FMTC + sembast + flutter_bloc + go_router + GetIt; offline-critical mid-tour"}
  - {id: TDR-17, status: APPROVED, scope: vendor, binds: [P4,P5], decision: "Met Office DataHub (forecast, via Worker proxy) + TfL (use street field); read-only, informational at v1", reopenIf: "Met Office paid tier for severe weather (R-D6)"}
```

## Context (non-binding)
Most of the money-path and guide-app stack already exists as working code: `admin-rome` (Hono/Workers/D1/KV/Stripe/Postmark/JWT, code-complete, un-deployed) and the route-pipeline/`guide_app` (deployed capture API + partial GMT). These TDRs largely **ratify what's built** rather than choose anew. The two `PROPOSED`/`reopenIf` items (messaging vendor, email consolidation) are the only genuinely-open technical questions; both are off the critical path for a first build.

## Constraints inventory
**Existing accounts / infra (use these — cheapest info):**
- Cloudflare — prod D1 + KV namespace IDs, `friendsonbikes.uk` zone (staging IDs are placeholders).
- Stripe — test mode, GBP, Embedded Checkout + PaymentIntents implemented.
- Postmark — configured (transactional email + cron sends).
- Twilio — channel configured; **no WhatsApp Business API registration, no approved templates**.
- Met Office DataHub — free tier. TfL Unified API — registered.
- Apple Developer account — **needed** for `mobile-guide` iOS distribution (~£79/yr), not yet obtained.

**Vendors / tech to AVOID:**
- **SendGrid** — stale corpus reference only; never use (email is Postmark).
- **MailChannels** — deferred, not v1.
- **Durable Objects, Cloudflare Queues, AI Gateway, Vectorize, Cloudflare Access** — explicitly out (TDR-02).

## Pre-flight (ROME-GUIDE-002 Part 4)
- ✅ UID + `Status: Reliable`.
- ✅ Every decided thing is a TDR row; no decision-shaped prose outside the table.
- ✅ One decision / one checkable sentence / scope / explicit `binds` per TDR.
- ✅ `APPROVED` only on settled decisions; the 1 genuinely-open item is `PROPOSED` (TDR-10).
- ✅ `deployment` (TDR-11) and `dev-env` (TDR-12) covered, not just stack/vendor.
- ✅ Existing accounts / avoid-list captured.
- ✅ Not over-constrained — internal implementation detail left to the design phase.

---

## Revision Log
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 1.0 | 2026-07-21T00:00:00Z | Initial technical spec: 17 TDRs (16 APPROVED, 1 PROPOSED) constituting the settled Cloudflare/D1/KV/Stripe/Postmark/JWT/Flutter stack from built code + Decision Records into binding form. Constraints inventory + avoid-list. Completes the ROME handoff's technical-spec axis (companion to the AORDL requirement set). |
