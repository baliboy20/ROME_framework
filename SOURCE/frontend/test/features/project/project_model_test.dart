import 'package:flutter_test/flutter_test.dart';
import '../../lib/features/project/data/models/project_model.dart';
import '../../lib/features/project/domain/entities/project.dart';
import '../../lib/core/errors/exceptions.dart';

void main() {
  group('ProjectModel', () {
    final validJsonMap = {
      'id': 'project_123',
      'title': 'Test Project',
      'description': 'A test project for unit testing',
      'status': 'active',
      'createdAt': '2025-01-01T10:00:00.000Z',
      'updatedAt': '2025-01-01T12:00:00.000Z',
      'completedAt': '2025-01-01T18:00:00.000Z',
      'ownerId': 'user_456',
      'tags': ['urgent', 'frontend'],
      'attachments': ['file1.pdf', 'image1.png'],
    };

    final projectEntity = Project(
      id: 'project_123',
      title: 'Test Project',
      description: 'A test project for unit testing',
      status: ProjectStatus.active,
      createdAt: DateTime.parse('2025-01-01T10:00:00.000Z'),
      updatedAt: DateTime.parse('2025-01-01T12:00:00.000Z'),
      completedAt: DateTime.parse('2025-01-01T18:00:00.000Z'),
      ownerId: 'user_456',
      tags: ['urgent', 'frontend'],
      attachments: ['file1.pdf', 'image1.png'],
    );

    group('fromJson', () {
      test('should create ProjectModel from valid JSON', () {
        // Act
        final result = ProjectModel.fromJson(validJsonMap);

        // Assert
        expect(result.id, equals('project_123'));
        expect(result.title, equals('Test Project'));
        expect(result.description, equals('A test project for unit testing'));
        expect(result.status, equals('active'));
        expect(result.createdAt, equals(DateTime.parse('2025-01-01T10:00:00.000Z')));
        expect(result.updatedAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.completedAt, equals(DateTime.parse('2025-01-01T18:00:00.000Z')));
        expect(result.ownerId, equals('user_456'));
        expect(result.tags, equals(['urgent', 'frontend']));
        expect(result.attachments, equals(['file1.pdf', 'image1.png']));
      });

      test('should create ProjectModel with minimal required fields', () {
        // Arrange
        final minimalJson = {
          'id': 'project_123',
          'title': 'Test Project',
          'description': 'A test project',
          'status': 'draft',
          'createdAt': '2025-01-01T10:00:00.000Z',
          'updatedAt': '2025-01-01T12:00:00.000Z',
        };

        // Act
        final result = ProjectModel.fromJson(minimalJson);

        // Assert
        expect(result.id, equals('project_123'));
        expect(result.title, equals('Test Project'));
        expect(result.description, equals('A test project'));
        expect(result.status, equals('draft'));
        expect(result.completedAt, isNull);
        expect(result.ownerId, isNull);
        expect(result.tags, isEmpty);
        expect(result.attachments, isEmpty);
      });

      test('should throw JsonValidationException when required field is missing', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJsonMap)..remove('title');

        // Act & Assert
        expect(
          () => ProjectModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw JsonValidationException when field has wrong type', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJsonMap);
        invalidJson['title'] = 123; // Should be String

        // Act & Assert
        expect(
          () => ProjectModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw JsonValidationException when date format is invalid', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJsonMap);
        invalidJson['createdAt'] = 'invalid-date';

        // Act & Assert
        expect(
          () => ProjectModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should handle null optional fields correctly', () {
        // Arrange
        final jsonWithNulls = {
          'id': 'project_123',
          'title': 'Test Project',
          'description': 'A test project',
          'status': 'active',
          'createdAt': '2025-01-01T10:00:00.000Z',
          'updatedAt': '2025-01-01T12:00:00.000Z',
          'completedAt': null,
          'ownerId': null,
          'tags': null,
          'attachments': null,
        };

        // Act
        final result = ProjectModel.fromJson(jsonWithNulls);

        // Assert
        expect(result.completedAt, isNull);
        expect(result.ownerId, isNull);
        expect(result.tags, isEmpty);
        expect(result.attachments, isEmpty);
      });

      test('should handle empty arrays correctly', () {
        // Arrange
        final jsonWithEmptyArrays = Map<String, dynamic>.from(validJsonMap);
        jsonWithEmptyArrays['tags'] = <String>[];
        jsonWithEmptyArrays['attachments'] = <String>[];

        // Act
        final result = ProjectModel.fromJson(jsonWithEmptyArrays);

        // Assert
        expect(result.tags, isEmpty);
        expect(result.attachments, isEmpty);
      });
    });

    group('toJson', () {
      test('should convert ProjectModel to JSON correctly', () {
        // Arrange
        final model = ProjectModel.fromJson(validJsonMap);

        // Act
        final result = model.toJson();

        // Assert
        expect(result['id'], equals('project_123'));
        expect(result['title'], equals('Test Project'));
        expect(result['description'], equals('A test project for unit testing'));
        expect(result['status'], equals('active'));
        expect(result['createdAt'], equals('2025-01-01T10:00:00.000Z'));
        expect(result['updatedAt'], equals('2025-01-01T12:00:00.000Z'));
        expect(result['completedAt'], equals('2025-01-01T18:00:00.000Z'));
        expect(result['ownerId'], equals('user_456'));
        expect(result['tags'], equals(['urgent', 'frontend']));
        expect(result['attachments'], equals(['file1.pdf', 'image1.png']));
      });

      test('should omit null optional fields in JSON', () {
        // Arrange
        final model = ProjectModel(
          id: 'project_123',
          title: 'Test Project',
          description: 'A test project',
          status: 'draft',
          createdAt: DateTime.parse('2025-01-01T10:00:00.000Z'),
          updatedAt: DateTime.parse('2025-01-01T12:00:00.000Z'),
        );

        // Act
        final result = model.toJson();

        // Assert
        expect(result.containsKey('completedAt'), isFalse);
        expect(result.containsKey('ownerId'), isFalse);
        expect(result['tags'], isEmpty);
        expect(result['attachments'], isEmpty);
      });
    });

    group('toEntity', () {
      test('should convert ProjectModel to Project entity correctly', () {
        // Arrange
        final model = ProjectModel.fromJson(validJsonMap);

        // Act
        final result = model.toEntity();

        // Assert
        expect(result.id, equals('project_123'));
        expect(result.title, equals('Test Project'));
        expect(result.description, equals('A test project for unit testing'));
        expect(result.status, equals(ProjectStatus.active));
        expect(result.createdAt, equals(DateTime.parse('2025-01-01T10:00:00.000Z')));
        expect(result.updatedAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.completedAt, equals(DateTime.parse('2025-01-01T18:00:00.000Z')));
        expect(result.ownerId, equals('user_456'));
        expect(result.tags, equals(['urgent', 'frontend']));
        expect(result.attachments, equals(['file1.pdf', 'image1.png']));
      });

      test('should throw ArgumentError for invalid status', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJsonMap);
        invalidJson['status'] = 'invalid_status';
        final model = ProjectModel(
          id: 'project_123',
          title: 'Test Project',
          description: 'A test project',
          status: 'invalid_status',
          createdAt: DateTime.parse('2025-01-01T10:00:00.000Z'),
          updatedAt: DateTime.parse('2025-01-01T12:00:00.000Z'),
        );

        // Act & Assert
        expect(() => model.toEntity(), throwsA(isA<ArgumentError>()));
      });
    });

    group('fromEntity', () {
      test('should create ProjectModel from Project entity correctly', () {
        // Act
        final result = ProjectModel.fromEntity(projectEntity);

        // Assert
        expect(result.id, equals('project_123'));
        expect(result.title, equals('Test Project'));
        expect(result.description, equals('A test project for unit testing'));
        expect(result.status, equals('active'));
        expect(result.createdAt, equals(DateTime.parse('2025-01-01T10:00:00.000Z')));
        expect(result.updatedAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.completedAt, equals(DateTime.parse('2025-01-01T18:00:00.000Z')));
        expect(result.ownerId, equals('user_456'));
        expect(result.tags, equals(['urgent', 'frontend']));
        expect(result.attachments, equals(['file1.pdf', 'image1.png']));
      });
    });

    group('copyWith', () {
      test('should create copy with updated fields', () {
        // Arrange
        final original = ProjectModel.fromJson(validJsonMap);

        // Act
        final updated = original.copyWith(
          title: 'Updated Project',
          status: 'completed',
          tags: ['updated', 'test'],
        );

        // Assert
        expect(updated.id, equals(original.id)); // Unchanged
        expect(updated.title, equals('Updated Project')); // Changed
        expect(updated.status, equals('completed')); // Changed
        expect(updated.tags, equals(['updated', 'test'])); // Changed
        expect(updated.description, equals(original.description)); // Unchanged
      });

      test('should create identical copy when no fields changed', () {
        // Arrange
        final original = ProjectModel.fromJson(validJsonMap);

        // Act
        final copy = original.copyWith();

        // Assert
        expect(copy.id, equals(original.id));
        expect(copy.title, equals(original.title));
        expect(copy.status, equals(original.status));
        expect(copy.tags, equals(original.tags));
      });
    });

    group('Equality and HashCode', () {
      test('should be equal when all fields are same', () {
        // Arrange
        final model1 = ProjectModel.fromJson(validJsonMap);
        final model2 = ProjectModel.fromJson(validJsonMap);

        // Act & Assert
        expect(model1, equals(model2));
        expect(model1.hashCode, equals(model2.hashCode));
      });

      test('should not be equal when fields differ', () {
        // Arrange
        final model1 = ProjectModel.fromJson(validJsonMap);
        final differentJson = Map<String, dynamic>.from(validJsonMap);
        differentJson['title'] = 'Different Project';
        final model2 = ProjectModel.fromJson(differentJson);

        // Act & Assert
        expect(model1, isNot(equals(model2)));
        expect(model1.hashCode, isNot(equals(model2.hashCode)));
      });
    });

    group('Round-trip conversion', () {
      test('should maintain data integrity through JSON round-trip', () {
        // Arrange
        final original = ProjectModel.fromJson(validJsonMap);

        // Act
        final json = original.toJson();
        final reconstructed = ProjectModel.fromJson(json);

        // Assert
        expect(reconstructed, equals(original));
      });

      test('should maintain data integrity through entity round-trip', () {
        // Arrange
        final original = projectEntity;

        // Act
        final model = ProjectModel.fromEntity(original);
        final reconstructed = model.toEntity();

        // Assert
        expect(reconstructed.id, equals(original.id));
        expect(reconstructed.title, equals(original.title));
        expect(reconstructed.status, equals(original.status));
        expect(reconstructed.tags, equals(original.tags));
      });
    });
  });

  group('ProjectStatisticsModel', () {
    final validStatsJson = {
      'totalProjects': 10,
      'activeProjects': 3,
      'completedProjects': 5,
      'onHoldProjects': 1,
      'cancelledProjects': 1,
      'overallCompletionRate': 0.75,
      'averageProjectDurationDays': 30,
    };

    test('should create from valid JSON', () {
      // Act
      final result = ProjectStatisticsModel.fromJson(validStatsJson);

      // Assert
      expect(result.totalProjects, equals(10));
      expect(result.activeProjects, equals(3));
      expect(result.completedProjects, equals(5));
      expect(result.overallCompletionRate, equals(0.75));
      expect(result.averageProjectDurationDays, equals(30));
    });

    test('should handle optional fields', () {
      // Arrange
      final minimalJson = Map<String, dynamic>.from(validStatsJson);
      minimalJson.remove('averageProjectDurationDays');

      // Act
      final result = ProjectStatisticsModel.fromJson(minimalJson);

      // Assert
      expect(result.averageProjectDurationDays, isNull);
    });

    test('should convert to entity correctly', () {
      // Arrange
      final model = ProjectStatisticsModel.fromJson(validStatsJson);

      // Act
      final entity = model.toEntity();

      // Assert
      expect(entity.totalProjects, equals(10));
      expect(entity.averageProjectDuration, equals(const Duration(days: 30)));
    });
  });

  group('ProjectWithProgressModel', () {
    final validProgressJson = {
      'project': {
        'id': 'project_123',
        'title': 'Test Project',
        'description': 'A test project',
        'status': 'active',
        'createdAt': '2025-01-01T10:00:00.000Z',
        'updatedAt': '2025-01-01T12:00:00.000Z',
      },
      'completionPercentage': 0.65,
      'totalTasks': 20,
      'completedTasks': 13,
    };

    test('should create from valid JSON', () {
      // Act
      final result = ProjectWithProgressModel.fromJson(validProgressJson);

      // Assert
      expect(result.project.id, equals('project_123'));
      expect(result.completionPercentage, equals(0.65));
      expect(result.totalTasks, equals(20));
      expect(result.completedTasks, equals(13));
    });

    test('should convert to entity correctly', () {
      // Arrange
      final model = ProjectWithProgressModel.fromJson(validProgressJson);

      // Act
      final entity = model.toEntity();

      // Assert
      expect(entity.project.id, equals('project_123'));
      expect(entity.completionPercentage, equals(0.65));
      expect(entity.totalTasks, equals(20));
      expect(entity.completedTasks, equals(13));
    });
  });
}