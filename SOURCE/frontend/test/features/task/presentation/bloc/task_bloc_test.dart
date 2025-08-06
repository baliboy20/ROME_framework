import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/core/utils/result.dart';
import '../../../../../lib/features/task/domain/entities/task.dart';
import '../../../../../lib/features/task/domain/usecases/create_task.dart';
import '../../../../../lib/features/task/domain/usecases/delete_task.dart';
import '../../../../../lib/features/task/domain/usecases/get_all_tasks.dart';
import '../../../../../lib/features/task/domain/usecases/get_tasks_by_status.dart';
import '../../../../../lib/features/task/domain/usecases/update_task.dart';
import '../../../../../lib/features/task/presentation/bloc/task_bloc.dart';
import '../../../../../lib/features/task/presentation/bloc/task_event.dart';
import '../../../../../lib/features/task/presentation/bloc/task_state.dart';

// Mock classes
class MockGetAllTasks extends Mock implements GetAllTasks {}
class MockGetTasksByStatus extends Mock implements GetTasksByStatus {}
class MockCreateTask extends Mock implements CreateTask {}
class MockUpdateTask extends Mock implements UpdateTask {}
class MockDeleteTask extends Mock implements DeleteTask {}

void main() {
  group('TaskBloc', () {
    late TaskBloc taskBloc;
    late MockGetAllTasks mockGetAllTasks;
    late MockGetTasksByStatus mockGetTasksByStatus;
    late MockCreateTask mockCreateTask;
    late MockUpdateTask mockUpdateTask;
    late MockDeleteTask mockDeleteTask;

    // Test data
    final testTask = Task(
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      status: TaskStatus.todo,
      priority: TaskPriority.medium,
      projectId: 'project-1',
      createdAt: DateTime(2025, 1, 1),
      updatedAt: DateTime(2025, 1, 1),
      dueDate: DateTime(2025, 1, 10),
      attachments: [],
    );

    final testTasks = [
      testTask,
      Task(
        id: '2',
        title: 'Another Task',
        description: 'Another Description',
        status: TaskStatus.inProgress,
        priority: TaskPriority.high,
        projectId: 'project-1',
        createdAt: DateTime(2025, 1, 2),
        updatedAt: DateTime(2025, 1, 2),
        attachments: [],
      ),
    ];

    final testCreateParams = CreateTaskParams(
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.todo,
      priority: TaskPriority.medium,
      projectId: 'project-1',
      dueDate: DateTime(2025, 1, 15),
    );

    setUp(() {
      mockGetAllTasks = MockGetAllTasks();
      mockGetTasksByStatus = MockGetTasksByStatus();
      mockCreateTask = MockCreateTask();
      mockUpdateTask = MockUpdateTask();
      mockDeleteTask = MockDeleteTask();

      taskBloc = TaskBloc(
        getAllTasks: mockGetAllTasks,
        getTasksByStatus: mockGetTasksByStatus,
        createTask: mockCreateTask,
        updateTask: mockUpdateTask,
        deleteTask: mockDeleteTask,
      );

      // Register fallback values for mocktail
      registerFallbackValue(testCreateParams);
      registerFallbackValue(testTask);
      registerFallbackValue(TaskStatus.todo);
      registerFallbackValue('test-id');
    });

    tearDown(() {
      taskBloc.close();
    });

    test('initial state should be TaskInitial', () {
      expect(taskBloc.state, const TaskInitial());
    });

    group('LoadTasks', () {
      blocTest<TaskBloc, TaskState>(
        'emits [TaskLoading, TasksLoaded] when GetAllTasks succeeds',
        build: () {
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.success(testTasks),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const LoadTasks()),
        expect: () => [
          const TaskLoading(),
          TasksLoaded(testTasks),
        ],
        verify: (_) {
          verify(() => mockGetAllTasks()).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskLoading, TaskError] when GetAllTasks fails',
        build: () {
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Server error')),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const LoadTasks()),
        expect: () => [
          const TaskLoading(),
          const TaskError(ServerFailure('Server error')),
        ],
        verify: (_) {
          verify(() => mockGetAllTasks()).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskLoading, TasksLoaded] with empty list when no tasks exist',
        build: () {
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.success(<Task>[]),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const LoadTasks()),
        expect: () => [
          const TaskLoading(),
          const TasksLoaded(<Task>[]),
        ],
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskLoading, TaskError] when unexpected exception occurs',
        build: () {
          when(() => mockGetAllTasks()).thenThrow(
            Exception('Unexpected error'),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const LoadTasks()),
        expect: () => [
          const TaskLoading(),
          isA<TaskError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('LoadTasksByStatus', () {
      blocTest<TaskBloc, TaskState>(
        'emits [TaskLoading, TasksLoaded] when GetTasksByStatus succeeds',
        build: () {
          when(() => mockGetTasksByStatus(any())).thenAnswer(
            (_) async => Result.success([testTask]),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const LoadTasksByStatus(TaskStatus.todo)),
        expect: () => [
          const TaskLoading(),
          TasksLoaded([testTask], filteredStatus: TaskStatus.todo),
        ],
        verify: (_) {
          verify(() => mockGetTasksByStatus(TaskStatus.todo)).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskLoading, TaskError] when GetTasksByStatus fails',
        build: () {
          when(() => mockGetTasksByStatus(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Server error')),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const LoadTasksByStatus(TaskStatus.inProgress)),
        expect: () => [
          const TaskLoading(),
          const TaskError(ServerFailure('Server error')),
        ],
        verify: (_) {
          verify(() => mockGetTasksByStatus(TaskStatus.inProgress)).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskLoading, TaskError] when unexpected exception occurs',
        build: () {
          when(() => mockGetTasksByStatus(any())).thenThrow(
            Exception('Unexpected error'),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const LoadTasksByStatus(TaskStatus.done)),
        expect: () => [
          const TaskLoading(),
          isA<TaskError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('CreateTaskEvent', () {
      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskCreated, TaskLoading, TasksLoaded] when CreateTask succeeds',
        build: () {
          when(() => mockCreateTask(any())).thenAnswer(
            (_) async => Result.success(testTask),
          );
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.success(testTasks),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(CreateTaskEvent(testCreateParams)),
        expect: () => [
          const TaskOperationLoading('Creating task'),
          TaskCreated(testTask),
          const TaskLoading(),
          TasksLoaded(testTasks),
        ],
        verify: (_) {
          verify(() => mockCreateTask(testCreateParams)).called(1);
          verify(() => mockGetAllTasks()).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskError] when CreateTask fails with validation error',
        build: () {
          when(() => mockCreateTask(any())).thenAnswer(
            (_) async => Result.failure(const ValidationFailure('Title is required')),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(CreateTaskEvent(testCreateParams)),
        expect: () => [
          const TaskOperationLoading('Creating task'),
          const TaskError(ValidationFailure('Title is required')),
        ],
        verify: (_) {
          verify(() => mockCreateTask(testCreateParams)).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskError] when CreateTask fails with server error',
        build: () {
          when(() => mockCreateTask(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Failed to create task')),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(CreateTaskEvent(testCreateParams)),
        expect: () => [
          const TaskOperationLoading('Creating task'),
          const TaskError(ServerFailure('Failed to create task')),
        ],
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskError] when unexpected exception occurs',
        build: () {
          when(() => mockCreateTask(any())).thenThrow(
            Exception('Unexpected error'),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(CreateTaskEvent(testCreateParams)),
        expect: () => [
          const TaskOperationLoading('Creating task'),
          isA<TaskError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('UpdateTaskEvent', () {
      final updatedTask = testTask.copyWith(
        title: 'Updated Task Title',
        description: 'Updated Description',
        status: TaskStatus.inProgress,
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskUpdated, TaskLoading, TasksLoaded] when UpdateTask succeeds',
        build: () {
          when(() => mockUpdateTask(any())).thenAnswer(
            (_) async => Result.success(updatedTask),
          );
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.success(testTasks),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(UpdateTaskEvent(updatedTask)),
        expect: () => [
          const TaskOperationLoading('Updating task'),
          TaskUpdated(updatedTask),
          const TaskLoading(),
          TasksLoaded(testTasks),
        ],
        verify: (_) {
          verify(() => mockUpdateTask(updatedTask)).called(1);
          verify(() => mockGetAllTasks()).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskError] when UpdateTask fails',
        build: () {
          when(() => mockUpdateTask(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Failed to update task')),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(UpdateTaskEvent(updatedTask)),
        expect: () => [
          const TaskOperationLoading('Updating task'),
          const TaskError(ServerFailure('Failed to update task')),
        ],
        verify: (_) {
          verify(() => mockUpdateTask(updatedTask)).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskError] when task is not found',
        build: () {
          when(() => mockUpdateTask(any())).thenAnswer(
            (_) async => Result.failure(const NotFoundFailure('Task not found')),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(UpdateTaskEvent(updatedTask)),
        expect: () => [
          const TaskOperationLoading('Updating task'),
          const TaskError(NotFoundFailure('Task not found')),
        ],
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskError] when unexpected exception occurs',
        build: () {
          when(() => mockUpdateTask(any())).thenThrow(
            Exception('Unexpected error'),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(UpdateTaskEvent(updatedTask)),
        expect: () => [
          const TaskOperationLoading('Updating task'),
          isA<TaskError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('DeleteTaskEvent', () {
      const taskId = 'test-task-id';

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskDeleted, TaskLoading, TasksLoaded] when DeleteTask succeeds',
        build: () {
          when(() => mockDeleteTask(any())).thenAnswer(
            (_) async => Result.success(null),
          );
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.success(testTasks),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const DeleteTaskEvent(taskId)),
        expect: () => [
          const TaskOperationLoading('Deleting task'),
          const TaskDeleted(taskId),
          const TaskLoading(),
          TasksLoaded(testTasks),
        ],
        verify: (_) {
          verify(() => mockDeleteTask(taskId)).called(1);
          verify(() => mockGetAllTasks()).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskError] when DeleteTask fails',
        build: () {
          when(() => mockDeleteTask(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Failed to delete task')),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const DeleteTaskEvent(taskId)),
        expect: () => [
          const TaskOperationLoading('Deleting task'),
          const TaskError(ServerFailure('Failed to delete task')),
        ],
        verify: (_) {
          verify(() => mockDeleteTask(taskId)).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskError] when task is not found for deletion',
        build: () {
          when(() => mockDeleteTask(any())).thenAnswer(
            (_) async => Result.failure(const NotFoundFailure('Task not found')),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const DeleteTaskEvent(taskId)),
        expect: () => [
          const TaskOperationLoading('Deleting task'),
          const TaskError(NotFoundFailure('Task not found')),
        ],
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskOperationLoading, TaskError] when unexpected exception occurs',
        build: () {
          when(() => mockDeleteTask(any())).thenThrow(
            Exception('Unexpected error'),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const DeleteTaskEvent(taskId)),
        expect: () => [
          const TaskOperationLoading('Deleting task'),
          isA<TaskError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('FilterTasks', () {
      blocTest<TaskBloc, TaskState>(
        'triggers LoadTasks when status is null',
        build: () {
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.success(testTasks),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const FilterTasks(null)),
        expect: () => [
          const TaskLoading(),
          TasksLoaded(testTasks),
        ],
        verify: (_) {
          verify(() => mockGetAllTasks()).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'triggers LoadTasksByStatus when status is provided',
        build: () {
          when(() => mockGetTasksByStatus(any())).thenAnswer(
            (_) async => Result.success([testTask]),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const FilterTasks(TaskStatus.todo)),
        expect: () => [
          const TaskLoading(),
          TasksLoaded([testTask], filteredStatus: TaskStatus.todo),
        ],
        verify: (_) {
          verify(() => mockGetTasksByStatus(TaskStatus.todo)).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits TaskError when unexpected exception occurs',
        build: () {
          when(() => mockGetAllTasks()).thenThrow(
            Exception('Unexpected error'),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const FilterTasks(null)),
        expect: () => [
          const TaskLoading(),
          isA<TaskError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('RefreshTasks', () {
      blocTest<TaskBloc, TaskState>(
        'emits [TasksLoaded] when RefreshTasks succeeds (no loading state)',
        build: () {
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.success(testTasks),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const RefreshTasks()),
        expect: () => [
          TasksLoaded(testTasks),
        ],
        verify: (_) {
          verify(() => mockGetAllTasks()).called(1);
        },
      );

      blocTest<TaskBloc, TaskState>(
        'emits [TaskError] when RefreshTasks fails',
        build: () {
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.failure(const NetworkFailure('Network error')),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const RefreshTasks()),
        expect: () => [
          const TaskError(NetworkFailure('Network error')),
        ],
      );

      blocTest<TaskBloc, TaskState>(
        'emits TaskError when unexpected exception occurs',
        build: () {
          when(() => mockGetAllTasks()).thenThrow(
            Exception('Unexpected error'),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const RefreshTasks()),
        expect: () => [
          isA<TaskError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('Sequential Events', () {
      blocTest<TaskBloc, TaskState>(
        'handles multiple sequential events correctly',
        build: () {
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.success(testTasks),
          );
          when(() => mockCreateTask(any())).thenAnswer(
            (_) async => Result.success(testTask),
          );
          return taskBloc;
        },
        act: (bloc) {
          bloc.add(const LoadTasks());
          bloc.add(CreateTaskEvent(testCreateParams));
        },
        expect: () => [
          const TaskLoading(),
          TasksLoaded(testTasks),
          const TaskOperationLoading('Creating task'),
          TaskCreated(testTask),
          const TaskLoading(),
          TasksLoaded(testTasks),
        ],
      );
    });

    group('State Equality', () {
      test('TasksLoaded states with same tasks should be equal', () {
        final state1 = TasksLoaded(testTasks);
        final state2 = TasksLoaded(testTasks);
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });

      test('TasksLoaded states with different filtered status should not be equal', () {
        final state1 = TasksLoaded(testTasks, filteredStatus: TaskStatus.todo);
        final state2 = TasksLoaded(testTasks, filteredStatus: TaskStatus.done);
        
        expect(state1, isNot(equals(state2)));
      });

      test('TaskError states with same failure should be equal', () {
        const failure = ServerFailure('Error message');
        const state1 = TaskError(failure);
        const state2 = TaskError(failure);
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });

      test('TaskCreated states with same task should be equal', () {
        final state1 = TaskCreated(testTask);
        final state2 = TaskCreated(testTask);
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });

      test('TaskOperationLoading states with same operation should be equal', () {
        const state1 = TaskOperationLoading('Creating task');
        const state2 = TaskOperationLoading('Creating task');
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });
    });

    group('Event Equality', () {
      test('LoadTasksByStatus events with same status should be equal', () {
        const event1 = LoadTasksByStatus(TaskStatus.todo);
        const event2 = LoadTasksByStatus(TaskStatus.todo);
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('CreateTaskEvent events with same params should be equal', () {
        final event1 = CreateTaskEvent(testCreateParams);
        final event2 = CreateTaskEvent(testCreateParams);
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('DeleteTaskEvent events with same id should be equal', () {
        const event1 = DeleteTaskEvent('test-id');
        const event2 = DeleteTaskEvent('test-id');
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('FilterTasks events with same status should be equal', () {
        const event1 = FilterTasks(TaskStatus.inProgress);
        const event2 = FilterTasks(TaskStatus.inProgress);
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('FilterTasks events with null status should be equal', () {
        const event1 = FilterTasks(null);
        const event2 = FilterTasks(null);
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });
    });

    group('Edge Cases', () {
      test('TaskError message property returns failure message', () {
        const failure = ServerFailure('Test error message');
        const taskError = TaskError(failure);
        
        expect(taskError.message, equals('Test error message'));
      });

      blocTest<TaskBloc, TaskState>(
        'handles null results gracefully',
        build: () {
          when(() => mockGetAllTasks()).thenAnswer(
            (_) async => Result.success(null),
          );
          return taskBloc;
        },
        act: (bloc) => bloc.add(const LoadTasks()),
        expect: () => [
          const TaskLoading(),
          const TasksLoaded(<Task>[]),
        ],
      );
    });
  });
}