# FOB (Friends on Bikes) — SOURCE

Cloudflare-native tour-operations platform. 7 deployable components, one
Hono API Worker, D1 (UK) + KV + R2 + Cron. See
`ARTIFACTS/_design/architecture.md` for the full topology and
`ARTIFACTS/_config/infra-impact-brief.md` for the sponsor-facing infra
summary. **This is config scaffolding (P4/Lucien) — no feature code.** P5
robots (Ashok/Reena/Charlie) implement features into these workspaces.

## Layout

```
SOURCE/
  worker/                  api-worker (Hono+Zod) + core-data-access + cron-workers
    wrangler.toml          D1/KV/R2/Cron bindings, [env.staging]/[env.production]
    migrations/            run-once in-order D1 migration runner (TDR-03)
    .dev.vars.example      SECRET NAMES ONLY — copy to .dev.vars, never commit
  apps/
    webapp-customer/       static HTML (en/fr/es) + Flutter Web islands
    webapp-admin/          Flutter Web SPA (Owner console, parchment theme)
    webapp-editor/         Flutter Web SPA (content authoring)
    mobile-guide/           Flutter Web PWA only (guide field app)
  .github/workflows/ci.yml lint+test+build (deploy stage is manual-gated, TDR-14)
```

## Local dev loop (DEV-4 / TDR-12: Wrangler + local D1)

1. **Worker:**
   ```bash
   cd SOURCE/worker
   npm install
   cp .dev.vars.example .dev.vars   # fill with your own TEST credentials
   npm run db:migrate:local          # applies migrations/ to local D1 (miniflare)
   npm run dev                       # wrangler dev, http://localhost:8787
   ```
2. **Any Flutter app** (webapp-admin/webapp-editor/mobile-guide):
   ```bash
   cd SOURCE/apps/<app>
   flutter pub get
   flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8787
   ```
3. **webapp-customer** is static HTML — open the per-locale dir directly, or
   serve with any static file server; islands are built separately
   (`SOURCE/apps/webapp-customer/README.md`).

**Dev/prod runtime divergence (declared, not silent):** local dev uses
Wrangler local D1 + miniflare; staging/production use Cloudflare edge
D1/KV/R2. Same bindings, different runtime backing — see
`ARTIFACTS/_config/config-manifest.json` (`devRuntimeDiffers: true`).

## Environments

| Env | D1/KV/R2 | Notes |
|---|---|---|
| dev (local) | Wrangler local D1 (miniflare) | no real secrets; `.dev.vars` |
| staging | **to be created** | see infra-impact-brief.md |
| production | already exist (sponsor-provisioned) | `friendsonbikes.uk`, placeholder ids in `wrangler.toml` must be replaced by ops before first deploy |

## Secrets (TDR-11 — via Wrangler, never in source)

```bash
wrangler secret put STRIPE_SECRET_KEY [--env staging|production]
wrangler secret put STRIPE_WEBHOOK_SECRET [--env staging|production]
wrangler secret put JWT_SECRET [--env staging|production]
wrangler secret put POSTMARK_TOKEN [--env staging|production]
wrangler secret put MET_OFFICE_KEY [--env staging|production]
wrangler secret put TFL_APP_KEY [--env staging|production]
```

## Deploy

Deploy is **manual-gated** (mirrors TDR-14's manual-publish posture) via
GitHub Actions `workflow_dispatch` (`SOURCE/.github/workflows/ci.yml`) or
directly:

```bash
cd SOURCE/worker && npm run deploy:staging      # or deploy:production
```

Each Flutter/static app deploys to its own Cloudflare Pages project — see
the per-app README under `SOURCE/apps/*/README.md`.

## Binding TDRs honored by this scaffold

TDR-01 (Workers/Pages/D1-UK/KV/R2/Cron), TDR-02 (no DO/Queues/AI
Gateway/Vectorize/Workers AI/Access — none present here), TDR-03 (D1 UK +
core-data-access + run-once in-order migration runner), TDR-09 (Postmark
secret name only, no Resend), TDR-11 (friendsonbikes.uk deploy target;
prod D1/KV exist, staging to be created; secrets via Wrangler), TDR-17 (Met
Office + TfL secret names for the Worker proxy). DEV-4/TDR-12 (greenfield,
local dev = Wrangler + local D1), DEV-3 (mobile-guide Flutter Web PWA
only), DEV-2 (guide offline via Cache-Storage + sembast_web).
