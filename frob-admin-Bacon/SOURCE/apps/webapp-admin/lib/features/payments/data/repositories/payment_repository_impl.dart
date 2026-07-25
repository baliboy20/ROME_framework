import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/payment.dart';
import '../../domain/repositories/payment_repository.dart';
import '../datasources/payment_remote_data_source.dart';

/// Catches data-source exceptions and maps them to `Result`. Never throws.
class PaymentRepositoryImpl implements PaymentRepository {
  final PaymentRemoteDataSource remote;
  PaymentRepositoryImpl(this.remote);

  @override
  Future<Result<List<Payment>>> getPayments() =>
      _guard(() async => await remote.getPayments());

  @override
  Future<Result<void>> refundBooking(String bookingId, int cumulativeRefundPence) =>
      _guard(() async {
        await remote.refundBooking(bookingId, cumulativeRefundPence);
      });

  /// Single exception→Failure mapping shared by every repository method.
  Future<Result<T>> _guard<T>(Future<T> Function() run) async {
    try {
      return Success(await run());
    } on AuthException catch (e) {
      return Error(AuthFailure(e.message));
    } on ValidationException catch (e) {
      return Error(ValidationFailure(e.message));
    } on NetworkException catch (e) {
      return Error(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Error(ServerFailure(e.message, statusCode: e.statusCode));
    } catch (_) {
      return const Error(ServerFailure('Something went wrong. Please try again.'));
    }
  }
}
