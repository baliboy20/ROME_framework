import 'package:flutter/material.dart';

import '../api/booking_api.dart';
import 'booking_flow_controller.dart';
import 'hub_flow.dart';
import 'payment_step.dart';
import 'steps.dart';

/// Root widget for the booking island (W4-W10), mounted into the static
/// booking page's `#booking-island` div. Reads `?tour=` from the page URL
/// (see main.dart) to know which tour it's booking.
class BookingFlow extends StatefulWidget {
  const BookingFlow({
    required this.apiBaseUrl,
    required this.tourId,
    super.key,
  });

  final String apiBaseUrl;
  final String tourId;

  @override
  State<BookingFlow> createState() => _BookingFlowState();
}

class _BookingFlowState extends State<BookingFlow> {
  late final BookingFlowController _controller;

  /// When true, the confirmation screen has handed off to the in-app hub.
  bool _showingHub = false;

  @override
  void initState() {
    super.initState();
    _controller = BookingFlowController(
      api: BookingApi(baseUrl: widget.apiBaseUrl),
      tourId: widget.tourId,
    );
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
        return SelectionStep(controller: _controller);
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
