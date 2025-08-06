import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/core/utils/result.dart';
import '../../../../../lib/features/project/domain/entities/project.dart';
import '../../../../../lib/features/project/domain/repositories/project_repository.dart';
import '../../../../../lib/features/project/domain/usecases/create_project.dart';

// Mock classes
class MockProjectRepository extends Mock implements ProjectRepository {}

void main() {
  group('CreateProject', () {
    late CreateProject useCase;
    late MockProjectRepository mockRepository;

    setUp(() {
      mockRepository = MockProjectRepository();
      useCase = CreateProject(mockRepository);
      
      // Register fallback values for mocktail
      registerFallbackValue(Project(
        id: '',
        title: '',
        description: '',
        status: ProjectStatus.planning,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        attachments: [],
      ));
    });

    group('successful creation', () {
      test('should create project with valid parameters', () async {
        // Arrange
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
          ownerId: 'user-1',
          tags: ['test', 'project'],
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          ownerId: params.ownerId,
          tags: params.tags,
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Project>>());
        final successResult = result as Success<Project>;
        expect(successResult.data, equals(expectedProject));

        // Verify repository was called with correct project
        verify(() => mockRepository.createProject(any(that: predicate<Project>((project) =>
            project.title == params.title &&
            project.description == params.description &&
            project.status == params.status &&
            project.ownerId == params.ownerId &&
            project.tags == params.tags &&
            project.id.isEmpty // ID should be empty before creation
        )))).called(1);
      });

      test('should create project with minimal parameters', () async {
        // Arrange
        final params = CreateProjectParams(
          title: 'Minimal Project',
          description: 'Minimal Description',
          status: ProjectStatus.planning,
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Project>>());
        final successResult = result as Success<Project>;
        expect(successResult.data, equals(expectedProject));

        // Verify project entity was created correctly
        verify(() => mockRepository.createProject(any(that: predicate<Project>((project) =>
            project.title == params.title &&
            project.description == params.description &&
            project.status == params.status &&
            project.ownerId == null &&
            project.tags.isEmpty
        )))).called(1);
      });

      test('should create project with all possible statuses', () async {
        // Arrange & Act & Assert
        for (final status in ProjectStatus.values) {
          final params = CreateProjectParams(
            title: 'Test Project',
            description: 'Test Description',
            status: status,
          );

          final expectedProject = Project(
            id: 'generated-id',
            title: params.title,
            description: params.description,
            status: status,
            createdAt: DateTime(2025, 1, 1),
            updatedAt: DateTime(2025, 1, 1),
            attachments: [],
          );

          when(() => mockRepository.createProject(any()))
              .thenAnswer((_) async => Result.success(expectedProject));

          final result = await useCase(params);

          expect(result, isA<Success<Project>>(), reason: 'Failed for status: $status');
          final successResult = result as Success<Project>;
          expect(successResult.data.status, equals(status));
        }
      });

      test('should set creation and update timestamps', () async {
        // Arrange
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        final beforeCall = DateTime.now();

        // Act
        final result = await useCase(params);

        final afterCall = DateTime.now();

        // Assert
        expect(result, isA<Success<Project>>());

        // Verify timestamps were set during creation
        verify(() => mockRepository.createProject(any(that: predicate<Project>((project) {
          final createdAt = project.createdAt;
          final updatedAt = project.updatedAt;
          
          return createdAt.isAfter(beforeCall.subtract(const Duration(seconds: 1))) &&
                 createdAt.isBefore(afterCall.add(const Duration(seconds: 1))) &&
                 updatedAt.isAfter(beforeCall.subtract(const Duration(seconds: 1))) &&
                 updatedAt.isBefore(afterCall.add(const Duration(seconds: 1)));
        })))).called(1);
      });
    });

    group('validation failures', () {
      test('should fail when project name is empty', () async {
        // Arrange
        final params = CreateProjectParams(
          title: '',
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Project>>());
        final errorResult = result as Error<Project>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Project title cannot be empty'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createProject(any()));
      });

      test('should fail when project name is only whitespace', () async {
        // Arrange
        final params = CreateProjectParams(
          title: '   ',
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Project>>());
        final errorResult = result as Error<Project>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Project title cannot be empty'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createProject(any()));
      });

      test('should fail when project name exceeds 100 characters', () async {
        // Arrange
        final longName = 'a' * 101;
        final params = CreateProjectParams(
          title: longName,
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Project>>());
        final errorResult = result as Error<Project>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Project title cannot exceed 100 characters'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createProject(any()));
      });

      test('should fail when description exceeds 1000 characters', () async {
        // Arrange
        final longDescription = 'a' * 1001;
        final params = CreateProjectParams(
          title: 'Test Project',
          description: longDescription,
          status: ProjectStatus.active,
        );

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Project>>());
        final errorResult = result as Error<Project>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Project description cannot exceed 1000 characters'));

        // Verify repository was not called
        verifyNever(() => mockRepository.createProject(any()));
      });

      test('should pass with exactly 100 character name', () async {
        // Arrange
        final maxLengthName = 'a' * 100;
        final params = CreateProjectParams(
          title: maxLengthName,
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: maxLengthName,
          description: 'Test Description',
          status: ProjectStatus.active,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Project>>());
        verify(() => mockRepository.createProject(any())).called(1);
      });

      test('should pass with exactly 1000 character description', () async {
        // Arrange
        final maxLengthDescription = 'a' * 1000;
        final params = CreateProjectParams(
          title: 'Test Project',
          description: maxLengthDescription,
          status: ProjectStatus.active,
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: 'Test Project',
          description: maxLengthDescription,
          status: ProjectStatus.active,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Project>>());
        verify(() => mockRepository.createProject(any())).called(1);
      });
    });

    group('repository failures', () {
      test('should propagate server failure from repository', () async {
        // Arrange
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.failure(const ServerFailure('Server error')));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Project>>());
        final errorResult = result as Error<Project>;
        expect(errorResult.failure, isA<ServerFailure>());
        expect(errorResult.failure.message, equals('Server error'));

        verify(() => mockRepository.createProject(any())).called(1);
      });

      test('should propagate network failure from repository', () async {
        // Arrange
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.failure(const NetworkFailure('Network error')));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Project>>());
        final errorResult = result as Error<Project>;
        expect(errorResult.failure, isA<NetworkFailure>());
        expect(errorResult.failure.message, equals('Network error'));

        verify(() => mockRepository.createProject(any())).called(1);
      });

      test('should propagate validation failure from repository', () async {
        // Arrange
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.failure(const ValidationFailure('Repository validation error')));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Error<Project>>());
        final errorResult = result as Error<Project>;
        expect(errorResult.failure, isA<ValidationFailure>());
        expect(errorResult.failure.message, equals('Repository validation error'));

        verify(() => mockRepository.createProject(any())).called(1);
      });
    });

    group('edge cases', () {
      test('should handle special characters in name and description', () async {
        // Arrange
        final params = CreateProjectParams(
          title: 'Test Project 🚀 with émöjis & spéciál chars',
          description: 'Description with special chars: @#$%^&*()[]{}|\\:";\'<>?,./',
          status: ProjectStatus.active,
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Project>>());
        final successResult = result as Success<Project>;
        expect(successResult.data.title, equals(params.title));
        expect(successResult.data.description, equals(params.description));
      });

      test('should handle empty description', () async {
        // Arrange
        final params = CreateProjectParams(
          title: 'Test Project',
          description: '',
          status: ProjectStatus.active,
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: params.title,
          description: '',
          status: params.status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Project>>());
        final successResult = result as Success<Project>;
        expect(successResult.data.description, isEmpty);
      });

      test('should handle multiple tags', () async {
        // Arrange
        final tags = ['tag1', 'tag2', 'tag3', 'important', 'urgent'];
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
          tags: tags,
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          tags: tags,
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Project>>());
        final successResult = result as Success<Project>;
        expect(successResult.data.tags, equals(tags));
      });

      test('should handle empty tags list', () async {
        // Arrange
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
          tags: [],
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: params.title,
          description: params.description,
          status: params.status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          tags: [],
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Project>>());
        final successResult = result as Success<Project>;
        expect(successResult.data.tags, isEmpty);
      });

      test('should trim whitespace from name before validation', () async {
        // Arrange
        final params = CreateProjectParams(
          title: '  Test Project  ',
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        final expectedProject = Project(
          id: 'generated-id',
          title: 'Test Project', // Should be trimmed in the entity
          description: 'Test Description',
          status: params.status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        );

        when(() => mockRepository.createProject(any()))
            .thenAnswer((_) async => Result.success(expectedProject));

        // Act
        final result = await useCase(params);

        // Assert
        expect(result, isA<Success<Project>>());
        
        // Verify validation was done on trimmed name
        verify(() => mockRepository.createProject(any(that: predicate<Project>((project) =>
            project.title == '  Test Project  ' // Use case passes original title, trimming is for validation only
        )))).called(1);
      });
    });

    group('CreateProjectParams', () {
      test('should have correct toString representation', () {
        // Arrange
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        // Act
        final result = params.toString();

        // Assert
        expect(result, equals('CreateProjectParams(title: Test Project, status: ProjectStatus.active)'));
      });

      test('should create params with default values', () {
        // Arrange & Act
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
        );

        // Assert
        expect(params.title, equals('Test Project'));
        expect(params.description, equals('Test Description'));
        expect(params.status, equals(ProjectStatus.active));
        expect(params.ownerId, isNull);
        expect(params.tags, isEmpty);
      });

      test('should create params with all values', () {
        // Arrange & Act
        final params = CreateProjectParams(
          title: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.active,
          ownerId: 'user-1',
          tags: ['tag1', 'tag2'],
        );

        // Assert
        expect(params.title, equals('Test Project'));
        expect(params.description, equals('Test Description'));
        expect(params.status, equals(ProjectStatus.active));
        expect(params.ownerId, equals('user-1'));
        expect(params.tags, equals(['tag1', 'tag2']));
      });
    });
  });
}