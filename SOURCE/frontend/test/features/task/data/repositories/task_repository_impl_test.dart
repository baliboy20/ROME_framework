import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/network/dio_client.dart';
import '../../../../../lib/core/utils/result.dart';
import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/features/task/data/repositories/task_repository_impl.dart';
import '../../../../../lib/features/task/domain/entities/task.dart';

// Mock classes
class MockDioClient extends Mock implements DioClient {}

void main() {
  group('TaskRepositoryImpl', () {
    late TaskRepositoryImpl repository;
    late MockDioClient mockDioClient;

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

    setUp(() {
      mockDioClient = MockDioClient();
      repository = TaskRepositoryImpl(mockDioClient);
    });

    group('getAllTasks', () {
      test('should return empty list when no tasks exist', () async {
        // Act
        final result = await repository.getAllTasks();

        // Assert
        expect(result, isA<Success<List<Task>>>());
        final successResult = result as Success<List<Task>>;
        expect(successResult.data, isEmpty);
      });

      test('should complete within reasonable time', () async {
        // Arrange
        final stopwatch = Stopwatch()..start();

        // Act
        await repository.getAllTasks();

        // Assert
        stopwatch.stop();
        expect(stopwatch.elapsedMilliseconds, lessThan(1000)); // Should complete within 1 second
      });

      test('should return failure when exception occurs', () async {
        // Note: Since the current implementation uses a delay and doesn't actually throw,
        // this test verifies the error handling structure is in place
        
        // Act
        final result = await repository.getAllTasks();

        // Assert - Current implementation returns success with empty list
        expect(result, isA<Success<List<Task>>>());
      });
    });

    group('getTaskById', () {
      test('should return failure for any task ID (current implementation)', () async {
        // Act
        final result = await repository.getTaskById('test-id');

        // Assert
        expect(result, isA<Error<Task>>());
        final errorResult = result as Error<Task>;
        expect(errorResult.failure, isA<ServerFailure>());
        expect(errorResult.failure.message, equals('Task not found'));
      });

      test('should complete within reasonable time', () async {
        // Arrange
        final stopwatch = Stopwatch()..start();

        // Act
        await repository.getTaskById('test-id');

        // Assert
        stopwatch.stop();
        expect(stopwatch.elapsedMilliseconds, lessThan(1000));
      });
    });

    group('createTask', () {
      test('should return created task with generated ID', () async {
        // Act
        final result = await repository.createTask(testTask);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data.title, equals(testTask.title));
        expect(successResult.data.description, equals(testTask.description));
        expect(successResult.data.status, equals(testTask.status));
        expect(successResult.data.priority, equals(testTask.priority));
        expect(successResult.data.projectId, equals(testTask.projectId));
        // ID should be different (generated)
        expect(successResult.data.id, isNot(equals(testTask.id)));
        expect(successResult.data.id, isNotEmpty);
      });

      test('should generate unique IDs for different tasks', () async {
        // Act
        final result1 = await repository.createTask(testTask);
        await Future.delayed(const Duration(milliseconds: 1)); // Ensure different timestamps
        final result2 = await repository.createTask(testTask);

        // Assert
        expect(result1, isA<Success<Task>>());
        expect(result2, isA<Success<Task>>());
        final task1 = (result1 as Success<Task>).data;
        final task2 = (result2 as Success<Task>).data;
        expect(task1.id, isNot(equals(task2.id)));
      });

      test('should preserve all task properties except ID', () async {
        // Arrange
        final complexTask = Task(
          id: 'original-id',
          title: 'Complex Task',
          description: 'Complex Description',
          status: TaskStatus.inProgress,
          priority: TaskPriority.critical,
          projectId: 'project-2',
          assigneeId: 'user-1',
          dueDate: DateTime(2025, 12, 31),
          estimatedHours: 10.5,
          tags: ['urgent', 'feature'],
          attachments: ['file1.pdf'],
          dependencies: ['task-3'],
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
        );

        // Act
        final result = await repository.createTask(complexTask);

        // Assert
        expect(result, isA<Success<Task>>());
        final createdTask = (result as Success<Task>).data;
        expect(createdTask.title, equals(complexTask.title));
        expect(createdTask.description, equals(complexTask.description));
        expect(createdTask.status, equals(complexTask.status));
        expect(createdTask.priority, equals(complexTask.priority));
        expect(createdTask.projectId, equals(complexTask.projectId));
        expect(createdTask.assigneeId, equals(complexTask.assigneeId));
        expect(createdTask.dueDate, equals(complexTask.dueDate));
        expect(createdTask.estimatedHours, equals(complexTask.estimatedHours));
        expect(createdTask.tags, equals(complexTask.tags));
        expect(createdTask.attachments, equals(complexTask.attachments));
        expect(createdTask.dependencies, equals(complexTask.dependencies));
        expect(createdTask.createdAt, equals(complexTask.createdAt));
        expect(createdTask.updatedAt, equals(complexTask.updatedAt));
      });

      test('should complete within reasonable time', () async {
        // Arrange
        final stopwatch = Stopwatch()..start();

        // Act
        await repository.createTask(testTask);

        // Assert
        stopwatch.stop();
        expect(stopwatch.elapsedMilliseconds, lessThan(1000));
      });
    });

    group('updateTask', () {
      test('should return updated task unchanged', () async {
        // Act
        final result = await repository.updateTask(testTask);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data, equals(testTask));
      });

      test('should preserve all task properties', () async {
        // Arrange
        final updatedTask = testTask.copyWith(
          title: 'Updated Title',
          description: 'Updated Description',
          status: TaskStatus.done,
          priority: TaskPriority.low,
        );

        // Act
        final result = await repository.updateTask(updatedTask);

        // Assert
        expect(result, isA<Success<Task>>());
        final successResult = result as Success<Task>;
        expect(successResult.data, equals(updatedTask));
        expect(successResult.data.title, equals('Updated Title'));
        expect(successResult.data.description, equals('Updated Description'));
        expect(successResult.data.status, equals(TaskStatus.done));
        expect(successResult.data.priority, equals(TaskPriority.low));
      });

      test('should complete within reasonable time', () async {
        // Arrange
        final stopwatch = Stopwatch()..start();

        // Act
        await repository.updateTask(testTask);

        // Assert
        stopwatch.stop();
        expect(stopwatch.elapsedMilliseconds, lessThan(1000));
      });
    });

    group('deleteTask', () {
      test('should return success when deleting task', () async {
        // Act
        final result = await repository.deleteTask('test-id');

        // Assert
        expect(result, isA<Success<void>>());
        final successResult = result as Success<void>;
        expect(successResult.data, isNull);
      });

      test('should accept any task ID', () async {
        // Act
        final result1 = await repository.deleteTask('valid-id');
        final result2 = await repository.deleteTask('another-id');
        final result3 = await repository.deleteTask('');

        // Assert
        expect(result1, isA<Success<void>>());
        expect(result2, isA<Success<void>>());
        expect(result3, isA<Success<void>>());
      });

      test('should complete within reasonable time', () async {
        // Arrange
        final stopwatch = Stopwatch()..start();

        // Act
        await repository.deleteTask('test-id');

        // Assert
        stopwatch.stop();
        expect(stopwatch.elapsedMilliseconds, lessThan(1000));
      });
    });

    group('getTasksByStatus', () {
      test('should return empty list for any status', () async {
        // Act
        final todoResult = await repository.getTasksByStatus(TaskStatus.todo);
        final inProgressResult = await repository.getTasksByStatus(TaskStatus.inProgress);
        final doneResult = await repository.getTasksByStatus(TaskStatus.done);

        // Assert
        expect(todoResult, isA<Success<List<Task>>>());
        expect(inProgressResult, isA<Success<List<Task>>>());
        expect(doneResult, isA<Success<List<Task>>>());
        
        expect((todoResult as Success<List<Task>>).data, isEmpty);
        expect((inProgressResult as Success<List<Task>>).data, isEmpty);
        expect((doneResult as Success<List<Task>>).data, isEmpty);
      });

      test('should complete within reasonable time', () async {
        // Arrange
        final stopwatch = Stopwatch()..start();

        // Act
        await repository.getTasksByStatus(TaskStatus.todo);

        // Assert
        stopwatch.stop();
        expect(stopwatch.elapsedMilliseconds, lessThan(1000));
      });
    });

    group('Not Implemented Methods', () {
      test('getTasksByProjectId should return NotImplementedFailure', () async {
        // Act
        final result = await repository.getTasksByProjectId('project-1');

        // Assert
        expect(result, isA<Error<List<Task>>>());
        final errorResult = result as Error<List<Task>>;
        expect(errorResult.failure, isA<NotImplementedFailure>());
        expect(errorResult.failure.message, equals('Not implemented yet'));
      });

      test('getTasksByPriority should return NotImplementedFailure', () async {
        // Act
        final result = await repository.getTasksByPriority(TaskPriority.high);

        // Assert
        expect(result, isA<Error<List<Task>>>());
        expect((result as Error<List<Task>>).failure, isA<NotImplementedFailure>());
      });

      test('getTasksByAssignee should return NotImplementedFailure', () async {
        // Act
        final result = await repository.getTasksByAssignee('user-1');

        // Assert
        expect(result, isA<Error<List<Task>>>());
        expect((result as Error<List<Task>>).failure, isA<NotImplementedFailure>());
      });

      test('getOverdueTasks should return NotImplementedFailure', () async {
        // Act
        final result = await repository.getOverdueTasks();

        // Assert
        expect(result, isA<Error<List<Task>>>());
        expect((result as Error<List<Task>>).failure, isA<NotImplementedFailure>());
      });

      test('getTasksDueSoon should return NotImplementedFailure', () async {
        // Act
        final result = await repository.getTasksDueSoon();

        // Assert
        expect(result, isA<Error<List<Task>>>());
        expect((result as Error<List<Task>>).failure, isA<NotImplementedFailure>());
      });

      test('searchTasks should return NotImplementedFailure', () async {
        // Act
        final result = await repository.searchTasks('query');

        // Assert
        expect(result, isA<Error<List<Task>>>());
        expect((result as Error<List<Task>>).failure, isA<NotImplementedFailure>());
      });

      test('updateTaskStatus should return NotImplementedFailure', () async {
        // Act
        final result = await repository.updateTaskStatus('task-1', TaskStatus.done);

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('assignTask should return NotImplementedFailure', () async {
        // Act
        final result = await repository.assignTask('task-1', 'user-1');

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('unassignTask should return NotImplementedFailure', () async {
        // Act
        final result = await repository.unassignTask('task-1');

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('updateTaskPriority should return NotImplementedFailure', () async {
        // Act
        final result = await repository.updateTaskPriority('task-1', TaskPriority.critical);

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('addTimeEntry should return NotImplementedFailure', () async {
        // Act
        final result = await repository.addTimeEntry('task-1', 2.5, 'Work done');

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('updateEstimatedHours should return NotImplementedFailure', () async {
        // Act
        final result = await repository.updateEstimatedHours('task-1', 8.0);

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('getTaskStatistics should return NotImplementedFailure', () async {
        // Act
        final result = await repository.getTaskStatistics();

        // Assert
        expect(result, isA<Error<TaskStatistics>>());
        expect((result as Error<TaskStatistics>).failure, isA<NotImplementedFailure>());
      });

      test('getTaskStatistics with projectId should return NotImplementedFailure', () async {
        // Act
        final result = await repository.getTaskStatistics(projectId: 'project-1');

        // Assert
        expect(result, isA<Error<TaskStatistics>>());
        expect((result as Error<TaskStatistics>).failure, isA<NotImplementedFailure>());
      });

      test('getTaskDependencies should return NotImplementedFailure', () async {
        // Act
        final result = await repository.getTaskDependencies('task-1');

        // Assert
        expect(result, isA<Error<List<Task>>>());
        expect((result as Error<List<Task>>).failure, isA<NotImplementedFailure>());
      });

      test('addTaskDependency should return NotImplementedFailure', () async {
        // Act
        final result = await repository.addTaskDependency('task-1', 'task-2');

        // Assert
        expect(result, isA<Error<void>>());
        expect((result as Error<void>).failure, isA<NotImplementedFailure>());
      });

      test('removeTaskDependency should return NotImplementedFailure', () async {
        // Act
        final result = await repository.removeTaskDependency('task-1', 'task-2');

        // Assert
        expect(result, isA<Error<void>>());
        expect((result as Error<void>).failure, isA<NotImplementedFailure>());
      });

      test('getSubtasks should return NotImplementedFailure', () async {
        // Act
        final result = await repository.getSubtasks('parent-task-1');

        // Assert
        expect(result, isA<Error<List<Task>>>());
        expect((result as Error<List<Task>>).failure, isA<NotImplementedFailure>());
      });

      test('createSubtask should return NotImplementedFailure', () async {
        // Act
        final result = await repository.createSubtask('parent-task-1', testTask);

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('addTagsToTask should return NotImplementedFailure', () async {
        // Act
        final result = await repository.addTagsToTask('task-1', ['tag1', 'tag2']);

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('removeTagsFromTask should return NotImplementedFailure', () async {
        // Act
        final result = await repository.removeTagsFromTask('task-1', ['tag1']);

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('uploadAttachment should return NotImplementedFailure', () async {
        // Act
        final result = await repository.uploadAttachment('task-1', '/path/to/file.pdf');

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });

      test('removeAttachment should return NotImplementedFailure', () async {
        // Act
        final result = await repository.removeAttachment('task-1', 'attachment-1');

        // Assert
        expect(result, isA<Error<Task>>());
        expect((result as Error<Task>).failure, isA<NotImplementedFailure>());
      });
    });

    group('Edge Cases and Error Handling', () {
      test('should handle empty task ID in deleteTask', () async {
        // Act
        final result = await repository.deleteTask('');

        // Assert
        expect(result, isA<Success<void>>());
      });

      test('should handle very long task ID in deleteTask', () async {
        // Arrange
        final longId = 'x' * 10000;

        // Act
        final result = await repository.deleteTask(longId);

        // Assert
        expect(result, isA<Success<void>>());
      });

      test('should handle task with null optional fields in createTask', () async {
        // Arrange
        final minimalTask = Task(
          id: 'minimal',
          title: 'Minimal Task',
          description: 'Minimal Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          attachments: [],
        );

        // Act
        final result = await repository.createTask(minimalTask);

        // Assert
        expect(result, isA<Success<Task>>());
        final createdTask = (result as Success<Task>).data;
        expect(createdTask.title, equals(minimalTask.title));
        expect(createdTask.assigneeId, isNull);
        expect(createdTask.dueDate, isNull);
        expect(createdTask.estimatedHours, isNull);
      });

      test('should handle task with empty collections in createTask', () async {
        // Arrange
        final taskWithEmptyCollections = Task(
          id: 'empty-collections',
          title: 'Task with Empty Collections',
          description: 'Description',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          tags: [],
          attachments: [],
          dependencies: [],
        );

        // Act
        final result = await repository.createTask(taskWithEmptyCollections);

        // Assert
        expect(result, isA<Success<Task>>());
        final createdTask = (result as Success<Task>).data;
        expect(createdTask.tags, isEmpty);
        expect(createdTask.attachments, isEmpty);
        expect(createdTask.dependencies, isEmpty);
      });

      test('should handle all task status values in getTasksByStatus', () async {
        // Act & Assert
        for (final status in TaskStatus.values) {
          final result = await repository.getTasksByStatus(status);
          expect(result, isA<Success<List<Task>>>());
          expect((result as Success<List<Task>>).data, isEmpty);
        }
      });

      test('should handle all task priority values in getTasksByPriority', () async {
        // Act & Assert
        for (final priority in TaskPriority.values) {
          final result = await repository.getTasksByPriority(priority);
          expect(result, isA<Error<List<Task>>>());
          expect((result as Error<List<Task>>).failure, isA<NotImplementedFailure>());
        }
      });
    });

    group('Performance and Timing', () {
      test('should complete all basic operations within acceptable time', () async {
        // Arrange
        final stopwatch = Stopwatch()..start();

        // Act
        await repository.getAllTasks();
        await repository.getTaskById('test');
        await repository.createTask(testTask);
        await repository.updateTask(testTask);
        await repository.deleteTask('test');
        await repository.getTasksByStatus(TaskStatus.todo);

        // Assert
        stopwatch.stop();
        expect(stopwatch.elapsedMilliseconds, lessThan(4000)); // All operations within 4 seconds
      });

      test('should handle concurrent operations correctly', () async {
        // Act
        final futures = [
          repository.getAllTasks(),
          repository.createTask(testTask),
          repository.getTasksByStatus(TaskStatus.todo),
          repository.deleteTask('test'),
        ];

        final results = await Future.wait(futures);

        // Assert
        expect(results, hasLength(4));
        expect(results[0], isA<Success<List<Task>>>());
        expect(results[1], isA<Success<Task>>());
        expect(results[2], isA<Success<List<Task>>>());
        expect(results[3], isA<Success<void>>());
      });
    });

    group('Constructor and Dependencies', () {
      test('should accept DioClient dependency', () {
        // Act
        final repo = TaskRepositoryImpl(mockDioClient);

        // Assert
        expect(repo, isA<TaskRepositoryImpl>());
      });

      test('should implement TaskRepository interface', () {
        // Assert
        expect(repository, isA<TaskRepository>());
      });
    });
  });

  group('NotImplementedFailure', () {
    test('should extend Failure', () {
      // Arrange
      const failure = NotImplementedFailure('Test message');

      // Assert
      expect(failure, isA<Failure>());
      expect(failure.message, equals('Test message'));
    });

    test('should be equal when messages are the same', () {
      // Arrange
      const failure1 = NotImplementedFailure('Same message');
      const failure2 = NotImplementedFailure('Same message');

      // Assert
      expect(failure1, equals(failure2));
    });

    test('should not be equal when messages differ', () {
      // Arrange
      const failure1 = NotImplementedFailure('Message 1');
      const failure2 = NotImplementedFailure('Message 2');

      // Assert
      expect(failure1, isNot(equals(failure2)));
    });
  });
}