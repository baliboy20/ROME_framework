import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../application/payment/session_status_bloc.dart';

/// Page Stripe redirects the customer to after Embedded Checkout completes,
/// via the Checkout Session's `return_url` template:
///
///   {apiBaseUrl-or-app-origin}/return?session_id={CHECKOUT_SESSION_ID}
///
/// IMPORTANT: this screen is informational only. It tells the customer
/// what happened so they're not left staring at a blank page, but it does
/// NOT drive fulfilment — that is (and must remain) the responsibility of
/// the server-side Stripe webhook, which is the only trustworthy source of
/// truth for "was this actually paid". A customer closing this tab, losing
/// connectivity, or this poll failing must never block a webhook-driven
/// booking confirmation.
class ReturnScreen extends StatefulWidget {
  final String? sessionId;

  const ReturnScreen({super.key, required this.sessionId});

  @override
  State<ReturnScreen> createState() => _ReturnScreenState();
}

class _ReturnScreenState extends State<ReturnScreen> {
  @override
  void initState() {
    super.initState();
    final sessionId = widget.sessionId;
    if (sessionId != null && sessionId.isNotEmpty) {
      context.read<SessionStatusBloc>().add(
        SessionStatusCheckRequested(sessionId),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment result')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: widget.sessionId == null || widget.sessionId!.isEmpty
                ? const Text('No session_id found in the URL.')
                : BlocBuilder<SessionStatusBloc, SessionStatusState>(
                    builder: (context, state) => _buildForState(context, state),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildForState(BuildContext context, SessionStatusState state) {
    final (icon, color, message) = switch (state) {
      SessionStatusInitial() ||
      SessionStatusLoading() => (
        Icons.hourglass_top,
        Colors.blueGrey,
        'Checking payment status…',
      ),
      SessionStatusPaid() => (Icons.check_circle, Colors.green, 'Paid ✅'),
      SessionStatusFailed(:final message) => (
        Icons.cancel,
        Colors.red,
        'Failed ❌\n$message',
      ),
      SessionStatusStillProcessing() => (
        Icons.hourglass_bottom,
        Colors.orange,
        'Still processing…\n\nThis can take a little longer than expected. '
            'Your booking will be confirmed automatically once Stripe '
            'notifies our server — you do not need to keep this page open.',
      ),
      SessionStatusError(:final message) => (
        Icons.error_outline,
        Colors.red,
        'Something went wrong checking status:\n$message',
      ),
    };

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 64, color: color),
        const SizedBox(height: 16),
        Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 24),
        // Reminder for anyone reading the UI, not just the code comments.
        const Text(
          'Note: this page is informational only. Fulfilment is driven '
          'server-side by the Stripe webhook, not by this page loading.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }
}
