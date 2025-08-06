import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/services/app_logger.dart';
import '../../../../core/utils/result.dart';
import '../../../../main.dart';
import '../../domain/usecases/create_task.dart';
import '../../domain/usecases/delete_task.dart';
import '../../domain/usecases/get_all_tasks.dart';
import '../../domain/usecases/get_tasks_by_status.dart';
import '../../domain/usecases/update_task.dart';
import 'task_event.dart';
import 'task_state.dart';

class TaskBloc extends Bloc<TaskEvent, TaskState> {
  TaskBloc({
    required GetAllTasks getAllTasks,
    required GetTasksByStatus getTasksByStatus,
    required CreateTask createTask,
    required UpdateTask updateTask,
    required DeleteTask deleteTask,
  })  : _getAllTasks = getAllTasks,
        _getTasksByStatus = getTasksByStatus,
        _createTask = createTask,
        _updateTask = updateTask,
        _deleteTask = deleteTask,
        super(const TaskInitial()) {
    on<LoadTasks>(_onLoadTasks);
    on<LoadTasksByStatus>(_onLoadTasksByStatus);
    on<CreateTaskEvent>(_onCreateTask);
    on<UpdateTaskEvent>(_onUpdateTask);
    on<DeleteTaskEvent>(_onDeleteTask);
    on<FilterTasks>(_onFilterTasks);
    on<RefreshTasks>(_onRefreshTasks);
    
    logInfo('TaskBloc initialized');
  }

  final GetAllTasks _getAllTasks;
  final GetTasksByStatus _getTasksByStatus;
  final CreateTask _createTask;
  final UpdateTask _updateTask;
  final DeleteTask _deleteTask;

  Future<void> _onLoadTasks(
    LoadTasks event,
    Emitter<TaskState> emit,
  ) async {
    emit(const TaskLoading());
    
    try {
      final result = await _getAllTasks();
      
      switch (result) {
        case Success<List<dynamic>>():
          final tasks = result.data;
          emit(TasksLoaded(tasks));
          logger.i('Loaded ${tasks.length} tasks');
        case Error<List<dynamic>>():
          emit(TaskError(result.failure));
          logger.e('Failed to load tasks: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error loading tasks', error: e, stackTrace: stackTrace);
      emit(TaskError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onLoadTasksByStatus(
    LoadTasksByStatus event,
    Emitter<TaskState> emit,
  ) async {
    emit(const TaskLoading());
    
    try {
      final result = await _getTasksByStatus(event.status);
      
      switch (result) {
        case Success<List<dynamic>>():
          final tasks = result.data;
          emit(TasksLoaded(tasks, filteredStatus: event.status));
          logger.i('Loaded ${tasks.length} tasks with status ${event.status.name}');
        case Error<List<dynamic>>():
          emit(TaskError(result.failure));
          logger.e('Failed to load tasks by status: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error loading tasks by status', error: e, stackTrace: stackTrace);
      emit(TaskError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onCreateTask(
    CreateTaskEvent event,
    Emitter<TaskState> emit,
  ) async {
    emit(const TaskOperationLoading('Creating task'));
    
    try {
      final result = await _createTask(event.params);
      
      switch (result) {
        case Success():
          final task = result.data;
          emit(TaskCreated(task));
          logger.i('Created task: ${task.title}');
          
          // Automatically reload tasks after creation
          add(const RefreshTasks());
        case Error():
          emit(TaskError(result.failure));
          logger.e('Failed to create task: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error creating task', error: e, stackTrace: stackTrace);
      emit(TaskError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onUpdateTask(
    UpdateTaskEvent event,
    Emitter<TaskState> emit,
  ) async {
    emit(const TaskOperationLoading('Updating task'));
    
    try {
      final result = await _updateTask(event.task);
      
      switch (result) {
        case Success():
          final task = result.data;
          emit(TaskUpdated(task));
          logger.i('Updated task: ${task.title}');
          
          // Automatically reload tasks after update
          add(const RefreshTasks());
        case Error():
          emit(TaskError(result.failure));
          logger.e('Failed to update task: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error updating task', error: e, stackTrace: stackTrace);
      emit(TaskError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onDeleteTask(
    DeleteTaskEvent event,
    Emitter<TaskState> emit,
  ) async {
    emit(const TaskOperationLoading('Deleting task'));
    
    try {
      final result = await _deleteTask(event.id);
      
      switch (result) {
        case Success():
          emit(TaskDeleted(event.id));
          logger.i('Deleted task: ${event.id}');
          
          // Automatically reload tasks after deletion
          add(const RefreshTasks());
        case Error():
          emit(TaskError(result.failure));
          logger.e('Failed to delete task ${event.id}: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error deleting task ${event.id}', error: e, stackTrace: stackTrace);
      emit(TaskError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onFilterTasks(
    FilterTasks event,
    Emitter<TaskState> emit,
  ) async {
    try {
      if (event.status == null) {
        // Load all tasks
        add(const LoadTasks());
      } else {
        // Load tasks by status
        add(LoadTasksByStatus(event.status!));
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error filtering tasks', error: e, stackTrace: stackTrace);
      emit(TaskError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onRefreshTasks(
    RefreshTasks event,
    Emitter<TaskState> emit,
  ) async {
    // Don't show loading state for refresh
    try {
      final result = await _getAllTasks();
      
      switch (result) {
        case Success<List<dynamic>>():
          final tasks = result.data;
          emit(TasksLoaded(tasks));
          logger.i('Refreshed ${tasks.length} tasks');
        case Error<List<dynamic>>():
          emit(TaskError(result.failure));
          logger.e('Failed to refresh tasks: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error refreshing tasks', error: e, stackTrace: stackTrace);
      emit(TaskError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }
}

class UnexpectedFailure extends Failure {
  const UnexpectedFailure(super.message);
}