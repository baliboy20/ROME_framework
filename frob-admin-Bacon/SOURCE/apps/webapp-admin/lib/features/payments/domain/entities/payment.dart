import 'package:equatable/equatable.dart';

/// Payment state as the business understands it — independent of any UI pill.
/// Presentation maps this to a [StatusPillState] for rendering.
enum PaymentStatus { succeeded, requiresPayment, refunded, failed, noShow, draft }

/// A booking's aggregated payment position, as shown in the A8 list (one row
/// per booking). Pure, immutable, Equatable — no JSON, no Flutter.
class Payment extends Equatable {
  final String bookingId;
  final String bookingRef;
  final String customerName;
  final int paidPence;
  final int refundedPence;
  final PaymentStatus status;
  final String providerRef;

  /// When money last moved for this booking — the latest payment row's
  /// timestamp. Null for bookings with no payment yet (drafts).
  final DateTime? lastPaymentAt;

  const Payment({
    required this.bookingId,
    required this.bookingRef,
    required this.customerName,
    required this.paidPence,
    required this.refundedPence,
    required this.status,
    required this.providerRef,
    this.lastPaymentAt,
  });

  Payment copyWith({int? refundedPence, PaymentStatus? status}) => Payment(
        bookingId: bookingId,
        bookingRef: bookingRef,
        customerName: customerName,
        paidPence: paidPence,
        refundedPence: refundedPence ?? this.refundedPence,
        status: status ?? this.status,
        providerRef: providerRef,
        lastPaymentAt: lastPaymentAt,
      );

  @override
  List<Object?> get props =>
      [bookingId, bookingRef, customerName, paidPence, refundedPence, status, providerRef, lastPaymentAt];
}
