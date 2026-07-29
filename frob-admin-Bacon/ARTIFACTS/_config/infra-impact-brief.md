# AIB-P4 — Infrastructure Impact Brief (Config)

| | |
|---|---|
| **Author** | Lucien (Configuration Specialist), dispatch `lucien-P4` |
| **Phase** | P4 (Config) |
| **Status** | PROPOSED — for GATE-P4 / sponsor CONFIRM/DELEGATE (`sponsorInfra`) |
| **Binds** | TDR-01, TDR-02, TDR-03, TDR-09, TDR-11, TDR-17 (all APPROVED, bind P4); DEV-4/TDR-12, DEV-3, DEV-2 (sponsor-approved deviations) |

## Environments

Three: **dev** (local, per-developer, Wrangler + local D1/miniflare —
DEV-4/TDR-12), **staging**, **production**. Production deploys to
`friendsonbikes.uk` (TDR-11).

## Bindings (per component, satisfies TDR-01/TDR-02)

`api-worker` (co-locating `core-data-access` and `cron-workers` in the same
Wrangler bundle) binds: **D1** (`DB`, UK region, sole access path via
`core-data-access` + run-once in-order migration runner, TDR-03), **KV**
(`SESSIONS` + `IDEMPOTENCY` namespaces, TDR-07 session backing), **R2**
(`ASSETS` bucket), and **4 Cron triggers** — `gdpr-cleanup` 03:00,
`send-reminders` 08:00, `send-review-requests` 09:00, `compliance-check`
04:00 (additional scheduled jobs share these slots, dispatched by
time-of-day). No Durable Objects, Queues, AI Gateway, Vectorize, Workers
AI, or Cloudflare Access anywhere in this scaffold (TDR-02) — capacity
concurrency is a D1 atomic decrement, idempotency a D1 store, auth is
JWT+KV/`X-Device-ID`, all handled without those excluded primitives.

## Secrets — who sets what, via Wrangler only (TDR-11)

Six secret names only, no values, ever committed:
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`,
`POSTMARK_TOKEN`, `MET_OFFICE_KEY`, `TFL_APP_KEY`. Local dev: each
developer copies `SOURCE/worker/.dev.vars.example` to `.dev.vars`
(gitignored) with their own sandbox/test credentials. Staging/production:
**ops (sponsor-side, holder of the Cloudflare account)** runs
`wrangler secret put <NAME> --env staging|production` for each — this
brief does not and cannot set them. `wrangler.toml` carries only
placeholder resource ids (`<prod-d1-id>` etc.), never real ids or secrets.

## Staging-namespace creation task (open, blocks staging deploy)

Sponsor confirms **production D1 + KV namespaces already exist**; **staging
D1 + KV namespaces do not** (per architecture-impact-brief.md). Before any
staging deploy: ops must run `wrangler d1 create fob-d1-staging` and
`wrangler kv namespace create SESSIONS`/`IDEMPOTENCY` (staging), then
replace the `<staging-*-TO-BE-CREATED>` placeholders in
`SOURCE/worker/wrangler.toml`. Not done by Lucien (no live Cloudflare
account access in P4) — flagged here as the concrete follow-up task.

## Vendor posture (delta from AIB-P3: none — same vendor set, now with
concrete secret-name wiring)

- **Postmark** (email) — interim v1 (TDR-09; the Stripe-poc reference used
  Resend — explicitly **not** carried forward). `POSTMARK_TOKEN` secret.
  Swappable: costly (D-NOTIF-2 open — a Cloudflare-native email path may
  supersede later).
- **Twilio** (SMS/WhatsApp) — **deferred** for v1 (TDR-10 PROPOSED,
  D-NOTIF-1). No secret wired yet; `message.provider` kept a plain string
  in the data model, not an enum, to avoid lock-in. Swappable: yes.
- **Met Office DataHub** + **TfL Unified API** — advisory reads via a
  Worker proxy only (TDR-17), never called directly from any frontend.
  `MET_OFFICE_KEY` / `TFL_APP_KEY` secrets. Swappable: yes.
- **Stripe** (Embedded Checkout, TDR-06) — `STRIPE_SECRET_KEY` +
  `STRIPE_WEBHOOK_SECRET`. Fulfilment is webhook-only; payments path
  follows the stripe-poc reference conventions (reference only, no code
  seeding) with two required divergences already noted in P3: Postmark not
  Resend, and a core-auth operator session not the PoC's static admin-key
  guard.

## Sponsor's local dev loop

`cd SOURCE/worker && npm install && cp .dev.vars.example .dev.vars` (fill
with test creds) `&& npm run db:migrate:local && npm run dev` — Wrangler
dev server on `:8787` against local D1 (miniflare). Each Flutter app:
`flutter pub get && flutter run -d chrome --dart-define=API_BASE_URL=...`.
Full sequence in `SOURCE/README.md`.

## Dev/prod runtime divergence (declared — ROME-AX-28)

`devRuntimeDiffers: true`. Local dev runs Wrangler local D1 + miniflare;
staging/production run on real Cloudflare edge D1/KV/R2. Same bindings and
schema apply in both — only the runtime backing differs, so nothing built
against local D1 silently breaks in production. See
`config-manifest.json`.

## Standards in force

No dedicated expert-pack/skill dispatch mechanism was exercised in this P4
run beyond the wrangler/D1 conventions referenced from the stripe-poc
(reference only). **NO-PACK** for: Flutter Web PWA offline-storage
patterns (sembast_web/Cache-Storage) and Hono/Zod Worker route
conventions — no codified standard exists in this repo yet; P5 should
follow the patterns documented in each component README and
`api-contracts.md`.

## Risks

- **Guide-app offline reliability (DEV-2):** browser storage quota/eviction
  is weaker than native storage; the offline-critical guarantee for
  mid-tour guide use now depends on pre-caching before departure and the
  browser not evicting under pressure. Carried forward from P3, unchanged
  by P4 scaffolding.
- **Staging namespaces not yet created** — see task above; staging deploys
  will fail until ops provisions them.
- **Placeholder production ids** in `wrangler.toml` must be replaced by ops
  before first production deploy — deploying with placeholders will fail
  fast (not silently), which is the intended safety behaviour.

## What needs sponsor confirmation (GATE-P4 / `sponsorInfra`)

1. **CONFIRM** the three-environment topology (dev/staging/production) and
   that production D1+KV already exist under the sponsor's Cloudflare
   account (ids to be supplied to ops, never checked into source).
2. **CONFIRM** who on the sponsor side runs the staging-namespace creation
   task and secret `wrangler secret put` commands (this brief cannot
   perform them without live account access).
3. **CONFIRM** the Postmark(interim)/Twilio(deferred) vendor posture
   carries into P5 unchanged, or **REDIRECT** if vendor decisions have
   moved since P3.
