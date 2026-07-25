import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

import 'stripe_embedded_checkout_interop.dart';

/// Registers a unique HTML view factory (once per widget instance) that
/// hosts the `<div>` Stripe's Embedded Checkout mounts its iframe into, and
/// wraps it in an `HtmlElementView` so it can live inside the Flutter
/// widget tree.
///
/// This widget only manages the DOM container + view registration; the
/// actual `stripe.createEmbeddedCheckoutPage(...)` / `.mount()` call happens
/// once, in [State.initState], via [mountEmbeddedCheckout].
class EmbeddedCheckoutView extends StatefulWidget {
  final String publishableKey;
  final String clientSecret;

  const EmbeddedCheckoutView({
    super.key,
    required this.publishableKey,
    required this.clientSecret,
  });

  @override
  State<EmbeddedCheckoutView> createState() => _EmbeddedCheckoutViewState();
}

class _EmbeddedCheckoutViewState extends State<EmbeddedCheckoutView> {
  late final String _elementId;
  MountedEmbeddedCheckout? _mounted;

  @override
  void initState() {
    super.initState();
    // Unique per mount so re-creating this widget (e.g. hot reload, or a
    // second attempt after an error) doesn't collide with a stale view
    // factory registration for the same id.
    _elementId =
        'stripe-embedded-checkout-${identityHashCode(this)}-'
        '${DateTime.now().microsecondsSinceEpoch}';

    // ignore: undefined_prefixed_name
    ui_web.platformViewRegistry.registerViewFactory(_elementId, (int viewId) {
      return createCheckoutContainer(_elementId);
    });

    // Mount Stripe's Embedded Checkout into the div once it's had a chance
    // to be attached to the document by the platform view.
    WidgetsBinding.instance.addPostFrameCallback((_) => _mount());
  }

  Future<void> _mount() async {
    final mounted = await mountEmbeddedCheckout(
      publishableKey: widget.publishableKey,
      clientSecret: widget.clientSecret,
      elementId: _elementId,
    );
    if (this.mounted) {
      setState(() => _mounted = mounted);
    }
  }

  @override
  void dispose() {
    _mounted?.destroy();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _elementId);
  }
}
