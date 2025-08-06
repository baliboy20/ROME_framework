import 'package:flutter_test/flutter_test.dart';

import '../../../../../lib/core/errors/exceptions.dart';
import '../../../../../lib/features/blog/data/models/blog_model.dart';
import '../../../../../lib/features/blog/domain/entities/blog.dart';

void main() {
  group('BlogModel', () {
    // Test data
    final testDateTime = DateTime(2025, 1, 1, 12, 0, 0);
    final testPublishedDate = DateTime(2025, 1, 5, 10, 0, 0);

    final testBlogModel = BlogModel(
      id: '1',
      title: 'Test Blog',
      content: 'Test Content',
      status: 'published',
      createdAt: testDateTime,
      updatedAt: testDateTime,
      publishedAt: testPublishedDate,
      authorId: 'user-1',
      projectId: 'project-1',
      taskId: 'task-1',
      summary: 'Test Summary',
      tags: ['test', 'blog'],
      attachments: ['image1.png', 'doc.pdf'],
      readTime: 5,
    );

    final testBlogEntity = Blog(
      id: '1',
      title: 'Test Blog',
      content: 'Test Content',
      status: BlogStatus.published,
      createdAt: testDateTime,
      updatedAt: testDateTime,
      publishedAt: testPublishedDate,
      authorId: 'user-1',
      projectId: 'project-1',
      taskId: 'task-1',
      summary: 'Test Summary',
      tags: ['test', 'blog'],
      attachments: ['image1.png', 'doc.pdf'],
      readTime: 5,
    );

    final validJson = {
      'id': '1',
      'title': 'Test Blog',
      'content': 'Test Content',
      'status': 'published',
      'createdAt': '2025-01-01T12:00:00.000Z',
      'updatedAt': '2025-01-01T12:00:00.000Z',
      'publishedAt': '2025-01-05T10:00:00.000Z',
      'authorId': 'user-1',
      'projectId': 'project-1',
      'taskId': 'task-1',
      'summary': 'Test Summary',
      'tags': ['test', 'blog'],
      'attachments': ['image1.png', 'doc.pdf'],
      'readTime': 5,
    };

    final minimalValidJson = {
      'id': '1',
      'title': 'Test Blog',
      'content': 'Test Content',
      'status': 'draft',
      'createdAt': '2025-01-01T12:00:00.000Z',
      'updatedAt': '2025-01-01T12:00:00.000Z',
    };

    group('fromJson', () {
      test('should create BlogModel from valid JSON with all fields', () {
        // Act
        final result = BlogModel.fromJson(validJson);

        // Assert
        expect(result.id, equals('1'));
        expect(result.title, equals('Test Blog'));
        expect(result.content, equals('Test Content'));
        expect(result.status, equals('published'));
        expect(result.createdAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.updatedAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.publishedAt, equals(DateTime.parse('2025-01-05T10:00:00.000Z')));
        expect(result.authorId, equals('user-1'));
        expect(result.projectId, equals('project-1'));
        expect(result.taskId, equals('task-1'));
        expect(result.summary, equals('Test Summary'));
        expect(result.tags, equals(['test', 'blog']));
        expect(result.attachments, equals(['image1.png', 'doc.pdf']));
        expect(result.readTime, equals(5));
      });

      test('should create BlogModel from minimal valid JSON', () {
        // Act
        final result = BlogModel.fromJson(minimalValidJson);

        // Assert
        expect(result.id, equals('1'));
        expect(result.title, equals('Test Blog'));
        expect(result.content, equals('Test Content'));
        expect(result.status, equals('draft'));
        expect(result.createdAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.updatedAt, equals(DateTime.parse('2025-01-01T12:00:00.000Z')));
        expect(result.publishedAt, isNull);
        expect(result.authorId, isNull);
        expect(result.projectId, isNull);
        expect(result.taskId, isNull);
        expect(result.summary, isNull);
        expect(result.tags, isEmpty);
        expect(result.attachments, isEmpty);
        expect(result.readTime, isNull);
      });

      test('should handle null optional fields correctly', () {
        // Arrange
        final jsonWithNulls = Map<String, dynamic>.from(minimalValidJson);
        jsonWithNulls.addAll({
          'publishedAt': null,
          'authorId': null,
          'projectId': null,
          'taskId': null,
          'summary': null,
          'tags': null,
          'attachments': null,
          'readTime': null,
        });

        // Act
        final result = BlogModel.fromJson(jsonWithNulls);

        // Assert
        expect(result.publishedAt, isNull);
        expect(result.authorId, isNull);
        expect(result.projectId, isNull);
        expect(result.taskId, isNull);
        expect(result.summary, isNull);
        expect(result.tags, isEmpty);
        expect(result.attachments, isEmpty);
        expect(result.readTime, isNull);
      });

      test('should throw FormatException when required field is missing', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson.remove('title');

        // Act & Assert
        expect(
          () => BlogModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when required field is null', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['title'] = null;

        // Act & Assert
        expect(
          () => BlogModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when required field has wrong type', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['title'] = 123; // Should be String

        // Act & Assert
        expect(
          () => BlogModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when optional field has wrong type', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['readTime'] = 'not_a_number'; // Should be int

        // Act & Assert
        expect(
          () => BlogModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when date field has invalid format', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['createdAt'] = 'invalid-date';

        // Act & Assert
        expect(
          () => BlogModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });

      test('should throw FormatException when list field has wrong element type', () {
        // Arrange
        final invalidJson = Map<String, dynamic>.from(validJson);
        invalidJson['tags'] = ['valid', 123, 'invalid']; // Should be List<String>

        // Act & Assert
        expect(
          () => BlogModel.fromJson(invalidJson),
          throwsA(isA<FormatException>()),
        );
      });
    });

    group('toJson', () {
      test('should convert BlogModel to JSON with all fields', () {
        // Act
        final result = testBlogModel.toJson();

        // Assert
        expect(result['id'], equals('1'));
        expect(result['title'], equals('Test Blog'));
        expect(result['content'], equals('Test Content'));
        expect(result['status'], equals('published'));
        expect(result['createdAt'], equals(testDateTime.toIso8601String()));
        expect(result['updatedAt'], equals(testDateTime.toIso8601String()));
        expect(result['publishedAt'], equals(testPublishedDate.toIso8601String()));
        expect(result['authorId'], equals('user-1'));
        expect(result['projectId'], equals('project-1'));
        expect(result['taskId'], equals('task-1'));
        expect(result['summary'], equals('Test Summary'));
        expect(result['tags'], equals(['test', 'blog']));
        expect(result['attachments'], equals(['image1.png', 'doc.pdf']));
        expect(result['readTime'], equals(5));
      });

      test('should convert BlogModel to JSON excluding null optional fields', () {
        // Arrange
        final minimalBlogModel = BlogModel(
          id: '1',
          title: 'Test Blog',
          content: 'Test Content',
          status: 'draft',
          createdAt: testDateTime,
          updatedAt: testDateTime,
        );

        // Act
        final result = minimalBlogModel.toJson();

        // Assert
        expect(result.containsKey('publishedAt'), isFalse);
        expect(result.containsKey('authorId'), isFalse);
        expect(result.containsKey('projectId'), isFalse);
        expect(result.containsKey('taskId'), isFalse);
        expect(result.containsKey('summary'), isFalse);
        expect(result.containsKey('readTime'), isFalse);
        expect(result['tags'], equals([]));
        expect(result['attachments'], equals([]));
      });

      test('should be reversible with fromJson', () {
        // Act
        final json = testBlogModel.toJson();
        final recreated = BlogModel.fromJson(json);

        // Assert
        expect(recreated, equals(testBlogModel));
      });
    });

    group('toEntity', () {
      test('should convert BlogModel to Blog entity', () {
        // Act
        final result = testBlogModel.toEntity();

        // Assert
        expect(result, isA<Blog>());
        expect(result.id, equals('1'));
        expect(result.title, equals('Test Blog'));
        expect(result.content, equals('Test Content'));
        expect(result.status, equals(BlogStatus.published));
        expect(result.createdAt, equals(testDateTime));
        expect(result.updatedAt, equals(testDateTime));
        expect(result.publishedAt, equals(testPublishedDate));
        expect(result.authorId, equals('user-1'));
        expect(result.projectId, equals('project-1'));
        expect(result.taskId, equals('task-1'));
        expect(result.summary, equals('Test Summary'));
        expect(result.tags, equals(['test', 'blog']));
        expect(result.attachments, equals(['image1.png', 'doc.pdf']));
        expect(result.readTime, equals(5));
      });
    });

    group('fromEntity', () {
      test('should create BlogModel from Blog entity', () {
        // Act
        final result = BlogModel.fromEntity(testBlogEntity);

        // Assert
        expect(result, isA<BlogModel>());
        expect(result.id, equals('1'));
        expect(result.title, equals('Test Blog'));
        expect(result.content, equals('Test Content'));
        expect(result.status, equals('published'));
        expect(result.createdAt, equals(testDateTime));
        expect(result.updatedAt, equals(testDateTime));
        expect(result.publishedAt, equals(testPublishedDate));
        expect(result.authorId, equals('user-1'));
        expect(result.projectId, equals('project-1'));
        expect(result.taskId, equals('task-1'));
        expect(result.summary, equals('Test Summary'));
        expect(result.tags, equals(['test', 'blog']));
        expect(result.attachments, equals(['image1.png', 'doc.pdf']));
        expect(result.readTime, equals(5));
      });

      test('should be reversible with toEntity', () {
        // Act
        final model = BlogModel.fromEntity(testBlogEntity);
        final entity = model.toEntity();

        // Assert
        expect(entity, equals(testBlogEntity));
      });
    });

    group('copyWith', () {
      test('should create copy with updated fields', () {
        // Act
        final result = testBlogModel.copyWith(
          title: 'Updated Title',
          status: 'draft',
          readTime: 10,
        );

        // Assert
        expect(result.title, equals('Updated Title'));
        expect(result.status, equals('draft'));
        expect(result.readTime, equals(10));
        // Other fields should remain unchanged
        expect(result.id, equals(testBlogModel.id));
        expect(result.content, equals(testBlogModel.content));
        expect(result.createdAt, equals(testBlogModel.createdAt));
        expect(result.authorId, equals(testBlogModel.authorId));
      });

      test('should create identical copy when no fields are provided', () {
        // Act
        final result = testBlogModel.copyWith();

        // Assert
        expect(result, equals(testBlogModel));
      });

      test('should handle null values correctly', () {
        // Act
        final result = testBlogModel.copyWith(
          authorId: null,
          publishedAt: null,
          readTime: null,
        );

        // Assert
        expect(result.authorId, isNull);
        expect(result.publishedAt, isNull);
        expect(result.readTime, isNull);
      });
    });

    group('equality and hashCode', () {
      test('should be equal when all fields are the same', () {
        // Arrange
        final blogModel1 = BlogModel.fromJson(validJson);
        final blogModel2 = BlogModel.fromJson(validJson);

        // Assert
        expect(blogModel1, equals(blogModel2));
        expect(blogModel1.hashCode, equals(blogModel2.hashCode));
      });

      test('should not be equal when fields differ', () {
        // Arrange
        final blogModel1 = BlogModel.fromJson(validJson);
        final blogModel2 = blogModel1.copyWith(title: 'Different Title');

        // Assert
        expect(blogModel1, isNot(equals(blogModel2)));
        expect(blogModel1.hashCode, isNot(equals(blogModel2.hashCode)));
      });

      test('should not be equal when lists differ', () {
        // Arrange
        final blogModel1 = BlogModel.fromJson(validJson);
        final blogModel2 = blogModel1.copyWith(tags: ['different', 'tags']);

        // Assert
        expect(blogModel1, isNot(equals(blogModel2)));
      });

      test('should be equal when lists have same elements in same order', () {
        // Arrange
        final json1 = Map<String, dynamic>.from(validJson);
        final json2 = Map<String, dynamic>.from(validJson);
        json1['tags'] = ['tag1', 'tag2'];
        json2['tags'] = ['tag1', 'tag2'];

        final blogModel1 = BlogModel.fromJson(json1);
        final blogModel2 = BlogModel.fromJson(json2);

        // Assert
        expect(blogModel1, equals(blogModel2));
        expect(blogModel1.hashCode, equals(blogModel2.hashCode));
      });

      test('should not be equal when lists have same elements in different order', () {
        // Arrange
        final json1 = Map<String, dynamic>.from(validJson);
        final json2 = Map<String, dynamic>.from(validJson);
        json1['tags'] = ['tag1', 'tag2'];
        json2['tags'] = ['tag2', 'tag1'];

        final blogModel1 = BlogModel.fromJson(json1);
        final blogModel2 = BlogModel.fromJson(json2);

        // Assert
        expect(blogModel1, isNot(equals(blogModel2)));
      });
    });

    group('toString', () {
      test('should return formatted string representation', () {
        // Act
        final result = testBlogModel.toString();

        // Assert
        expect(result, equals('BlogModel(id: 1, title: Test Blog, status: published)'));
      });
    });

    group('edge cases', () {
      test('should handle empty lists correctly', () {
        // Arrange
        final jsonWithEmptyLists = Map<String, dynamic>.from(minimalValidJson);
        jsonWithEmptyLists.addAll({
          'tags': <String>[],
          'attachments': <String>[],
        });

        // Act
        final result = BlogModel.fromJson(jsonWithEmptyLists);

        // Assert
        expect(result.tags, isEmpty);
        expect(result.attachments, isEmpty);
      });

      test('should handle very long strings', () {
        // Arrange
        final longString = 'A' * 10000;
        final jsonWithLongStrings = Map<String, dynamic>.from(minimalValidJson);
        jsonWithLongStrings['title'] = longString;
        jsonWithLongStrings['content'] = longString;
        jsonWithLongStrings['summary'] = longString;

        // Act
        final result = BlogModel.fromJson(jsonWithLongStrings);

        // Assert
        expect(result.title, equals(longString));
        expect(result.content, equals(longString));
        expect(result.summary, equals(longString));
      });

      test('should handle edge case datetime values', () {
        // Arrange
        final edgeDateTime = DateTime.utc(1970, 1, 1); // Unix epoch
        final jsonWithEdgeDate = Map<String, dynamic>.from(minimalValidJson);
        jsonWithEdgeDate['createdAt'] = edgeDateTime.toIso8601String();
        jsonWithEdgeDate['updatedAt'] = edgeDateTime.toIso8601String();
        jsonWithEdgeDate['publishedAt'] = edgeDateTime.toIso8601String();

        // Act
        final result = BlogModel.fromJson(jsonWithEdgeDate);

        // Assert
        expect(result.createdAt, equals(edgeDateTime));
        expect(result.updatedAt, equals(edgeDateTime));
        expect(result.publishedAt, equals(edgeDateTime));
      });

      test('should handle zero and negative read time values', () {
        // Arrange
        final jsonWithNumbers = Map<String, dynamic>.from(minimalValidJson);
        jsonWithNumbers['readTime'] = 0;

        // Act
        final result = BlogModel.fromJson(jsonWithNumbers);

        // Assert
        expect(result.readTime, equals(0));
      });

      test('should handle special characters in strings', () {
        // Arrange
        final specialCharString = 'Test with émojis 🎉 and ñoño characters';
        final jsonWithSpecialChars = Map<String, dynamic>.from(minimalValidJson);
        jsonWithSpecialChars['title'] = specialCharString;
        jsonWithSpecialChars['content'] = specialCharString;

        // Act
        final result = BlogModel.fromJson(jsonWithSpecialChars);

        // Assert
        expect(result.title, equals(specialCharString));
        expect(result.content, equals(specialCharString));
      });
    });
  });

  group('BlogStatisticsModel', () {
    final validStatsJson = {
      'totalBlogs': 100,
      'publishedBlogs': 60,
      'draftBlogs': 25,
      'archivedBlogs': 10,
      'scheduledBlogs': 5,
      'totalWords': 50000,
      'averageReadTimeMinutes': 7,
      'mostUsedTags': {
        'flutter': 25,
        'dart': 20,
        'tutorial': 15,
        'tips': 10,
      },
      'blogsPerMonth': {
        '2025-01': 15,
        '2025-02': 12,
        '2025-03': 18,
      },
    };

    group('fromJson', () {
      test('should create BlogStatisticsModel from valid JSON', () {
        // Act
        final result = BlogStatisticsModel.fromJson(validStatsJson);

        // Assert
        expect(result.totalBlogs, equals(100));
        expect(result.publishedBlogs, equals(60));
        expect(result.draftBlogs, equals(25));
        expect(result.archivedBlogs, equals(10));
        expect(result.scheduledBlogs, equals(5));
        expect(result.totalWords, equals(50000));
        expect(result.averageReadTimeMinutes, equals(7));
        expect(result.mostUsedTags, equals({
          'flutter': 25,
          'dart': 20,
          'tutorial': 15,
          'tips': 10,
        }));
        expect(result.blogsPerMonth, equals({
          '2025-01': 15,
          '2025-02': 12,
          '2025-03': 18,
        }));
      });

      test('should handle empty maps correctly', () {
        // Arrange
        final jsonWithEmptyMaps = Map<String, dynamic>.from(validStatsJson);
        jsonWithEmptyMaps['mostUsedTags'] = <String, int>{};
        jsonWithEmptyMaps['blogsPerMonth'] = <String, int>{};

        // Act
        final result = BlogStatisticsModel.fromJson(jsonWithEmptyMaps);

        // Assert
        expect(result.mostUsedTags, isEmpty);
        expect(result.blogsPerMonth, isEmpty);
      });
    });

    group('toJson', () {
      test('should convert BlogStatisticsModel to JSON', () {
        // Arrange
        final model = BlogStatisticsModel.fromJson(validStatsJson);

        // Act
        final result = model.toJson();

        // Assert
        expect(result, equals(validStatsJson));
      });
    });

    group('toEntity', () {
      test('should convert to BlogStatistics entity correctly', () {
        // Arrange
        final model = BlogStatisticsModel.fromJson(validStatsJson);

        // Act
        final result = model.toEntity();

        // Assert
        expect(result.totalBlogs, equals(100));
        expect(result.publishedBlogs, equals(60));
        expect(result.draftBlogs, equals(25));
        expect(result.archivedBlogs, equals(10));
        expect(result.scheduledBlogs, equals(5));
        expect(result.totalWords, equals(50000));
        expect(result.averageReadTime, equals(const Duration(minutes: 7)));
        expect(result.mostUsedTags, equals({
          'flutter': 25,
          'dart': 20,
          'tutorial': 15,
          'tips': 10,
        }));
        expect(result.blogsPerMonth, equals({
          '2025-01': 15,
          '2025-02': 12,
          '2025-03': 18,
        }));
      });
    });
  });

  group('BlogSearchFiltersModel', () {
    final testDateTime = DateTime(2025, 1, 1);
    final testEndDateTime = DateTime(2025, 12, 31);

    final validFiltersJson = {
      'status': 'published',
      'projectId': 'project-1',
      'taskId': 'task-1',
      'authorId': 'user-1',
      'tags': ['flutter', 'tutorial'],
      'dateFrom': testDateTime.toIso8601String(),
      'dateTo': testEndDateTime.toIso8601String(),
      'minReadTime': 5,
      'maxReadTime': 15,
    };

    group('fromJson', () {
      test('should create BlogSearchFiltersModel from valid JSON', () {
        // Act
        final result = BlogSearchFiltersModel.fromJson(validFiltersJson);

        // Assert
        expect(result.status, equals('published'));
        expect(result.projectId, equals('project-1'));
        expect(result.taskId, equals('task-1'));
        expect(result.authorId, equals('user-1'));
        expect(result.tags, equals(['flutter', 'tutorial']));
        expect(result.dateFrom, equals(testDateTime));
        expect(result.dateTo, equals(testEndDateTime));
        expect(result.minReadTime, equals(5));
        expect(result.maxReadTime, equals(15));
      });

      test('should handle empty JSON correctly', () {
        // Act
        final result = BlogSearchFiltersModel.fromJson({});

        // Assert
        expect(result.status, isNull);
        expect(result.projectId, isNull);
        expect(result.taskId, isNull);
        expect(result.authorId, isNull);
        expect(result.tags, isNull);
        expect(result.dateFrom, isNull);
        expect(result.dateTo, isNull);
        expect(result.minReadTime, isNull);
        expect(result.maxReadTime, isNull);
      });
    });

    group('toJson', () {
      test('should convert BlogSearchFiltersModel to JSON', () {
        // Arrange
        final model = BlogSearchFiltersModel.fromJson(validFiltersJson);

        // Act
        final result = model.toJson();

        // Assert
        expect(result, equals(validFiltersJson));
      });

      test('should exclude null fields from JSON', () {
        // Arrange
        const model = BlogSearchFiltersModel(
          status: 'draft',
          projectId: null,
          taskId: null,
        );

        // Act
        final result = model.toJson();

        // Assert
        expect(result['status'], equals('draft'));
        expect(result.containsKey('projectId'), isFalse);
        expect(result.containsKey('taskId'), isFalse);
        expect(result.containsKey('authorId'), isFalse);
      });
    });

    group('toEntity', () {
      test('should convert to BlogSearchFilters entity correctly', () {
        // Arrange
        final model = BlogSearchFiltersModel.fromJson(validFiltersJson);

        // Act
        final result = model.toEntity();

        // Assert
        expect(result.status, equals(BlogStatus.published));
        expect(result.projectId, equals('project-1'));
        expect(result.taskId, equals('task-1'));
        expect(result.authorId, equals('user-1'));
        expect(result.tags, equals(['flutter', 'tutorial']));
        expect(result.dateFrom, equals(testDateTime));
        expect(result.dateTo, equals(testEndDateTime));
        expect(result.minReadTime, equals(5));
        expect(result.maxReadTime, equals(15));
      });

      test('should handle null status correctly', () {
        // Arrange
        const model = BlogSearchFiltersModel(status: null);

        // Act
        final result = model.toEntity();

        // Assert
        expect(result.status, isNull);
      });
    });

    group('fromEntity', () {
      test('should create BlogSearchFiltersModel from entity', () {
        // Arrange
        final entity = BlogSearchFilters(
          status: BlogStatus.draft,
          projectId: 'project-2',
          authorId: 'user-2',
          tags: ['dart', 'tips'],
          dateFrom: testDateTime,
          dateTo: testEndDateTime,
          minReadTime: 3,
          maxReadTime: 10,
        );

        // Act
        final result = BlogSearchFiltersModel.fromEntity(entity);

        // Assert
        expect(result.status, equals('draft'));
        expect(result.projectId, equals('project-2'));
        expect(result.authorId, equals('user-2'));
        expect(result.tags, equals(['dart', 'tips']));
        expect(result.dateFrom, equals(testDateTime));
        expect(result.dateTo, equals(testEndDateTime));
        expect(result.minReadTime, equals(3));
        expect(result.maxReadTime, equals(10));
      });

      test('should be reversible with toEntity', () {
        // Arrange
        final originalEntity = BlogSearchFilters(
          status: BlogStatus.published,
          projectId: 'project-1',
          tags: ['test'],
          minReadTime: 5,
        );

        // Act
        final model = BlogSearchFiltersModel.fromEntity(originalEntity);
        final recreatedEntity = model.toEntity();

        // Assert
        expect(recreatedEntity.status, equals(originalEntity.status));
        expect(recreatedEntity.projectId, equals(originalEntity.projectId));
        expect(recreatedEntity.tags, equals(originalEntity.tags));
        expect(recreatedEntity.minReadTime, equals(originalEntity.minReadTime));
      });
    });
  });
}