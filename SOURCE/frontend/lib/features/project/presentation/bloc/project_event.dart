import 'package:equatable/equatable.dart';

import '../../domain/entities/project.dart';
import '../../domain/usecases/create_project.dart';

abstract class ProjectEvent extends Equatable {
  const ProjectEvent();

  @override
  List<Object?> get props => [];
}

class LoadProjects extends ProjectEvent {
  const LoadProjects();
}

class LoadProjectById extends ProjectEvent {
  const LoadProjectById(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class CreateProjectEvent extends ProjectEvent {
  const CreateProjectEvent(this.params);

  final CreateProjectParams params;

  @override
  List<Object?> get props => [params];
}

class UpdateProject extends ProjectEvent {
  const UpdateProject(this.project);

  final Project project;

  @override
  List<Object?> get props => [project];
}

class DeleteProject extends ProjectEvent {
  const DeleteProject(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class RefreshProjects extends ProjectEvent {
  const RefreshProjects();
}