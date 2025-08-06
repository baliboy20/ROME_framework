import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../entities/task.dart';
import '../repositories/task_repository.dart';

class CreateTask {
  const CreateTask(this._repository);

  final TaskRepository _repository;

  Future<Result<Task>> call(CreateTaskParams params) async {
    // Validate input
    final validationResult = _validateParams(params);
    if (validationResult != null) {
      return Result.failure(validationResult);
    }

    // Create task entity
    final task = Task(
      id: '', // Will be assigned by the server
      title: params.title,
      description: params.description,
      status: params.status,
      priority: params.priority,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      projectId: params.projectId,
      projectTitle: params.projectTitle,
      assigneeId: params.assigneeId,
      dueDate: params.dueDate,
      estimatedHours: params.estimatedHours,
      tags: params.tags,
    );

    return await _repository.createTask(task);
  }

  ValidationFailure? _validateParams(CreateTaskParams params) {
    if (params.title.trim().isEmpty) {
      return const ValidationFailure('Task title cannot be empty');
    }

    if (params.title.length > 200) {
      return const ValidationFailure('Task title cannot exceed 200 characters');
    }

    if (params.description.length > 2000) {
      return const ValidationFailure('Task description cannot exceed 2000 characters');
    }

    if (params.projectId.isEmpty) {
      return const ValidationFailure('Project ID is required');
    }

    if (params.estimatedHours != null && params.estimatedHours! < 0) {
      return const ValidationFailure('Estimated hours cannot be negative');
    }

    return null;
  }
}

class CreateTaskParams {
  const CreateTaskParams({
    required this.title,
    required this.description,
    required this.status,
    required this.priority,
    required this.projectId,
    this.projectTitle,
    this.assigneeId,
    this.dueDate,
    this.estimatedHours,
    this.tags = const [],
  });

  final String title;
  final String description;
  final TaskStatus status;
  final TaskPriority priority;
  final String projectId;
  final String? projectTitle;
  final String? assigneeId;
  final DateTime? dueDate;
  final double? estimatedHours;
  final List<String> tags;

  @override
  String toString() {
    return 'CreateTaskParams(title: $title, status: $status, priority: $priority)';
  }
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}