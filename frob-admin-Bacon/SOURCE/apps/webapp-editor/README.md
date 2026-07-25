# webapp-editor (content authoring)

Flutter Web SPA — full app, no SEO (satisfies: TDR-13). No REQ IDs
exclusively owned this run; present in topology for the manual publish
workflow (TDR-14) — publish control (`POST /publish`) shared with
webapp-admin (A6, SEO03). See component-specs.md#webapp-editor.

Track A (Forest — Syne/DM Sans) per design-system.md §1-§7; the editor is
a customer/content-facing surface and stays forest, not parchment (DEV-1).

## Local dev

```bash
flutter pub get
flutter run -d chrome
```

## Tests

```bash
flutter analyze
flutter test
```

## Build & deploy (Cloudflare Pages)

```bash
flutter build web --release
wrangler pages deploy build/web --project-name=fob-webapp-editor
```
