import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/bike.dart';
import '../../domain/entities/bike_record.dart';
import '../../domain/entities/compliance_item.dart';
import '../../domain/entities/departure_option.dart';
import '../../domain/entities/equipment.dart';
import '../../domain/entities/fleet_readiness.dart';
import '../../domain/repositories/fleet_repository.dart';
import '../datasources/fleet_remote_data_source.dart';

class FleetRepositoryImpl with RepositoryGuard implements FleetRepository {
  final FleetRemoteDataSource remote;
  FleetRepositoryImpl(this.remote);

  @override
  Future<Result<List<BikeSummary>>> getFleet() => guard(() async => await remote.getFleet());

  @override
  Future<Result<BikeRecord>> getBike(String id) => guard(() async => await remote.getBike(id));

  @override
  Future<Result<void>> addBike(String id, String label) =>
      guard(() async => await remote.addBike(id, label));

  @override
  Future<Result<FleetReadiness>> getFleetReadiness() =>
      guard(() async => await remote.getFleetReadiness());

  @override
  Future<Result<List<Bike>>> getAvailableBikes(String departureId) =>
      guard(() async => await remote.getAvailableBikes(departureId));

  @override
  Future<Result<void>> setBikeAssignments(String departureId, List<String> bikeIds) =>
      guard(() async => await remote.setBikeAssignments(departureId, bikeIds));

  @override
  Future<Result<void>> logMaintenance(String bikeId, String note) =>
      guard(() async => await remote.logMaintenance(bikeId, note));

  @override
  Future<Result<void>> setBikeStatus(String bikeId, String status) =>
      guard(() async => await remote.setBikeStatus(bikeId, status));

  @override
  Future<Result<List<Equipment>>> getEquipment() => guard(() async => await remote.getEquipment());

  @override
  Future<Result<void>> addEquipment(String type, String description, String purchaseDate) =>
      guard(() async => await remote.addEquipment(type, description, purchaseDate));

  @override
  Future<Result<List<ComplianceItem>>> getCompliance() =>
      guard(() async => await remote.getCompliance());

  @override
  Future<Result<void>> renewCompliance(String id, String newExpiry) =>
      guard(() async => await remote.renewCompliance(id, newExpiry));

  @override
  Future<Result<List<DepartureOption>>> getDepartureOptions() =>
      guard(() async => await remote.getDepartureOptions());
}
