import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/services/app_logger.dart';
import '../../../../core/utils/result.dart';
import '../../../../main.dart';
import '../../domain/usecases/create_project.dart';
import '../../domain/usecases/delete_project.dart' as delete_uc;
import '../../domain/usecases/get_all_projects.dart';
import '../../domain/usecases/get_project_by_id.dart';
import '../../domain/usecases/update_project.dart' as update_uc;
import 'project_event.dart';
import 'project_state.dart';

class ProjectBloc extends Bloc<ProjectEvent, ProjectState> {
  ProjectBloc({
    required GetAllProjects getAllProjects,
    required GetProjectById getProjectById,
    required CreateProject createProject,
    required update_uc.UpdateProject updateProject,
    required delete_uc.DeleteProject deleteProject,
  })  : _getAllProjects = getAllProjects,
        _getProjectById = getProjectById,
        _createProject = createProject,
        _updateProject = updateProject,
        _deleteProject = deleteProject,
        super(const ProjectInitial()) {
    on<LoadProjects>(_onLoadProjects);
    on<LoadProjectById>(_onLoadProjectById);
    on<CreateProjectEvent>(_onCreateProject);
    on<UpdateProject>(_onUpdateProject);
    on<DeleteProject>(_onDeleteProject);
    on<RefreshProjects>(_onRefreshProjects);
    
    logInfo('ProjectBloc initialized');
  }

  final GetAllProjects _getAllProjects;
  final GetProjectById _getProjectById;
  final CreateProject _createProject;
  final update_uc.UpdateProject _updateProject;
  final delete_uc.DeleteProject _deleteProject;

  Future<void> _onLoadProjects(
    LoadProjects event,
    Emitter<ProjectState> emit,
  ) async {
    logDebug('Starting to load all projects');
    emit(const ProjectLoading());
    
    try {
      final result = await _getAllProjects();
      
      switch (result) {
        case Success<List<dynamic>>():
          final projects = result.data;
          emit(ProjectsLoaded(projects));
          logInfo('Successfully loaded ${projects.length} projects');
        case Error<List<dynamic>>():
          emit(ProjectError(result.failure));
          logError('Failed to load projects: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logError('Unexpected error while loading projects', error: e, stackTrace: stackTrace);
      emit(ProjectError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onLoadProjectById(
    LoadProjectById event,
    Emitter<ProjectState> emit,
  ) async {
    logDebug('Loading project by ID: ${event.id}');
    emit(const ProjectOperationLoading('Loading project'));
    
    try {
      final result = await _getProjectById(event.id);
      
      switch (result) {
        case Success():
          final project = result.data;
          emit(ProjectLoaded(project));
          logInfo('Successfully loaded project: ${project.title} (ID: ${event.id})');
        case Error():
          emit(ProjectError(result.failure));
          logError('Failed to load project ${event.id}: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logError('Unexpected error loading project ${event.id}', error: e, stackTrace: stackTrace);
      emit(ProjectError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onCreateProject(
    CreateProjectEvent event,
    Emitter<ProjectState> emit,
  ) async {
    emit(const ProjectOperationLoading('Creating project'));
    
    try {
      final result = await _createProject(event.params);
      
      switch (result) {
        case Success():
          final project = result.data;
          emit(ProjectCreated(project));
          logger.i('Created project: ${project.title}');
          
          // Automatically reload projects after creation
          add(const RefreshProjects());
        case Error():
          emit(ProjectError(result.failure));
          logger.e('Failed to create project: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error creating project', error: e, stackTrace: stackTrace);
      emit(ProjectError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onRefreshProjects(
    RefreshProjects event,
    Emitter<ProjectState> emit,
  ) async {
    // Don't show loading state for refresh
    try {
      final result = await _getAllProjects();
      
      switch (result) {
        case Success<List<dynamic>>():
          final projects = result.data;
          emit(ProjectsLoaded(projects));
          logger.i('Refreshed ${projects.length} projects');
        case Error<List<dynamic>>():
          emit(ProjectError(result.failure));
          logger.e('Failed to refresh projects: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error refreshing projects', error: e, stackTrace: stackTrace);
      emit(ProjectError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onUpdateProject(
    UpdateProject event,
    Emitter<ProjectState> emit,
  ) async {
    emit(const ProjectOperationLoading('Updating project'));
    
    try {
      final result = await _updateProject(event.project);
      
      switch (result) {
        case Success():
          final project = result.data;
          emit(ProjectUpdated(project));
          logger.i('Updated project: ${project.title}');
          
          // Automatically reload projects after update
          add(const RefreshProjects());
        case Error():
          emit(ProjectError(result.failure));
          logger.e('Failed to update project: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error updating project', error: e, stackTrace: stackTrace);
      emit(ProjectError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onDeleteProject(
    DeleteProject event,
    Emitter<ProjectState> emit,
  ) async {
    emit(const ProjectOperationLoading('Deleting project'));
    
    try {
      final result = await _deleteProject(event.id);
      
      switch (result) {
        case Success():
          emit(ProjectDeleted(event.id));
          logger.i('Deleted project: ${event.id}');
          
          // Automatically reload projects after deletion
          add(const RefreshProjects());
        case Error():
          emit(ProjectError(result.failure));
          logger.e('Failed to delete project ${event.id}: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error deleting project ${event.id}', error: e, stackTrace: stackTrace);
      emit(ProjectError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }
}

class UnexpectedFailure extends Failure {
  const UnexpectedFailure(super.message);
}