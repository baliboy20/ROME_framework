import '../../../../core/utils/result.dart';
import '../entities/project.dart';
import '../repositories/project_repository.dart';

/// Use case for retrieving all projects
class GetAllProjects {
  const GetAllProjects(this._repository);

  final ProjectRepository _repository;

  /// Execute the use case to get all projects
  Future<Result<List<Project>>> call() async {
    return await _repository.getAllProjects();
  }
}