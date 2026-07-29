// Stripe Embedded Checkout JS interop for the customer booking island
// (BOOK04, TDR-06).
//
// Reference-only source: `_user_input/reference/stripe-poc/SOURCE/app/lib/
// presentation/stripe_embedded_checkout_interop.dart`. That PoC's
// LEARNINGS.md records a live-browser correction: Stripe.js has removed
// `stripe.initEmbeddedCheckout()` in favour of
// `stripe.createEmbeddedCheckoutPage()`, even though the Checkout Session on
// the worker side is still created with `ui_mode: 'embedded'`. This file
// follows that verified finding (`createEmbeddedCheckoutPage`) rather than
// the (now-incorrect) `initEmbeddedCheckout` name, per DEV-4 "PoC patterns
// as reference only, no code copied" — the pattern is reproduced here
// greenfield for webapp-customer.
//
// Uses `dart:js_interop` + `package:web`, no `dart:js`/`dart:html`.

import 'dart:js_interop';

import 'package:web/web.dart' as web;

@JS('Stripe')
external _JSStripeConstructor get _stripeConstructor;

typedef _JSStripeConstructor = JSFunction;

extension type _EmbeddedCheckoutOptions._(JSObject _) implements JSObject {
  external factory _EmbeddedCheckoutOptions({JSFunction fetchClientSecret});
}

extension type _JSStripe(JSObject _) implements JSObject {
  external JSPromise<_JSEmbeddedCheckout> createEmbeddedCheckoutPage(
    _EmbeddedCheckoutOptions options,
  );
}

extension type _JSEmbeddedCheckout(JSObject _) implements JSObject {
  external void mount(String selector);
  external void unmount();
  external void destroy();
}

/// Dart-side wrapper so callers (the payment step widget) don't touch JS
/// interop types directly.
class MountedEmbeddedCheckout {
  MountedEmbeddedCheckout._(this._checkout);

  final _JSEmbeddedCheckout _checkout;

  void unmount() => _checkout.unmount();
  void destroy() => _checkout.destroy();
}

/// Creates a `<div id="$elementId">` for `HtmlElementView` to host, not yet
/// attached to the document.
web.HTMLDivElement createCheckoutContainer(String elementId) {
  final div = web.document.createElement('div') as web.HTMLDivElement;
  div.id = elementId;
  return div;
}

/// Initializes Stripe.js with [publishableKey] and mounts Embedded Checkout
/// into `#$elementId` using the already-fetched [clientSecret] (fetched via
/// `BookingApi.createCheckoutSession`, BOOK04). The [elementId] div must
/// already be laid out in the document before calling this.
Future<MountedEmbeddedCheckout> mountEmbeddedCheckout({
  required String publishableKey,
  required String clientSecret,
  required String elementId,
}) async {
  final stripe = _stripeConstructor.callAsFunction(
    null,
    publishableKey.toJS,
  ) as _JSStripe;

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
