import 'package:equatable/equatable.dart';

/// A merchant-supplied reference for a checkout (e.g. a booking reference).
///
/// Kept as a thin value object so validation rules (non-empty, max length)
/// live in one place rather than being duplicated across the UI.
class PaymentReference extends Equatable {
  final String value;

  const PaymentReference(this.value);

  bool get isValid => value.trim().isNotEmpty && value.trim().length <= 200;

  @override
  List<Object?> get props => [value];

  @override
  String toString() => value;
}

/// An amount expressed in the smallest currency unit (pence for GBP), the
/// unit Stripe's API expects. Keeping this as a dedicated type avoids ever
/// accidentally passing pounds where pence are expected.
class AmountPence extends Equatable {
  final int value;

  const AmountPence(this.value);

  bool get isValid => value > 0;

  /// Formats as a GBP amount for display, e.g. 2500 -> "£25.00".
  String get formatted => '£${(value / 100).toStringAsFixed(2)}';

  @override
  List<Object?> get props => [value];
}

/// Status of a Stripe Checkout Session, mirrored from Stripe's own
/// `status` field (`open` | `complete` | `expired`) plus a local `pending`
/// value used before a session has been created at all, and a local
/// `failed` value used for local/transport errors that never made it to
/// Stripe.
enum CheckoutSessionStatus { pending, open, succeeded, failed }

/// Result of creating a Checkout Session server-side: the client secret
/// needed to mount Embedded Checkout, and the session id used later to
/// poll for status on the return page.
class CheckoutSessionCreated extends Equatable {
  final String clientSecret;
  final String sessionId;

  const CheckoutSessionCreated({
    required this.clientSecret,
    required this.sessionId,
  });

  @override
  List<Object?> get props => [clientSecret, sessionId];
}

/// Stripe's `payment_status` field on a Checkout Session.
enum PaymentStatus { paid, unpaid, noPaymentRequired, unknown }

/// Result of polling `GET /api/session-status`.
class SessionStatus extends Equatable {
  final CheckoutSessionStatus status;
  final PaymentStatus paymentStatus;

  const SessionStatus({required this.status, required this.paymentStatus});

  factory SessionStatus.fromWireValues({
    required String status,
    required String paymentStatus,
  }) {
    final mappedStatus = switch (status) {
      'open' => CheckoutSessionStatus.open,
      'complete' => CheckoutSessionStatus.succeeded,
      'expired' => CheckoutSessionStatus.failed,
      _ => CheckoutSessionStatus.failed,
    };
    final mappedPaymentStatus = switch (paymentStatus) {
      'paid' => PaymentStatus.paid,
      'unpaid' => PaymentStatus.unpaid,
      'no_payment_required' => PaymentStatus.noPaymentRequired,
      _ => PaymentStatus.unknown,
    };
    return SessionStatus(
      status: mappedStatus,
      paymentStatus: mappedPaymentStatus,
    );
  }

  @override
  List<Object?> get props => [status, paymentStatus];
}
