import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../application/payment/checkout_bloc.dart';
import '../core/env.dart';
import 'embedded_checkout_view.dart';
import 'test_card_panel.dart';

/// Entry screen: a simple form (fixed test amount + editable reference)
/// that creates a Stripe Checkout Session, then mounts Embedded Checkout
/// once the bloc has a `clientSecret`.
class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  // Fixed POC test amount: £25.00.
  static const int _amountPence = 2500;

  final _referenceController = TextEditingController(
    text: 'booking-poc-001',
  );

  @override
  void dispose() {
    _referenceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Friends on Bikes — Payment POC'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pushNamed('/admin'),
            child: const Text('Admin →'),
          ),
        ],
      ),
      body: BlocBuilder<CheckoutBloc, CheckoutState>(
        builder: (context, state) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (state is! CheckoutReady) ...[
                      _buildForm(context, state),
                    ] else ...[
                      _buildCheckout(context, state),
                    ],
                    const SizedBox(height: 24),
                    const TestCardPanel(),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildForm(BuildContext context, CheckoutState state) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Amount: £${(_amountPence / 100).toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _referenceController,
              decoration: const InputDecoration(
                labelText: 'Booking reference',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            if (state is CheckoutError)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  state.message,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            FilledButton(
              onPressed: state is CheckoutLoading ? null : _onPay,
              child: state is CheckoutLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Pay'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckout(BuildContext context, CheckoutReady state) {
    if (Env.stripePublishableKey.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'STRIPE_PUBLISHABLE_KEY was not provided via --dart-define, '
            'so Embedded Checkout cannot be mounted.',
          ),
        ),
      );
    }
    return SizedBox(
      height: 720,
      child: EmbeddedCheckoutView(
        publishableKey: Env.stripePublishableKey,
        clientSecret: state.clientSecret,
      ),
    );
  }

  void _onPay() {
    context.read<CheckoutBloc>().add(
      CheckoutSubmitted(
        amountPence: _amountPence,
        reference: _referenceController.text,
      ),
    );
  }
}
