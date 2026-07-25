import 'admin_entities.dart';

/// Abstract boundary between the admin application layer (BLoCs) and
/// whatever transport is used to talk to the Worker's admin API. Kept
/// separate from [PaymentRepository] (rather than folded in) because the
/// admin endpoints require a distinct auth header (`X-Admin-Key`) and serve
/// a different concern (back-office operations vs. the customer checkout
/// flow).
abstract class AdminRepository {
  /// Calls `GET /api/admin/payments` on the Worker, attaching the
  /// `X-Admin-Key` header, and returns the full list of tracked payments.
  Future<List<AdminPaymentRow>> listPayments();

  /// Calls `POST /api/admin/refund` on the Worker, attaching the
  /// `X-Admin-Key` header. Omit [amountPence] for a full refund.
  Future<RefundResult> refund({required String sessionId, int? amountPence});
}
