// Stripe Embedded Checkout JS interop.
//
// CORRECTION (found by live-testing in a real browser, not by docs alone):
// both `docs.stripe.com/checkout/embedded/quickstart` and
// `docs.stripe.com/js/embedded_checkout` were read (twice, on two separate
// occasions) as saying `ui_mode: 'embedded'` pairs with
// `stripe.initEmbeddedCheckout(...)`. That is WRONG as of the Stripe.js build
// actually served at runtime — the real browser console shows:
//   "Uncaught (in promise) IntegrationError: stripe.initEmbeddedCheckout()
//    has been removed. Please use stripe.createEmbeddedCheckoutPage() instead."
// Stripe has evidently consolidated the embedded API onto
// `createEmbeddedCheckoutPage`, and no doc fetch (via WebFetch's
// summarization pass) surfaced that removal notice. See LEARNINGS.md
// "Phase 7 — Live browser fix" for the full account.
//
// This file therefore calls `createEmbeddedCheckoutPage`, NOT
// `initEmbeddedCheckout`, even though the Worker's Checkout Session is still
// created with `ui_mode: 'embedded'` (see
// SOURCE/worker/src/routes/checkoutSession.ts) — the removal notice is about
// the JS method name only; the same `clientSecret` mounts fine via the new
// method name once fixed.
//
//   const stripe = Stripe(publishableKey);
//   const checkout = await stripe.createEmbeddedCheckoutPage({
//     fetchClientSecret: async () => clientSecret,
//   });
//   checkout.mount('#checkout');
//
// `fetchClientSecret` here does NOT create a new session — the Checkout
// Session is already created by `CheckoutBloc` before this interop is ever
// invoked; this callback just hands back the secret it was given.
//
// Uses `dart:js_interop` + `package:web` (not the legacy `dart:js`/
// `dart:html`) per the project's web-interop convention.

import 'dart:js_interop';

import 'package:web/web.dart' as web;

/// Thin `@JS()` binding for the global `Stripe` constructor injected by the
/// `<script src="https://js.stripe.com/.../stripe.js">` tag loaded in
/// `web/index.html`.
@JS('Stripe')
external _JSStripeConstructor get _stripeConstructor;

typedef _JSStripeConstructor = JSFunction;

/// Options object passed to `stripe.createEmbeddedCheckoutPage(...)`.
extension type _EmbeddedCheckoutOptions._(JSObject _) implements JSObject {
  external factory _EmbeddedCheckoutOptions({JSFunction fetchClientSecret});
}

/// The `stripe` instance returned by `Stripe(publishableKey)`.
extension type _JSStripe(JSObject _) implements JSObject {
  external JSPromise<_JSEmbeddedCheckout> createEmbeddedCheckoutPage(
    _EmbeddedCheckoutOptions options,
  );
}

/// The embedded checkout instance returned once the promise above resolves.
extension type _JSEmbeddedCheckout(JSObject _) implements JSObject {
  external void mount(String selector);
  external void unmount();
  external void destroy();
}

/// Dart-side wrapper around a mounted Embedded Checkout instance, so
/// callers (the payment screen) don't need to touch JS interop types
/// directly.
class MountedEmbeddedCheckout {
  final _JSEmbeddedCheckout _checkout;

  MountedEmbeddedCheckout._(this._checkout);

  void unmount() => _checkout.unmount();
  void destroy() => _checkout.destroy();
}

/// Creates a `<div>` with the given [elementId] (not yet attached to the
/// document — the caller attaches it via `HtmlElementView`'s platform view
/// registry) that Embedded Checkout will mount its iframe into.
web.HTMLDivElement createCheckoutContainer(String elementId) {
  final div = web.document.createElement('div') as web.HTMLDivElement;
  div.id = elementId;
  return div;
}

/// Initializes Stripe.js with [publishableKey], then creates and mounts
/// Embedded Checkout into the DOM element with id `#$elementId`, using the
/// already-fetched [clientSecret].
///
/// The [elementId] div must already exist in the document (i.e. the
/// `HtmlElementView` for it must have been laid out) before calling this,
/// otherwise `mount()` will silently fail to find the selector.
Future<MountedEmbeddedCheckout> mountEmbeddedCheckout({
  required String publishableKey,
  required String clientSecret,
  required String elementId,
}) async {
  final stripe = _stripeConstructor.callAsFunction(
    null,
    publishableKey.toJS,
  ) as _JSStripe;

  // `fetchClientSecret` must be a () => Promise<string>. We already have
  // the secret (created earlier by CheckoutBloc), so just wrap it in a
  // resolved promise via an async JS function.
  JSPromise<JSString> fetchClientSecret() {
    return Future.value(clientSecret.toJS).toJS;
  }

  final options = _EmbeddedCheckoutOptions(
    fetchClientSecret: fetchClientSecret.toJS,
  );

  final checkout = await stripe.createEmbeddedCheckoutPage(options).toDart;
  checkout.mount('#$elementId');
  return MountedEmbeddedCheckout._(checkout);
}
