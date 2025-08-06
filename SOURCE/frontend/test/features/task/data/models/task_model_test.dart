import 'package:flutter_test/flutter_test.dart';

import '../../../../../lib/core/errors/exceptions.dart';
import '../../../../../lib/features/task/data/models/task_model.dart';
import '../../../../../lib/features/task/domain/entities/task.dart';

void main() {
  group('TaskModel', () {
    // Test data
    final testDateTime = DateTime(2025, 1, 1, 12, 0, 0);
    final testDueDate = DateTime(2025, 1, 10, 17, 0, 0);
    final testCompletedDate = DateTime(2025, 1, 8, 14, 30, 0);

    final testTaskModel = TaskModel(
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo',
      priority: 'medium',
      createdAt: testDateTime,
      updatedAt: testDateTime,
      projectId: 'project-1',
      assigneeId: 'user-1',
      dueDate: testDueDate,
      completedAt: testCompletedDate,
      estimatedHours: 8.0,
      actualHours: 6.5,
      tags: ['test', 'important'],
      attachments: ['file1.pdf', 'image.png'],
      dependencies: ['task-2', 'task-3'],
    );

    final testTaskEntity = Task(
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      status: TaskStatus.todo,
      priority: TaskPriority.medium,
      createdAt: testDateTime,
      updatedAt: testDateTime,
      projectId: 'project-1',
      assigneeId: 'user-1',
      dueDate: testDueDate,
      completedAt: testCompletedDate,
      estimatedHours: 8.0,
      actualHours: 6.5,
      tags: ['test', 'important'],
      attachments: ['file1.pdf', 'image.png'],
      dependencies: ['task-2', 'task-3'],
    );

    final validJson = {
      'id': '1',
      'title': 'Test Task',
      'description': 'Test Description',
      'status': 'todo',
      'priority': 'medium',
      'createdAt': '2025-01-01T12:00:00.000Z',
      'updatedAt': '2025-01-01T12:00:00.000Z',
      'projectId': 'project-1',
      'assigneeId': 'user-1',
      'dueDate': '2025-01-10T17:00:00.000Z',
      'completedAt': '2025-01-08T14:30:00.000Z',
      'estimatedHours': 8.0,
      'actualHours': 6.5,
      'tags': ['test', 'important'],
      'attachments': ['file1.pdf', 'image.png'],
      'dependencies': ['task-2', 'task-3'],
    };

    final minimalValidJson = {
      'id': '1',
      'title': 'Test Task',
      'description': 'Test Description',
      'status': 'todo',
      'priority': 'medium',
      'createdAt': '2025-01-01T12:00:00.000Z',
      'updatedAt': '2025-01-01T12:00:00.000Z',
      'projectId': 'project-1',
    };

    group('fromJson', () {
      test('should create TaskModel from valid JSON with all fields', () {
        // Act
        final result = TaskModel.fromJson(validJson);

        // Assert
        expect(result.id, equals('1'));
        expect(result.title, equals('Test Task'));
        expect(result.description, equals('Test Description'));
        expect(result.status, equals('todo'));
        expect(result.priority, equals('medium'));
        expect(result.createdAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.updatedAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.projectId, equals('project-1'));
        expect(result.assigneeId, equals('user-1'));
        expect(result.dueDate, equals(DateTime.parse('2025-01-10T17:00:00.000Z')));
        expect(result.completedAt, equals(DateTime.parse('2025-01-08T14:30:00.000Z')));
        expect(result.estimatedHours, equals(8.0));
        expect(result.actualHours, equals(6.5));
        expect(result.tags, equals(['test', 'important']));
        expect(result.attachments, equals(['file1.pdf', 'image.png']));
        expect(result.dependencies, equals(['task-2', 'task-3']));
      });

      test('should create TaskModel from minimal valid JSON', () {
        // Act
        final result = TaskModel.fromJson(minimalValidJson);

        // Assert
        expect(result.id, equals('1'));
        expect(result.title, equals('Test Task'));
        expect(result.description, equals('Test Description'));
        expect(result.status, equals('todo'));
        expect(result.priority, equals('medium'));
        expect(result.createdAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.updatedAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.projectId, equals('project-1'));
        expect(result.assigneeId, isNull);
        expect(result.dueDate, isNull);
        expect(result.completedAt, isNull);
        expect(result.estimatedHours, isNull);
        expect(result.actualHours, isNull);
        expect(result.tags, isEmpty);
        expect(result.attachments, isEmpty);
        expect(result.dependencies, isEmpty);
      });

      test('should handle null optional fields correctly', () {
        // Arrange
        final jsonWithNulls = Map<String, dynamic>.from(minimalValidJson);
        jsonWithNulls.addAll({
          'assigneeId': null,
          'dueDate': null,
          'completedAt': null,
          'estimatedHours': null,
          'actualHours': null,
          'tags': null,
          'attachments': null,
          'dependencies': null,
        });

        // Act
        final result = TaskModel.fromJson(jsonWithNulls);

        // Assert
        expect(result.assigneeId, isNull);
        expect(result.dueDate, isNull);
        expect(result.completedAt, isNull);
        expect(result.estimatedHours, isNull);
        expect(result.actualHours, isNull);
        expect(result.tags, isEmpty);
        expect(result.attachments, isEmpty);
        expect(result.dependencies, isEmpty);
      });

      test('should throw FormatException when required field is missing', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson.remove('title');

        // Act & Assert
        expect(
          () => TaskModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when required field is null', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['title'] = null;

        // Act & Assert
        expect(
          () => TaskModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when required field has wrong type', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['title'] = 123; // Should be String

        // Act & Assert
        expect(
          () => TaskModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when optional field has wrong type', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['estimatedHours'] = 'not_a_number'; // Should be double

        // Act & Assert
        expect(
          () => TaskModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when date field has invalid format', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['createdAt'] = 'invalid-date';

        // Act & Assert
        expect(
          () => TaskModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when list field has wrong element type', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['tags'] = ['valid', 123, 'invalid']; // Should be List<String>

        // Act & Assert
        expect(
          () => TaskModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });
    });

    group('toJson', () {
      test('should convert TaskModel to JSON with all fields', () {
        // Act
        final result = testTaskModel.toJson();

        // Assert
        expect(result['id'], equals('1'));
        expect(result['title'], equals('Test Task'));
        expect(result['description'], equals('Test Description'));
        expect(result['status'], equals('todo'));
        expect(result['priority'], equals('medium'));
        expect(result['createdAt'], equals(testDateTime.toIso8601String()));
        expect(result['updatedAt'], equals(testDateTime.toIso8601String()));
        expect(result['projectId'], equals('project-1'));
        expect(result['assigneeId'], equals('user-1'));
        expect(result['dueDate'], equals(testDueDate.toIso8601String()));
        expect(result['completedAt'], equals(testCompletedDate.toIso8601String()));
        expect(result['estimatedHours'], equals(8.0));
        expect(result['actualHours'], equals(6.5));
        expect(result['tags'], equals(['test', 'important']));
        expect(result['attachments'], equals(['file1.pdf', 'image.png']));
        expect(result['dependencies'], equals(['task-2', 'task-3']));
      });

      test('should convert TaskModel to JSON excluding null optional fields', () {
        // Arrange
        final minimalTaskModel = TaskModel(
          id: '1',
          title: 'Test Task',
          description: 'Test Description',
          status: 'todo',
          priority: 'medium',
          createdAt: testDateTime,
          updatedAt: testDateTime,
          projectId: 'project-1',
        );

        // Act
        final result = minimalTaskModel.toJson();

        // Assert
        expect(result.containsKey('assigneeId'), isFalse);
        expect(result.containsKey('dueDate'), isFalse);
        expect(result.containsKey('completedAt'), isFalse);
        expect(result.containsKey('estimatedHours'), isFalse);
        expect(result.containsKey('actualHours'), isFalse);
        expect(result['tags'], equals([]));
        expect(result['attachments'], equals([]));
        expect(result['dependencies'], equals([]));
      });

      test('should be reversible with fromJson', () {
        // Act
        final json = testTaskModel.toJson();
        final recreated = TaskModel.fromJson(json);

        // Assert
        expect(recreated, equals(testTaskModel));
      });
    });

    group('toEntity', () {
      test('should convert TaskModel to Task entity', () {
        // Act
        final result = testTaskModel.toEntity();

        // Assert
        expect(result, isA<Task>());
        expect(result.id, equals('1'));
        expect(result.title, equals('Test Task'));
        expect(result.description, equals('Test Description'));
        expect(result.status, equals(TaskStatus.todo));
        expect(result.priority, equals(TaskPriority.medium));
        expect(result.createdAt, equals(testDateTime));
        expect(result.updatedAt, equals(testDateTime));
        expect(result.projectId, equals('project-1'));
        expect(result.assigneeId, equals('user-1'));
        expect(result.dueDate, equals(testDueDate));
        expect(result.completedAt, equals(testCompletedDate));
        expect(result.estimatedHours, equals(8.0));
        expect(result.actualHours, equals(6.5));
        expect(result.tags, equals(['test', 'important']));
        expect(result.attachments, equals(['file1.pdf', 'image.png']));
        expect(result.dependencies, equals(['task-2', 'task-3']));
      });
    });

    group('fromEntity', () {
      test('should create TaskModel from Task entity', () {
        // Act
        final result = TaskModel.fromEntity(testTaskEntity);

        // Assert
        expect(result, isA<TaskModel>());
        expect(result.id, equals('1'));
        expect(result.title, equals('Test Task'));
        expect(result.description, equals('Test Description'));
        expect(result.status, equals('todo'));
        expect(result.priority, equals('medium'));
        expect(result.createdAt, equals(testDateTime));
        expect(result.updatedAt, equals(testDateTime));
        expect(result.projectId, equals('project-1'));
        expect(result.assigneeId, equals('user-1'));
        expect(result.dueDate, equals(testDueDate));
        expect(result.completedAt, equals(testCompletedDate));
        expect(result.estimatedHours, equals(8.0));
        expect(result.actualHours, equals(6.5));
        expect(result.tags, equals(['test', 'important']));
        expect(result.attachments, equals(['file1.pdf', 'image.png']));
        expect(result.dependencies, equals(['task-2', 'task-3']));
      });

      test('should be reversible with toEntity', () {
        // Act
        final model = TaskModel.fromEntity(testTaskEntity);
        final entity = model.toEntity();

        // Assert
        expect(entity, equals(testTaskEntity));
      });
    });

    group('copyWith', () {
      test('should create copy with updated fields', () {
        // Act
        final result = testTaskModel.copyWith(
          title: 'Updated Title',
          priority: 'high',
          estimatedHours: 10.0,
        );

        // Assert
        expect(result.title, equals('Updated Title'));
        expect(result.priority, equals('high'));
        expect(result.estimatedHours, equals(10.0));
        // Other fields should remain unchanged
        expect(result.id, equals(testTaskModel.id));
        expect(result.description, equals(testTaskModel.description));
        expect(result.status, equals(testTaskModel.status));
        expect(result.createdAt, equals(testTaskModel.createdAt));
      });

      test('should create identical copy when no fields are provided', () {
        // Act
        final result = testTaskModel.copyWith();

        // Assert
        expect(result, equals(testTaskModel));
      });

      test('should handle null values correctly', () {
        // Act
        final result = testTaskModel.copyWith(
          assigneeId: null,
          dueDate: null,
          estimatedHours: null,
        );

        // Assert
        expect(result.assigneeId, isNull);
        expect(result.dueDate, isNull);
        expect(result.estimatedHours, isNull);
      });
    });

    group('equality and hashCode', () {
      test('should be equal when all fields are the same', () {
        // Arrange
        final taskModel1 = TaskModel.fromJson(validJson);
        final taskModel2 = TaskModel.fromJson(validJson);

        // Assert
        expect(taskModel1, equals(taskModel2));
        expect(taskModel1.hashCode, equals(taskModel2.hashCode));
      });

      test('should not be equal when fields differ', () {
        // Arrange
        final taskModel1 = TaskModel.fromJson(validJson);
        final taskModel2 = taskModel1.copyWith(title: 'Different Title');

        // Assert
        expect(taskModel1, isNot(equals(taskModel2)));
        expect(taskModel1.hashCode, isNot(equals(taskModel2.hashCode)));
      });

      test('should not be equal when lists differ', () {
        // Arrange
        final taskModel1 = TaskModel.fromJson(validJson);
        final taskModel2 = taskModel1.copyWith(tags: ['different', 'tags']);

        // Assert
        expect(taskModel1, isNot(equals(taskModel2)));
      });

      test('should be equal when lists have same elements in same order', () {
        // Arrange
        final json1 = Map<String, dynamic>.from(validJson);
        final json2 = Map<String, dynamic>.from(validJson);
        json1['tags'] = ['tag1', 'tag2'];
        json2['tags'] = ['tag1', 'tag2'];

        final taskModel1 = TaskModel.fromJson(json1);
        final taskModel2 = TaskModel.fromJson(json2);

        // Assert
        expect(taskModel1, equals(taskModel2));
        expect(taskModel1.hashCode, equals(taskModel2.hashCode));
      });

      test('should not be equal when lists have same elements in different order', () {
        // Arrange
        final json1 = Map<String, dynamic>.from(validJson);
        final json2 = Map<String, dynamic>.from(validJson);
        json1['tags'] = ['tag1', 'tag2'];
        json2['tags'] = ['tag2', 'tag1'];

        final taskModel1 = TaskModel.fromJson(json1);
        final taskModel2 = TaskModel.fromJson(json2);

        // Assert
        expect(taskModel1, isNot(equals(taskModel2)));
      });
    });

    group('toString', () {
      test('should return formatted string representation', () {
        // Act
        final result = testTaskModel.toString();

        // Assert
        expect(result, equals('TaskModel(id: 1, title: Test Task, status: todo, priority: medium)'));
      });
    });

    group('edge cases', () {
      test('should handle empty lists correctly', () {
        // Arrange
        final jsonWithEmptyLists = Map<String, dynamic>.from(minimalValidJson);
        jsonWithEmptyLists.addAll({
          'tags': <String>[],
          'attachments': <String>[],
          'dependencies': <String>[],
        });

        // Act
        final result = TaskModel.fromJson(jsonWithEmptyLists);

        // Assert
        expect(result.tags, isEmpty);
        expect(result.attachments, isEmpty);
        expect(result.dependencies, isEmpty);
      });

      test('should handle very long strings', () {
        // Arrange
        final longString = 'A' * 10000;
        final jsonWithLongStrings = Map<String, dynamic>.from(minimalValidJson);
        jsonWithLongStrings['title'] = longString;
        jsonWithLongStrings['description'] = longString;

        // Act
        final result = TaskModel.fromJson(jsonWithLongStrings);

        // Assert
        expect(result.title, equals(longString));
        expect(result.description, equals(longString));
      });

      test('should handle edge case datetime values', () {
        // Arrange
        final edgeDateTime = DateTime.utc(1970, 1, 1); // Unix epoch
        final jsonWithEdgeDate = Map<String, dynamic>.from(minimalValidJson);
        jsonWithEdgeDate['createdAt'] = edgeDateTime.toIso8601String();
        jsonWithEdgeDate['updatedAt'] = edgeDateTime.toIso8601String();

        // Act
        final result = TaskModel.fromJson(jsonWithEdgeDate);

        // Assert
        expect(result.createdAt, equals(edgeDateTime));
        expect(result.updatedAt, equals(edgeDateTime));
      });

      test('should handle zero and negative numeric values', () {
        // Arrange
        final jsonWithNumbers = Map<String, dynamic>.from(minimalValidJson);
        jsonWithNumbers['estimatedHours'] = 0.0;
        jsonWithNumbers['actualHours'] = -1.5; // Negative hours (could be valid for adjustments)

        // Act
        final result = TaskModel.fromJson(jsonWithNumbers);

        // Assert
        expect(result.estimatedHours, equals(0.0));
        expect(result.actualHours, equals(-1.5));
      });
    });
  });

  group('TaskStatisticsModel', () {
    final validStatsJson = {
      'totalTasks': 100,
      'todoTasks': 25,
      'inProgressTasks': 30,
      'reviewTasks': 10,
      'blockedTasks': 5,
      'completedTasks': 25,
      'cancelledTasks': 5,
      'overdueTasks': 8,
      'dueSoonTasks': 15,
      'averageCompletionTimeDays': 7,
      'priorityDistribution': {
        'low': 20,
        'medium': 50,
        'high': 25,
        'critical': 5,
      },
    };

    group('fromJson', () {
      test('should create TaskStatisticsModel from valid JSON', () {
        // Act
        final result = TaskStatisticsModel.fromJson(validStatsJson);

        // Assert
        expect(result.totalTasks, equals(100));
        expect(result.todoTasks, equals(25));
        expect(result.inProgressTasks, equals(30));
        expect(result.reviewTasks, equals(10));
        expect(result.blockedTasks, equals(5));
        expect(result.completedTasks, equals(25));
        expect(result.cancelledTasks, equals(5));
        expect(result.overdueTasks, equals(8));
        expect(result.dueSoonTasks, equals(15));
        expect(result.averageCompletionTimeDays, equals(7));
        expect(result.priorityDistribution, equals({
          'low': 20,
          'medium': 50,
          'high': 25,
          'critical': 5,
        }));
      });

      test('should handle null averageCompletionTimeDays', () {
        // Arrange
        final jsonWithoutAverage = Map<String, dynamic>.from(validStatsJson);
        jsonWithoutAverage.remove('averageCompletionTimeDays');

        // Act
        final result = TaskStatisticsModel.fromJson(jsonWithoutAverage);

        // Assert
        expect(result.averageCompletionTimeDays, isNull);
      });
    });

    group('toJson', () {
      test('should convert TaskStatisticsModel to JSON', () {
        // Arrange
        final model = TaskStatisticsModel.fromJson(validStatsJson);

        // Act
        final result = model.toJson();

        // Assert
        expect(result, equals(validStatsJson));
      });
    });

    group('toEntity', () {
      test('should convert to TaskStatistics entity correctly', () {
        // Arrange
        final model = TaskStatisticsModel.fromJson(validStatsJson);

        // Act
        final result = model.toEntity();

        // Assert
        expect(result.totalTasks, equals(100));
        expect(result.averageCompletionTime, equals(const Duration(days: 7)));
        expect(result.priorityDistribution[TaskPriority.low], equals(20));
        expect(result.priorityDistribution[TaskPriority.medium], equals(50));
        expect(result.priorityDistribution[TaskPriority.high], equals(25));
        expect(result.priorityDistribution[TaskPriority.critical], equals(5));
      });

      test('should handle null averageCompletionTimeDays in entity conversion', () {
        // Arrange
        final jsonWithoutAverage = Map<String, dynamic>.from(validStatsJson);
        jsonWithoutAverage.remove('averageCompletionTimeDays');
        final model = TaskStatisticsModel.fromJson(jsonWithoutAverage);

        // Act
        final result = model.toEntity();

        // Assert
        expect(result.averageCompletionTime, isNull);
      });
    });
  });

  group('TimeEntryModel', () {
    final testTimeEntryJson = {
      'id': 'entry-1',
      'taskId': 'task-1',
      'hours': 2.5,
      'description': 'Worked on implementation',
      'createdAt': '2025-01-01T14:30:00.000Z',
      'userId': 'user-1',
    };

    group('fromJson', () {
      test('should create TimeEntryModel from valid JSON', () {
        // Act
        final result = TimeEntryModel.fromJson(testTimeEntryJson);

        // Assert
        expect(result.id, equals('entry-1'));
        expect(result.taskId, equals('task-1'));
        expect(result.hours, equals(2.5));
        expect(result.description, equals('Worked on implementation'));
        expect(result.createdAt, equals(DateTime.parse('2025-01-01T14:30:00.000Z')));
        expect(result.userId, equals('user-1'));
      });

      test('should handle null userId', () {
        // Arrange
        final jsonWithoutUserId = Map<String, dynamic>.from(testTimeEntryJson);
        jsonWithoutUserId.remove('userId');

        // Act
        final result = TimeEntryModel.fromJson(jsonWithoutUserId);

        // Assert
        expect(result.userId, isNull);
      });
    });

    group('toJson', () {
      test('should convert TimeEntryModel to JSON', () {
        // Arrange
        final model = TimeEntryModel.fromJson(testTimeEntryJson);

        // Act
        final result = model.toJson();

        // Assert
        expect(result, equals(testTimeEntryJson));
      });
    });

    group('toEntity', () {
      test('should convert to TimeEntry entity correctly', () {
        // Arrange
        final model = TimeEntryModel.fromJson(testTimeEntryJson);

        // Act
        final result = model.toEntity();

        // Assert
        expect(result.id, equals('entry-1'));
        expect(result.taskId, equals('task-1'));
        expect(result.hours, equals(2.5));
        expect(result.description, equals('Worked on implementation'));
        expect(result.createdAt, equals(DateTime.parse('2025-01-01T14:30:00.000Z')));
        expect(result.userId, equals('user-1'));
      });
    });
  });
}