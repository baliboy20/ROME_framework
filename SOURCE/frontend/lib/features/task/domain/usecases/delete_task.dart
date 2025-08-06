import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/task_repository.dart';

class DeleteTask {
  const DeleteTask(this._repository);

  final TaskRepository _repository;

  Future<Result<void>> call(String id) async {
    if (id.isEmpty) {
      return Result.failure(const ValidationFailure('Task ID cannot be empty'));
    }
    
    return await _repository.deleteTask(id);
  }
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}