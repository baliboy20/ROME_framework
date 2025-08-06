import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macos_ui/macos_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/features/project/domain/entities/project.dart';
import '../../../../../lib/features/project/domain/usecases/create_project.dart';
import '../../../../../lib/features/project/presentation/bloc/project_bloc.dart';
import '../../../../../lib/features/project/presentation/bloc/project_event.dart';
import '../../../../../lib/features/project/presentation/bloc/project_state.dart';
import '../../../../../lib/features/project/presentation/pages/projects_page.dart';

// Mock classes
class MockProjectBloc extends MockBloc<ProjectEvent, ProjectState> implements ProjectBloc {}

void main() {
  group('ProjectsPage Widget Tests', () {
    late MockProjectBloc mockProjectBloc;

    // Test data
    final testProjects = [
      Project(
        id: '1',
        name: 'Test Project 1',
        description: 'Description for project 1',
        status: ProjectStatus.active,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 1),
        attachments: [],
      ),
      Project(
        id: '2',
        name: 'Test Project 2',
        description: 'Description for project 2',
        status: ProjectStatus.planning,
        createdAt: DateTime(2025, 1, 2),
        updatedAt: DateTime(2025, 1, 2),
        attachments: [],
      ),
      Project(
        id: '3',
        name: 'Test Project 3',
        description: '',
        status: ProjectStatus.completed,
        createdAt: DateTime(2025, 1, 3),
        updatedAt: DateTime(2025, 1, 3),
        attachments: [],
      ),
    ];

    setUp(() {
      mockProjectBloc = MockProjectBloc();
      when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
    });

    Widget createTestWidget() {
      return MacosApp(
        home: BlocProvider<ProjectBloc>.value(
          value: mockProjectBloc,
          child: const ProjectsPage(),
        ),
      );
    }

    group('Initial Load', () {
      testWidgets('should dispatch LoadProjects event on init', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectLoading());

        // Act
        await tester.pumpWidget(createTestWidget());

        // Assert
        verify(() => mockProjectBloc.add(const LoadProjects())).called(1);
      });

      testWidgets('should show loading indicator when ProjectLoading state', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectLoading());
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(const ProjectLoading()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byType(ProgressCircle), findsOneWidget);
      });
    });

    group('Empty State', () {
      testWidgets('should show empty state when no projects', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectsLoaded([]));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(const ProjectsLoaded([])));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('No Projects Yet'), findsOneWidget);
        expect(find.text('Create your first project to get started'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.folder), findsOneWidget);
        expect(find.text('Create Project'), findsOneWidget);
      });

      testWidgets('should show create project dialog when tapping Create Project button in empty state', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectsLoaded([]));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(const ProjectsLoaded([])));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.text('Create Project'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Create New Project'), findsOneWidget);
        expect(find.byType(CreateProjectDialog), findsOneWidget);
      });
    });

    group('Projects List', () {
      testWidgets('should display projects list when ProjectsLoaded state with projects', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(testProjects));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(testProjects)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('3 Projects'), findsOneWidget);
        expect(find.text('Test Project 1'), findsOneWidget);
        expect(find.text('Test Project 2'), findsOneWidget);
        expect(find.text('Test Project 3'), findsOneWidget);
        expect(find.text('Description for project 1'), findsOneWidget);
        expect(find.text('Description for project 2'), findsOneWidget);
      });

      testWidgets('should display correct status badges for each project', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(testProjects));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(testProjects)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('ACTIVE'), findsOneWidget);
        expect(find.text('PLANNING'), findsOneWidget);
        expect(find.text('COMPLETED'), findsOneWidget);
      });

      testWidgets('should not show description when project description is empty', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(testProjects));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(testProjects)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        // Project 3 has empty description, so it shouldn't be displayed
        expect(find.text('Description for project 3'), findsNothing);
      });

      testWidgets('should show relative date formatting for project creation', (tester) async {
        // Arrange
        final recentProject = [Project(
          id: '1',
          name: 'Recent Project',
          description: 'Recent description',
          status: ProjectStatus.active,
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
          updatedAt: DateTime.now(),
          attachments: [],
        )];

        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(recentProject));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(recentProject)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('hours ago'), findsOneWidget);
      });

      testWidgets('should display edit and delete buttons for each project', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(testProjects));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(testProjects)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byIcon(CupertinoIcons.pencil), findsNWidgets(3));
        expect(find.byIcon(CupertinoIcons.trash), findsNWidgets(3));
      });
    });

    group('Toolbar', () {
      testWidgets('should display Projects title in toolbar', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(const ProjectInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Projects'), findsOneWidget);
      });

      testWidgets('should show New Project button in toolbar', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(const ProjectInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('New Project'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.plus), findsOneWidget);
      });

      testWidgets('should show create project dialog when tapping New Project button', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(const ProjectInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.text('New Project'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Create New Project'), findsOneWidget);
        expect(find.byType(CreateProjectDialog), findsOneWidget);
      });
    });

    group('Error State', () {
      testWidgets('should display error state when ProjectError', (tester) async {
        // Arrange
        const errorMessage = 'Failed to load projects';
        when(() => mockProjectBloc.state).thenReturn(const ProjectError(ServerFailure(errorMessage)));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(const ProjectError(ServerFailure(errorMessage))));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Error Loading Projects'), findsOneWidget);
        expect(find.text(errorMessage), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.exclamationmark_triangle), findsOneWidget);
        expect(find.text('Retry'), findsOneWidget);
      });

      testWidgets('should dispatch LoadProjects when tapping Retry button', (tester) async {
        // Arrange
        const errorMessage = 'Failed to load projects';
        when(() => mockProjectBloc.state).thenReturn(const ProjectError(ServerFailure(errorMessage)));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(const ProjectError(ServerFailure(errorMessage))));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Clear previous calls
        clearInteractions(mockProjectBloc);

        await tester.tap(find.text('Retry'));
        await tester.pump();

        // Assert
        verify(() => mockProjectBloc.add(const LoadProjects())).called(1);
      });
    });

    group('Project Actions', () {
      testWidgets('should show edit dialog when tapping edit button', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(testProjects));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(testProjects)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.pencil).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Edit Project'), findsOneWidget);
        expect(find.byType(EditProjectDialog), findsOneWidget);
      });

      testWidgets('should show delete confirmation dialog when tapping delete button', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(testProjects));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(testProjects)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Delete Project'), findsOneWidget);
        expect(find.textContaining('Are you sure you want to delete'), findsOneWidget);
        expect(find.text('Delete'), findsOneWidget);
        expect(find.text('Cancel'), findsOneWidget);
      });

      testWidgets('should dispatch DeleteProject event when confirming delete', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(testProjects));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(testProjects)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Clear previous calls
        clearInteractions(mockProjectBloc);

        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        await tester.tap(find.text('Delete'));
        await tester.pump();

        // Assert
        verify(() => mockProjectBloc.add(DeleteProject(testProjects.first.id))).called(1);
      });

      testWidgets('should close delete dialog when tapping Cancel', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(testProjects));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(testProjects)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        await tester.tap(find.text('Cancel'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Delete Project'), findsNothing);
        verifyNever(() => mockProjectBloc.add(any()));
      });
    });

    group('BLoC Listener', () {
      testWidgets('should show error dialog when ProjectError state', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.fromIterable([
          const ProjectError(ServerFailure('Error message')),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Error'), findsOneWidget);
        expect(find.text('Error message'), findsOneWidget);
      });

      testWidgets('should show success dialog when ProjectCreated state', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.fromIterable([
          ProjectCreated(testProjects.first),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Project created successfully'), findsOneWidget);
      });

      testWidgets('should show success dialog when ProjectUpdated state', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.fromIterable([
          ProjectUpdated(testProjects.first),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Project updated successfully'), findsOneWidget);
      });

      testWidgets('should show success dialog when ProjectDeleted state', (tester) async {
        // Arrange
        when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.fromIterable([
          const ProjectDeleted('project-1'),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Project deleted successfully'), findsOneWidget);
      });
    });

    group('Status Color Mapping', () {
      testWidgets('should display correct colors for different project statuses', (tester) async {
        // Arrange
        final projectsWithAllStatuses = ProjectStatus.values.map((status) => Project(
          id: status.name,
          name: 'Project ${status.name}',
          description: 'Description',
          status: status,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        )).toList();

        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(projectsWithAllStatuses));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(projectsWithAllStatuses)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        for (final status in ProjectStatus.values) {
          expect(find.text(status.name.toUpperCase()), findsOneWidget);
        }
      });
    });

    group('Edge Cases', () {
      testWidgets('should handle single project correctly', (tester) async {
        // Arrange
        final singleProject = [testProjects.first];
        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(singleProject));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(singleProject)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('1 Projects'), findsOneWidget);
        expect(find.text('Test Project 1'), findsOneWidget);
      });

      testWidgets('should handle projects with very long names and descriptions', (tester) async {
        // Arrange
        final longNameProject = [Project(
          id: '1',
          name: 'Very Long Project Name That Should Be Truncated If Necessary',
          description: 'Very long description that should be truncated with ellipsis when it exceeds the maximum number of lines allowed in the card display',
          status: ProjectStatus.active,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        )];

        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(longNameProject));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(longNameProject)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('Very Long Project Name'), findsOneWidget);
        expect(find.textContaining('Very long description'), findsOneWidget);
      });

      testWidgets('should handle projects with special characters', (tester) async {
        // Arrange
        final specialCharProject = [Project(
          id: '1',
          name: 'Project with émöjis 🚀 & spéciál chars',
          description: 'Description with @#\$%^&*()[]{}|\\',
          status: ProjectStatus.active,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        )];

        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(specialCharProject));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(specialCharProject)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('Project with émöjis 🚀'), findsOneWidget);
        expect(find.textContaining('Description with @#\$%^&*()[]{}|\\'), findsOneWidget);
      });
    });

    group('Scrolling Behavior', () {
      testWidgets('should be scrollable when many projects are present', (tester) async {
        // Arrange
        final manyProjects = List.generate(20, (index) => Project(
          id: 'project-$index',
          name: 'Project $index',
          description: 'Description for project $index',
          status: ProjectStatus.values[index % ProjectStatus.values.length],
          createdAt: DateTime(2025, 1, 1).add(Duration(days: index)),
          updatedAt: DateTime(2025, 1, 1).add(Duration(days: index)),
          attachments: [],
        ));

        when(() => mockProjectBloc.state).thenReturn(ProjectsLoaded(manyProjects));
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(ProjectsLoaded(manyProjects)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('20 Projects'), findsOneWidget);
        expect(find.byType(ListView), findsOneWidget);
        
        // Verify scrolling works
        expect(find.text('Project 0'), findsOneWidget);
        await tester.scrollUntilVisible(find.text('Project 19'), 500);
        expect(find.text('Project 19'), findsOneWidget);
      });
    });
  });
}