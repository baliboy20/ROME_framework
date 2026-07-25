import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/booking_created.dart';
import '../../domain/entities/booking_detail.dart';
import '../../domain/entities/booking_summary.dart';
import '../../domain/repositories/booking_repository.dart';
import '../datasources/booking_remote_data_source.dart';

class BookingRepositoryImpl with RepositoryGuard implements BookingRepository {
  final BookingRemoteDataSource remote;
  BookingRepositoryImpl(this.remote);

  @override
  Future<Result<BookingDetail>> getBookingDetail(String id) =>
      guard(() async => await remote.getBookingDetail(id));

  @override
  Future<Result<List<BookingSummary>>> getBookings() =>
      guard(() async => await remote.getBookings());

  @override
  Future<Result<List<DepartureSlot>>> getDepartures() =>
      guard(() async => await remote.getDepartures());

  @override
  Future<Result<BookingCreated>> createBooking(Map<String, dynamic> body) =>
      guard(() async => _created(await remote.createBooking(body)));

  @override
  Future<Result<BookingCreated>> createProvisionalBooking(Map<String, dynamic> body) =>
      guard(() async => _created(await remote.createProvisionalBooking(body)));

  @override
  Future<Result<void>> updateBooking(String id, Map<String, dynamic> body) =>
      guard(() async => await remote.updateBooking(id, body));

  @override
  Future<Result<void>> transitionBooking(String id, String transition) =>
      guard(() async => await remote.transitionBooking(id, transition));

  BookingCreated _created(Map<String, dynamic> j) => BookingCreated(
        id: j['id']?.toString() ?? '',
        completionLinkSent: j['completionLinkSent'] == true,
      );
}
