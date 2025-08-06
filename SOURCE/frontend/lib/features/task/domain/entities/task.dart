import 'package:equatable/equatable.dart';

/// Task entity representing a task in the domain layer
class Task extends Equatable {
  const Task({
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
  final TaskStatus status;
  final TaskPriority priority;
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
  final List<String> dependencies; // IDs of dependent tasks

  /// Create a copy of this task with some fields replaced
  Task copyWith({
    String? id,
    String? title,
    String? description,
    TaskStatus? status,
    TaskPriority? priority,
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
    return Task(
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

  /// Check if task is completed
  bool get isCompleted => status == TaskStatus.completed;

  /// Check if task is in progress
  bool get isInProgress => status == TaskStatus.inProgress;

  /// Check if task is overdue
  bool get isOverdue {
    if (dueDate == null || isCompleted) return false;
    return DateTime.now().isAfter(dueDate!);
  }

  /// Check if task is due soon (within 24 hours)
  bool get isDueSoon {
    if (dueDate == null || isCompleted) return false;
    final now = DateTime.now();
    final timeDiff = dueDate!.difference(now);
    return timeDiff.inHours <= 24 && timeDiff.inHours > 0;
  }

  /// Get time tracking efficiency (actual vs estimated)
  double? get efficiency {
    if (estimatedHours == null || actualHours == null || actualHours == 0) {
      return null;
    }
    return estimatedHours! / actualHours!;
  }

  /// Check if task has time tracking data
  bool get hasTimeTracking => estimatedHours != null || actualHours != null;

  @override
  List<Object?> get props => [
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
        tags,
        attachments,
        dependencies,
      ];

  @override
  String toString() {
    return 'Task(id: $id, title: $title, status: $status, priority: $priority)';
  }
}

/// Enumeration of possible task statuses
enum TaskStatus {
  todo,
  inProgress,
  review,
  blocked,
  completed,
  cancelled;

  /// Display name for the status
  String get displayName {
    switch (this) {
      case TaskStatus.todo:
        return 'To Do';
      case TaskStatus.inProgress:
        return 'In Progress';
      case TaskStatus.review:
        return 'Review';
      case TaskStatus.blocked:
        return 'Blocked';
      case TaskStatus.completed:
        return 'Completed';
      case TaskStatus.cancelled:
        return 'Cancelled';
    }
  }

  /// Color representation for UI
  String get colorCode {
    switch (this) {
      case TaskStatus.todo:
        return '#8E8E93'; // Gray
      case TaskStatus.inProgress:
        return '#007AFF'; // Blue
      case TaskStatus.review:
        return '#FF9500'; // Orange
      case TaskStatus.blocked:
        return '#FF3B30'; // Red
      case TaskStatus.completed:
        return '#34C759'; // Green
      case TaskStatus.cancelled:
        return '#FF3B30'; // Red
    }
  }

  /// Check if status allows editing
  bool get allowsEditing {
    return this != TaskStatus.completed && this != TaskStatus.cancelled;
  }

  /// Parse status from string
  static TaskStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'todo':
      case 'to_do':
        return TaskStatus.todo;
      case 'inprogress':
      case 'in_progress':
        return TaskStatus.inProgress;
      case 'review':
        return TaskStatus.review;
      case 'blocked':
        return TaskStatus.blocked;
      case 'completed':
        return TaskStatus.completed;
      case 'cancelled':
        return TaskStatus.cancelled;
      default:
        throw ArgumentError('Unknown task status: $status');
    }
  }
}

/// Enumeration of task priorities
enum TaskPriority {
  low,
  medium,
  high,
  urgent;

  /// Display name for the priority
  String get displayName {
    switch (this) {
      case TaskPriority.low:
        return 'Low';
      case TaskPriority.medium:
        return 'Medium';
      case TaskPriority.high:
        return 'High';
      case TaskPriority.urgent:
        return 'Urgent';
    }
  }

  /// Color representation for UI
  String get colorCode {
    switch (this) {
      case TaskPriority.low:
        return '#34C759'; // Green
      case TaskPriority.medium:
        return '#FF9500'; // Orange
      case TaskPriority.high:
        return '#FF3B30'; // Red
      case TaskPriority.urgent:
        return '#AF52DE'; // Purple
    }
  }

  /// Numeric value for sorting
  int get sortOrder {
    switch (this) {
      case TaskPriority.urgent:
        return 4;
      case TaskPriority.high:
        return 3;
      case TaskPriority.medium:
        return 2;
      case TaskPriority.low:
        return 1;
    }
  }

  /// Parse priority from string
  static TaskPriority fromString(String priority) {
    switch (priority.toLowerCase()) {
      case 'low':
        return TaskPriority.low;
      case 'medium':
        return TaskPriority.medium;
      case 'high':
        return TaskPriority.high;
      case 'urgent':
        return TaskPriority.urgent;
      default:
        throw ArgumentError('Unknown task priority: $priority');
    }
  }
}