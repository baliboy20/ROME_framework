import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../lib/features/project/data/repositories/project_repository_impl.dart';
import '../../lib/features/project/domain/entities/project.dart';
import '../../lib/core/network/dio_client.dart';
import '../../lib/core/errors/exceptions.dart';
import '../../lib/core/errors/failures.dart';

// Mock classes
class MockDioClient extends Mock implements DioClient {}
class MockLogger extends Mock implements Logger {}

void main() {
  group('ProjectRepositoryImpl', () {
    late ProjectRepositoryImpl repository;
    late MockDioClient mockDioClient;
    late MockLogger mockLogger;

    setUp(() {
      mockDioClient = MockDioClient();
      mockLogger = MockLogger();
      repository = ProjectRepositoryImpl(
        dioClient: mockDioClient,
        logger: mockLogger,
      );
    });

    group('getAllProjects', () {
      test('should return list of projects when API call is successful', () async {
        // Arrange
        final responseData = {
          'projects': [
            {
              'id': 'project_1',
              'name': 'Project 1',
              'description': 'First project',
              'status': 'active',
              'createdAt': '2025-01-01T10:00:00.000Z',
              'updatedAt': '2025-01-01T12:00:00.000Z',
            },
            {
              'id': 'project_2',
              'name': 'Project 2',
              'description': 'Second project',
              'status': 'completed',
              'createdAt': '2025-01-01T11:00:00.000Z',
              'updatedAt': '2025-01-01T13:00:00.000Z',
            },
          ]
        };

        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenAnswer((_) async => Response(
                  data: responseData,
                  statusCode: 200,
                  requestOptions: RequestOptions(path: '/projects'),
                ));

        // Act
        final result = await repository.getAllProjects();

        // Assert
        expect(result.isSuccess, isTrue);
        final projects = result.data;
        expect(projects, hasLength(2));
        expect(projects[0].id, equals('project_1'));
        expect(projects[0].name, equals('Project 1'));
        expect(projects[0].status, equals(ProjectStatus.active));
        expect(projects[1].id, equals('project_2'));
        expect(projects[1].status, equals(ProjectStatus.completed));

        verify(() => mockDioClient.get<Map<String, dynamic>>('/projects')).called(1);
      });

      test('should return empty list when no projects exist', () async {
        // Arrange
        final responseData = {'projects': <dynamic>[]};

        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenAnswer((_) async => Response(
                  data: responseData,
                  statusCode: 200,
                  requestOptions: RequestOptions(path: '/projects'),
                ));

        // Act
        final result = await repository.getAllProjects();

        // Assert
        expect(result.isSuccess, isTrue);
        expect(result.data, isEmpty);
      });

      test('should return ServerFailure when API returns null data', () async {
        // Arrange
        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenAnswer((_) async => Response(
                  data: null,
                  statusCode: 200,
                  requestOptions: RequestOptions(path: '/projects'),
                ));

        // Act
        final result = await repository.getAllProjects();

        // Assert
        expect(result.isFailure, isTrue);
        expect(result.failure, isA<ServerFailure>());
        expect(result.failure.message, contains('No data received'));
      });

      test('should return ServerFailure when API throws ServerException', () async {
        // Arrange
        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenThrow(const ServerException('Internal server error', statusCode: 500));

        // Act
        final result = await repository.getAllProjects();

        // Assert
        expect(result.isFailure, isTrue);
        expect(result.failure, isA<ServerFailure>());
        expect(result.failure.message, equals('Internal server error'));
        expect((result.failure as ServerFailure).statusCode, equals(500));
      });

      test('should return NetworkFailure when API throws NetworkException', () async {
        // Arrange
        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenThrow(const NetworkException('Connection timeout'));

        // Act
        final result = await repository.getAllProjects();

        // Assert
        expect(result.isFailure, isTrue);
        expect(result.failure, isA<NetworkFailure>());
        expect(result.failure.message, equals('Connection timeout'));
      });

      test('should return JsonValidationFailure when JSON is invalid', () async {
        // Arrange
        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenThrow(const JsonValidationException(
              objectName: 'ProjectModel',
              missingFields: ['name'],
              invalidTypeFields: {},
            ));

        // Act
        final result = await repository.getAllProjects();

        // Assert
        expect(result.isFailure, isTrue);
        expect(result.failure, isA<JsonValidationFailure>());
      });

      test('should return UnexpectedFailure for other exceptions', () async {
        // Arrange
        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenThrow(Exception('Unexpected error'));

        // Act
        final result = await repository.getAllProjects();

        // Assert
        expect(result.isFailure, isTrue);
        expect(result.failure, isA<UnexpectedFailure>());
        expect(result.failure.message, contains('Unexpected error'));
      });
    });

    group('getProjectById', () {
      test('should return project when API call is successful', () async {
        // Arrange
        const projectId = 'project_123';
        final responseData = {
          'id': projectId,
          'name': 'Test Project',
          'description': 'A test project',
          'status': 'active',
          'createdAt': '2025-01-01T10:00:00.000Z',
          'updatedAt': '2025-01-01T12:00:00.000Z',
        };

        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenAnswer((_) async => Response(
                  data: responseData,
                  statusCode: 200,
                  requestOptions: RequestOptions(path: '/projects/$projectId'),
                ));

        // Act
        final result = await repository.getProjectById(projectId);

        // Assert
        expect(result.isSuccess, isTrue);
        final project = result.data;
        expect(project.id, equals(projectId));
        expect(project.name, equals('Test Project'));
        expect(project.status, equals(ProjectStatus.active));

        verify(() => mockDioClient.get<Map<String, dynamic>>('/projects/$projectId')).called(1);
      });

      test('should return ServerFailure when project not found', () async {
        // Arrange
        const projectId = 'nonexistent_project';
        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenThrow(const ServerException('Project not found', statusCode: 404));

        // Act
        final result = await repository.getProjectById(projectId);

        // Assert
        expect(result.isFailure, isTrue);
        expect(result.failure, isA<ServerFailure>());
        expect(result.failure.message, equals('Project not found'));
        expect((result.failure as ServerFailure).statusCode, equals(404));
      });
    });

    group('getProjectsByStatus', () {
      test('should return projects filtered by status', () async {
        // Arrange
        const status = ProjectStatus.active;
        final responseData = {
          'projects': [
            {
              'id': 'project_1',
              'name': 'Active Project 1',
              'description': 'First active project',
              'status': 'active',
              'createdAt': '2025-01-01T10:00:00.000Z',
              'updatedAt': '2025-01-01T12:00:00.000Z',
            },
            {
              'id': 'project_2',
              'name': 'Active Project 2',
              'description': 'Second active project',
              'status': 'active',
              'createdAt': '2025-01-01T11:00:00.000Z',
              'updatedAt': '2025-01-01T13:00:00.000Z',
            },
          ]
        };

        when(() => mockDioClient.get<Map<String, dynamic>>(
              any(),
              queryParameters: any(named: 'queryParameters'),
            )).thenAnswer((_) async => Response(
              data: responseData,
              statusCode: 200,
              requestOptions: RequestOptions(path: '/projects'),
            ));

        // Act
        final result = await repository.getProjectsByStatus(status);

        // Assert
        expect(result.isSuccess, isTrue);
        final projects = result.data;
        expect(projects, hasLength(2));
        expect(projects.every((p) => p.status == ProjectStatus.active), isTrue);

        verify(() => mockDioClient.get<Map<String, dynamic>>(
              '/projects',
              queryParameters: {'status': 'active'},
            )).called(1);
      });
    });

    group('searchProjects', () {
      test('should return matching projects when search is successful', () async {
        // Arrange
        const query = 'test';
        final responseData = {
          'projects': [
            {
              'id': 'project_1',
              'name': 'Test Project',
              'description': 'A test project',
              'status': 'active',
              'createdAt': '2025-01-01T10:00:00.000Z',
              'updatedAt': '2025-01-01T12:00:00.000Z',
            },
          ]
        };

        when(() => mockDioClient.get<Map<String, dynamic>>(
              any(),
              queryParameters: any(named: 'queryParameters'),
            )).thenAnswer((_) async => Response(
              data: responseData,
              statusCode: 200,
              requestOptions: RequestOptions(path: '/projects/search'),
            ));

        // Act
        final result = await repository.searchProjects(query);

        // Assert
        expect(result.isSuccess, isTrue);
        final projects = result.data;
        expect(projects, hasLength(1));
        expect(projects[0].name, contains('Test'));

        verify(() => mockDioClient.get<Map<String, dynamic>>(
              '/projects/search',
              queryParameters: {'q': query},
            )).called(1);
      });

      test('should return empty list when no matches found', () async {
        // Arrange
        const query = 'nonexistent';
        final responseData = {'projects': <dynamic>[]};

        when(() => mockDioClient.get<Map<String, dynamic>>(
              any(),
              queryParameters: any(named: 'queryParameters'),
            )).thenAnswer((_) async => Response(
              data: responseData,
              statusCode: 200,
              requestOptions: RequestOptions(path: '/projects/search'),
            ));

        // Act
        final result = await repository.searchProjects(query);

        // Assert
        expect(result.isSuccess, isTrue);
        expect(result.data, isEmpty);
      });
    });

    group('createProject', () {
      test('should return created project when API call is successful', () async {
        // Arrange
        final project = Project(
          id: '',
          name: 'New Project',
          description: 'A new project',
          status: ProjectStatus.planning,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final responseData = {
          'id': 'project_new_123',
          'name': 'New Project',
          'description': 'A new project',
          'status': 'planning',
          'createdAt': '2025-01-01T10:00:00.000Z',
          'updatedAt': '2025-01-01T10:00:00.000Z',
        };

        when(() => mockDioClient.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
            )).thenAnswer((_) async => Response(
              data: responseData,
              statusCode: 201,
              requestOptions: RequestOptions(path: '/projects'),
            ));

        // Act
        final result = await repository.createProject(project);

        // Assert
        expect(result.isSuccess, isTrue);
        final createdProject = result.data;
        expect(createdProject.id, equals('project_new_123'));
        expect(createdProject.name, equals('New Project'));
        expect(createdProject.status, equals(ProjectStatus.planning));

        verify(() => mockDioClient.post<Map<String, dynamic>>(
              '/projects',
              data: any(named: 'data'),
            )).called(1);
      });
    });

    group('updateProject', () {
      test('should return updated project when API call is successful', () async {
        // Arrange
        final project = Project(
          id: 'project_123',
          name: 'Updated Project',
          description: 'An updated project',
          status: ProjectStatus.active,
          createdAt: DateTime.parse('2025-01-01T10:00:00.000Z'),
          updatedAt: DateTime.now(),
        );

        final responseData = {
          'id': 'project_123',
          'name': 'Updated Project',
          'description': 'An updated project',
          'status': 'active',
          'createdAt': '2025-01-01T10:00:00.000Z',
          'updatedAt': '2025-01-01T14:00:00.000Z',
        };

        when(() => mockDioClient.put<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
            )).thenAnswer((_) async => Response(
              data: responseData,
              statusCode: 200,
              requestOptions: RequestOptions(path: '/projects/project_123'),
            ));

        // Act
        final result = await repository.updateProject(project);

        // Assert
        expect(result.isSuccess, isTrue);
        final updatedProject = result.data;
        expect(updatedProject.id, equals('project_123'));
        expect(updatedProject.name, equals('Updated Project'));

        verify(() => mockDioClient.put<Map<String, dynamic>>(
              '/projects/project_123',
              data: any(named: 'data'),
            )).called(1);
      });
    });

    group('deleteProject', () {
      test('should return success when deletion is successful', () async {
        // Arrange
        const projectId = 'project_123';

        when(() => mockDioClient.delete(any())).thenAnswer((_) async => Response(
              statusCode: 204,
              requestOptions: RequestOptions(path: '/projects/$projectId'),
            ));

        // Act
        final result = await repository.deleteProject(projectId);

        // Assert
        expect(result.isSuccess, isTrue);

        verify(() => mockDioClient.delete('/projects/$projectId')).called(1);
      });

      test('should return ServerFailure when deletion fails', () async {
        // Arrange
        const projectId = 'project_123';

        when(() => mockDioClient.delete(any()))
            .thenThrow(const ServerException('Failed to delete project', statusCode: 500));

        // Act
        final result = await repository.deleteProject(projectId);

        // Assert
        expect(result.isFailure, isTrue);
        expect(result.failure, isA<ServerFailure>());
      });
    });

    group('uploadAttachment', () {
      test('should return updated project when upload is successful', () async {
        // Arrange
        const projectId = 'project_123';
        const filePath = '/path/to/file.pdf';

        final responseData = {
          'id': projectId,
          'name': 'Test Project',
          'description': 'A test project',
          'status': 'active',
          'createdAt': '2025-01-01T10:00:00.000Z',
          'updatedAt': '2025-01-01T12:00:00.000Z',
          'attachments': ['file.pdf'],
        };

        when(() => mockDioClient.uploadFile<Map<String, dynamic>>(
              any(),
              any(),
              any(),
            )).thenAnswer((_) async => Response(
              data: responseData,
              statusCode: 200,
              requestOptions: RequestOptions(path: '/projects/$projectId/attachments'),
            ));

        // Act
        final result = await repository.uploadAttachment(projectId, filePath);

        // Assert
        expect(result.isSuccess, isTrue);
        final updatedProject = result.data;
        expect(updatedProject.attachments, contains('file.pdf'));

        verify(() => mockDioClient.uploadFile<Map<String, dynamic>>(
              '/projects/$projectId/attachments',
              filePath,
              'file',
            )).called(1);
      });
    });

    group('Logging', () {
      test('should log successful operations', () async {
        // Arrange
        final responseData = {'projects': <dynamic>[]};
        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenAnswer((_) async => Response(
                  data: responseData,
                  statusCode: 200,
                  requestOptions: RequestOptions(path: '/projects'),
                ));

        // Act
        await repository.getAllProjects();

        // Assert
        verify(() => mockLogger.d('Fetching all projects')).called(1);
        verify(() => mockLogger.d('Successfully fetched 0 projects')).called(1);
      });

      test('should log errors', () async {
        // Arrange
        when(() => mockDioClient.get<Map<String, dynamic>>(any()))
            .thenThrow(const NetworkException('Connection failed'));

        // Act
        await repository.getAllProjects();

        // Assert
        verify(() => mockLogger.e('Network error fetching projects: Connection failed')).called(1);
      });
    });
  });
}