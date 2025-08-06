import '../../../../core/utils/result.dart';
import '../entities/task.dart';
import '../repositories/task_repository.dart';

class GetTasksByStatus {
  const GetTasksByStatus(this._repository);

  final TaskRepository _repository;

  Future<Result<List<Task>>> call(TaskStatus status) async {
    return await _repository.getTasksByStatus(status);
  }
}