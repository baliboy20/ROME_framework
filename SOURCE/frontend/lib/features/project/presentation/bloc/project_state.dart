import 'package:equatable/equatable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/project.dart';

abstract class ProjectState extends Equatable {
  const ProjectState();

  @override
  List<Object?> get props => [];
}

class ProjectInitial extends ProjectState {
  const ProjectInitial();
}

class ProjectLoading extends ProjectState {
  const ProjectLoading();
}

class ProjectsLoaded extends ProjectState {
  const ProjectsLoaded(this.projects);

  final List<Project> projects;

  @override
  List<Object?> get props => [projects];
}

class ProjectLoaded extends ProjectState {
  const ProjectLoaded(this.project);

  final Project project;

  @override
  List<Object?> get props => [project];
}

class ProjectCreated extends ProjectState {
  const ProjectCreated(this.project);

  final Project project;

  @override
  List<Object?> get props => [project];
}

class ProjectUpdated extends ProjectState {
  const ProjectUpdated(this.project);

  final Project project;

  @override
  List<Object?> get props => [project];
}

class ProjectDeleted extends ProjectState {
  const ProjectDeleted(this.projectId);

  final String projectId;

  @override
  List<Object?> get props => [projectId];
}

class ProjectError extends ProjectState {
  const ProjectError(this.failure);

  final Failure failure;

  @override
  List<Object?> get props => [failure];

  String get message => failure.message;
}

class ProjectOperationLoading extends ProjectState {
  const ProjectOperationLoading(this.operation);

  final String operation;

  @override
  List<Object?> get props => [operation];
}