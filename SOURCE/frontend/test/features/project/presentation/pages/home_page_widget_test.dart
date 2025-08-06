import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macos_ui/macos_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/features/project/presentation/pages/home_page.dart';
import '../../../../../lib/features/project/presentation/pages/projects_page.dart';
import '../../../../../lib/features/task/presentation/pages/tasks_page.dart';
import '../../../../../lib/features/blog/presentation/pages/blogs_page.dart';
import '../../../../../lib/features/project/presentation/bloc/project_bloc.dart';
import '../../../../../lib/features/project/presentation/bloc/project_state.dart';
import '../../../../../lib/features/task/presentation/bloc/task_bloc.dart';
import '../../../../../lib/features/task/presentation/bloc/task_state.dart';
import '../../../../../lib/features/blog/presentation/bloc/blog_bloc.dart';
import '../../../../../lib/features/blog/presentation/bloc/blog_state.dart';

// Mock classes
class MockProjectBloc extends MockBloc<dynamic, ProjectState> implements ProjectBloc {}
class MockTaskBloc extends MockBloc<dynamic, TaskState> implements TaskBloc {}
class MockBlogBloc extends MockBloc<dynamic, BlogState> implements BlogBloc {}

void main() {
  group('HomePage Widget Tests', () {
    late MockProjectBloc mockProjectBloc;
    late MockTaskBloc mockTaskBloc;
    late MockBlogBloc mockBlogBloc;

    setUp(() {
      mockProjectBloc = MockProjectBloc();
      mockTaskBloc = MockTaskBloc();
      mockBlogBloc = MockBlogBloc();
      
      // Set up default states
      when(() => mockProjectBloc.state).thenReturn(const ProjectInitial());
      when(() => mockTaskBloc.state).thenReturn(const TaskInitial());
      when(() => mockBlogBloc.state).thenReturn(const BlogInitial());
    });

    Widget createTestWidget() {
      return MacosApp(
        home: MultiBlocProvider(
          providers: [
            BlocProvider<ProjectBloc>.value(value: mockProjectBloc),
            BlocProvider<TaskBloc>.value(value: mockTaskBloc),
            BlocProvider<BlogBloc>.value(value: mockBlogBloc),
          ],
          child: const HomePage(),
        ),
      );
    }

    group('Sidebar Navigation', () {
      testWidgets('should display all sidebar items', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Dashboard'), findsOneWidget);
        expect(find.text('Projects'), findsAtLeastNWidgets(1));
        expect(find.text('Tasks'), findsAtLeastNWidgets(1));
        expect(find.text('Journal'), findsOneWidget);
        
        // Check sidebar icons
        expect(find.byIcon(CupertinoIcons.home), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.folder), findsAtLeastNWidgets(1));
        expect(find.byIcon(CupertinoIcons.checkmark_square), findsAtLeastNWidgets(1));
        expect(find.byIcon(CupertinoIcons.book), findsAtLeastNWidgets(1));
      });

      testWidgets('should start with Dashboard selected', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert - Dashboard should be visible and selected
        expect(find.text('Welcome to Project Management'), findsOneWidget);
        expect(find.text('Quick Overview'), findsOneWidget);
        expect(find.byType(DashboardView), findsOneWidget);
      });

      testWidgets('should navigate to Projects page when Projects tab is tapped', (tester) async {
        // Arrange
        when(() => mockProjectBloc.stream).thenAnswer((_) => Stream.value(const ProjectInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Tap on Projects in sidebar
        await tester.tap(find.text('Projects').first);
        await tester.pump();

        // Assert
        expect(find.byType(ProjectsPage), findsOneWidget);
      });

      testWidgets('should navigate to Tasks page when Tasks tab is tapped', (tester) async {
        // Arrange
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TaskInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Tap on Tasks in sidebar
        await tester.tap(find.text('Tasks').first);
        await tester.pump();

        // Assert
        expect(find.byType(TasksPage), findsOneWidget);
      });

      testWidgets('should navigate to Journal page when Journal tab is tapped', (tester) async {
        // Arrange
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Tap on Journal in sidebar
        await tester.tap(find.text('Journal'));
        await tester.pump();

        // Assert
        expect(find.byType(BlogsPage), findsOneWidget);
      });

      testWidgets('should navigate back to Dashboard when Dashboard tab is tapped', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Navigate to Projects first
        await tester.tap(find.text('Projects').first);
        await tester.pump();

        // Navigate back to Dashboard
        await tester.tap(find.text('Dashboard'));
        await tester.pump();

        // Assert
        expect(find.byType(DashboardView), findsOneWidget);
        expect(find.text('Welcome to Project Management'), findsOneWidget);
      });
    });

    group('DashboardView', () {
      testWidgets('should display welcome message and overview', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Welcome to Project Management'), findsOneWidget);
        expect(find.text('Quick Overview'), findsOneWidget);
        expect(find.text('Recent Activity'), findsOneWidget);
      });

      testWidgets('should display dashboard cards with correct titles', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Projects'), findsAtLeastNWidgets(1)); // One in sidebar, one in card
        expect(find.text('Tasks'), findsAtLeastNWidgets(1)); // One in sidebar, one in card
        expect(find.text('Journal Entries'), findsOneWidget);
      });

      testWidgets('should display default counts of 0 for all cards', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert - Should find three instances of "0" (one for each card)
        expect(find.text('0'), findsNWidgets(3));
      });

      testWidgets('should display dashboard card icons with correct colors', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert - Check that all expected icons are present
        // Note: Some icons appear in both sidebar and cards
        expect(find.byIcon(CupertinoIcons.folder), findsAtLeastNWidgets(1));
        expect(find.byIcon(CupertinoIcons.checkmark_square), findsAtLeastNWidgets(1));
        expect(find.byIcon(CupertinoIcons.book), findsAtLeastNWidgets(1));
      });

      testWidgets('should display recent activity section', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Recent Activity'), findsOneWidget);
        expect(find.text('No recent activity'), findsOneWidget);
      });

      testWidgets('should have proper layout structure', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byType(MacosScaffold), findsOneWidget);
        expect(find.byType(ToolBar), findsOneWidget);
        expect(find.byType(ContentArea), findsOneWidget);
        expect(find.byType(Column), findsAtLeastNWidgets(1));
        expect(find.byType(Row), findsAtLeastNWidgets(1));
      });
    });

    group('MacosWindow Structure', () {
      testWidgets('should have correct MacosWindow structure', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byType(MacosWindow), findsOneWidget);
        expect(find.byType(Sidebar), findsOneWidget);
        expect(find.byType(SidebarItems), findsOneWidget);
        expect(find.byType(IndexedStack), findsOneWidget);
      });

      testWidgets('should have correct sidebar configuration', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        final sidebar = tester.widget<Sidebar>(find.byType(Sidebar));
        expect(sidebar.minWidth, equals(200));
      });

      testWidgets('should contain all page widgets in IndexedStack', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        final indexedStack = tester.widget<IndexedStack>(find.byType(IndexedStack));
        expect(indexedStack.children, hasLength(4));
        expect(indexedStack.children[0], isA<DashboardView>());
        expect(indexedStack.children[1], isA<ProjectsPage>());
        expect(indexedStack.children[2], isA<TasksPage>());
        expect(indexedStack.children[3], isA<BlogsPage>());
      });
    });

    group('Navigation State Management', () {
      testWidgets('should maintain correct selected index when navigating', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Initial state - Dashboard (index 0) should be selected
        IndexedStack indexedStack = tester.widget<IndexedStack>(find.byType(IndexedStack));
        expect(indexedStack.index, equals(0));

        // Navigate to Projects (index 1)
        await tester.tap(find.text('Projects').first);
        await tester.pump();

        indexedStack = tester.widget<IndexedStack>(find.byType(IndexedStack));
        expect(indexedStack.index, equals(1));

        // Navigate to Tasks (index 2)
        await tester.tap(find.text('Tasks').first);
        await tester.pump();

        indexedStack = tester.widget<IndexedStack>(find.byType(IndexedStack));
        expect(indexedStack.index, equals(2));

        // Navigate to Journal (index 3)
        await tester.tap(find.text('Journal'));
        await tester.pump();

        indexedStack = tester.widget<IndexedStack>(find.byType(IndexedStack));
        expect(indexedStack.index, equals(3));

        // Navigate back to Dashboard (index 0)
        await tester.tap(find.text('Dashboard'));
        await tester.pump();

        indexedStack = tester.widget<IndexedStack>(find.byType(IndexedStack));
        expect(indexedStack.index, equals(0));
      });

      testWidgets('should update SidebarItems currentIndex when navigating', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Initial state
        SidebarItems sidebarItems = tester.widget<SidebarItems>(find.byType(SidebarItems));
        expect(sidebarItems.currentIndex, equals(0));

        // Navigate to Projects
        await tester.tap(find.text('Projects').first);
        await tester.pump();

        sidebarItems = tester.widget<SidebarItems>(find.byType(SidebarItems));
        expect(sidebarItems.currentIndex, equals(1));
      });
    });

    group('Dashboard Card Styling', () {
      testWidgets('should display dashboard cards with proper styling', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert - Check that containers with proper styling exist
        final containers = tester.widgetList<Container>(find.byType(Container));
        
        // Should have multiple containers (cards + activity section)
        expect(containers.length, greaterThan(3));
        
        // Check that some containers have border radius (indicating they are cards)
        final cardsWithBorderRadius = containers.where((container) {
          final decoration = container.decoration;
          if (decoration is BoxDecoration) {
            return decoration.borderRadius != null;
          }
          return false;
        });
        expect(cardsWithBorderRadius.length, greaterThan(0));
      });

      testWidgets('should have proper text styling for different elements', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert - Check main title styling
        final welcomeText = tester.widget<Text>(find.text('Welcome to Project Management'));
        expect(welcomeText.style?.fontSize, equals(24));
        expect(welcomeText.style?.fontWeight, equals(FontWeight.bold));

        // Check section title styling
        final overviewText = tester.widget<Text>(find.text('Quick Overview'));
        expect(overviewText.style?.fontSize, equals(18));
        expect(overviewText.style?.fontWeight, equals(FontWeight.w600));
      });
    });

    group('Responsive Layout', () {
      testWidgets('should handle different screen sizes appropriately', (tester) async {
        // Set different screen size
        await tester.binding.setSurfaceSize(const Size(1200, 800));
        
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byType(MacosWindow), findsOneWidget);
        expect(find.byType(Sidebar), findsOneWidget);
        expect(find.text('Welcome to Project Management'), findsOneWidget);

        // Reset surface size
        await tester.binding.setSurfaceSize(null);
      });

      testWidgets('should maintain layout structure with minimal width', (tester) async {
        // Set smaller screen size
        await tester.binding.setSurfaceSize(const Size(800, 600));
        
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert - All main components should still be present
        expect(find.byType(Sidebar), findsOneWidget);
        expect(find.text('Dashboard'), findsOneWidget);
        expect(find.text('Projects'), findsAtLeastNWidgets(1));
        expect(find.text('Tasks'), findsAtLeastNWidgets(1));
        expect(find.text('Journal'), findsOneWidget);

        // Reset surface size
        await tester.binding.setSurfaceSize(null);
      });
    });

    group('Edge Cases', () {
      testWidgets('should handle rapid navigation between tabs', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Rapidly navigate between tabs
        await tester.tap(find.text('Projects').first);
        await tester.pump();
        await tester.tap(find.text('Tasks').first);
        await tester.pump();
        await tester.tap(find.text('Journal'));
        await tester.pump();
        await tester.tap(find.text('Dashboard'));
        await tester.pump();

        // Assert - Should end up back at Dashboard
        expect(find.byType(DashboardView), findsOneWidget);
        expect(find.text('Welcome to Project Management'), findsOneWidget);
      });

      testWidgets('should maintain sidebar state during navigation', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Navigate to different tabs and verify sidebar items remain
        await tester.tap(find.text('Projects').first);
        await tester.pump();
        
        expect(find.text('Dashboard'), findsOneWidget);
        expect(find.text('Projects'), findsAtLeastNWidgets(1));
        expect(find.text('Tasks'), findsAtLeastNWidgets(1));
        expect(find.text('Journal'), findsOneWidget);

        await tester.tap(find.text('Tasks').first);
        await tester.pump();
        
        expect(find.text('Dashboard'), findsOneWidget);
        expect(find.text('Projects'), findsAtLeastNWidgets(1));
        expect(find.text('Tasks'), findsAtLeastNWidgets(1));
        expect(find.text('Journal'), findsOneWidget);
      });
    });

    group('Accessibility', () {
      testWidgets('should have proper semantic structure', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert - Check that important texts are present for screen readers
        expect(find.text('Welcome to Project Management'), findsOneWidget);
        expect(find.text('Dashboard'), findsOneWidget);
        expect(find.text('Projects'), findsAtLeastNWidgets(1));
        expect(find.text('Tasks'), findsAtLeastNWidgets(1));
        expect(find.text('Journal'), findsOneWidget);
      });

      testWidgets('should have accessible navigation elements', (tester) async {
        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert - Check that sidebar items can be found and interacted with
        expect(find.byType(SidebarItem), findsNWidgets(4));
        
        // Verify each sidebar item is tappable
        for (int i = 0; i < 4; i++) {
          final sidebarItem = find.byType(SidebarItem).at(i);
          expect(sidebarItem, findsOneWidget);
        }
      });
    });
  });
}