# mobile-guide (guide field app — Flutter Web PWA only)

**satisfies: TDR-13/16 as revised by DEV-2/DEV-3.** iOS-native primary
dropped (DEV-3) — no Apple Developer account dependency. Stack:
`flutter_map` + CyclOSM tiles + `flutter_bloc` + `go_router` + `get_it`
retained; FMTC and default (native) `sembast` are swapped for **service
worker / Cache-Storage** tile caching + **`sembast_web`** (IndexedDB) data
persistence (DEV-2 — Hive still rejected).

Design system: also renders from the sponsor parchment mockup tokens
(DEV-1, widened to cover mobile-guide) ported to a Flutter theme.

Auth: every request carries `X-Device-ID` (satisfies: TDR-07 — guides hold
no JWT/KV session), not a login session.

**Offline-mid-tour caveat (DEV-2):** browser storage quota/eviction is
weaker than native storage. The offline-critical guarantee (TDR-16) depends
on pre-caching tiles/data before a tour starts and the browser not evicting
under memory pressure — carried as a risk in infra-impact-brief.md.

Owns REQ IDs: AUTH03, OPS01–OPS11 (excl. OPS12), OPS13.
See component-specs.md#mobile-guide.

## Local dev (SCAFFOLD — P5 fills in `lib/`)

```bash
flutter pub get
flutter run -d chrome
```

Register a service worker for tile Cache-Storage; use `sembast_web` for the
IndexedDB-backed store — do not add native `sembast`/FMTC/Hive.

## Build & deploy (installable PWA via Cloudflare Pages)

```bash
flutter build web --release --pwa-strategy=offline-first
wrangler pages deploy build/web --project-name=fob-mobile-guide
```

No App Store / Play Store distribution — installable PWA only.
