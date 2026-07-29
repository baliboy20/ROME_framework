import 'package:flutter/material.dart';

import '../api/booking_api.dart';
import '../theme/tokens.dart';
import 'booking_flow_controller.dart';
import 'hub_flow.dart';
import 'payment_step.dart';
import 'steps.dart';

/// DR-B11 (FINDING-004) — magic-link landing page. Booted from
/// `?mode=complete&token=<link_token>` (see main.dart) when the customer
/// clicks the completion link mailed for an owner-created (REQ-BOOK08) or
/// provisional (REQ-BOOK10) booking. Exchanges the link token for a session
/// via [BookingFlowController.startFromCompletionLink], then reuses the
/// same attendees/consent/review/payment/confirmation steps as the normal
/// self-service booking island (steps.dart) — the Owner never enters this
/// data on the customer's behalf; only the customer's own action here
/// satisfies REQ-BOOK03's waiver/terms consent invariant (DR-B7).
class CompletionFlow extends StatefulWidget {
  const CompletionFlow({
    required this.apiBaseUrl,
    required this.linkToken,
    super.key,
  });

  final String apiBaseUrl;
  final String linkToken;

  @override
  State<CompletionFlow> createState() => _CompletionFlowState();
}

class _CompletionFlowState extends State<CompletionFlow> {
  late final BookingFlowController _controller;
  bool _started = false;
  bool _showingHub = false;

  @override
  void initState() {
    super.initState();
    _controller = BookingFlowController(
      api: BookingApi(baseUrl: widget.apiBaseUrl),
      tourId: '',
    );
    _controller.startFromCompletionLink(widget.linkToken).then((_) {
      if (mounted) setState(() => _started = true);
    });
  }

  @override
  void dispose() {
    _controller.api.close();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        if (_controller.loading && !_started) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ),
          );
        }
        if (_controller.errorMessage != null && _controller.bookingId == null) {
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('This link isn\'t valid',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: ForestTokens.space4),
                Text(
                  'It may have expired, or already been used. Contact us and '
                  'we\'ll send a fresh one.',
                ),
              ],
            ),
          );
        }
        if (_showingHub && _controller.bookingId != null) {
          return HubFlow(
            apiBaseUrl: widget.apiBaseUrl,
            bookingId: _controller.bookingId!,
            token: _controller.authToken,
            onExit: () => setState(() => _showingHub = false),
          );
        }
        return Padding(
          padding: const EdgeInsets.all(16),
          child: _stepFor(_controller.step),
        );
      },
    );
  }

  Widget _stepFor(BookingStep step) {
    switch (step) {
      case BookingStep.selection:
        // Not reachable here — the Owner already selected the departure.
        return const SizedBox.shrink();
      case BookingStep.attendees:
        return AttendeesStep(controller: _controller);
      case BookingStep.consent:
        return ConsentStep(controller: _controller);
      case BookingStep.review:
        return ReviewStep(controller: _controller);
      case BookingStep.payment:
        return PaymentStep(controller: _controller);
      case BookingStep.confirmed:
        return ConfirmationStep(
          controller: _controller,
          onManageBooking: () => setState(() => _showingHub = true),
        );
    }
  }
}
