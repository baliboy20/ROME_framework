# FINDING-003 — Design-fidelity drift vs the approved parchment mockup

- **Increment:** 0
- **Component:** webapp-admin (and likely mobile-guide, which shares the parchment system)
- **Raised by:** Roma (sponsor visual comparison, dev build vs mockup)
- **Date:** 2026-07-22
- **Severity:** MEDIUM — functional but visibly off the approved design (DEV-1/TDR-15).

## Summary
The built admin console works but looks materially different from the sponsor
parchment mockup. Two root causes:

1. **Fonts referenced but never bundled.** The theme (`lib/theme/tokens.dart`)
   names `Playfair Display` (serif titles/price) and `Plus Jakarta Sans` (body),
   but neither was declared in `pubspec.yaml`, bundled as an asset, or linked in
   `web/index.html`. Flutter web silently fell back to Roboto, removing the
   serif/parchment character on every screen. **FIXED 2026-07-22**: downloaded
   the two variable fonts to `assets/fonts/`, declared them in pubspec, and added
   a Google Fonts `<link>` in web/index.html. Family names match the theme.

2. **Layout-composition fidelity.** Screens implement the correct DATA but not the
   mockup's compositions — e.g. the A19 Booking browser mockup is a two-pane
   master-detail with a richly sectioned booking-record card (attendees table,
   emergency/payment/waiver/T&C grid, status pills, serif accent price, status
   history); the build renders a plain full-width table + a minimal popup dialog.
   The mockup React components were "layout reference only," and P5 generation
   optimised for functional wiring over visual parity. NOT yet addressed — this is
   per-screen design work.

## Root cause (same gate gap as FINDING-001/002)
GATE-P5 verified builds/tests/functional coverage, never visual conformance to the
approved mockup. Recommend adding a **design-fidelity check** to P5 (fonts actually
load; key screens match the mockup composition) alongside the contract-conformance
and surface-coverage checks already recommended.

## Status
- Font bundling: RESOLVED (admin, 2026-07-22). RESOLVED for mobile-guide
  2026-07-24 — same bug (Playfair Display/Plus Jakarta Sans referenced in
  fob_theme.dart, no pubspec fonts block, no assets, no CDN link); fixed by
  copying admin's bundled .ttf assets into mobile-guide/assets/fonts, adding
  the pubspec fonts block, and adding the Google Fonts CDN link to
  web/index.html. `flutter pub get` + `flutter analyze` clean.
  webapp-customer already had Newsreader/Instrument Sans bundled — no bug there.
  webapp-editor had the same bug (Syne/DM Sans referenced in forest_theme.dart,
  nothing bundled, no assets dir at all) — partially fixed 2026-07-24: added
  Google Fonts CDN link only (no local .ttf files were available to bundle as
  assets, unlike the other three apps). Note this deviates from
  fob_theme.dart's stated intent ("self-hosted, no Google Fonts CDN at runtime"
  per DEV-1/TDR-15 §8.6) — same deviation already accepted for admin's fix, but
  should be flagged at re-gate since editor never got local assets like the
  others did.
- Layout-composition fidelity: OPEN — per-screen restyle to mockup compositions.
