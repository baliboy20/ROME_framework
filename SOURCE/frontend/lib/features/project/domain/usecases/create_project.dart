import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../entities/project.dart';
import '../repositories/project_repository.dart';

/// Use case for creating a new project
class CreateProject {
  const CreateProject(this._repository);

  final ProjectRepository _repository;

  /// Execute the use case to create a new project
  /// [params] The parameters for creating a project
  Future<Result<Project>> call(CreateProjectParams params) async {
    // Validate input
    final validationResult = _validateParams(params);
    if (validationResult != null) {
      return Result.failure(validationResult);
    }

    // Create project entity
    final project = Project(
      id: '', // Will be assigned by the server
      title: params.title,
      description: params.description,
      status: params.status,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      ownerId: params.ownerId,
      localSourceFolder: params.localSourceFolder,
      githubRepo: params.githubRepo,
      tags: params.tags,
    );

    return await _repository.createProject(project);
  }

  /// Validate the creation parameters
  ValidationFailure? _validateParams(CreateProjectParams params) {
    if (params.title.trim().isEmpty) {
      return const ValidationFailure('Project title cannot be empty');
    }

    if (params.title.length > 100) {
      return const ValidationFailure('Project title cannot exceed 100 characters');
    }

    if (params.description.length > 1000) {
      return const ValidationFailure('Project description cannot exceed 1000 characters');
    }

    return null;
  }
}

/// Parameters for creating a project
class CreateProjectParams {
  const CreateProjectParams({
    required this.title,
    required this.description,
    required this.status,
    this.ownerId,
    this.localSourceFolder,
    this.githubRepo,
    this.tags = const [],
  });

  final String title;
  final String description;
  final ProjectStatus status;
  final String? ownerId;
  final String? localSourceFolder;
  final String? githubRepo;
  final List<String> tags;

  @override
  String toString() {
    return 'CreateProjectParams(title: $title, status: $status)';
  }
}