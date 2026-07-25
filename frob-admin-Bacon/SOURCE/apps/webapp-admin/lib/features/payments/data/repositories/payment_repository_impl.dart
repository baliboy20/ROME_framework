import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/payment.dart';
import '../../domain/repositories/payment_repository.dart';
import '../datasources/payment_remote_data_source.dart';

/// Catches data-source exceptions and maps them to `Result`. Never throws.
class PaymentRepositoryImpl with RepositoryGuard implements PaymentRepository {
  final PaymentRemoteDataSource remote;
  PaymentRepositoryImpl(this.remote);

  @override
  Future<Result<List<Payment>>> getPayments() =>
      guard(() async => await remote.getPayments());

  @override
  Future<Result<void>> refundBooking(String bookingId, int cumulativeRefundPence) =>
      guard(() async => await remote.refundBooking(bookingId, cumulativeRefundPence));
}
