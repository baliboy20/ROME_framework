import '../../../../core/utils/json_verification_service.dart';
import '../../domain/entities/task.dart';
import '../../domain/repositories/task_repository.dart';

/// Data model for Task with JSON serialization
/// Handles conversion between JSON and domain entities
class TaskModel {
  const TaskModel({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.priority,
    required this.createdAt,
    required this.updatedAt,
    required this.projectId,
    this.projectTitle,
    this.assigneeId,
    this.dueDate,
    this.completedAt,
    this.estimatedHours,
    this.actualHours,
    this.tags = const [],
    this.attachments = const [],
    this.dependencies = const [],
  });

  final String id;
  final String title;
  final String description;
  final String status; // String representation for JSON
  final String priority; // String representation for JSON
  final DateTime createdAt;
  final DateTime updatedAt;
  final String projectId;
  final String? projectTitle; // Denormalized project title for UI display
  final String? assigneeId;
  final DateTime? dueDate;
  final DateTime? completedAt;
  final double? estimatedHours;
  final double? actualHours;
  final List<String> tags;
  final List<String> attachments;
  final List<String> dependencies;

  /// Convert from JSON using JsonVerificationService
  factory TaskModel.fromJson(Map<String, dynamic> json) {
    try {
      // Verify required fields
      JsonVerificationService.verifyRequiredFields(
        json,
        {
          'id': String,
          'title': String,
          'description': String,
          'status': String,
          'priority': String,
          'createdAt': String,
          'updatedAt': String,
          'projectId': String,
        },
        objectName: 'TaskModel',
      );

      // Verify optional fields
      JsonVerificationService.verifyOptionalFields(
        json,
        {
          'projectTitle': String,
          'assigneeId': String,
          'dueDate': String,
          'completedAt': String,
          'estimatedHours': double,
          'actualHours': double,
          'tags': List<dynamic>,
          'attachments': List<dynamic>,
          'dependencies': List<dynamic>,
        },
        objectName: 'TaskModel',
      );

      return TaskModel(
        id: JsonVerificationService.getRequiredField<String>(json, 'id'),
        title: JsonVerificationService.getRequiredField<String>(json, 'title'),
        description: JsonVerificationService.getRequiredField<String>(json, 'description'),
        status: JsonVerificationService.getRequiredField<String>(json, 'status'),
        priority: JsonVerificationService.getRequiredField<String>(json, 'priority'),
        createdAt: JsonVerificationService.getRequiredDateTime(json, 'createdAt'),
        updatedAt: JsonVerificationService.getRequiredDateTime(json, 'updatedAt'),
        projectId: JsonVerificationService.getRequiredField<String>(json, 'projectId'),
        projectTitle: JsonVerificationService.getOptionalField<String>(json, 'projectTitle'),
        assigneeId: JsonVerificationService.getOptionalField<String>(json, 'assigneeId'),
        dueDate: JsonVerificationService.getOptionalDateTime(json, 'dueDate'),
        completedAt: JsonVerificationService.getOptionalDateTime(json, 'completedAt'),
        estimatedHours: JsonVerificationService.getOptionalField<double>(json, 'estimatedHours'),
        actualHours: JsonVerificationService.getOptionalField<double>(json, 'actualHours'),
        tags: JsonVerificationService.getOptionalList<String>(json, 'tags') ?? [],
        attachments: JsonVerificationService.getOptionalList<String>(json, 'attachments') ?? [],
        dependencies: JsonVerificationService.getOptionalList<String>(json, 'dependencies') ?? [],
      );
    } catch (e) {
      throw FormatException('Failed to parse TaskModel from JSON: $e');
    }
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) 'id': id, // Only include ID if it's not empty (for updates)
      'title': title,
      'description': description,
      'status': status,
      'priority': priority,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'projectId': projectId,
      if (projectTitle != null && projectTitle!.isNotEmpty) 'projectTitle': projectTitle,
      if (assigneeId != null) 'assigneeId': assigneeId,
      if (dueDate != null) 'dueDate': dueDate!.toIso8601String(),
      if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
      if (estimatedHours != null) 'estimatedHours': estimatedHours,
      if (actualHours != null) 'actualHours': actualHours,
      'tags': tags,
      'attachments': attachments,
      'dependencies': dependencies,
    };
  }

  /// Convert to JSON for creation (excludes server-managed fields)
  Map<String, dynamic> toCreateJson() {
    return {
      'title': title,
      'description': description,
      'status': status,
      'priority': priority,
      'projectId': projectId,
      if (projectTitle != null && projectTitle!.isNotEmpty) 'projectTitle': projectTitle,
      if (assigneeId != null) 'assigneeId': assigneeId,
      if (dueDate != null) 'dueDate': dueDate!.toIso8601String(),
      if (estimatedHours != null) 'estimatedHours': estimatedHours,
      'tags': tags,
    };
  }

  /// Convert to domain entity
  Task toEntity() {
    return Task(
      id: id,
      title: title,
      description: description,
      status: TaskStatus.fromString(status),
      priority: TaskPriority.fromString(priority),
      createdAt: createdAt,
      updatedAt: updatedAt,
      projectId: projectId,
      projectTitle: projectTitle,
      assigneeId: assigneeId,
      dueDate: dueDate,
      completedAt: completedAt,
      estimatedHours: estimatedHours,
      actualHours: actualHours,
      tags: tags,
      attachments: attachments,
      dependencies: dependencies,
    );
  }

  /// Create from domain entity
  factory TaskModel.fromEntity(Task task) {
    return TaskModel(
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status.name,
      priority: task.priority.name,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      projectId: task.projectId,
      projectTitle: task.projectTitle,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      tags: task.tags,
      attachments: task.attachments,
      dependencies: task.dependencies,
    );
  }

  /// Create copy with updated fields
  TaskModel copyWith({
    String? id,
    String? title,
    String? description,
    String? status,
    String? priority,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? projectId,
    String? projectTitle,
    String? assigneeId,
    DateTime? dueDate,
    DateTime? completedAt,
    double? estimatedHours,
    double? actualHours,
    List<String>? tags,
    List<String>? attachments,
    List<String>? dependencies,
  }) {
    return TaskModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      projectId: projectId ?? this.projectId,
      projectTitle: projectTitle ?? this.projectTitle,
      assigneeId: assigneeId ?? this.assigneeId,
      dueDate: dueDate ?? this.dueDate,
      completedAt: completedAt ?? this.completedAt,
      estimatedHours: estimatedHours ?? this.estimatedHours,
      actualHours: actualHours ?? this.actualHours,
      tags: tags ?? this.tags,
      attachments: attachments ?? this.attachments,
      dependencies: dependencies ?? this.dependencies,
    );
  }

  @override
  String toString() {
    return 'TaskModel(id: $id, title: $title, status: $status, priority: $priority)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TaskModel &&
        other.id == id &&
        other.title == title &&
        other.description == description &&
        other.status == status &&
        other.priority == priority &&
        other.createdAt == createdAt &&
        other.updatedAt == updatedAt &&
        other.projectId == projectId &&
        other.projectTitle == projectTitle &&
        other.assigneeId == assigneeId &&
        other.dueDate == dueDate &&
        other.completedAt == completedAt &&
        other.estimatedHours == estimatedHours &&
        other.actualHours == actualHours &&
        _listEquals(other.tags, tags) &&
        _listEquals(other.attachments, attachments) &&
        _listEquals(other.dependencies, dependencies);
  }

  @override
  int get hashCode {
    return Object.hash(
      id,
      title,
      description,
      status,
      priority,
      createdAt,
      updatedAt,
      projectId,
      projectTitle,
      assigneeId,
      dueDate,
      completedAt,
      estimatedHours,
      actualHours,
      Object.hashAll(tags),
      Object.hashAll(attachments),
      Object.hashAll(dependencies),
    );
  }

  /// Helper method to compare lists
  bool _listEquals<T>(List<T> a, List<T> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}

