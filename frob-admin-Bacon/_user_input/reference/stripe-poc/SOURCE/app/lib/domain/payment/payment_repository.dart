import 'payment_entities.dart';

/// Abstract boundary between the application layer (BLoCs) and whatever
/// transport is used to talk to the Worker API. The infrastructure layer
/// provides the concrete `http`-based implementation; tests can provide a
/// fake without touching the network.
abstract class PaymentRepository {
  /// Calls `POST /api/checkout-session` on the Worker to create a Stripe
  /// Checkout Session in `ui_mode: embedded` and returns its client secret.
  Future<CheckoutSessionCreated> createCheckoutSession({
    required int amountPence,
    required String reference,
    String? customerEmail,
  });

  /// Calls `GET /api/session-status?session_id=...` on the Worker to check
  /// the current status of a previously-created Checkout Session.
  Future<SessionStatus> getSessionStatus(String sessionId);
}
