import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/bike.dart';
import '../entities/bike_record.dart';
import '../entities/compliance_item.dart';
import '../entities/departure_option.dart';
import '../entities/equipment.dart';
import '../entities/fleet_readiness.dart';
import '../repositories/fleet_repository.dart';

class GetFleet extends UseCase<List<BikeSummary>, NoParams> {
  final FleetRepository repository;
  GetFleet(this.repository);
  @override
  Future<Result<List<BikeSummary>>> call(NoParams params) => repository.getFleet();
}

class GetBike extends UseCase<BikeRecord, String> {
  final FleetRepository repository;
  GetBike(this.repository);
  @override
  Future<Result<BikeRecord>> call(String id) => repository.getBike(id);
}

class AddBike extends UseCase<void, AddBikeParams> {
  final FleetRepository repository;
  AddBike(this.repository);
  @override
  Future<Result<void>> call(AddBikeParams p) => repository.addBike(p.id, p.label);
}

class AddBikeParams {
  final String id;
  final String label;
  const AddBikeParams(this.id, this.label);
}

class GetFleetReadiness extends UseCase<FleetReadiness, NoParams> {
  final FleetRepository repository;
  GetFleetReadiness(this.repository);
  @override
  Future<Result<FleetReadiness>> call(NoParams params) => repository.getFleetReadiness();
}

class GetAvailableBikes extends UseCase<List<Bike>, String> {
  final FleetRepository repository;
  GetAvailableBikes(this.repository);
  @override
  Future<Result<List<Bike>>> call(String departureId) => repository.getAvailableBikes(departureId);
}

class SetBikeAssignments extends UseCase<void, AssignmentParams> {
  final FleetRepository repository;
  SetBikeAssignments(this.repository);
  @override
  Future<Result<void>> call(AssignmentParams p) =>
      repository.setBikeAssignments(p.departureId, p.bikeIds);
}

class AssignmentParams {
  final String departureId;
  final List<String> bikeIds;
  const AssignmentParams(this.departureId, this.bikeIds);
}

class LogMaintenance extends UseCase<void, MaintenanceParams> {
  final FleetRepository repository;
  LogMaintenance(this.repository);
  @override
  Future<Result<void>> call(MaintenanceParams p) => repository.logMaintenance(p.bikeId, p.note);
}

class MaintenanceParams {
  final String bikeId;
  final String note;
  const MaintenanceParams(this.bikeId, this.note);
}

class SetBikeStatus extends UseCase<void, StatusParams> {
  final FleetRepository repository;
  SetBikeStatus(this.repository);
  @override
  Future<Result<void>> call(StatusParams p) => repository.setBikeStatus(p.bikeId, p.status);
}

class StatusParams {
  final String bikeId;
  final String status;
  const StatusParams(this.bikeId, this.status);
}

class GetEquipment extends UseCase<List<Equipment>, NoParams> {
  final FleetRepository repository;
  GetEquipment(this.repository);
  @override
  Future<Result<List<Equipment>>> call(NoParams params) => repository.getEquipment();
}

class AddEquipment extends UseCase<void, AddEquipmentParams> {
  final FleetRepository repository;
  AddEquipment(this.repository);
  @override
  Future<Result<void>> call(AddEquipmentParams p) =>
      repository.addEquipment(p.type, p.description, p.purchaseDate);
}

class AddEquipmentParams {
  final String type;
  final String description;
  final String purchaseDate;
  const AddEquipmentParams(this.type, this.description, this.purchaseDate);
}

class GetCompliance extends UseCase<List<ComplianceItem>, NoParams> {
  final FleetRepository repository;
  GetCompliance(this.repository);
  @override
  Future<Result<List<ComplianceItem>>> call(NoParams params) => repository.getCompliance();
}

class RenewCompliance extends UseCase<void, RenewParams> {
  final FleetRepository repository;
  RenewCompliance(this.repository);
  @override
  Future<Result<void>> call(RenewParams p) => repository.renewCompliance(p.id, p.newExpiry);
}

class RenewParams {
  final String id;
  final String newExpiry;
  const RenewParams(this.id, this.newExpiry);
}

class GetDepartureOptions extends UseCase<List<DepartureOption>, NoParams> {
  final FleetRepository repository;
  GetDepartureOptions(this.repository);
  @override
  Future<Result<List<DepartureOption>>> call(NoParams params) => repository.getDepartureOptions();
}
