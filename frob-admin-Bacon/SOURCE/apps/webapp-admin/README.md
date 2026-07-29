# webapp-admin (Owner/operator console)

**Flutter macOS desktop app** — full app, no SEO (satisfies: TDR-13 as revised
by **DEV-5**; the Flutter Web SPA target is retired). The directory and pubspec
name still say `webapp-admin`/`fob_webapp_admin` — accepted naming debt, see
`architecture-impact-brief-DEV-5.md`. Design system:
sponsor parchment mockup tokens (DEV-1 / TDR-15), ported to a Flutter theme
by Clara (P5 design-system work) — mockup React components are layout
reference only, not reused code.

Owns REQ IDs: BO04–06, BOOK08/10/11/12/13/14, FLEET01–08, OPS12, OPS14,
PRE05, NOTIF02/04, CNA03, SEO03 (publish, shared with webapp-editor),
AUTH01, AUTH05 (owner). See component-specs.md#webapp-admin.

## Local dev (SCAFFOLD — P5 fills in `lib/`)

```bash
flutter pub get
flutter run -d macos
```

Talks to `api-worker` over JSON fetch; owner session via JWT + KV
(satisfies: TDR-07). Point `--dart-define=API_BASE_URL=http://localhost:8787`
at the local Worker (`SOURCE/worker`, `npm run dev`).

Requires `flutter config --enable-macos-desktop` and Xcode command-line tools.
The `macos/` target is scaffolded and the sandbox entitlement
`com.apple.security.network.client` is already declared in both
`DebugProfile.entitlements` and `Release.entitlements` — without it every API
call fails silently, so do not remove it.

## Build & distribute (signed .app)

```bash
flutter build macos --release
# output: build/macos/Build/Products/Release/*.app
# then: codesign with a Developer ID, notarise, and staple
```

**NOT YET PROVISIONED.** DEV-5 reinstates the Apple Developer account
dependency that DEV-3 removed, and `_config/infra-impact-brief.md` has no
signing, notarisation, or update-distribution provision. The previous
Cloudflare Pages pipeline (`wrangler pages deploy build/web`) no longer
applies, and `SOURCE/.github/workflows/ci.yml` still builds the retired web
target — both are outstanding P4/P5 work.

Distribution stays manual/gated, matching the TDR-14 manual-publish posture
used elsewhere in this system.
