import 'package:equatable/equatable.dart';

import '../../domain/entities/task.dart';
import '../../domain/usecases/create_task.dart';

abstract class TaskEvent extends Equatable {
  const TaskEvent();

  @override
  List<Object?> get props => [];
}

class LoadTasks extends TaskEvent {
  const LoadTasks();
}

class LoadTasksByStatus extends TaskEvent {
  const LoadTasksByStatus(this.status);

  final TaskStatus status;

  @override
  List<Object?> get props => [status];
}

class CreateTaskEvent extends TaskEvent {
  const CreateTaskEvent(this.params);

  final CreateTaskParams params;

  @override
  List<Object?> get props => [params];
}

class UpdateTaskEvent extends TaskEvent {
  const UpdateTaskEvent(this.task);

  final Task task;

  @override
  List<Object?> get props => [task];
}

class DeleteTaskEvent extends TaskEvent {
  const DeleteTaskEvent(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class UpdateTaskStatus extends TaskEvent {
  const UpdateTaskStatus(this.id, this.status);

  final String id;
  final TaskStatus status;

  @override
  List<Object?> get props => [id, status];
}

class FilterTasks extends TaskEvent {
  const FilterTasks(this.status);

  final TaskStatus? status;

  @override
  List<Object?> get props => [status];
}

class RefreshTasks extends TaskEvent {
  const RefreshTasks();
}