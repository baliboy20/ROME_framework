import '../../../../core/utils/result.dart';
import '../entities/project.dart';

/// Repository interface for project data operations
/// This defines the contract for project data access in the domain layer
abstract class ProjectRepository {
  /// Get all projects
  /// Returns either a failure or list of projects
  Future<Result<List<Project>>> getAllProjects();

  /// Get project by ID
  /// Returns either a failure or the project
  Future<Result<Project>> getProjectById(String id);

  /// Get projects by status
  /// Returns either a failure or list of projects with matching status
  Future<Result<List<Project>>> getProjectsByStatus(ProjectStatus status);

  /// Search projects by name or description
  /// Returns either a failure or list of matching projects
  Future<Result<List<Project>>> searchProjects(String query);

  /// Create a new project
  /// Returns either a failure or the created project
  Future<Result<Project>> createProject(Project project);

  /// Update an existing project
  /// Returns either a failure or the updated project
  Future<Result<Project>> updateProject(Project project);

  /// Delete a project
  /// Returns either a failure or success
  Future<Result<void>> deleteProject(String id);

  /// Get project statistics (count by status, etc.)
  /// Returns either a failure or project statistics
  Future<Result<ProjectStatistics>> getProjectStatistics();

  /// Get overdue projects
  /// Returns either a failure or list of overdue projects
  Future<Result<List<Project>>> getOverdueProjects();

  /// Get projects with progress tracking
  /// Returns either a failure or list of projects with completion percentage
  Future<Result<List<ProjectWithProgress>>> getProjectsWithProgress();

  /// Archive a project
  /// Returns either a failure or success
  Future<Result<void>> archiveProject(String id);

  /// Restore an archived project
  /// Returns either a failure or success
  Future<Result<void>> restoreProject(String id);

  /// Add tags to a project
  /// Returns either a failure or the updated project
  Future<Result<Project>> addTagsToProject(String id, List<String> tags);

  /// Remove tags from a project
  /// Returns either a failure or the updated project
  Future<Result<Project>> removeTagsFromProject(String id, List<String> tags);

  /// Upload attachment to project
  /// Returns either a failure or the updated project with new attachment
  Future<Result<Project>> uploadAttachment(String id, String filePath);

  /// Remove attachment from project
  /// Returns either a failure or the updated project
  Future<Result<Project>> removeAttachment(String id, String attachmentId);
}

/// Project statistics model
class ProjectStatistics {
  const ProjectStatistics({
    required this.totalProjects,
    required this.activeProjects,
    required this.completedProjects,
    required this.onHoldProjects,
    required this.cancelledProjects,
    required this.overallCompletionRate,
    required this.averageProjectDuration,
  });

  final int totalProjects;
  final int activeProjects;
  final int completedProjects;
  final int onHoldProjects;
  final int cancelledProjects;
  final double overallCompletionRate; // 0.0 to 1.0
  final Duration? averageProjectDuration;

  @override
  String toString() {
    return 'ProjectStatistics(total: $totalProjects, active: $activeProjects, completed: $completedProjects)';
  }
}

/// Project with progress information
class ProjectWithProgress {
  const ProjectWithProgress({
    required this.project,
    required this.completionPercentage,
    required this.totalTasks,
    required this.completedTasks,
  });

  final Project project;
  final double completionPercentage; // 0.0 to 1.0
  final int totalTasks;
  final int completedTasks;

  @override
  String toString() {

    return 'ProjectWithProgress(${project.title}: ${(completionPercentage * 100).toStringAsFixed(1)}%)';
  }
}