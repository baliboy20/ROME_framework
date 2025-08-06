import 'package:equatable/equatable.dart';

/// Project entity representing a project in the domain layer
class Project extends Equatable {
  const Project({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.completedAt,
    this.ownerId,
    this.localSourceFolder,
    this.githubRepo,
    this.tags = const [],
    this.attachments = const [],
  });

  final String id;
  final String title;
  final String description;
  final ProjectStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? completedAt;
  final String? ownerId;
  final String? localSourceFolder; // Local path to project source code
  final String? githubRepo; // GitHub repository URL
  final List<String> tags;
  final List<String> attachments; // File paths/URLs

  /// Create a copy of this project with some fields replaced
  Project copyWith({
    String? id,
    String? title,
    String? description,
    ProjectStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? completedAt,
    String? ownerId,
    String? localSourceFolder,
    String? githubRepo,
    List<String>? tags,
    List<String>? attachments,
  }) {
    return Project(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      completedAt: completedAt ?? this.completedAt,
      ownerId: ownerId ?? this.ownerId,
      localSourceFolder: localSourceFolder ?? this.localSourceFolder,
      githubRepo: githubRepo ?? this.githubRepo,
      tags: tags ?? this.tags,
      attachments: attachments ?? this.attachments,
    );
  }

  /// Check if project is completed
  bool get isCompleted => status == ProjectStatus.completed;

  /// Check if project is active
  bool get isActive => status == ProjectStatus.active;

  /// Check if project is archived
  bool get isArchived => status == ProjectStatus.archived;

  /// Check if project is draft
  bool get isDraft => status == ProjectStatus.draft;

  /// Get completion percentage (this would typically be calculated based on tasks)
  double get completionPercentage {
    switch (status) {
      case ProjectStatus.draft:
        return 0.0;
      case ProjectStatus.active:
        return 0.5; // This would be calculated from tasks in a real implementation
      case ProjectStatus.completed:
        return 1.0;
      case ProjectStatus.archived:
        return 0.8; // Partial progress when archived
    }
  }

  /// Check if local source folder path is valid
  bool get hasValidLocalSourceFolder {
    if (localSourceFolder == null || localSourceFolder!.isEmpty) return true;
    return localSourceFolder!.length <= 500 && _isValidPath(localSourceFolder!);
  }

  /// Check if GitHub repository URL is valid
  bool get hasValidGithubRepo {
    if (githubRepo == null || githubRepo!.isEmpty) return true;
    return githubRepo!.length <= 200 && _isValidGithubUrl(githubRepo!);
  }

  /// Check if project has source code integration
  bool get hasSourceIntegration => localSourceFolder != null || githubRepo != null;

  /// Validate path format (basic validation)
  bool _isValidPath(String path) {
    // Basic path validation - no empty string, reasonable characters
    if (path.trim().isEmpty) return false;
    // Allow common path characters, reject dangerous ones
    final pathRegex = RegExp(r'^[a-zA-Z0-9\\/\\_\-\.\s:]+$');
    return pathRegex.hasMatch(path);
  }

  /// Validate GitHub URL format
  bool _isValidGithubUrl(String url) {
    if (url.trim().isEmpty) return false;
    // GitHub URL validation - must be valid GitHub repository URL
    final githubRegex = RegExp(
      r'^https:\/\/github\.com\/[a-zA-Z0-9\-_\.]+\/[a-zA-Z0-9\-_\.]+\/?$',
      caseSensitive: false,
    );
    return githubRegex.hasMatch(url.trim());
  }

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        status,
        createdAt,
        updatedAt,
        completedAt,
        ownerId,
        localSourceFolder,
        githubRepo,
        tags,
        attachments,
      ];

  @override
  String toString() {
    return 'Project(id: $id, title: $title, status: $status, createdAt: $createdAt)';
  }
}

/// Enumeration of possible project statuses
enum ProjectStatus {
  draft,
  active,
  completed,
  archived;

  /// Display name for the status
  String get displayName {
    switch (this) {
      case ProjectStatus.draft:
        return 'Draft';
      case ProjectStatus.active:
        return 'Active';
      case ProjectStatus.completed:
        return 'Completed';
      case ProjectStatus.archived:
        return 'Archived';
    }
  }

  /// Color representation for UI
  String get colorCode {
    switch (this) {
      case ProjectStatus.draft:
        return '#8E8E93'; // Gray - for draft projects
      case ProjectStatus.active:
        return '#007AFF'; // Blue  
      case ProjectStatus.completed:
        return '#34C759'; // Green
      case ProjectStatus.archived:
        return '#FF9500'; // Orange - for archived projects
    }
  }

  /// Check if status allows editing
  bool get allowsEditing {
    return this != ProjectStatus.completed && this != ProjectStatus.archived;
  }

  /// Parse status from string
  static ProjectStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'draft':
      case 'planning': // Legacy support
        return ProjectStatus.draft;
      case 'active':
        return ProjectStatus.active;
      case 'completed':
        return ProjectStatus.completed;
      case 'archived':
      case 'onhold': // Legacy support
      case 'on_hold': // Legacy support
      case 'cancelled': // Legacy support
        return ProjectStatus.archived;
      default:
        throw ArgumentError('Unknown project status: $status');
    }
  }
}