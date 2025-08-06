import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/core/utils/result.dart';
import '../../../../../lib/features/project/domain/entities/project.dart';
import '../../../../../lib/features/project/domain/usecases/create_project.dart';
import '../../../../../lib/features/project/domain/usecases/delete_project.dart' as delete_uc;
import '../../../../../lib/features/project/domain/usecases/get_all_projects.dart';
import '../../../../../lib/features/project/domain/usecases/get_project_by_id.dart';
import '../../../../../lib/features/project/domain/usecases/update_project.dart' as update_uc;
import '../../../../../lib/features/project/presentation/bloc/project_bloc.dart';
import '../../../../../lib/features/project/presentation/bloc/project_event.dart';
import '../../../../../lib/features/project/presentation/bloc/project_state.dart';

// Mock classes
class MockGetAllProjects extends Mock implements GetAllProjects {}
class MockGetProjectById extends Mock implements GetProjectById {}
class MockCreateProject extends Mock implements CreateProject {}
class MockUpdateProject extends Mock implements update_uc.UpdateProject {}
class MockDeleteProject extends Mock implements delete_uc.DeleteProject {}

void main() {
  group('ProjectBloc', () {
    late ProjectBloc projectBloc;
    late MockGetAllProjects mockGetAllProjects;
    late MockGetProjectById mockGetProjectById;
    late MockCreateProject mockCreateProject;
    late MockUpdateProject mockUpdateProject;
    late MockDeleteProject mockDeleteProject;

    // Test data
    final testProject = Project(
      id: '1',
      name: 'Test Project',
      description: 'Test Description',
      status: ProjectStatus.active,
      createdAt: DateTime(2025, 1, 1),
      updatedAt: DateTime(2025, 1, 1),
      attachments: [],
    );

    final testProjects = [
      testProject,
      Project(
        id: '2',
        name: 'Another Project',
        description: 'Another Description',
        status: ProjectStatus.planning,
        createdAt: DateTime(2025, 1, 2),
        updatedAt: DateTime(2025, 1, 2),
        attachments: [],
      ),
    ];

    final testCreateParams = CreateProjectParams(
      name: 'New Project',
      description: 'New Description',
      status: ProjectStatus.planning,
    );

    setUp(() {
      mockGetAllProjects = MockGetAllProjects();
      mockGetProjectById = MockGetProjectById();
      mockCreateProject = MockCreateProject();
      mockUpdateProject = MockUpdateProject();
      mockDeleteProject = MockDeleteProject();

      projectBloc = ProjectBloc(
        getAllProjects: mockGetAllProjects,
        getProjectById: mockGetProjectById,
        createProject: mockCreateProject,
        updateProject: mockUpdateProject,
        deleteProject: mockDeleteProject,
      );

      // Register fallback values for mocktail
      registerFallbackValue(testCreateParams);
      registerFallbackValue(testProject);
      registerFallbackValue('test-id');
    });

    tearDown(() {
      projectBloc.close();
    });

    test('initial state should be ProjectInitial', () {
      expect(projectBloc.state, const ProjectInitial());
    });

    group('LoadProjects', () {
      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectsLoaded] when GetAllProjects succeeds',
        build: () {
          when(() => mockGetAllProjects()).thenAnswer(
            (_) async => Result.success(testProjects),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const LoadProjects()),
        expect: () => [
          const ProjectLoading(),
          ProjectsLoaded(testProjects),
        ],
        verify: (_) {
          verify(() => mockGetAllProjects()).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectError] when GetAllProjects fails',
        build: () {
          when(() => mockGetAllProjects()).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Server error')),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const LoadProjects()),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(ServerFailure('Server error')),
        ],
        verify: (_) {
          verify(() => mockGetAllProjects()).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectsLoaded] with empty list when no projects exist',
        build: () {
          when(() => mockGetAllProjects()).thenAnswer(
            (_) async => Result.success(<Project>[]),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const LoadProjects()),
        expect: () => [
          const ProjectLoading(),
          const ProjectsLoaded(<Project>[]),
        ],
      );
    });

    group('LoadProjectById', () {
      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectLoaded] when GetProjectById succeeds',
        build: () {
          when(() => mockGetProjectById(any())).thenAnswer(
            (_) async => Result.success(testProject),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const LoadProjectById('1')),
        expect: () => [
          const ProjectLoading(),
          ProjectLoaded(testProject),
        ],
        verify: (_) {
          verify(() => mockGetProjectById('1')).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectError] when GetProjectById fails',
        build: () {
          when(() => mockGetProjectById(any())).thenAnswer(
            (_) async => Result.failure(const NotFoundFailure('Project not found')),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const LoadProjectById('invalid-id')),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(NotFoundFailure('Project not found')),
        ],
        verify: (_) {
          verify(() => mockGetProjectById('invalid-id')).called(1);
        },
      );
    });

    group('CreateProjectEvent', () {
      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectCreated] when CreateProject succeeds',
        build: () {
          when(() => mockCreateProject(any())).thenAnswer(
            (_) async => Result.success(testProject),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(CreateProjectEvent(testCreateParams)),
        expect: () => [
          const ProjectLoading(),
          ProjectCreated(testProject),
        ],
        verify: (_) {
          verify(() => mockCreateProject(testCreateParams)).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectError] when CreateProject fails with validation error',
        build: () {
          when(() => mockCreateProject(any())).thenAnswer(
            (_) async => Result.failure(const ValidationFailure('Name is required')),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(CreateProjectEvent(testCreateParams)),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(ValidationFailure('Name is required')),
        ],
        verify: (_) {
          verify(() => mockCreateProject(testCreateParams)).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectError] when CreateProject fails with server error',
        build: () {
          when(() => mockCreateProject(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Failed to create project')),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(CreateProjectEvent(testCreateParams)),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(ServerFailure('Failed to create project')),
        ],
      );
    });

    group('UpdateProject', () {
      final updatedProject = testProject.copyWith(
        name: 'Updated Project Name',
        description: 'Updated Description',
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectUpdated] when UpdateProject succeeds',
        build: () {
          when(() => mockUpdateProject(any())).thenAnswer(
            (_) async => Result.success(updatedProject),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(UpdateProject(updatedProject)),
        expect: () => [
          const ProjectLoading(),
          ProjectUpdated(updatedProject),
        ],
        verify: (_) {
          verify(() => mockUpdateProject(updatedProject)).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectError] when UpdateProject fails',
        build: () {
          when(() => mockUpdateProject(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Failed to update project')),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(UpdateProject(updatedProject)),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(ServerFailure('Failed to update project')),
        ],
        verify: (_) {
          verify(() => mockUpdateProject(updatedProject)).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectError] when project is not found',
        build: () {
          when(() => mockUpdateProject(any())).thenAnswer(
            (_) async => Result.failure(const NotFoundFailure('Project not found')),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(UpdateProject(updatedProject)),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(NotFoundFailure('Project not found')),
        ],
      );
    });

    group('DeleteProject', () {
      const projectId = 'test-project-id';

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectDeleted] when DeleteProject succeeds',
        build: () {
          when(() => mockDeleteProject(any())).thenAnswer(
            (_) async => Result.success(null),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const DeleteProject(projectId)),
        expect: () => [
          const ProjectLoading(),
          const ProjectDeleted(projectId),
        ],
        verify: (_) {
          verify(() => mockDeleteProject(projectId)).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectError] when DeleteProject fails',
        build: () {
          when(() => mockDeleteProject(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Failed to delete project')),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const DeleteProject(projectId)),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(ServerFailure('Failed to delete project')),
        ],
        verify: (_) {
          verify(() => mockDeleteProject(projectId)).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectError] when project is not found for deletion',
        build: () {
          when(() => mockDeleteProject(any())).thenAnswer(
            (_) async => Result.failure(const NotFoundFailure('Project not found')),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const DeleteProject(projectId)),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(NotFoundFailure('Project not found')),
        ],
      );
    });

    group('RefreshProjects', () {
      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectsLoaded] when RefreshProjects succeeds',
        build: () {
          when(() => mockGetAllProjects()).thenAnswer(
            (_) async => Result.success(testProjects),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const RefreshProjects()),
        expect: () => [
          const ProjectLoading(),
          ProjectsLoaded(testProjects),
        ],
        verify: (_) {
          verify(() => mockGetAllProjects()).called(1);
        },
      );

      blocTest<ProjectBloc, ProjectState>(
        'emits [ProjectLoading, ProjectError] when RefreshProjects fails',
        build: () {
          when(() => mockGetAllProjects()).thenAnswer(
            (_) async => Result.failure(const NetworkFailure('Network error')),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const RefreshProjects()),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(NetworkFailure('Network error')),
        ],
      );
    });

    group('Sequential Events', () {
      blocTest<ProjectBloc, ProjectState>(
        'handles multiple sequential events correctly',
        build: () {
          when(() => mockGetAllProjects()).thenAnswer(
            (_) async => Result.success(testProjects),
          );
          when(() => mockCreateProject(any())).thenAnswer(
            (_) async => Result.success(testProject),
          );
          return projectBloc;
        },
        act: (bloc) {
          bloc.add(const LoadProjects());
          bloc.add(CreateProjectEvent(testCreateParams));
        },
        expect: () => [
          const ProjectLoading(),
          ProjectsLoaded(testProjects),
          const ProjectLoading(),
          ProjectCreated(testProject),
        ],
      );
    });

    group('Edge Cases', () {
      blocTest<ProjectBloc, ProjectState>(
        'handles unexpected exceptions gracefully',
        build: () {
          when(() => mockGetAllProjects()).thenThrow(
            Exception('Unexpected error'),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const LoadProjects()),
        expect: () => [
          const ProjectLoading(),
          const ProjectError(ServerFailure('An unexpected error occurred')),
        ],
      );

      blocTest<ProjectBloc, ProjectState>(
        'handles null results gracefully',
        build: () {
          when(() => mockGetAllProjects()).thenAnswer(
            (_) async => Result.success(null),
          );
          return projectBloc;
        },
        act: (bloc) => bloc.add(const LoadProjects()),
        expect: () => [
          const ProjectLoading(),
          const ProjectsLoaded(<Project>[]),
        ],
      );
    });

    group('State Equality', () {
      test('ProjectsLoaded states with same projects should be equal', () {
        final state1 = ProjectsLoaded(testProjects);
        final state2 = ProjectsLoaded(testProjects);
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });

      test('ProjectError states with same failure should be equal', () {
        const failure = ServerFailure('Error message');
        const state1 = ProjectError(failure);
        const state2 = ProjectError(failure);
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });

      test('ProjectCreated states with same project should be equal', () {
        final state1 = ProjectCreated(testProject);
        final state2 = ProjectCreated(testProject);
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });
    });

    group('Event Equality', () {
      test('LoadProjectById events with same id should be equal', () {
        const event1 = LoadProjectById('test-id');
        const event2 = LoadProjectById('test-id');
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('CreateProjectEvent events with same params should be equal', () {
        final event1 = CreateProjectEvent(testCreateParams);
        final event2 = CreateProjectEvent(testCreateParams);
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('DeleteProject events with same id should be equal', () {
        const event1 = DeleteProject('test-id');
        const event2 = DeleteProject('test-id');
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });
    });
  });
}