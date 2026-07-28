# webapp-customer (public marketing/booking/tour-hub site)

**satisfies: TDR-13, TDR-15 (forest CSS tokens).** Stack: static
HTML/CSS/JS per-locale directories (`en/`, `fr/`, `es/`) with Flutter Web
**island** widgets mounted into specific DOM nodes (availability widget,
Stripe Embedded Checkout mount, tour-hub interactive pieces) — NOT a full
Flutter SPA. SEO-first: crawlers see server-static HTML; islands hydrate
only the interactive widgets.

Owns REQ IDs (frontend): PRE01/02/03/04/06/08, BOOK01–07, TOUR01/04/06/08/09,
POST03/10, CNA01/02, SEO01/02, AUTH02/04/05 (customer).
See component-specs.md#webapp-customer.

## Directory shape (P5 — filled in)

```
en/                       # English static pages (P5 content: home, tours
                           # catalogue, tour detail, booking-page shell)
  index.html               # W11 homepage
  site.css                  # Track A Cream & Ink shared stylesheet (DEV-4, design-system.md §7)
  island-loader.js          # no-JS-safe bootstrap for island mount points
  tours/
    index.html               # W11 tour catalogue
    hidden-city.html          # W12 tour detail (per-tour static page)
  book/
    index.html               # W4-W10 booking flow shell — static page with
                              # a single `.island-mount[data-island="booking"]`
                              # div; content-readable no-JS fallback inside it
    flutter/                  # `flutter build web` OUTPUT for the booking
                              # island, copied here at publish time (see
                              # below) — do not hand-edit
fr/, es/                  # locale dirs, scaffolded (P6+ fills in translated
                           # static content; the booking island is
                           # locale-agnostic and shared)
flutter/                  # Flutter Web island SOURCE for the booking flow
                           # (W4-W10: selection, attendees, consent, review,
                           # embedded Stripe checkout, confirmation).
                           # `fob_webapp_customer_booking_island` package.
  lib/
    theme/tokens.dart          # Track A Forest tokens ported to Flutter
    api/booking_api.dart       # BOOK01-04 client (api-contracts.md)
    interop/stripe_embedded_checkout_interop.dart
                                # Stripe Embedded Checkout JS interop
                                # (BOOK04, TDR-06) — follows the verified
                                # stripe-poc reference finding that Stripe.js
                                # now uses `createEmbeddedCheckoutPage`, not
                                # the (removed) `initEmbeddedCheckout`.
    widgets/                   # booking_flow.dart + one widget per step
    main.dart                  # entry point; reads `?tour=` and the
                                # `<meta name="fob-api-base">` tag from the
                                # host page
  web/index.html                # includes `<script src="https://js.stripe.com/v3/">`
                                 # and the `fob-api-base` meta tag
  test/booking_flow_test.dart   # controller + widget tests (incl. the
                                 # "consent never pre-ticked" invariant)
```

Only the booking flow (W4-W10) is built as an island in this pass — it is
the one stateful/transactional surface required end-to-end by BOOK01-08.
Other TDR-13-flagged interactive widgets (tour-hub W13-W15/W17-W19/W21)
share the same `flutter/` pattern and can be added as additional
entry points / mount points later without restructuring the static site.

## Static publish (TDR-14 — manual, operator-triggered only)

`webapp-admin` / `webapp-editor` call `POST /publish` on `api-worker`,
which regenerates the per-locale static HTML (SEO01) + sitemap (SEO02) and
pushes to Cloudflare Pages/R2. There is no on-content-change trigger.

## Build

```bash
# 1. Booking island (Flutter Web), base-href matches its mount path below
#    the locale dir (`en/book/flutter/`):
cd flutter
flutter pub get
flutter analyze
flutter test
flutter build web --release --base-href=/book/

# 2. Copy the island build output into the static page's mount directory
#    (this copy step is what the real `POST /publish` pipeline automates —
#    done by hand here for the P5 build-verify pass):
cp -r flutter/build/web/* en/book/flutter/

# 3. Static HTML: no build step — deploy the locale directories as-is.
```

## Deploy (Cloudflare Pages)

```bash
wrangler pages deploy . --project-name=fob-webapp-customer
```
