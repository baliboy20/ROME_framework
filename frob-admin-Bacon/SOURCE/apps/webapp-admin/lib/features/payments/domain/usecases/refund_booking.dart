import 'package:equatable/equatable.dart';
import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/payment_repository.dart';

/// UXD-01 — issue a cumulative refund against a booking.
class RefundBooking extends UseCase<void, RefundParams> {
  final PaymentRepository repository;
  RefundBooking(this.repository);

  @override
  Future<Result<void>> call(RefundParams params) =>
      repository.refundBooking(params.bookingId, params.cumulativeRefundPence);
}

class RefundParams extends Equatable {
  final String bookingId;

  /// The NEW refunded total for the booking (cumulative, never a delta).
  final int cumulativeRefundPence;

  const RefundParams({required this.bookingId, required this.cumulativeRefundPence});

  @override
  List<Object?> get props => [bookingId, cumulativeRefundPence];
}
