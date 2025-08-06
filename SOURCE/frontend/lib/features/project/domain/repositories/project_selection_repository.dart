import '../../../../core/utils/result.dart';
import '../entities/project.dart';

/// Repository interface for project selection operations
/// Focused on loading projects for UI selection purposes
abstract class ProjectSelectionRepository {
  /// Get all active projects (draft and active status)
  /// Returns only essential fields needed for selection
  Future<Result<List<ProjectSelectionItem>>> getActiveProjects();

  /// Get project by ID for selection purposes
  Future<Result<ProjectSelectionItem?>> getProjectForSelection(String projectId);
}

/// Lightweight project data for selection purposes
class ProjectSelectionItem {
  const ProjectSelectionItem({
    required this.id,
    required this.title,
    required this.status,
  });

  final String id;
  final String title;
  final ProjectStatus status;

  /// Create from full Project entity
  factory ProjectSelectionItem.fromProject(Project project) {
    return ProjectSelectionItem(
      id: project.id,
      title: project.title,
      status: project.status,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ProjectSelectionItem &&
        other.id == id &&
        other.title == title &&
        other.status == status;
  }

  @override
  int get hashCode => Object.hash(id, title, status);

  @override
  String toString() => 'ProjectSelectionItem(id: $id, title: $title, status: $status)';
}