import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/hazard.dart';
import '../entities/incident.dart';
import '../repositories/safety_repository.dart';

class GetIncidents extends UseCase<List<Incident>, NoParams> {
  final SafetyRepository repository;
  GetIncidents(this.repository);
  @override
  Future<Result<List<Incident>>> call(NoParams params) => repository.getIncidents();
}

class DispatchIncident extends UseCase<void, String> {
  final SafetyRepository repository;
  DispatchIncident(this.repository);
  @override
  Future<Result<void>> call(String id) => repository.dispatchIncident(id);
}

class GetHazards extends UseCase<List<Hazard>, NoParams> {
  final SafetyRepository repository;
  GetHazards(this.repository);
  @override
  Future<Result<List<Hazard>>> call(NoParams params) => repository.getHazards();
}

class ReviewHazard extends UseCase<void, ReviewHazardParams> {
  final SafetyRepository repository;
  ReviewHazard(this.repository);
  @override
  Future<Result<void>> call(ReviewHazardParams p) => repository.reviewHazard(p.id, p.status);
}

class ReviewHazardParams {
  final String id;
  final String status;
  const ReviewHazardParams(this.id, this.status);
}
