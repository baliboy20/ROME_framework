import '../../../../core/utils/json_verification_service.dart';
import '../../domain/entities/project.dart';
import '../../domain/repositories/project_repository.dart';

/// Data model for Project with JSON serialization
/// Handles conversion between JSON and domain entities
class ProjectModel {
  const ProjectModel({
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
  final String status; // String representation for JSON
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? completedAt;
  final String? ownerId;
  final String? localSourceFolder; // Local path to project source code
  final String? githubRepo; // GitHub repository URL
  final List<String> tags;
  final List<String> attachments;

  /// Convert from JSON using JsonVerificationService
  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    try {
      // Verify required fields
      JsonVerificationService.verifyRequiredFields(
        json,
        {
          'id': String,
          'title': String,
          'description': String,
          'status': String,
          'createdAt': String,
          'updatedAt': String,
        },
        objectName: 'ProjectModel',
      );

      // Verify optional fields
      JsonVerificationService.verifyOptionalFields(
        json,
        {
          'completedAt': String,
          'ownerId': String,
          'localSourceFolder': String,
          'githubRepo': String,
          'tags': List<dynamic>,
          'attachments': List<dynamic>,
        },
        objectName: 'ProjectModel',
      );

      return ProjectModel(
        id: JsonVerificationService.getRequiredField<String>(json, 'id'),
        title: JsonVerificationService.getRequiredField<String>(json, 'title'),
        description: JsonVerificationService.getRequiredField<String>(json, 'description'),
        status: JsonVerificationService.getRequiredField<String>(json, 'status'),
        createdAt: JsonVerificationService.getRequiredDateTime(json, 'createdAt'),
        updatedAt: JsonVerificationService.getRequiredDateTime(json, 'updatedAt'),
        completedAt: JsonVerificationService.getOptionalDateTime(json, 'completedAt'),
        ownerId: JsonVerificationService.getOptionalField<String>(json, 'ownerId'),
        localSourceFolder: JsonVerificationService.getOptionalField<String>(json, 'localSourceFolder'),
        githubRepo: JsonVerificationService.getOptionalField<String>(json, 'githubRepo'),
        tags: JsonVerificationService.getOptionalList<String>(json, 'tags') ?? [],
        attachments: JsonVerificationService.getOptionalList<String>(json, 'attachments') ?? [],
      );
    } catch (e) {
      throw FormatException('Failed to parse ProjectModel from JSON: $e');
    }
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) 'id': id, // Only include ID if it's not empty (for updates)
      'title': title,
      'description': description,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
      if (ownerId != null) 'ownerId': ownerId,
      if (localSourceFolder != null && localSourceFolder!.isNotEmpty) 'localSourceFolder': localSourceFolder,
      if (githubRepo != null && githubRepo!.isNotEmpty) 'githubRepo': githubRepo,
      'tags': tags,
      'attachments': attachments,
    };
  }

  /// Convert to JSON for creation (excludes server-managed fields)
  Map<String, dynamic> toCreateJson() {
    return {
      'title': title,
      'description': description,
      'status': status,
      if (ownerId != null) 'ownerId': ownerId,
      if (localSourceFolder != null && localSourceFolder!.isNotEmpty) 'localSourceFolder': localSourceFolder,
      if (githubRepo != null && githubRepo!.isNotEmpty) 'githubRepo': githubRepo,
      'tags': tags,
    };
  }

  /// Convert to domain entity
  Project toEntity() {
    return Project(
      id: id,
      title: title,
      description: description,
      status: ProjectStatus.fromString(status),
      createdAt: createdAt,
      updatedAt: updatedAt,
      completedAt: completedAt,
      ownerId: ownerId,
      localSourceFolder: localSourceFolder,
      githubRepo: githubRepo,
      tags: tags,
      attachments: attachments,
    );
  }

  /// Create from domain entity
  factory ProjectModel.fromEntity(Project project) {
    return ProjectModel(
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      completedAt: project.completedAt,
      ownerId: project.ownerId,
      localSourceFolder: project.localSourceFolder,
      githubRepo: project.githubRepo,
      tags: project.tags,
      attachments: project.attachments,
    );
  }

  /// Create copy with updated fields
  ProjectModel copyWith({
    String? id,
    String? title,
    String? description,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? completedAt,
    String? ownerId,
    String? localSourceFolder,
    String? githubRepo,
    List<String>? tags,
    List<String>? attachments,
  }) {
    return ProjectModel(
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

  @override
  String toString() {
    return 'ProjectModel(id: $id, title: $title, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ProjectModel &&
        other.id == id &&
        other.title == title &&
        other.description == description &&
        other.status == status &&
        other.createdAt == createdAt &&
        other.updatedAt == updatedAt &&
        other.completedAt == completedAt &&
        other.ownerId == ownerId &&
        other.localSourceFolder == localSourceFolder &&
        other.githubRepo == githubRepo &&
        _listEquals(other.tags, tags) &&
        _listEquals(other.attachments, attachments);
  }

  @override
  int get hashCode {
    return Object.hash(
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
      Object.hashAll(tags),
      Object.hashAll(attachments),
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

/// Project statistics data model
class ProjectStatisticsModel {
  const ProjectStatisticsModel({
    required this.totalProjects,
    required this.activeProjects,
    required this.completedProjects,
    required this.onHoldProjects,
    required this.cancelledProjects,
    required this.overallCompletionRate,
    this.averageProjectDurationDays,
  });

  final int totalProjects;
  final int activeProjects;
  final int completedProjects;
  final int onHoldProjects;
  final int cancelledProjects;
  final double overallCompletionRate;
  final int? averageProjectDurationDays;

  factory ProjectStatisticsModel.fromJson(Map<String, dynamic> json) {
    JsonVerificationService.verifyRequiredFields(
      json,
      {
        'totalProjects': int,
        'activeProjects': int,
        'completedProjects': int,
        'onHoldProjects': int,
        'cancelledProjects': int,
        'overallCompletionRate': double,
      },
      objectName: 'ProjectStatisticsModel',
    );

    return ProjectStatisticsModel(
      totalProjects: JsonVerificationService.getRequiredField<int>(json, 'totalProjects'),
      activeProjects: JsonVerificationService.getRequiredField<int>(json, 'activeProjects'),
      completedProjects: JsonVerificationService.getRequiredField<int>(json, 'completedProjects'),
      onHoldProjects: JsonVerificationService.getRequiredField<int>(json, 'onHoldProjects'),
      cancelledProjects: JsonVerificationService.getRequiredField<int>(json, 'cancelledProjects'),
      overallCompletionRate: JsonVerificationService.getRequiredField<double>(json, 'overallCompletionRate'),
      averageProjectDurationDays: JsonVerificationService.getOptionalField<int>(json, 'averageProjectDurationDays'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalProjects': totalProjects,
      'activeProjects': activeProjects,
      'completedProjects': completedProjects,
      'onHoldProjects': onHoldProjects,
      'cancelledProjects': cancelledProjects,
      'overallCompletionRate': overallCompletionRate,
      if (averageProjectDurationDays != null) 'averageProjectDurationDays': averageProjectDurationDays,
    };
  }

  ProjectStatistics toEntity() {
    return ProjectStatistics(
      totalProjects: totalProjects,
      activeProjects: activeProjects,
      completedProjects: completedProjects,
      onHoldProjects: onHoldProjects,
      cancelledProjects: cancelledProjects,
      overallCompletionRate: overallCompletionRate,
      averageProjectDuration: averageProjectDurationDays != null
          ? Duration(days: averageProjectDurationDays!)
          : null,
    );
  }
}

/// Project with progress data model
class ProjectWithProgressModel {
  const ProjectWithProgressModel({
    required this.project,
    required this.completionPercentage,
    required this.totalTasks,
    required this.completedTasks,
  });

  final ProjectModel project;
  final double completionPercentage;
  final int totalTasks;
  final int completedTasks;

  factory ProjectWithProgressModel.fromJson(Map<String, dynamic> json) {
    JsonVerificationService.verifyRequiredFields(
      json,
      {
        'project': Map<String, dynamic>,
        'completionPercentage': double,
        'totalTasks': int,
        'completedTasks': int,
      },
      objectName: 'ProjectWithProgressModel',
    );

    return ProjectWithProgressModel(
      project: ProjectModel.fromJson(
        JsonVerificationService.getRequiredObject(json, 'project'),
      ),
      completionPercentage: JsonVerificationService.getRequiredField<double>(json, 'completionPercentage'),
      totalTasks: JsonVerificationService.getRequiredField<int>(json, 'totalTasks'),
      completedTasks: JsonVerificationService.getRequiredField<int>(json, 'completedTasks'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'project': project.toJson(),
      'completionPercentage': completionPercentage,
      'totalTasks': totalTasks,
      'completedTasks': completedTasks,
    };
  }

  ProjectWithProgress toEntity() {
    return ProjectWithProgress(
      project: project.toEntity(),
      completionPercentage: completionPercentage,
      totalTasks: totalTasks,
      completedTasks: completedTasks,
    );
  }
}

