import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../entities/task.dart';
import '../repositories/task_repository.dart';

class UpdateTask {
  const UpdateTask(this._repository);

  final TaskRepository _repository;

  Future<Result<Task>> call(Task task) async {
    // Validate input
    final validationResult = _validateTask(task);
    if (validationResult != null) {
      return Result.failure(validationResult);
    }

    // Update the task's updatedAt timestamp
    final updatedTask = task.copyWith(
      updatedAt: DateTime.now(),
    );

    return await _repository.updateTask(updatedTask);
  }

  ValidationFailure? _validateTask(Task task) {
    if (task.id.isEmpty) {
      return const ValidationFailure('Task ID cannot be empty');
    }

    if (task.title.trim().isEmpty) {
      return const ValidationFailure('Task title cannot be empty');
    }

    if (task.title.length > 200) {
      return const ValidationFailure('Task title cannot exceed 200 characters');
    }

    if (task.description.length > 2000) {
      return const ValidationFailure('Task description cannot exceed 2000 characters');
    }

    if (task.projectId.isEmpty) {
      return const ValidationFailure('Project ID is required');
    }

    if (task.estimatedHours != null && task.estimatedHours! < 0) {
      return const ValidationFailure('Estimated hours cannot be negative');
    }

    if (task.actualHours != null && task.actualHours! < 0) {
      return const ValidationFailure('Actual hours cannot be negative');
    }

    return null;
  }
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}