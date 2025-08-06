import 'package:logger/logger.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/services/app_logger.dart';
import '../../../../core/utils/result.dart';
import '../../domain/entities/project.dart';
import '../../domain/repositories/project_repository.dart';
import '../models/project_model.dart';

/// Implementation of ProjectRepository that communicates with the API
class ProjectRepositoryImpl implements ProjectRepository {
  ProjectRepositoryImpl({required DioClient dioClient, required Logger logger})
    : _dioClient = dioClient,
      _logger = logger;

  final DioClient _dioClient;
  final Logger _logger;

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
      logWarning('Failed to parse createdAt, using current time: $e');
      createdAt = DateTime.now();
    }

    try {
      updatedAt = DateTime.parse(
        json['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
      );
    } catch (e) {
      logWarning('Failed to parse updatedAt, using current time: $e');
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
        logWarning(
          'Unknown project status: $statusString, defaulting to draft',
        );
        return ProjectStatus.draft;
    }
  }

  @override
  Future<Result<List<Project>>> getAllProjects() async {
    try {
      logDebug(
        'Starting to fetch all projects from ${AppConstants.projectsEndpoint}',
      );

      final response = await _dioClient.get<Map<String, dynamic>>(
        AppConstants.projectsEndpoint,
      );

      final data = response.data;
      if (data == null) {
        logError('Received null data from projects endpoint');
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      logDebug('Raw API response: $data');

      // Handle the actual API response format: {"success": true, "data": [...]}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        logError('API returned success=false');
        return Result.failure(
          const ServerFailure('API request was not successful'),
        );
      }

      final projectsJson = data['data'] as List<dynamic>? ?? [];
      logDebug('Found ${projectsJson.length} projects in API response');

      final projects = <Project>[];
      for (final projectJson in projectsJson) {
        try {
          final project = _parseProjectFromApi(
            projectJson as Map<String, dynamic>,
          );
          projects.add(project);
        } catch (e) {
          logWarning(
            'Failed to parse project: $e, skipping project: $projectJson',
          );
        }
      }

      logInfo('Successfully fetched ${projects.length} projects from API');
      return Result.success(projects);
    } on ServerException catch (e) {
      logError('Server error while fetching projects', error: e);
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      logError('Network error while fetching projects', error: e);
      return Result.failure(NetworkFailure(e.message));
    } on JsonValidationException catch (e) {
      _logger.e('JSON validation error fetching projects: ${e.message}');
      return Result.failure(
        JsonValidationFailure(
          e.message,
          objectName: e.objectName,
          missingFields: e.missingFields,
          invalidTypeFields: e.invalidTypeFields,
        ),
      );
    } catch (e) {
      _logger.e('Unexpected error fetching projects: $e');
      return Result.failure(UnexpectedFailure('Failed to fetch projects: $e'));
    }
  }

  @override
  Future<Result<Project>> getProjectById(String id) async {
    try {
      _logger.d('Fetching project with ID: $id');

      final response = await _dioClient.get<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/$id',
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      // Handle the API response format: {"success": true, "data": {...}}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        return Result.failure(
          const ServerFailure('API request was not successful'),
        );
      }

      final projectData = data['data'] as Map<String, dynamic>?;
      if (projectData == null) {
        return Result.failure(
          const ServerFailure('No project data in response'),
        );
      }

      final project = _parseProjectFromApi(projectData);

      _logger.d('Successfully fetched project: ${project.title}');
      return Result.success(project);
    } on ServerException catch (e) {
      _logger.e('Server error fetching project $id: ${e.message}');
      if (e.statusCode == 404) {
        return Result.failure(
          ServerFailure('Project not found', statusCode: e.statusCode),
        );
      }
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      _logger.e('Network error fetching project $id: ${e.message}');
      return Result.failure(NetworkFailure(e.message));
    } on JsonValidationException catch (e) {
      _logger.e('JSON validation error fetching project $id: ${e.message}');
      return Result.failure(
        JsonValidationFailure(
          e.message,
          objectName: e.objectName,
          missingFields: e.missingFields,
          invalidTypeFields: e.invalidTypeFields,
        ),
      );
    } catch (e) {
      _logger.e('Unexpected error fetching project $id: $e');
      return Result.failure(UnexpectedFailure('Failed to fetch project: $e'));
    }
  }

  @override
  Future<Result<List<Project>>> getProjectsByStatus(
    ProjectStatus status,
  ) async {
    try {
      _logger.d('Fetching projects with status: ${status.name}');

      final response = await _dioClient.get<Map<String, dynamic>>(
        AppConstants.projectsEndpoint,
        queryParameters: {'status': status.name},
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      final projectsJson = data['projects'] as List<dynamic>? ?? [];
      final projects = projectsJson
          .map(
            (json) =>
                ProjectModel.fromJson(json as Map<String, dynamic>).toEntity(),
          )
          .toList();

      _logger.d(
        'Successfully fetched ${projects.length} projects with status ${status.name}',
      );
      return Result.success(projects);
    } catch (e) {
      return _handleError('fetch projects by status', e);
    }
  }

  @override
  Future<Result<List<Project>>> searchProjects(String query) async {
    try {
      _logger.d('Searching projects with query: $query');

      final response = await _dioClient.get<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/search',
        queryParameters: {'q': query},
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      final projectsJson = data['projects'] as List<dynamic>? ?? [];
      final projects = projectsJson
          .map(
            (json) =>
                ProjectModel.fromJson(json as Map<String, dynamic>).toEntity(),
          )
          .toList();

      _logger.d(
        'Successfully found ${projects.length} projects matching "$query"',
      );
      return Result.success(projects);
    } catch (e) {
      return _handleError('search projects', e);
    }
  }

  @override
  Future<Result<Project>> createProject(Project project) async {
    try {
      _logger.d('Creating project: ${project.title}');

      final projectModel = ProjectModel.fromEntity(project);
      final requestData = projectModel.toJson();
      _logger.d('Sending create project request: $requestData');

      final response = await _dioClient.post<Map<String, dynamic>>(
        AppConstants.projectsEndpoint,
        data: requestData,
      );

      final data = response.data;
      if (data == null) {
        _logger.e('No data received from create project API');
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      _logger.d('Raw create project API response: $data');

      // Handle the API response format: {"success": true, "data": {...}}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        final errorMessage =
            data['message'] as String? ?? 'API request was not successful';
        final errors = data['errors'] as List<dynamic>? ?? [];
        _logger.e(
          'Create project API returned success=false: $errorMessage, errors: $errors',
        );
        return Result.failure(ServerFailure(errorMessage));
      }

      final projectData = data['data'] as Map<String, dynamic>?;
      if (projectData == null) {
        _logger.e('No project data in successful API response');
        return Result.failure(
          const ServerFailure('No project data in response'),
        );
      }

      final createdProject = _parseProjectFromApi(projectData);

      _logger.d('Successfully created project: ${createdProject.title}');
      return Result.success(createdProject);
    } on ServerException catch (e) {
      _logger.e(
        'Server error creating project: ${e.message}, status: ${e.statusCode}',
      );
      if (e.statusCode == 400) {
        return Result.failure(
          ServerFailure(
            'Invalid project data: ${e.message}',
            statusCode: e.statusCode,
          ),
        );
      }
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      _logger.e('Network error creating project: ${e.message}');
      return Result.failure(NetworkFailure(e.message));
    } on JsonValidationException catch (e) {
      _logger.e('JSON validation error creating project: ${e.message}');
      return Result.failure(
        JsonValidationFailure(
          e.message,
          objectName: e.objectName,
          missingFields: e.missingFields,
          invalidTypeFields: e.invalidTypeFields,
        ),
      );
    } catch (e) {
      _logger.e('Unexpected error creating project: $e');
      return Result.failure(UnexpectedFailure('Failed to create project: $e'));
    }
  }

  @override
  Future<Result<Project>> updateProject(Project project) async {
    try {
      _logger.d('Updating project: ${project.title}');

      final projectModel = ProjectModel.fromEntity(project);
      final response = await _dioClient.put<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/${project.id}',
        data: projectModel.toJson(),
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      // Handle the API response format: {"success": true, "data": {...}}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        // Extract detailed error message from backend validation error
        String errorMessage = 'API request was not successful';
        
        // Try to extract the error message from the response
        if (data['error'] is Map<String, dynamic>) {
          final error = data['error'] as Map<String, dynamic>;
          errorMessage = error['message'] as String? ?? errorMessage;
        } else if (data['message'] is String) {
          errorMessage = data['message'] as String;
        }
        
        logError('Update project failed: $errorMessage, full response: $data');
        return Result.failure(ServerFailure(errorMessage));
      }

      final projectData = data['data'] as Map<String, dynamic>?;
      if (projectData == null) {
        return Result.failure(
          const ServerFailure('No project data in response'),
        );
      }

      final updatedProject = _parseProjectFromApi(projectData);

      _logger.d('Successfully updated project: ${updatedProject.title}');
      return Result.success(updatedProject);
    } catch (e) {
      return _handleError('update project', e);
    }
  }

  @override
  Future<Result<void>> deleteProject(String id) async {
    try {
      _logger.d('Deleting project with ID: $id');

      await _dioClient.delete('${AppConstants.projectsEndpoint}/$id');

      _logger.d('Successfully deleted project: $id');
      return Result.success(null);
    } catch (e) {
      return _handleError('delete project', e);
    }
  }

  @override
  Future<Result<ProjectStatistics>> getProjectStatistics() async {
    try {
      _logger.d('Fetching project statistics');

      final response = await _dioClient.get<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/statistics',
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      final statistics = ProjectStatisticsModel.fromJson(data).toEntity();

      _logger.d('Successfully fetched project statistics');
      return Result.success(statistics);
    } catch (e) {
      return _handleError('fetch project statistics', e);
    }
  }

  @override
  Future<Result<List<Project>>> getOverdueProjects() async {
    try {
      _logger.d('Fetching overdue projects');

      final response = await _dioClient.get<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/overdue',
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      final projectsJson = data['projects'] as List<dynamic>? ?? [];
      final projects = projectsJson
          .map(
            (json) =>
                ProjectModel.fromJson(json as Map<String, dynamic>).toEntity(),
          )
          .toList();

      _logger.d('Successfully fetched ${projects.length} overdue projects');
      return Result.success(projects);
    } catch (e) {
      return _handleError('fetch overdue projects', e);
    }
  }

  @override
  Future<Result<List<ProjectWithProgress>>> getProjectsWithProgress() async {
    try {
      _logger.d('Fetching projects with progress');

      final response = await _dioClient.get<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/progress',
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      final projectsJson = data['projects'] as List<dynamic>? ?? [];
      final projects = projectsJson
          .map(
            (json) => ProjectWithProgressModel.fromJson(
              json as Map<String, dynamic>,
            ).toEntity(),
          )
          .toList();

      _logger.d(
        'Successfully fetched ${projects.length} projects with progress',
      );
      return Result.success(projects);
    } catch (e) {
      return _handleError('fetch projects with progress', e);
    }
  }

  @override
  Future<Result<void>> archiveProject(String id) async {
    try {
      _logger.d('Archiving project: $id');

      await _dioClient.patch('${AppConstants.projectsEndpoint}/$id/archive');

      _logger.d('Successfully archived project: $id');
      return Result.success(null);
    } catch (e) {
      return _handleError('archive project', e);
    }
  }

  @override
  Future<Result<void>> restoreProject(String id) async {
    try {
      _logger.d('Restoring project: $id');

      await _dioClient.patch('${AppConstants.projectsEndpoint}/$id/restore');

      _logger.d('Successfully restored project: $id');
      return Result.success(null);
    } catch (e) {
      return _handleError('restore project', e);
    }
  }

  @override
  Future<Result<Project>> addTagsToProject(String id, List<String> tags) async {
    try {
      _logger.d('Adding tags to project $id: $tags');

      final response = await _dioClient.patch<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/$id/tags',
        data: {'tags': tags, 'action': 'add'},
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      final updatedProject = ProjectModel.fromJson(data).toEntity();

      _logger.d('Successfully added tags to project: $id');
      return Result.success(updatedProject);
    } catch (e) {
      return _handleError('add tags to project', e);
    }
  }

  @override
  Future<Result<Project>> removeTagsFromProject(
    String id,
    List<String> tags,
  ) async {
    try {
      _logger.d('Removing tags from project $id: $tags');

      final response = await _dioClient.patch<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/$id/tags',
        data: {'tags': tags, 'action': 'remove'},
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      final updatedProject = ProjectModel.fromJson(data).toEntity();

      _logger.d('Successfully removed tags from project: $id');
      return Result.success(updatedProject);
    } catch (e) {
      return _handleError('remove tags from project', e);
    }
  }

  @override
  Future<Result<Project>> uploadAttachment(String id, String filePath) async {
    try {
      _logger.d('Uploading attachment to project $id: $filePath');

      final response = await _dioClient.uploadFile<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/$id/attachments',
        filePath,
        'file',
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      final updatedProject = ProjectModel.fromJson(data).toEntity();

      _logger.d('Successfully uploaded attachment to project: $id');
      return Result.success(updatedProject);
    } catch (e) {
      return _handleError('upload attachment to project', e);
    }
  }

  @override
  Future<Result<Project>> removeAttachment(
    String id,
    String attachmentId,
  ) async {
    try {
      _logger.d('Removing attachment from project $id: $attachmentId');

      final response = await _dioClient.delete<Map<String, dynamic>>(
        '${AppConstants.projectsEndpoint}/$id/attachments/$attachmentId',
      );

      final data = response.data;
      if (data == null) {
        return Result.failure(
          const ServerFailure('No data received from server'),
        );
      }

      final updatedProject = ProjectModel.fromJson(data).toEntity();

      _logger.d('Successfully removed attachment from project: $id');
      return Result.success(updatedProject);
    } catch (e) {
      return _handleError('remove attachment from project', e);
    }
  }

  /// Helper method to handle errors consistently
  Result<T> _handleError<T>(String operation, dynamic error) {
    if (error is ServerException) {
      String errorMessage = error.message;
      
      // Try to extract more detailed error information from server response
      if (error.statusCode == 400) {
        // For validation errors, provide more specific messaging
        if (errorMessage.toLowerCase().contains('validation')) {
          errorMessage = 'Validation failed: $errorMessage';
        }
      }
      
      _logger.e('Server error during $operation: $errorMessage, status: ${error.statusCode}');
      return Result.failure(
        ServerFailure(errorMessage, statusCode: error.statusCode),
      );
    } else if (error is NetworkException) {
      _logger.e('Network error during $operation: ${error.message}');
      return Result.failure(NetworkFailure(error.message));
    } else if (error is JsonValidationException) {
      _logger.e('JSON validation error during $operation: ${error.message}');
      return Result.failure(
        JsonValidationFailure(
          error.message,
          objectName: error.objectName,
          missingFields: error.missingFields,
          invalidTypeFields: error.invalidTypeFields,
        ),
      );
    } else {
      _logger.e('Unexpected error during $operation: $error');
      return Result.failure(UnexpectedFailure('Failed to $operation: $error'));
    }
  }
}
