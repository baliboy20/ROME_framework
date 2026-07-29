import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'booking_flow_controller.dart';
import 'embedded_checkout_view.dart';

/// W8 - payment, mounts Stripe Embedded Checkout inline (no redirect;
/// BOOK04, TDR-06). On decline, this widget stays on-page and shows an
/// inline error, matching the prototype's "never redirects" behaviour.
class PaymentStep extends StatefulWidget {
  const PaymentStep({required this.controller, super.key});

  final BookingFlowController controller;

  @override
  State<PaymentStep> createState() => _PaymentStepState();
}

class _PaymentStepState extends State<PaymentStep> {
  @override
  void initState() {
    super.initState();
    if (widget.controller.checkoutClientSecret == null) {
      widget.controller.startCheckout();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) {
        final c = widget.controller;
        if (c.loading && c.checkoutClientSecret == null) {
          return const Center(child: CircularProgressIndicator());
        }
        if (c.errorMessage != null && c.checkoutClientSecret == null) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(c.errorMessage!,
                  style: const TextStyle(color: ForestTokens.error)),
              const SizedBox(height: ForestTokens.space4),
              ElevatedButton(
                onPressed: c.startCheckout,
                child: const Text('Retry'),
              ),
            ],
          );
        }
        if (c.checkoutClientSecret == null || c.checkoutPublishableKey == null) {
          return const SizedBox.shrink();
        }
        return SizedBox(
          height: 480,
          child: EmbeddedCheckoutView(
            publishableKey: c.checkoutPublishableKey!,
            clientSecret: c.checkoutClientSecret!,
          ),
        );
      },
    );
  }
}
