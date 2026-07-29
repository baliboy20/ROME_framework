import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/departure.dart';
import '../../domain/entities/departure_detail.dart';
import '../../domain/entities/lookups.dart';
import '../../domain/entities/tour.dart';
import '../../domain/repositories/scheduling_repository.dart';
import '../datasources/scheduling_remote_data_source.dart';

class SchedulingRepositoryImpl with RepositoryGuard implements SchedulingRepository {
  final SchedulingRemoteDataSource remote;
  SchedulingRepositoryImpl(this.remote);

  @override
  Future<Result<List<Departure>>> getCalendar() => guard(() async => await remote.getCalendar());

  @override
  Future<Result<DepartureDetail>> getDeparture(String id) =>
      guard(() async => await remote.getDeparture(id));

  @override
  Future<Result<List<Tour>>> getTours() => guard(() async => await remote.getTours());

  @override
  Future<Result<void>> createTour(Map<String, dynamic> body) =>
      guard(() async => await remote.createTour(body));

  @override
  Future<Result<void>> updateTour(String id, Map<String, dynamic> body) =>
      guard(() async => await remote.updateTour(id, body));

  @override
  Future<Result<void>> deleteTour(String id) => guard(() async => await remote.deleteTour(id));

  @override
  Future<Result<List<DepartureEditOption>>> getDepartures() =>
      guard(() async => await remote.getDepartures());

  @override
  Future<Result<List<GuideOption>>> getGuides() => guard(() async => await remote.getGuides());

  @override
  Future<Result<void>> createDeparture(Map<String, dynamic> body) =>
      guard(() async => await remote.createDeparture(body));

  @override
  Future<Result<void>> updateDeparture(String id, Map<String, dynamic> body) =>
      guard(() async => await remote.updateDeparture(id, body));

  @override
  Future<Result<void>> cancelDeparture(String id, {Map<String, dynamic>? notice}) =>
      guard(() async => await remote.cancelDeparture(id, notice: notice));
}
