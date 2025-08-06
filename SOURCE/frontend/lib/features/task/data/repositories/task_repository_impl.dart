import '../../../../core/network/dio_client.dart';
import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/services/app_logger.dart';
import '../../domain/entities/task.dart';
import '../../domain/repositories/task_repository.dart';
import '../models/task_model.dart';

class TaskRepositoryImpl implements TaskRepository {
  TaskRepositoryImpl(this._dioClient);

  final DioClient _dioClient;

  /// Parse task from the actual API response format
  Task _parseTaskFromApi(Map<String, dynamic> json) {
    // Handle different field names from API
    final id = json['_id'] as String? ?? json['id'] as String? ?? '';
    final title = json['title'] as String? ?? json['name'] as String? ?? 'Unnamed Task';
    final description = json['description'] as String? ?? '';
    final status = json['status'] as String? ?? 'todo';
    final priority = json['priority'] as String? ?? 'medium';
    
    // Parse dates
    DateTime createdAt;
    DateTime updatedAt;
    DateTime? dueDate;
    
    try {
      createdAt = DateTime.parse(json['createdAt'] as String? ?? DateTime.now().toIso8601String());
    } catch (e) {
      AppLogger.instance.warning('Failed to parse createdAt for task, using current time: $e');
      createdAt = DateTime.now();
    }
    
    try {
      updatedAt = DateTime.parse(json['updatedAt'] as String? ?? DateTime.now().toIso8601String());
    } catch (e) {
      AppLogger.instance.warning('Failed to parse updatedAt for task, using current time: $e');
      updatedAt = DateTime.now();
    }
    
    // Parse optional due date
    if (json['dueDate'] != null) {
      try {
        dueDate = DateTime.parse(json['dueDate'] as String);
      } catch (e) {
        AppLogger.instance.warning('Failed to parse dueDate for task: $e');
      }
    }
    
    // Handle projectId (could be string or object)
    String projectId = 'default-project';
    if (json['projectId'] != null) {
      if (json['projectId'] is String) {
        projectId = json['projectId'] as String;
      } else if (json['projectId'] is Map<String, dynamic>) {
        final projectObj = json['projectId'] as Map<String, dynamic>;
        projectId = projectObj['_id'] as String? ?? projectObj['id'] as String? ?? 'default-project';
      }
    }
    
    return Task(
      id: id,
      title: title,
      description: description,
      status: _parseTaskStatus(status),
      priority: _parseTaskPriority(priority),
      projectId: projectId,
      createdAt: createdAt,
      updatedAt: updatedAt,
      dueDate: dueDate,
    );
  }

  /// Parse task status from string, with fallback handling  
  TaskStatus _parseTaskStatus(String statusString) {
    switch (statusString.toLowerCase()) {
      case 'todo':
      case 'pending':
        return TaskStatus.todo;
      case 'in_progress':
      case 'inprogress':
      case 'active':
        return TaskStatus.inProgress;
      case 'review':
      case 'in_review':
        return TaskStatus.review;
      case 'blocked':
        return TaskStatus.blocked;
      case 'completed':
      case 'done':
        return TaskStatus.completed;
      case 'cancelled':
      case 'canceled':
        return TaskStatus.cancelled;
      default:
        AppLogger.instance.warning('Unknown task status: $statusString, defaulting to todo');
        return TaskStatus.todo;
    }
  }

  /// Parse task priority from string, with fallback handling
  TaskPriority _parseTaskPriority(String priorityString) {
    switch (priorityString.toLowerCase()) {
      case 'low':
        return TaskPriority.low;
      case 'medium':
        return TaskPriority.medium;
      case 'high':
        return TaskPriority.high;
      case 'urgent':
      case 'critical':
        return TaskPriority.high; // Map urgent/critical to high
      default:
        AppLogger.instance.warning('Unknown task priority: $priorityString, defaulting to medium');
        return TaskPriority.medium;
    }
  }

