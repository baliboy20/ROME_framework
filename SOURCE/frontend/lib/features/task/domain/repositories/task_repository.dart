import '../../../../core/utils/result.dart';
import '../entities/task.dart';

/// Repository interface for task data operations
/// This defines the contract for task data access in the domain layer
abstract class TaskRepository {
  /// Get all tasks
  /// Returns either a failure or list of tasks
  Future<Result<List<Task>>> getAllTasks();

  /// Get task by ID
  /// Returns either a failure or the task
  Future<Result<Task>> getTaskById(String id);

  /// Get tasks by project ID
  /// Returns either a failure or list of tasks for the project
  Future<Result<List<Task>>> getTasksByProjectId(String projectId);

  /// Get tasks by status
  /// Returns either a failure or list of tasks with matching status
  Future<Result<List<Task>>> getTasksByStatus(TaskStatus status);

  /// Get tasks by priority
  /// Returns either a failure or list of tasks with matching priority
  Future<Result<List<Task>>> getTasksByPriority(TaskPriority priority);

  /// Get tasks assigned to a user
  /// Returns either a failure or list of assigned tasks
  Future<Result<List<Task>>> getTasksByAssignee(String assigneeId);

  /// Get overdue tasks
  /// Returns either a failure or list of overdue tasks
  Future<Result<List<Task>>> getOverdueTasks();

  /// Get tasks due soon (within 24 hours)
  /// Returns either a failure or list of tasks due soon
  Future<Result<List<Task>>> getTasksDueSoon();

  /// Search tasks by title or description
  /// Returns either a failure or list of matching tasks
  Future<Result<List<Task>>> searchTasks(String query);

  /// Create a new task
  /// Returns either a failure or the created task
  Future<Result<Task>> createTask(Task task);

  /// Update an existing task
  /// Returns either a failure or the updated task
  Future<Result<Task>> updateTask(Task task);

  /// Delete a task
  /// Returns either a failure or success unit
  Future<Result<void>> deleteTask(String id);

  /// Update task status
  /// Returns either a failure or the updated task
  Future<Result<Task>> updateTaskStatus(String id, TaskStatus status);

  /// Assign task to user
  /// Returns either a failure or the updated task
  Future<Result<Task>> assignTask(String id, String assigneeId);

  /// Unassign task
  /// Returns either a failure or the updated task
  Future<Result<Task>> unassignTask(String id);

  /// Update task priority
  /// Returns either a failure or the updated task
  Future<Result<Task>> updateTaskPriority(String id, TaskPriority priority);

  /// Add time tracking entry
  /// Returns either a failure or the updated task
  Future<Result<Task>> addTimeEntry(String id, double hours, String description);

  /// Update estimated hours
  /// Returns either a failure or the updated task
  Future<Result<Task>> updateEstimatedHours(String id, double hours);

  /// Get task statistics
  /// Returns either a failure or task statistics
  Future<Result<TaskStatistics>> getTaskStatistics({String? projectId});

  /// Get task dependencies
  /// Returns either a failure or list of dependent tasks
  Future<Result<List<Task>>> getTaskDependencies(String id);

  /// Add task dependency
  /// Returns either a failure or success unit
  Future<Result<void>> addTaskDependency(String taskId, String dependencyId);

  /// Remove task dependency
  /// Returns either a failure or success unit
  Future<Result<void>> removeTaskDependency(String taskId, String dependencyId);

  /// Get subtasks
  /// Returns either a failure or list of subtasks
  Future<Result<List<Task>>> getSubtasks(String parentTaskId);

  /// Create subtask
  /// Returns either a failure or the created subtask
  Future<Result<Task>> createSubtask(String parentTaskId, Task subtask);

  /// Add tags to task
  /// Returns either a failure or the updated task
  Future<Result<Task>> addTagsToTask(String id, List<String> tags);

  /// Remove tags from task
  /// Returns either a failure or the updated task
  Future<Result<Task>> removeTagsFromTask(String id, List<String> tags);

  /// Upload attachment to task
  /// Returns either a failure or the updated task with new attachment
  Future<Result<Task>> uploadAttachment(String id, String filePath);

  /// Remove attachment from task
  /// Returns either a failure or the updated task
  Future<Result<Task>> removeAttachment(String id, String attachmentId);
}

/// Task statistics model
class TaskStatistics {
  const TaskStatistics({
    required this.totalTasks,
    required this.todoTasks,
    required this.inProgressTasks,
    required this.reviewTasks,
    required this.blockedTasks,
    required this.completedTasks,
    required this.cancelledTasks,
    required this.overdueTasks,
    required this.dueSoonTasks,
    required this.averageCompletionTime,
    required this.priorityDistribution,
  });

  final int totalTasks;
  final int todoTasks;
  final int inProgressTasks;
  final int reviewTasks;
  final int blockedTasks;
  final int completedTasks;
  final int cancelledTasks;
  final int overdueTasks;
  final int dueSoonTasks;
  final Duration? averageCompletionTime;
  final Map<TaskPriority, int> priorityDistribution;

  double get completionRate {
    if (totalTasks == 0) return 0.0;
    return completedTasks / totalTasks;
  }

  @override
  String toString() {
    return 'TaskStatistics(total: $totalTasks, completed: $completedTasks, overdue: $overdueTasks)';
  }
}

/// Time tracking entry model
class TimeEntry {
  const TimeEntry({
    required this.id,
    required this.taskId,
    required this.hours,
    required this.description,
    required this.createdAt,
    this.userId,
  });

  final String id;
  final String taskId;
  final double hours;
  final String description;
  final DateTime createdAt;
  final String? userId;

  @override
  String toString() {
    return 'TimeEntry(${hours}h - $description)';
  }
}