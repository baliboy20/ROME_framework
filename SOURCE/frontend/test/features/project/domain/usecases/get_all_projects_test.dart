import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/core/utils/result.dart';
import '../../../../../lib/features/project/domain/entities/project.dart';
import '../../../../../lib/features/project/domain/repositories/project_repository.dart';
import '../../../../../lib/features/project/domain/usecases/get_all_projects.dart';

// Mock classes
class MockProjectRepository extends Mock implements ProjectRepository {}

void main() {
  group('GetAllProjects', () {
    late GetAllProjects useCase;
    late MockProjectRepository mockRepository;

    setUp(() {
      mockRepository = MockProjectRepository();
      useCase = GetAllProjects(mockRepository);
    });

    final testProjects = [
      Project(
        id: '1',
        name: 'Test Project 1',
        description: 'Description 1',
        status: ProjectStatus.active,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 1),
        attachments: [],
      ),
      Project(
        id: '2',
        name: 'Test Project 2',
        description: 'Description 2',
        status: ProjectStatus.planning,
        createdAt: DateTime(2025, 1, 2),
        updatedAt: DateTime(2025, 1, 2),
        attachments: [],
      ),
      Project(
        id: '3',
        name: 'Test Project 3',
        description: 'Description 3',
        status: ProjectStatus.completed,
        createdAt: DateTime(2025, 1, 3),
        updatedAt: DateTime(2025, 1, 3),
        attachments: [],
      ),
    ];

    group('successful retrieval', () {
      test('should return all projects when repository succeeds', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(testProjects));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Success<List<Project>>>());
        final successResult = result as Success<List<Project>>;
        expect(successResult.data, equals(testProjects));
        expect(successResult.data, hasLength(3));

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should return empty list when no projects exist', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(<Project>[]));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Success<List<Project>>>());
        final successResult = result as Success<List<Project>>;
        expect(successResult.data, isEmpty);

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should return single project when only one exists', () async {
        // Arrange
        final singleProject = [testProjects.first];
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(singleProject));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Success<List<Project>>>());
        final successResult = result as Success<List<Project>>;
        expect(successResult.data, equals(singleProject));
        expect(successResult.data, hasLength(1));

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should return projects with all different statuses', () async {
        // Arrange
        final projectsWithAllStatuses = ProjectStatus.values.map((status) => Project(
          id: status.name,
          name: 'Project ${status.name}',
          description: 'Description for ${status.name}',
          status: status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        )).toList();

        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(projectsWithAllStatuses));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Success<List<Project>>>());
        final successResult = result as Success<List<Project>>;
        expect(successResult.data, hasLength(ProjectStatus.values.length));
        
        // Verify all statuses are present
        for (final status in ProjectStatus.values) {
          expect(
            successResult.data.any((project) => project.status == status),
            isTrue,
            reason: 'Status $status should be present in results',
          );
        }

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should return projects with various properties', () async {
        // Arrange
        final complexProjects = [
          Project(
            id: '1',
            name: 'Simple Project',
            description: 'Simple description',
            status: ProjectStatus.active,
            createdAt: DateTime(2025, 1, 1),
            updatedAt: DateTime(2025, 1, 1),
            attachments: [],
          ),
          Project(
            id: '2',
            name: 'Complex Project',
            description: 'Complex description with more details',
            status: ProjectStatus.planning,
            createdAt: DateTime(2025, 1, 2),
            updatedAt: DateTime(2025, 1, 3),
            ownerId: 'user-1',
            tags: ['important', 'urgent'],
            attachments: ['file1.pdf', 'file2.doc'],
          ),
        ];

        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(complexProjects));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Success<List<Project>>>());
        final successResult = result as Success<List<Project>>;
        expect(successResult.data, equals(complexProjects));
        
        // Verify complex project properties
        final complexProject = successResult.data[1];
        expect(complexProject.ownerId, equals('user-1'));
        expect(complexProject.tags, equals(['important', 'urgent']));
        expect(complexProject.attachments, equals(['file1.pdf', 'file2.doc']));

        verify(() => mockRepository.getAllProjects()).called(1);
      });
    });

    group('repository failures', () {
      test('should propagate server failure from repository', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.failure(const ServerFailure('Server error')));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Error<List<Project>>>());
        final errorResult = result as Error<List<Project>>;
        expect(errorResult.failure, isA<ServerFailure>());
        expect(errorResult.failure.message, equals('Server error'));

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should propagate network failure from repository', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.failure(const NetworkFailure('Network error')));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Error<List<Project>>>());
        final errorResult = result as Error<List<Project>>;
        expect(errorResult.failure, isA<NetworkFailure>());
        expect(errorResult.failure.message, equals('Network error'));

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should propagate not found failure from repository', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.failure(const NotFoundFailure('No projects found')));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Error<List<Project>>>());
        final errorResult = result as Error<List<Project>>;
        expect(errorResult.failure, isA<NotFoundFailure>());
        expect(errorResult.failure.message, equals('No projects found'));

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should propagate validation failure from repository', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.failure(const ValidationFailure('Validation error')));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Error<List<Project>>>());
        final errorResult = result as Error<List<Project>>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Validation error'));

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should propagate cache failure from repository', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.failure(const CacheFailure('Cache error')));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Error<List<Project>>>());
        final errorResult = result as Error<List<Project>>;
        expect(errorResult.failure, isA<CacheFailure>());
        expect(errorResult.failure.message, equals('Cache error'));

        verify(() => mockRepository.getAllProjects()).called(1);
      });
    });

    group('multiple calls', () {
      test('should call repository each time usecase is executed', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(testProjects));

        // Act
        await useCase();
        await useCase();
        await useCase();

        // Assert
        verify(() => mockRepository.getAllProjects()).called(3);
      });

      test('should return consistent results for multiple calls', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(testProjects));

        // Act
        final result1 = await useCase();
        final result2 = await useCase();
        final result3 = await useCase();

        // Assert
        expect(result1, isA<Success<List<Project>>>());
        expect(result2, isA<Success<List<Project>>>());
        expect(result3, isA<Success<List<Project>>>());

        final data1 = (result1 as Success<List<Project>>).data;
        final data2 = (result2 as Success<List<Project>>).data;
        final data3 = (result3 as Success<List<Project>>).data;

        expect(data1, equals(data2));
        expect(data2, equals(data3));

        verify(() => mockRepository.getAllProjects()).called(3);
      });

      test('should handle mixed success and failure results', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(testProjects))
            .thenAnswer((_) async => Result.failure(const ServerFailure('Server error')))
            .thenAnswer((_) async => Result.success(<Project>[]));

        // Act
        final result1 = await useCase();
        final result2 = await useCase();
        final result3 = await useCase();

        // Assert
        expect(result1, isA<Success<List<Project>>>());
        expect(result2, isA<Error<List<Project>>>());
        expect(result3, isA<Success<List<Project>>>());

        expect((result1 as Success<List<Project>>).data, equals(testProjects));
        expect((result2 as Error<List<Project>>).failure.message, equals('Server error'));
        expect((result3 as Success<List<Project>>).data, isEmpty);

        verify(() => mockRepository.getAllProjects()).called(3);
      });
    });

    group('edge cases', () {
      test('should handle very large project lists', () async {
        // Arrange
        final largeProjectList = List.generate(1000, (index) => Project(
          id: 'project-$index',
          name: 'Project $index',
          description: 'Description for project $index',
          status: ProjectStatus.values[index % ProjectStatus.values.length],
          createdAt: DateTime(2025, 1, 1).add(Duration(days: index)),
          updatedAt: DateTime(2025, 1, 1).add(Duration(days: index)),
          attachments: [],
        ));

        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(largeProjectList));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Success<List<Project>>>());
        final successResult = result as Success<List<Project>>;
        expect(successResult.data, hasLength(1000));
        expect(successResult.data.first.id, equals('project-0'));
        expect(successResult.data.last.id, equals('project-999'));

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should handle projects with null optional fields', () async {
        // Arrange
        final projectsWithNulls = [
          Project(
            id: '1',
            name: 'Project with nulls',
            description: 'Description',
            status: ProjectStatus.active,
            createdAt: DateTime(2025, 1, 1),
            updatedAt: DateTime(2025, 1, 1),
            ownerId: null,
            tags: [],
            attachments: [],
          ),
        ];

        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(projectsWithNulls));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Success<List<Project>>>());
        final successResult = result as Success<List<Project>>;
        expect(successResult.data.first.ownerId, isNull);
        expect(successResult.data.first.tags, isEmpty);
        expect(successResult.data.first.attachments, isEmpty);

        verify(() => mockRepository.getAllProjects()).called(1);
      });

      test('should handle projects with special characters in names', () async {
        // Arrange
        final projectsWithSpecialChars = [
          Project(
            id: '1',
            name: 'Project with émöjis 🚀 and spéciál chars',
            description: 'Description with @#$%^&*()[]{}|\\',
            status: ProjectStatus.active,
            createdAt: DateTime(2025, 1, 1),
            updatedAt: DateTime(2025, 1, 1),
            attachments: [],
          ),
        ];

        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(projectsWithSpecialChars));

        // Act
        final result = await useCase();

        // Assert
        expect(result, isA<Success<List<Project>>>());
        final successResult = result as Success<List<Project>>;
        expect(successResult.data.first.name, equals('Project with émöjis 🚀 and spéciál chars'));
        expect(successResult.data.first.description, equals('Description with @#$%^&*()[]{}|\\'));

        verify(() => mockRepository.getAllProjects()).called(1);
      });
    });

    group('performance', () {
      test('should complete within reasonable time for normal sized lists', () async {
        // Arrange
        when(() => mockRepository.getAllProjects())
            .thenAnswer((_) async => Result.success(testProjects));

        final stopwatch = Stopwatch()..start();

        // Act
        final result = await useCase();

        // Assert
        stopwatch.stop();
        expect(result, isA<Success<List<Project>>>());
        expect(stopwatch.elapsedMilliseconds, lessThan(100)); // Should be very fast for simple delegation
        
        verify(() => mockRepository.getAllProjects()).called(1);
      });
    });
  });
}