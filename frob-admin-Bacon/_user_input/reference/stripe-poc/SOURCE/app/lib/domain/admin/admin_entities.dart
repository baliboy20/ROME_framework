import 'package:equatable/equatable.dart';

/// Status of a payment as tracked by the Worker's admin store. Mirrors the
/// Worker's `status` field on `GET /api/admin/payments` exactly.
enum AdminPaymentStatus {
  pending,
  succeeded,
  failed,
  refunded,
  partiallyRefunded,
  unknown;

  static AdminPaymentStatus fromWireValue(String value) => switch (value) {
    'pending' => AdminPaymentStatus.pending,
    'succeeded' => AdminPaymentStatus.succeeded,
    'failed' => AdminPaymentStatus.failed,
    'refunded' => AdminPaymentStatus.refunded,
    'partially_refunded' => AdminPaymentStatus.partiallyRefunded,
    _ => AdminPaymentStatus.unknown,
  };

  /// Whether a refund can be attempted against a payment in this status,
  /// per the Worker's `POST /api/admin/refund` contract.
  bool get isRefundable =>
      this == AdminPaymentStatus.succeeded ||
      this == AdminPaymentStatus.partiallyRefunded;
}

/// A single row from `GET /api/admin/payments`.
class AdminPaymentRow extends Equatable {
  final String sessionId;
  final String paymentIntentId;
  final String reference;
  final int amountPence;
  final String currency;
  final AdminPaymentStatus status;
  final String? customerEmail;
  final int? refundAmountPence;
  final String? refundId;
  final String createdAt;
  final String updatedAt;

  const AdminPaymentRow({
    required this.sessionId,
    required this.paymentIntentId,
    required this.reference,
    required this.amountPence,
    required this.currency,
    required this.status,
    this.customerEmail,
    this.refundAmountPence,
    this.refundId,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Formats [amountPence] as a currency amount for display, e.g.
  /// 2500 -> "£25.00" (assumes GBP formatting regardless of [currency],
  /// which is fine for this POC where only GBP is used).
  String get formattedAmount => '£${(amountPence / 100).toStringAsFixed(2)}';

  String? get formattedRefundAmount => refundAmountPence == null
      ? null
      : '£${(refundAmountPence! / 100).toStringAsFixed(2)}';

  factory AdminPaymentRow.fromJson(Map<String, dynamic> json) {
    return AdminPaymentRow(
      sessionId: json['session_id'] as String,
      paymentIntentId: json['payment_intent_id'] as String? ?? '',
      reference: json['reference'] as String? ?? '',
      amountPence: json['amount_pence'] as int,
      currency: json['currency'] as String? ?? 'gbp',
      status: AdminPaymentStatus.fromWireValue(json['status'] as String),
      customerEmail: json['customer_email'] as String?,
      refundAmountPence: json['refund_amount_pence'] as int?,
      refundId: json['refund_id'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      updatedAt: json['updated_at'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [
    sessionId,
    paymentIntentId,
    reference,
    amountPence,
    currency,
    status,
    customerEmail,
    refundAmountPence,
    refundId,
    createdAt,
    updatedAt,
  ];
}

/// Result of `POST /api/admin/refund`.
class RefundResult extends Equatable {
  final String refundId;
  final String status;
  final int amountPence;

  const RefundResult({
    required this.refundId,
    required this.status,
    required this.amountPence,
  });

  factory RefundResult.fromJson(Map<String, dynamic> json) {
    return RefundResult(
      refundId: json['refundId'] as String,
      status: json['status'] as String,
      amountPence: json['amount'] as int,
    );
  }

  @override
  List<Object?> get props => [refundId, status, amountPence];
}