  @override
  Future<Result<List<Task>>> getAllTasks() async {
    try {
      AppLogger.instance.debug('Starting to fetch all tasks from ${AppConstants.tasksEndpoint}');
      
      final response = await _dioClient.get<Map<String, dynamic>>(
        AppConstants.tasksEndpoint,
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('Received null data from tasks endpoint');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw tasks API response: $data');
      
      // Handle the actual API response format: {"success": true, "data": [...]}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        AppLogger.instance.error('Tasks API returned success=false');
        return Result.failure(const ServerFailure('API request was not successful'));
      }
      
      final tasksJson = data['data'] as List<dynamic>? ?? [];
      AppLogger.instance.debug('Found ${tasksJson.length} tasks in API response');
      
      final tasks = <Task>[];
      for (final taskJson in tasksJson) {
        try {
          final task = _parseTaskFromApi(taskJson as Map<String, dynamic>);
          tasks.add(task);
        } catch (e) {
          AppLogger.instance.warning('Failed to parse task: $e, skipping task: $taskJson');
        }
      }
      
      AppLogger.instance.info('Successfully fetched ${tasks.length} tasks from API');
      return Result.success(tasks);
      
    } on ServerException catch (e) {
      AppLogger.instance.error('Server error while fetching tasks', error: e);
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error while fetching tasks', error: e);
      return Result.failure(NetworkFailure(e.message));
    } catch (e) {
      AppLogger.instance.error('Unexpected error fetching tasks: $e');
      return Result.failure(UnexpectedFailure('Failed to fetch tasks: $e'));
    }
  }

  @override
  Future<Result<Task>> getTaskById(String id) async {
    try {
      // TODO: Replace with actual API call
      await Future.delayed(const Duration(milliseconds: 500));
      return Result.failure(const ServerFailure('Task not found'));
    } catch (e) {
      return Result.failure(ServerFailure('Failed to load task: $e'));
    }
  }

  @override
  Future<Result<Task>> createTask(Task task) async {
    try {
      AppLogger.instance.debug('Creating task: ${task.title}');
      
      final taskModel = TaskModel.fromEntity(task);
      final requestData = taskModel.toCreateJson();
      AppLogger.instance.debug('Sending create task request: $requestData');
      
      final response = await _dioClient.post<Map<String, dynamic>>(
        AppConstants.tasksEndpoint,
        data: requestData,
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('No data received from create task API');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw create task API response: $data');
      
      // Handle the API response format: {"success": true, "data": {...}}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        final errorMessage = data['message'] as String? ?? 'API request was not successful';
        final errors = data['errors'] as List<dynamic>? ?? [];
        AppLogger.instance.error('Create task API returned success=false: $errorMessage, errors: $errors');
        return Result.failure(ServerFailure(errorMessage));
      }
      
      final taskData = data['data'] as Map<String, dynamic>?;
      if (taskData == null) {
        AppLogger.instance.error('No task data in successful API response');
        return Result.failure(const ServerFailure('No task data in response'));
      }
      
      final createdTask = _parseTaskFromApi(taskData);
      
      AppLogger.instance.debug('Successfully created task: ${createdTask.title}');
      return Result.success(createdTask);
      
    } on ServerException catch (e) {
      AppLogger.instance.error('Server error creating task: ${e.message}, status: ${e.statusCode}');
      if (e.statusCode == 400) {
        return Result.failure(ServerFailure('Invalid task data: ${e.message}', statusCode: e.statusCode));
      }
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error creating task: ${e.message}');
      return Result.failure(NetworkFailure(e.message));
    } on JsonValidationException catch (e) {
      AppLogger.instance.error('JSON validation error creating task: ${e.message}');
      return Result.failure(JsonValidationFailure(
        e.message,
        objectName: e.objectName,
        missingFields: e.missingFields,
        invalidTypeFields: e.invalidTypeFields,
      ));
    } catch (e) {
      AppLogger.instance.error('Unexpected error creating task: $e');
      return Result.failure(UnexpectedFailure('Failed to create task: $e'));
    }
  }

