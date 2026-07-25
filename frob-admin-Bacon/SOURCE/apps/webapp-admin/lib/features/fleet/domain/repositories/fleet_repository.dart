import '../../../../core/types/result.dart';
import '../entities/bike.dart';
import '../entities/bike_record.dart';
import '../entities/compliance_item.dart';
import '../entities/departure_option.dart';
import '../entities/equipment.dart';
import '../entities/fleet_readiness.dart';

abstract class FleetRepository {
  Future<Result<List<BikeSummary>>> getFleet();
  Future<Result<BikeRecord>> getBike(String id);
  Future<Result<void>> addBike(String id, String label);
  Future<Result<FleetReadiness>> getFleetReadiness();
  Future<Result<List<Bike>>> getAvailableBikes(String departureId);
  Future<Result<void>> setBikeAssignments(String departureId, List<String> bikeIds);
  Future<Result<void>> logMaintenance(String bikeId, String note);
  Future<Result<void>> setBikeStatus(String bikeId, String status);
  Future<Result<List<Equipment>>> getEquipment();
  Future<Result<void>> addEquipment(String type, String description, String purchaseDate);
  Future<Result<List<ComplianceItem>>> getCompliance();
  Future<Result<void>> renewCompliance(String id, String newExpiry);
  Future<Result<List<DepartureOption>>> getDepartureOptions();
}
