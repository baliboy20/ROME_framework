import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../entities/project.dart';
import '../repositories/project_repository.dart';

class UpdateProject {
  const UpdateProject(this._repository);

  final ProjectRepository _repository;

  Future<Result<Project>> call(Project project) async {
    // Validate input
    final validationResult = _validateProject(project);
    if (validationResult != null) {
      return Result.failure(validationResult);
    }

    // Update the project's updatedAt timestamp
    final updatedProject = project.copyWith(
      updatedAt: DateTime.now(),
    );

    return await _repository.updateProject(updatedProject);
  }

  ValidationFailure? _validateProject(Project project) {
    if (project.id.isEmpty) {
      return const ValidationFailure('Project ID cannot be empty');
    }

    if (project.title.trim().isEmpty) {
      return const ValidationFailure('Project title cannot be empty');
    }

    if (project.title.length > 100) {
      return const ValidationFailure('Project title cannot exceed 100 characters');
    }

    if (project.description.length > 1000) {
      return const ValidationFailure('Project description cannot exceed 1000 characters');
    }

    return null;
  }
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}