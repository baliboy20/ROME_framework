import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/core/utils/result.dart';
import '../../../../../lib/features/task/domain/entities/task.dart';
import '../../../../../lib/features/task/domain/repositories/task_repository.dart';
import '../../../../../lib/features/task/domain/usecases/create_task.dart';

// Mock classes
class MockTaskRepository extends Mock implements TaskRepository {}

void main() {
  group('CreateTask', () {
    late CreateTask useCase;
    late MockTaskRepository mockRepository;

    setUp(() {
      mockRepository = MockTaskRepository();
      useCase = CreateTask(mockRepository);
      
      // Register fallback values for mocktail
      registerFallbackValue(Task(
        id: '',
        title: '',
        description: '',
        status: TaskStatus.todo,
        priority: TaskPriority.medium,
        projectId: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        attachments: [],
      ));
    });

    group('successful creation', () {
      test('should create task with valid parameters', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          assigneeId: 'user-1',
          dueDate: DateTime(2025, 12, 31),
          estimatedHours: 8.0,
          tags: ['test', 'important'],
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          priority: params.priority,
          projectId: params.projectId,
          assigneeId: params.assigneeId,
          dueDate: params.dueDate,
          estimatedHours: params.estimatedHours,
          tags: params.tags,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data, equals(expectedTask));

        // Verify repository was called with correct task
        verify(() => mockRepository.createTask(any(that: predicate<Task>((task) =>
            task.title == params.title &&
            task.description == params.description &&
            task.status == params.status &&
            task.priority == params.priority &&
            task.projectId == params.projectId &&
            task.assigneeId == params.assigneeId &&
            task.dueDate == params.dueDate &&
            task.estimatedHours == params.estimatedHours &&
            task.tags == params.tags &&
            task.id.isEmpty // ID should be empty before creation
        )))).called(1);
      });

      test('should create task with minimal parameters', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Minimal Task',
          description: 'Minimal Description',
          status: TaskStatus.todo,
          priority: TaskPriority.low,
          projectId: 'project-1',
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          priority: params.priority,
          projectId: params.projectId,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data, equals(expectedTask));

        // Verify task entity was created correctly
        verify(() => mockRepository.createTask(any(that: predicate<Task>((task) =>
            task.title == params.title &&
            task.description == params.description &&
            task.status == params.status &&
            task.priority == params.priority &&
            task.projectId == params.projectId &&
            task.assigneeId == null &&
            task.dueDate == null &&
            task.estimatedHours == null &&
            task.tags.isEmpty
        )))).called(1);
      });

      test('should create task with all possible statuses and priorities', () async {
        // Test all status combinations
        for (final status in TaskStatus.values) {
          for (final priority in TaskPriority.values) {
            final params = CreateTaskParams(
              title: 'Test Task',
              description: 'Test Description',
              status: status,
              priority: priority,
              projectId: 'project-1',
            );

            final expectedTask = Task(
              id: 'generated-id',
              title: params.title,
              description: params.description,
              status: status,
              priority: priority,
              projectId: params.projectId,
              createdAt: DateTime(2025, 1, 1),
              updatedAt: DateTime(2025, 1, 1),
              attachments: [],
            );

            when(() => mockRepository.createTask(any()))
                .thenAnswer((_) async => Result.success(expectedTask));

            final result = await useCase(params);

            expect(result, isA<Success<Task>>(), 
                reason: 'Failed for status: $status, priority: $priority');
            final successResult = result as Success<Task>;
            expect(successResult.data.status, equals(status));
            expect(successResult.data.priority, equals(priority));
          }
        }
      });

      test('should set creation and update timestamps', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          priority: params.priority,
          projectId: params.projectId,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        final beforeCall = DateTime.now();

        // Act
        final result = await useCase(params);

        final afterCall = DateTime.now();

        // Assert
        expect(result, isA<Success<Task>>());

        // Verify timestamps were set during creation
        verify(() => mockRepository.createTask(any(that: predicate<Task>((task) {
          final createdAt = task.createdAt;
          final updatedAt = task.updatedAt;
          
          return createdAt.isAfter(beforeCall.subtract(const Duration(seconds: 1))) &&
                 createdAt.isBefore(afterCall.add(const Duration(seconds: 1))) &&
                 updatedAt.isAfter(beforeCall.subtract(const Duration(seconds: 1))) &&
                 updatedAt.isBefore(afterCall.add(const Duration(seconds: 1)));
        })))).called(1);
      });
    });

    group('validation failures', () {
      test('should fail when task title is empty', () async {
        // Arrange
        final params = CreateTaskParams(
          title: '',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Task>>());
        final errorResult = result as Error<Task>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Task title cannot be empty'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createTask(any()));
      });

      test('should fail when task title is only whitespace', () async {
        // Arrange
        final params = CreateTaskParams(
          title: '   ',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Task>>());
        final errorResult = result as Error<Task>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Task title cannot be empty'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createTask(any()));
      });

      test('should fail when task title exceeds 200 characters', () async {
        // Arrange
        final longTitle = 'a' * 201;
        final params = CreateTaskParams(
          title: longTitle,
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Task>>());
        final errorResult = result as Error<Task>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Task title cannot exceed 200 characters'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createTask(any()));
      });

      test('should fail when description exceeds 2000 characters', () async {
        // Arrange
        final longDescription = 'a' * 2001;
        final params = CreateTaskParams(
          title: 'Test Task',
          description: longDescription,
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Task>>());
        final errorResult = result as Error<Task>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Task description cannot exceed 2000 characters'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createTask(any()));
      });

      test('should fail when project ID is empty', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: '',
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Task>>());
        final errorResult = result as Error<Task>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Project ID is required'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createTask(any()));
      });

      test('should fail when estimated hours is negative', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          estimatedHours: -1.0,
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Task>>());
        final errorResult = result as Error<Task>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Estimated hours cannot be negative'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createTask(any()));
      });

      test('should pass with exactly 200 character title', () async {
        // Arrange
        final maxLengthTitle = 'a' * 200;
        final params = CreateTaskParams(
          title: maxLengthTitle,
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: maxLengthTitle,
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        verify(() => mockRepository.createTask(any())).called(1);
      });

      test('should pass with exactly 2000 character description', () async {
        // Arrange
        final maxLengthDescription = 'a' * 2000;
        final params = CreateTaskParams(
          title: 'Test Task',
          description: maxLengthDescription,
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: 'Test Task',
          description: maxLengthDescription,
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        verify(() => mockRepository.createTask(any())).called(1);
      });

      test('should pass with zero estimated hours', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          estimatedHours: 0.0,
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          estimatedHours: 0.0,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        verify(() => mockRepository.createTask(any())).called(1);
      });
    });

    group('repository failures', () {
      test('should propagate server failure from repository', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.failure(const ServerFailure('Server error')));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Task>>());
        final errorResult = result as Error<Task>;
        expect(errorResult.failure, isA<ServerFailure>());
        expect(errorResult.failure.message, equals('Server error'));

        verify(() => mockRepository.createTask(any())).called(1);
      });

      test('should propagate network failure from repository', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.failure(const NetworkFailure('Network error')));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Task>>());
        final errorResult = result as Error<Task>;
        expect(errorResult.failure, isA<NetworkFailure>());
        expect(errorResult.failure.message, equals('Network error'));

        verify(() => mockRepository.createTask(any())).called(1);
      });
    });

    group('edge cases', () {
      test('should handle special characters in title and description', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task 🚀 with émöjis & spéciál chars',
          description: 'Description with special chars: @#$%^&*()[]{}|\\:";\'<>?,./',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          priority: params.priority,
          projectId: params.projectId,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data.title, equals(params.title));
        expect(successResult.data.description, equals(params.description));
      });

      test('should handle empty description', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: '',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: params.title,
          description: '',
          status: params.status,
          priority: params.priority,
          projectId: params.projectId,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data.description, isEmpty);
      });

      test('should handle future due date', () async {
        // Arrange
        final futureDate = DateTime.now().add(const Duration(days: 30));
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          dueDate: futureDate,
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          priority: params.priority,
          projectId: params.projectId,
          dueDate: futureDate,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data.dueDate, equals(futureDate));
      });

      test('should handle multiple tags', () async {
        // Arrange
        final tags = ['urgent', 'bug', 'frontend', 'refactor', 'test'];
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          tags: tags,
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          priority: params.priority,
          projectId: params.projectId,
          tags: tags,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data.tags, equals(tags));
      });

      test('should handle fractional estimated hours', () async {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          estimatedHours: 4.5,
        );

        final expectedTask = Task(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          priority: params.priority,
          projectId: params.projectId,
          estimatedHours: 4.5,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createTask(any()))
            .thenAnswer((_) async => Result.success(expectedTask));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data.estimatedHours, equals(4.5));
      });
    });

    group('CreateTaskParams', () {
      test('should have correct toString representation', () {
        // Arrange
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.high,
          projectId: 'project-1',
        );

        // Act
        final result = params.toString();

        // Assert
        expect(result, equals('CreateTaskParams(title: Test Task, status: TaskStatus.todo, priority: TaskPriority.high)'));
      });

      test('should create params with default values', () {
        // Arrange & Act
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
        );

        // Assert
        expect(params.title, equals('Test Task'));
        expect(params.description, equals('Test Description'));
        expect(params.status, equals(TaskStatus.todo));
        expect(params.priority, equals(TaskPriority.medium));
        expect(params.projectId, equals('project-1'));
        expect(params.assigneeId, isNull);
        expect(params.dueDate, isNull);
        expect(params.estimatedHours, isNull);
        expect(params.tags, isEmpty);
      });

      test('should create params with all values', () {
        // Arrange & Act
        final params = CreateTaskParams(
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.inProgress,
          priority: TaskPriority.critical,
          projectId: 'project-1',
          assigneeId: 'user-1',
          dueDate: DateTime(2025, 12, 31),
          estimatedHours: 16.0,
          tags: ['important', 'urgent'],
        );

        // Assert
        expect(params.title, equals('Test Task'));
        expect(params.description, equals('Test Description'));
        expect(params.status, equals(TaskStatus.inProgress));
        expect(params.priority, equals(TaskPriority.critical));
        expect(params.projectId, equals('project-1'));
        expect(params.assigneeId, equals('user-1'));
        expect(params.dueDate, equals(DateTime(2025, 12, 31)));
        expect(params.estimatedHours, equals(16.0));
        expect(params.tags, equals(['important', 'urgent']));
      });
    });
  });
}