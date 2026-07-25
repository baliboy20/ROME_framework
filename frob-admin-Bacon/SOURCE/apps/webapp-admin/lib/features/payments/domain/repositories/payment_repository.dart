import '../../../../core/types/result.dart';
import '../entities/payment.dart';

/// Domain contract for the payments feature. The data layer implements it;
/// presentation depends only on this abstraction. All methods return a
/// `Result` — they never throw.
abstract class PaymentRepository {
  /// A8 list — one aggregated [Payment] per booking.
  Future<Result<List<Payment>>> getPayments();

  /// UXD-01 cumulative refund. [cumulativeRefundPence] is the new refunded
  /// TOTAL for the booking, never a delta.
  Future<Result<void>> refundBooking(String bookingId, int cumulativeRefundPence);
}
