import '../../../../core/types/result.dart';
import '../entities/hazard.dart';
import '../entities/incident.dart';

abstract class SafetyRepository {
  Future<Result<List<Incident>>> getIncidents();
  Future<Result<void>> dispatchIncident(String id);
  Future<Result<List<Hazard>>> getHazards();
  Future<Result<void>> reviewHazard(String id, String status);
}
