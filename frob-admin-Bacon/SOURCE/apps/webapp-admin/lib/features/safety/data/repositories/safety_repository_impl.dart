import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/hazard.dart';
import '../../domain/entities/incident.dart';
import '../../domain/repositories/safety_repository.dart';
import '../datasources/safety_remote_data_source.dart';

class SafetyRepositoryImpl with RepositoryGuard implements SafetyRepository {
  final SafetyRemoteDataSource remote;
  SafetyRepositoryImpl(this.remote);

  @override
  Future<Result<List<Incident>>> getIncidents() =>
      guard(() async => await remote.getIncidents());

  @override
  Future<Result<void>> dispatchIncident(String id) =>
      guard(() async => await remote.dispatchIncident(id));

  @override
  Future<Result<List<Hazard>>> getHazards() =>
      guard(() async => await remote.getHazards());

  @override
  Future<Result<void>> reviewHazard(String id, String status) =>
      guard(() async => await remote.reviewHazard(id, status));
}
