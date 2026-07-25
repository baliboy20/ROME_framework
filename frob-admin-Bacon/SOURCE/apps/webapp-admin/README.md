# webapp-admin (Owner/operator console)

Flutter Web SPA — full app, no SEO (satisfies: TDR-13). Design system:
sponsor parchment mockup tokens (DEV-1 / TDR-15), ported to a Flutter theme
by Clara (P5 design-system work) — mockup React components are layout
reference only, not reused code.

Owns REQ IDs: BO04–06, BOOK08/10/11/12/13/14, FLEET01–08, OPS12, OPS14,
PRE05, NOTIF02/04, CNA03, SEO03 (publish, shared with webapp-editor),
AUTH01, AUTH05 (owner). See component-specs.md#webapp-admin.

## Local dev (SCAFFOLD — P5 fills in `lib/`)

```bash
flutter pub get
flutter run -d chrome
```

Talks to `api-worker` over JSON fetch; owner session via JWT + KV
(satisfies: TDR-07). Point `--dart-define=API_BASE_URL=http://localhost:8787`
at the local Worker (`SOURCE/worker`, `npm run dev`).

## Build & deploy (Cloudflare Pages)

```bash
flutter build web --release
# deploy the build/web output as a Cloudflare Pages project
wrangler pages deploy build/web --project-name=fob-webapp-admin
```

Staging/production Pages projects are provisioned per infra-impact-brief.md.
Deploy is manual/gated in CI (`SOURCE/.github/workflows/ci.yml`), matching
the TDR-14 manual-publish posture used elsewhere in this system.
