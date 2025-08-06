import 'package:bloc_test/bloc_test.dart';
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
class MockProjectBloc extends MockBloc<ProjectEvent, ProjectState> 
    implements ProjectBloc {}

void main() {
  group('ProjectsPage', () {
    late MockProjectBloc mockProjectBloc;

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

    setUp(() {
      mockProjectBloc = MockProjectBloc();
      
      // Set up default state
      when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
    });

    Widget createTestWidget(ProjectState initialState) {
      when(() => mockProjectBloc.state).thenReturn(initialState);
      
      return MacosApp(
        home: BlocProvider<ProjectBloc>(
          create: (_) => mockProjectBloc,
          child: const ProjectsPage(),
        ),
      );
    }

    group('Initial State', () {
      testWidgets('should display empty state when ProjectInitial', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(const ProjectInitial()));

        // Act
        await tester.pump();

        // Assert
        expect(find.text('No Projects Yet'), findsOneWidget);
        expect(find.text('Create your first project to get started'), findsOneWidget);
        expect(find.text('Create Project'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.folder), findsOneWidget);
      });

      testWidgets('should trigger LoadProjects on init', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(const ProjectInitial()));

        // Act
        await tester.pump();

        // Assert
        verify(() => mockProjectBloc.add(const LoadProjects())).called(1);
      });
    });

    group('Loading State', () {
      testWidgets('should display loading indicator when ProjectLoading', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(const ProjectLoading()));

        // Act
        await tester.pump();

        // Assert
        expect(find.byType(ProgressCircle), findsOneWidget);
      });
    });

    group('Projects Loaded State', () {
      testWidgets('should display projects list when ProjectsLoaded', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));

        // Act
        await tester.pump();

        // Assert
        expect(find.text('2 Projects'), findsOneWidget);
        expect(find.text('Test Project'), findsOneWidget);
        expect(find.text('Another Project'), findsOneWidget);
        expect(find.text('Test Description'), findsOneWidget);
      });

      testWidgets('should display project status badges correctly', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));

        // Act
        await tester.pump();

        // Assert
        expect(find.text('ACTIVE'), findsOneWidget);
        expect(find.text('PLANNING'), findsOneWidget);
      });

      testWidgets('should display project creation dates', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));

        // Act
        await tester.pump();

        // Assert
        expect(find.textContaining('Created'), findsNWidgets(2));
      });

      testWidgets('should show edit and delete buttons for each project', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));

        // Act
        await tester.pump();

        // Assert
        expect(find.byIcon(CupertinoIcons.pencil), findsNWidgets(2));
        expect(find.byIcon(CupertinoIcons.trash), findsNWidgets(2));
      });
    });

    group('Error State', () {
      testWidgets('should display error message when ProjectError', (tester) async {
        // Arrange
        const errorState = ProjectError(ServerFailure('Failed to load projects'));
        await tester.pumpWidget(createTestWidget(errorState));

        // Act
        await tester.pump();

        // Assert
        expect(find.text('Error Loading Projects'), findsOneWidget);
        expect(find.text('Failed to load projects'), findsOneWidget);
        expect(find.text('Retry'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.exclamationmark_triangle), findsOneWidget);
      });

      testWidgets('should trigger LoadProjects when retry button is tapped', (tester) async {
        // Arrange
        const errorState = ProjectError(ServerFailure('Network error'));
        await tester.pumpWidget(createTestWidget(errorState));
        await tester.pump();

        // Act
        await tester.tap(find.text('Retry'));
        await tester.pump();

        // Assert
        verify(() => mockProjectBloc.add(const LoadProjects())).called(1);
      });
    });

    group('Toolbar Actions', () {
      testWidgets('should display New Project button in toolbar', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));

        // Act
        await tester.pump();

        // Assert
        expect(find.text('New Project'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.plus), findsOneWidget);
      });

      testWidgets('should show create project dialog when New Project is tapped', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));
        await tester.pump();

        // Act
        await tester.tap(find.text('New Project'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Create New Project'), findsOneWidget);
        expect(find.text('Project Name'), findsOneWidget);
        expect(find.text('Description (optional)'), findsOneWidget);
        expect(find.text('Status: '), findsOneWidget);
      });
    });

    group('Create Project Dialog', () {
      testWidgets('should show file attachment section in create dialog', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));
        await tester.pump();

        // Act
        await tester.tap(find.text('New Project'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Attachments:'), findsOneWidget);
        expect(find.text('Add Files'), findsOneWidget);
      });

      testWidgets('should enable Create button only when name is provided', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));
        await tester.pump();
        await tester.tap(find.text('New Project'));
        await tester.pumpAndSettle();

        // Act - Initially Create button should be disabled
        final createButton = find.text('Create').last;
        expect(tester.widget<PushButton>(createButton).onPressed, isNull);

        // Enter project name
        await tester.enterText(find.widgetWithText(MacosTextField, 'Project Name'), 'New Project');
        await tester.pump();

        // Assert - Create button should now be enabled
        expect(tester.widget<PushButton>(createButton).onPressed, isNotNull);
      });

      testWidgets('should trigger CreateProjectEvent when Create is pressed', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));
        await tester.pump();
        await tester.tap(find.text('New Project'));
        await tester.pumpAndSettle();

        // Act
        await tester.enterText(find.widgetWithText(MacosTextField, 'Project Name'), 'New Project');
        await tester.enterText(find.widgetWithText(MacosTextField, 'Description (optional)'), 'New Description');
        await tester.pump();
        await tester.tap(find.text('Create').last);

        // Assert
        verify(() => mockProjectBloc.add(any<CreateProjectEvent>())).called(1);
      });

      testWidgets('should close dialog when Cancel is pressed', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));
        await tester.pump();
        await tester.tap(find.text('New Project'));
        await tester.pumpAndSettle();

        // Act
        await tester.tap(find.text('Cancel'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Create New Project'), findsNothing);
      });
    });

    group('Project Actions', () {
      testWidgets('should show edit dialog when edit button is tapped', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));
        await tester.pump();

        // Act
        await tester.tap(find.byIcon(CupertinoIcons.pencil).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Edit Project'), findsOneWidget);
        expect(find.text('Save'), findsOneWidget);
      });

      testWidgets('should show delete confirmation dialog when delete button is tapped', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));
        await tester.pump();

        // Act
        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Delete Project'), findsOneWidget);
        expect(find.text('Are you sure you want to delete "Test Project"? This action cannot be undone.'), findsOneWidget);
        expect(find.text('Delete'), findsOneWidget);
        expect(find.text('Cancel'), findsOneWidget);
      });

      testWidgets('should trigger DeleteProject when delete is confirmed', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));
        await tester.pump();
        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        // Act
        await tester.tap(find.text('Delete').last);

        // Assert
        verify(() => mockProjectBloc.add(const DeleteProject('1'))).called(1);
      });
    });

    group('Empty State Interactions', () {
      testWidgets('should show create dialog when Create Project button is tapped in empty state', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(const ProjectsLoaded([])));
        await tester.pump();

        // Act
        await tester.tap(find.text('Create Project'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Create New Project'), findsOneWidget);
      });
    });

    group('BLoC State Changes', () {
      testWidgets('should show success dialog when ProjectCreated state is emitted', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(const ProjectInitial()));
        
        // Simulate state change
        whenListen(
          mockProjectBloc,
          Stream.fromIterable([ProjectCreated(testProject)]),
          initialState: const ProjectInitial(),
        );

        // Act
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Project created successfully'), findsOneWidget);
      });

      testWidgets('should show error dialog when ProjectError state is emitted', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(const ProjectInitial()));
        
        // Simulate state change
        whenListen(
          mockProjectBloc,
          Stream.fromIterable([const ProjectError(ServerFailure('Creation failed'))]),
          initialState: const ProjectInitial(),
        );

        // Act
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Error'), findsOneWidget);
        expect(find.text('Creation failed'), findsOneWidget);
      });
    });

    group('Accessibility', () {
      testWidgets('should have proper semantics for screen readers', (tester) async {
        // Arrange
        await tester.pumpWidget(createTestWidget(ProjectsLoaded(testProjects)));

        // Act
        await tester.pump();

        // Assert
        expect(find.byTooltip('New Project'), findsOneWidget);
        // Additional semantic assertions would go here
      });
    });

    group('Edge Cases', () {
      testWidgets('should handle projects with empty descriptions', (tester) async {
        // Arrange
        final projectWithoutDescription = Project(
          id: '3',
          name: 'Project Without Description',
          description: '',
          status: ProjectStatus.active,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          attachments: [],
        );
        
        await tester.pumpWidget(createTestWidget(ProjectsLoaded([projectWithoutDescription])));

        // Act
        await tester.pump();

        // Assert
        expect(find.text('Project Without Description'), findsOneWidget);
        // Description should not be shown when empty
        expect(find.text(''), findsNothing);
      });

      testWidgets('should handle very long project names gracefully', (tester) async {
        // Arrange
        final projectWithLongName = Project(
          id: '4',
          name: 'This is a very long project name that should be handled gracefully by the UI and not cause any overflow issues',
          description: 'Description',
          status: ProjectStatus.active,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          attachments: [],
        );
        
        await tester.pumpWidget(createTestWidget(ProjectsLoaded([projectWithLongName])));

        // Act
        await tester.pump();

        // Assert
        expect(find.textContaining('This is a very long project name'), findsOneWidget);
      });
    });
  });
}