import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../entities/project.dart';
import '../repositories/project_repository.dart';

/// Use case for retrieving a project by ID
class GetProjectById {
  const GetProjectById(this._repository);

  final ProjectRepository _repository;

  /// Execute the use case to get a project by ID
  /// [id] The project ID to retrieve
  Future<Result<Project>> call(String id) async {
    if (id.isEmpty) {
      return Result.failure(const ValidationFailure('Project ID cannot be empty'));
    }
    
    return await _repository.getProjectById(id);
  }
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}