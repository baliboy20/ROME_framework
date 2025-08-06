import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/project_repository.dart';

class DeleteProject {
  const DeleteProject(this._repository);

  final ProjectRepository _repository;

  Future<Result<void>> call(String id) async {
    if (id.isEmpty) {
      return Result.failure(const ValidationFailure('Project ID cannot be empty'));
    }
    
    return await _repository.deleteProject(id);
  }
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}