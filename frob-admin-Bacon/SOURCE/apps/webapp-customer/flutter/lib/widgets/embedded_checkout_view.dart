import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

import '../interop/stripe_embedded_checkout_interop.dart';

/// Registers a unique HTML view factory hosting the `<div>` Stripe's
/// Embedded Checkout mounts its iframe into, wrapped in `HtmlElementView` so
/// it lives inside the Flutter widget tree (W8 payment step, BOOK04,
/// TDR-06). Pattern follows the verified stripe-poc reference (reference
/// only, no code copied — see `interop/stripe_embedded_checkout_interop.dart`
/// header) using `createEmbeddedCheckoutPage`, not the removed
/// `initEmbeddedCheckout`.
class EmbeddedCheckoutView extends StatefulWidget {
  const EmbeddedCheckoutView({
    required this.publishableKey,
    required this.clientSecret,
    super.key,
  });

  final String publishableKey;
  final String clientSecret;

  @override
  State<EmbeddedCheckoutView> createState() => _EmbeddedCheckoutViewState();
}

class _EmbeddedCheckoutViewState extends State<EmbeddedCheckoutView> {
  late final String _elementId;
  MountedEmbeddedCheckout? _mounted;

  @override
  void initState() {
    super.initState();
    _elementId = 'stripe-embedded-checkout-${identityHashCode(this)}-'
        '${DateTime.now().microsecondsSinceEpoch}';

    // ignore: undefined_prefixed_name
    ui_web.platformViewRegistry.registerViewFactory(_elementId, (int viewId) {
      return createCheckoutContainer(_elementId);
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => _mount());
  }

  Future<void> _mount() async {
    final result = await mountEmbeddedCheckout(
      publishableKey: widget.publishableKey,
      clientSecret: widget.clientSecret,
      elementId: _elementId,
    );
    if (mounted) {
      setState(() => _mounted = result);
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
