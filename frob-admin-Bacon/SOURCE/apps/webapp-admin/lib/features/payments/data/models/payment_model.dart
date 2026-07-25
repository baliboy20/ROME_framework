import '../../domain/entities/payment.dart';

/// DTO for the A8 list row. Extends [Payment], adds JSON parsing and tolerates
/// the field-name variants the worker has emitted across contract revisions.
class PaymentModel extends Payment {
  const PaymentModel({
    required super.bookingId,
    required super.bookingRef,
    required super.customerName,
    required super.paidPence,
    required super.refundedPence,
    required super.status,
    required super.providerRef,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> j) => PaymentModel(
        bookingId: j['booking_id']?.toString() ?? j['id']?.toString() ?? '',
        bookingRef: j['booking_ref']?.toString() ?? j['ref']?.toString() ?? '',
        customerName: j['customer_name']?.toString() ?? 'Unknown',
        paidPence: (j['paid_pence'] as num?)?.toInt() ?? 0,
        refundedPence: (j['refunded_pence'] as num?)?.toInt() ?? 0,
        // FINDING-001: payment state lives in `payment_status`; `status` is the
        // booking status, not a payment state.
        status: paymentStatusFromString(j['payment_status']?.toString()),
        providerRef: j['provider_ref']?.toString() ?? '',
      );
}

PaymentStatus paymentStatusFromString(String? s) {
  switch (s) {
    case 'succeeded':
    case 'paid':
      return PaymentStatus.succeeded;
    case 'requires_payment':
    case 'requires_payment_method':
      return PaymentStatus.requiresPayment;
    case 'refunded':
    case 'partially_refunded':
      return PaymentStatus.refunded;
    case 'failed':
      return PaymentStatus.failed;
    case 'no_show':
    case 'noshow':
      return PaymentStatus.noShow;
    default:
      return PaymentStatus.draft;
  }
}
