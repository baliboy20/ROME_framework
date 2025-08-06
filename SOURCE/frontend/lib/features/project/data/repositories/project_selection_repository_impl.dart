import '../../../../core/network/dio_client.dart';
import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/services/app_logger.dart';
import '../../domain/entities/project.dart';
import '../../domain/repositories/project_selection_repository.dart';

class ProjectSelectionRepositoryImpl implements ProjectSelectionRepository {
  ProjectSelectionRepositoryImpl(this._dioClient);

  final DioClient _dioClient;

  /// Parse project from the actual API response format
  Project _parseProjectFromApi(Map<String, dynamic> json) {
    // Handle different field names from API
    final id = json['_id'] as String? ?? json['id'] as String? ?? '';
    final title =
        json['title'] as String? ??
        json['name'] as String? ??
        'Unnamed Project';
    final description = json['description'] as String? ?? '';
    final status = json['status'] as String? ?? 'draft';

    // Parse dates
    DateTime createdAt;
    DateTime updatedAt;

    try {
      createdAt = DateTime.parse(
        json['createdAt'] as String? ?? DateTime.now().toIso8601String(),
      );
    } catch (e) {
      AppLogger.instance.warning('Failed to parse createdAt, using current time: $e');
      createdAt = DateTime.now();
    }

    try {
      updatedAt = DateTime.parse(
        json['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
      );
    } catch (e) {
      AppLogger.instance.warning('Failed to parse updatedAt, using current time: $e');
      updatedAt = DateTime.now();
    }

    // Handle optional fields
    final ownerId = json['createdBy'] as String? ?? json['ownerId'] as String?;
    final tags = (json['tags'] as List<dynamic>?)?.cast<String>() ?? <String>[];
    final attachments =
        (json['attachments'] as List<dynamic>?)?.cast<String>() ?? <String>[];

    return Project(
      id: id,
      title: title,
      description: description,
      status: _parseProjectStatus(status),
      createdAt: createdAt,
      updatedAt: updatedAt,
      ownerId: ownerId,
      tags: tags,
      attachments: attachments,
    );
  }

  /// Parse project status from string, with fallback handling
  ProjectStatus _parseProjectStatus(String statusString) {
    switch (statusString.toLowerCase()) {
      case 'draft':
      case 'planning': // Legacy support
        return ProjectStatus.draft;
      case 'active':
        return ProjectStatus.active;
      case 'completed':
        return ProjectStatus.completed;
      case 'archived':
      case 'on_hold': // Legacy support
      case 'onhold': // Legacy support  
      case 'hold': // Legacy support
      case 'cancelled': // Legacy support
      case 'canceled': // Legacy support
        return ProjectStatus.archived;
      default:
        AppLogger.instance.warning(
          'Unknown project status: $statusString, defaulting to draft',
        );
        return ProjectStatus.draft;
    }
  }

  @override
  Future<Result<List<ProjectSelectionItem>>> getActiveProjects() async {
    try {
      AppLogger.instance.debug('Fetching active projects for selection');
      
      final response = await _dioClient.get<Map<String, dynamic>>(
        AppConstants.projectsEndpoint,
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('No data received from projects endpoint');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw projects API response: $data');
      
      // Handle the actual API response format: {"success": true, "data": [...]}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        AppLogger.instance.error('Projects API returned success=false');
        return Result.failure(const ServerFailure('API request was not successful'));
      }
      
      final projectsJson = data['data'] as List<dynamic>? ?? [];
      AppLogger.instance.debug('Found ${projectsJson.length} projects in API response');
      
      final projects = <ProjectSelectionItem>[];
      for (final projectJson in projectsJson) {
        try {
          // Parse project using the same approach as the regular repository
          final project = _parseProjectFromApi(projectJson as Map<String, dynamic>);
          
          AppLogger.instance.debug('Parsed project: ${project.title} with status: ${project.status}');
          
          // Only include active and draft projects
          if (project.status == ProjectStatus.active || project.status == ProjectStatus.draft) {
            projects.add(ProjectSelectionItem.fromProject(project));
            AppLogger.instance.debug('Added project to selection list: ${project.title}');
          } else {
            AppLogger.instance.debug('Skipped project ${project.title} - status ${project.status} is not active or draft');
          }
        } catch (e) {
          AppLogger.instance.warning('Failed to parse project for selection: $e, skipping project: $projectJson');
        }
      }
      
      // Sort projects by title for better UX
      projects.sort((a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
      
      AppLogger.instance.info('Successfully fetched ${projects.length} active projects for selection');
      return Result.success(projects);
      
    } on ServerException catch (e) {
      AppLogger.instance.error('Server error while fetching active projects', error: e);
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error while fetching active projects', error: e);
      return Result.failure(NetworkFailure(e.message));
    } catch (e) {
      AppLogger.instance.error('Unexpected error fetching active projects: $e');
      return Result.failure(UnexpectedFailure('Failed to fetch active projects: $e'));
    }
  }

  @override
  Future<Result<ProjectSelectionItem?>> getProjectForSelection(String projectId) async {
    try {
      AppLogger.instance.debug('Fetching project for selection: $projectId');
      
      final response = await _dioClient.get<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/$projectId',
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('No data received from project endpoint');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw project API response: $data');
      
      // Handle the actual API response format: {"success": true, "data": {...}}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        AppLogger.instance.error('Project API returned success=false');
        return Result.failure(const ServerFailure('API request was not successful'));
      }
      
      final projectData = data['data'] as Map<String, dynamic>?;
      if (projectData == null) {
        AppLogger.instance.info('Project not found: $projectId');
        return Result.success(null);
      }
      
      final project = _parseProjectFromApi(projectData);
      final selectionItem = ProjectSelectionItem.fromProject(project);
      
      AppLogger.instance.info('Successfully fetched project for selection: ${selectionItem.title}');
      return Result.success(selectionItem);
      
    } on ServerException catch (e) {
      AppLogger.instance.error('Server error while fetching project for selection', error: e);
      if (e.statusCode == 404) {
        return Result.success(null); // Project not found
      }
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error while fetching project for selection', error: e);
      return Result.failure(NetworkFailure(e.message));
    } catch (e) {
      AppLogger.instance.error('Unexpected error fetching project for selection: $e');
      return Result.failure(UnexpectedFailure('Failed to fetch project for selection: $e'));
    }
  }
}