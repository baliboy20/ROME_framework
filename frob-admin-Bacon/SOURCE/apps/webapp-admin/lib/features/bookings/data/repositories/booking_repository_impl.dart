import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/booking_detail.dart';
import '../../domain/repositories/booking_repository.dart';
import '../datasources/booking_remote_data_source.dart';

class BookingRepositoryImpl with RepositoryGuard implements BookingRepository {
  final BookingRemoteDataSource remote;
  BookingRepositoryImpl(this.remote);

  @override
  Future<Result<BookingDetail>> getBookingDetail(String id) =>
      guard(() async => await remote.getBookingDetail(id));
}
