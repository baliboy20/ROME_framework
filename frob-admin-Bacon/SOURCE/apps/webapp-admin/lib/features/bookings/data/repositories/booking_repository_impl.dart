import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/booking_detail.dart';
import '../../domain/repositories/booking_repository.dart';
import '../datasources/booking_remote_data_source.dart';

class BookingRepositoryImpl implements BookingRepository {
  final BookingRemoteDataSource remote;
  BookingRepositoryImpl(this.remote);

  @override
  Future<Result<BookingDetail>> getBookingDetail(String id) =>
      _guard(() async => await remote.getBookingDetail(id));

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
