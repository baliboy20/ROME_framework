import 'package:equatable/equatable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/task.dart';

abstract class TaskState extends Equatable {
  const TaskState();

  @override
  List<Object?> get props => [];
}

class TaskInitial extends TaskState {
  const TaskInitial();
}

class TaskLoading extends TaskState {
  const TaskLoading();
}

class TasksLoaded extends TaskState {
  const TasksLoaded(this.tasks, {this.filteredStatus});

  final List<Task> tasks;
  final TaskStatus? filteredStatus;

  @override
  List<Object?> get props => [tasks, filteredStatus];
}

class TaskCreated extends TaskState {
  const TaskCreated(this.task);

  final Task task;

  @override
  List<Object?> get props => [task];
}

class TaskUpdated extends TaskState {
  const TaskUpdated(this.task);

  final Task task;

  @override
  List<Object?> get props => [task];
}

class TaskDeleted extends TaskState {
  const TaskDeleted(this.taskId);

  final String taskId;

  @override
  List<Object?> get props => [taskId];
}

class TaskError extends TaskState {
  const TaskError(this.failure);

  final Failure failure;

  @override
  List<Object?> get props => [failure];

  String get message => failure.message;
}

class TaskOperationLoading extends TaskState {
  const TaskOperationLoading(this.operation);

  final String operation;

  @override
  List<Object?> get props => [operation];
}