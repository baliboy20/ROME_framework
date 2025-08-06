import '../../../../core/utils/result.dart';
import '../entities/task.dart';
import '../repositories/task_repository.dart';

class GetAllTasks {
  const GetAllTasks(this._repository);

  final TaskRepository _repository;

  Future<Result<List<Task>>> call() async {
    return await _repository.getAllTasks();
  }
}