/// Task statistics data model
class TaskStatisticsModel {
  const TaskStatisticsModel({
    required this.totalTasks,
    required this.todoTasks,
    required this.inProgressTasks,
    required this.reviewTasks,
    required this.blockedTasks,
    required this.completedTasks,
    required this.cancelledTasks,
    required this.overdueTasks,
    required this.dueSoonTasks,
    this.averageCompletionTimeDays,
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
  final int? averageCompletionTimeDays;
  final Map<String, int> priorityDistribution; // priority -> count

  factory TaskStatisticsModel.fromJson(Map<String, dynamic> json) {
    JsonVerificationService.verifyRequiredFields(
      json,
      {
        'totalTasks': int,
        'todoTasks': int,
        'inProgressTasks': int,
        'reviewTasks': int,
        'blockedTasks': int,
        'completedTasks': int,
        'cancelledTasks': int,
        'overdueTasks': int,
        'dueSoonTasks': int,
        'priorityDistribution': Map<String, dynamic>,
      },
      objectName: 'TaskStatisticsModel',
    );

    final priorityDistributionMap = JsonVerificationService.getRequiredObject(json, 'priorityDistribution');
    final priorityDistribution = <String, int>{};
    for (final entry in priorityDistributionMap.entries) {
      priorityDistribution[entry.key] = entry.value as int;
    }

    return TaskStatisticsModel(
      totalTasks: JsonVerificationService.getRequiredField<int>(json, 'totalTasks'),
      todoTasks: JsonVerificationService.getRequiredField<int>(json, 'todoTasks'),
      inProgressTasks: JsonVerificationService.getRequiredField<int>(json, 'inProgressTasks'),
      reviewTasks: JsonVerificationService.getRequiredField<int>(json, 'reviewTasks'),
      blockedTasks: JsonVerificationService.getRequiredField<int>(json, 'blockedTasks'),
      completedTasks: JsonVerificationService.getRequiredField<int>(json, 'completedTasks'),
      cancelledTasks: JsonVerificationService.getRequiredField<int>(json, 'cancelledTasks'),
      overdueTasks: JsonVerificationService.getRequiredField<int>(json, 'overdueTasks'),
      dueSoonTasks: JsonVerificationService.getRequiredField<int>(json, 'dueSoonTasks'),
      averageCompletionTimeDays: JsonVerificationService.getOptionalField<int>(json, 'averageCompletionTimeDays'),
      priorityDistribution: priorityDistribution,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalTasks': totalTasks,
      'todoTasks': todoTasks,
      'inProgressTasks': inProgressTasks,
      'reviewTasks': reviewTasks,
      'blockedTasks': blockedTasks,
      'completedTasks': completedTasks,
      'cancelledTasks': cancelledTasks,
      'overdueTasks': overdueTasks,
      'dueSoonTasks': dueSoonTasks,
      if (averageCompletionTimeDays != null) 'averageCompletionTimeDays': averageCompletionTimeDays,
      'priorityDistribution': priorityDistribution,
    };
  }

  TaskStatistics toEntity() {
    final priorityMap = <TaskPriority, int>{};
    for (final entry in priorityDistribution.entries) {
      try {
        final priority = TaskPriority.fromString(entry.key);
        priorityMap[priority] = entry.value;
      } catch (e) {
        // Skip invalid priorities
        continue;
      }
    }

    return TaskStatistics(
      totalTasks: totalTasks,
      todoTasks: todoTasks,
      inProgressTasks: inProgressTasks,
      reviewTasks: reviewTasks,
      blockedTasks: blockedTasks,
      completedTasks: completedTasks,
      cancelledTasks: cancelledTasks,
      overdueTasks: overdueTasks,
      dueSoonTasks: dueSoonTasks,
      averageCompletionTime: averageCompletionTimeDays != null
          ? Duration(days: averageCompletionTimeDays!)
          : null,
      priorityDistribution: priorityMap,
    );
  }
}

/// Time entry data model
class TimeEntryModel {
  const TimeEntryModel({
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

  factory TimeEntryModel.fromJson(Map<String, dynamic> json) {
    JsonVerificationService.verifyRequiredFields(
      json,
      {
        'id': String,
        'taskId': String,
        'hours': double,
        'description': String,
        'createdAt': String,
      },
      objectName: 'TimeEntryModel',
    );

    return TimeEntryModel(
      id: JsonVerificationService.getRequiredField<String>(json, 'id'),
      taskId: JsonVerificationService.getRequiredField<String>(json, 'taskId'),
      hours: JsonVerificationService.getRequiredField<double>(json, 'hours'),
      description: JsonVerificationService.getRequiredField<String>(json, 'description'),
      createdAt: JsonVerificationService.getRequiredDateTime(json, 'createdAt'),
      userId: JsonVerificationService.getOptionalField<String>(json, 'userId'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'taskId': taskId,
      'hours': hours,
      'description': description,
      'createdAt': createdAt.toIso8601String(),
      if (userId != null) 'userId': userId,
    };
  }

  TimeEntry toEntity() {
    return TimeEntry(
      id: id,
      taskId: taskId,
      hours: hours,
      description: description,
      createdAt: createdAt,
      userId: userId,
    );
  }
}