  @override
  Future<Result<Task>> updateTask(Task task) async {
    try {
      AppLogger.instance.debug('Updating task: ${task.title}');
      
      final taskModel = TaskModel.fromEntity(task);
      final response = await _dioClient.put<Map<String, dynamic>>(
        '${AppConstants.tasksEndpoint}/${task.id}',
        data: taskModel.toJson(),
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('No data received from update task API');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw update task API response: $data');
      
      // Handle the API response format: {"success": true, "data": {...}}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        final errorMessage = data['message'] as String? ?? 'API request was not successful';
        final errors = data['errors'] as List<dynamic>? ?? [];
        AppLogger.instance.error('Update task API returned success=false: $errorMessage, errors: $errors');
        return Result.failure(ServerFailure(errorMessage));
      }
      
      final taskData = data['data'] as Map<String, dynamic>?;
      if (taskData == null) {
        AppLogger.instance.error('No task data in successful API response');
        return Result.failure(const ServerFailure('No task data in response'));
      }
      
      final updatedTask = _parseTaskFromApi(taskData);
      
      AppLogger.instance.debug('Successfully updated task: ${updatedTask.title}');
      return Result.success(updatedTask);
      
    } on ServerException catch (e) {
      AppLogger.instance.error('Server error updating task: ${e.message}, status: ${e.statusCode}');
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error updating task: ${e.message}');
      return Result.failure(NetworkFailure(e.message));
    } on JsonValidationException catch (e) {
      AppLogger.instance.error('JSON validation error updating task: ${e.message}');
      return Result.failure(JsonValidationFailure(
        e.message,
        objectName: e.objectName,
        missingFields: e.missingFields,
        invalidTypeFields: e.invalidTypeFields,
      ));
    } catch (e) {
      AppLogger.instance.error('Unexpected error updating task: $e');
      return Result.failure(UnexpectedFailure('Failed to update task: $e'));
    }
  }

  @override
  Future<Result<void>> deleteTask(String id) async {
    try {
      // TODO: Replace with actual API call
      await Future.delayed(const Duration(milliseconds: 500));
      return Result.success(null);
    } catch (e) {
      return Result.failure(ServerFailure('Failed to delete task: $e'));
    }
  }

  @override
  Future<Result<List<Task>>> getTasksByStatus(TaskStatus status) async {
    try {
      AppLogger.instance.debug('Fetching tasks with status: ${status.name}');
      
      final response = await _dioClient.get<Map<String, dynamic>>(
        AppConstants.tasksEndpoint,
        queryParameters: {'status': status.name},
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('Received null data from tasks endpoint');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw tasks by status API response: $data');
      
      // Handle the actual API response format: {"success": true, "data": [...]}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        AppLogger.instance.error('Tasks by status API returned success=false');
        return Result.failure(const ServerFailure('API request was not successful'));
      }
      
      final tasksJson = data['data'] as List<dynamic>? ?? [];
      AppLogger.instance.debug('Found ${tasksJson.length} tasks with status ${status.name}');
      
      final tasks = <Task>[];
      for (final taskJson in tasksJson) {
        try {
          final task = _parseTaskFromApi(taskJson as Map<String, dynamic>);
          tasks.add(task);
        } catch (e) {
          AppLogger.instance.warning('Failed to parse task: $e, skipping task: $taskJson');
        }
      }
      
      AppLogger.instance.info('Successfully fetched ${tasks.length} tasks with status ${status.name}');
      return Result.success(tasks);
      
    } on ServerException catch (e) {
      AppLogger.instance.error('Server error while fetching tasks by status', error: e);
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error while fetching tasks by status', error: e);
      return Result.failure(NetworkFailure(e.message));
    } catch (e) {
      AppLogger.instance.error('Unexpected error fetching tasks by status: $e');
      return Result.failure(ServerFailure('Failed to load tasks by status: $e'));
    }
  }

  // Placeholder implementations for remaining methods
  @override
  Future<Result<List<Task>>> getTasksByProjectId(String projectId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Task>>> getTasksByPriority(TaskPriority priority) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Task>>> getTasksByAssignee(String assigneeId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Task>>> getOverdueTasks() async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Task>>> getTasksDueSoon() async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Task>>> searchTasks(String query) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> updateTaskStatus(String id, TaskStatus status) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> assignTask(String id, String assigneeId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> unassignTask(String id) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> updateTaskPriority(String id, TaskPriority priority) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> addTimeEntry(String id, double hours, String description) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> updateEstimatedHours(String id, double hours) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<TaskStatistics>> getTaskStatistics({String? projectId}) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Task>>> getTaskDependencies(String id) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<void>> addTaskDependency(String taskId, String dependencyId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<void>> removeTaskDependency(String taskId, String dependencyId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Task>>> getSubtasks(String parentTaskId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> createSubtask(String parentTaskId, Task subtask) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> addTagsToTask(String id, List<String> tags) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> removeTagsFromTask(String id, List<String> tags) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> uploadAttachment(String id, String filePath) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Task>> removeAttachment(String id, String attachmentId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }
}

class NotImplementedFailure extends Failure {
  const NotImplementedFailure(super.message);
}