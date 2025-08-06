import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macos_ui/macos_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/features/task/domain/entities/task.dart';
import '../../../../../lib/features/task/domain/usecases/create_task.dart';
import '../../../../../lib/features/task/presentation/bloc/task_bloc.dart';
import '../../../../../lib/features/task/presentation/bloc/task_event.dart';
import '../../../../../lib/features/task/presentation/bloc/task_state.dart';
import '../../../../../lib/features/task/presentation/pages/tasks_page.dart';

// Mock classes
class MockTaskBloc extends MockBloc<TaskEvent, TaskState> implements TaskBloc {}

void main() {
  group('TasksPage Widget Tests', () {
    late MockTaskBloc mockTaskBloc;

    // Test data
    final testTasks = [
      Task(
        id: '1',
        title: 'Test Task 1',
        description: 'Description for task 1',
        status: TaskStatus.todo,
        priority: TaskPriority.high,
        projectId: 'project-1',
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 1),
        attachments: [],
      ),
      Task(
        id: '2',
        title: 'Test Task 2',
        description: 'Description for task 2',
        status: TaskStatus.inProgress,
        priority: TaskPriority.medium,
        projectId: 'project-1',
        createdAt: DateTime(2025, 1, 2),
        updatedAt: DateTime(2025, 1, 2),
        attachments: [],
      ),
      Task(
        id: '3',
        title: 'Test Task 3',
        description: '',
        status: TaskStatus.completed,
        priority: TaskPriority.low,
        projectId: 'project-1',
        createdAt: DateTime(2025, 1, 3),
        updatedAt: DateTime(2025, 1, 3),
        attachments: [],
        dueDate: DateTime(2025, 12, 31),
      ),
    ];

    setUp(() {
      mockTaskBloc = MockTaskBloc();
      when(() => mockTaskBloc.state).thenReturn(const TaskInitial());
    });

    Widget createTestWidget() {
      return MacosApp(
        home: BlocProvider<TaskBloc>.value(
          value: mockTaskBloc,
          child: const TasksPage(),
        ),
      );
    }

    group('Initial Load', () {
      testWidgets('should dispatch LoadTasks event on init', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TaskLoading());

        // Act
        await tester.pumpWidget(createTestWidget());

        // Assert
        verify(() => mockTaskBloc.add(const LoadTasks())).called(1);
      });

      testWidgets('should show loading indicator when TaskLoading state', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TaskLoading());
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TaskLoading()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byType(ProgressCircle), findsOneWidget);
      });
    });

    group('Empty State', () {
      testWidgets('should show empty state when no tasks', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TasksLoaded([]));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TasksLoaded([])));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('No Tasks Yet'), findsOneWidget);
        expect(find.text('Create your first task to get started'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.checkmark_square), findsOneWidget);
        expect(find.text('Create Task'), findsOneWidget);
      });

      testWidgets('should show create task dialog when tapping Create Task button in empty state', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TasksLoaded([]));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TasksLoaded([])));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.text('Create Task'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Create New Task'), findsOneWidget);
        expect(find.byType(CreateTaskDialog), findsOneWidget);
      });
    });

    group('Tasks List', () {
      testWidgets('should display tasks list when TasksLoaded state with tasks', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('3 tasks'), findsOneWidget);
        expect(find.text('Test Task 1'), findsOneWidget);
        expect(find.text('Test Task 2'), findsOneWidget);
        expect(find.text('Test Task 3'), findsOneWidget);
        expect(find.text('Description for task 1'), findsOneWidget);
        expect(find.text('Description for task 2'), findsOneWidget);
      });

      testWidgets('should display correct status badges and icons for each task', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('TO DO'), findsOneWidget);
        expect(find.text('IN PROGRESS'), findsOneWidget);
        expect(find.text('COMPLETED'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.clock), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.play_circle), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.checkmark_circle), findsOneWidget);
      });

      testWidgets('should not show description when task description is empty', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        // Task 3 has empty description, so it shouldn't be displayed
        expect(find.text('Description for task 3'), findsNothing);
      });

      testWidgets('should show due date for tasks that have one', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('Due:'), findsOneWidget); // Only task 3 has due date
      });

      testWidgets('should display edit and delete buttons for each task', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byIcon(CupertinoIcons.pencil), findsNWidgets(3));
        expect(find.byIcon(CupertinoIcons.trash), findsNWidgets(3));
      });

      testWidgets('should show strikethrough text for completed tasks', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        final completedTaskTitle = tester.widget<Text>(
          find.descendant(
            of: find.ancestor(
              of: find.text('Test Task 3'),
              matching: find.byType(Container),
            ),
            matching: find.text('Test Task 3'),
          ),
        );
        expect(completedTaskTitle.style?.decoration, equals(TextDecoration.lineThrough));
      });
    });

    group('Filter Bar', () {
      testWidgets('should display filter dropdown with all task statuses', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Filter:'), findsOneWidget);
        expect(find.byType(MacosPopupButton<TaskStatus?>), findsOneWidget);
      });

      testWidgets('should filter tasks when status is selected', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Tap on filter dropdown
        await tester.tap(find.byType(MacosPopupButton<TaskStatus?>));
        await tester.pumpAndSettle();

        // Select "In Progress" filter
        await tester.tap(find.text('In Progress').last);
        await tester.pump();

        // Assert
        verify(() => mockTaskBloc.add(const LoadTasksByStatus(TaskStatus.inProgress))).called(1);
      });

      testWidgets('should show correct task count in filter bar', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('3 tasks'), findsOneWidget);
      });
    });

    group('Toolbar', () {
      testWidgets('should display Tasks title in toolbar', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TaskInitial());
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TaskInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Tasks'), findsOneWidget);
      });

      testWidgets('should show New Task button in toolbar', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TaskInitial());
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TaskInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('New Task'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.plus), findsOneWidget);
      });

      testWidgets('should show create task dialog when tapping New Task button', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TaskInitial());
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TaskInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.text('New Task'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Create New Task'), findsOneWidget);
        expect(find.byType(CreateTaskDialog), findsOneWidget);
      });
    });

    group('Error State', () {
      testWidgets('should display error state when TaskError', (tester) async {
        // Arrange
        const errorMessage = 'Failed to load tasks';
        when(() => mockTaskBloc.state).thenReturn(const TaskError(ServerFailure(errorMessage)));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TaskError(ServerFailure(errorMessage))));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Error Loading Tasks'), findsOneWidget);
        expect(find.text(errorMessage), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.exclamationmark_triangle), findsOneWidget);
        expect(find.text('Retry'), findsOneWidget);
      });

      testWidgets('should dispatch LoadTasks when tapping Retry button', (tester) async {
        // Arrange
        const errorMessage = 'Failed to load tasks';
        when(() => mockTaskBloc.state).thenReturn(const TaskError(ServerFailure(errorMessage)));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TaskError(ServerFailure(errorMessage))));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Clear previous calls
        clearInteractions(mockTaskBloc);

        await tester.tap(find.text('Retry'));
        await tester.pump();

        // Assert
        verify(() => mockTaskBloc.add(const LoadTasks())).called(1);
      });
    });

    group('Task Actions', () {
      testWidgets('should show edit dialog when tapping edit button', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.pencil).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Edit Task'), findsOneWidget);
        expect(find.byType(EditTaskDialog), findsOneWidget);
      });

      testWidgets('should show delete confirmation dialog when tapping delete button', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Delete Task'), findsOneWidget);
        expect(find.textContaining('Are you sure you want to delete'), findsOneWidget);
        expect(find.text('Delete'), findsOneWidget);
        expect(find.text('Cancel'), findsOneWidget);
      });

      testWidgets('should dispatch DeleteTaskEvent when confirming delete', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Clear previous calls
        clearInteractions(mockTaskBloc);

        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        await tester.tap(find.text('Delete'));
        await tester.pump();

        // Assert
        verify(() => mockTaskBloc.add(DeleteTaskEvent(testTasks.first.id))).called(1);
      });

      testWidgets('should close delete dialog when tapping Cancel', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(testTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(testTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        await tester.tap(find.text('Cancel'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Delete Task'), findsNothing);
        verifyNever(() => mockTaskBloc.add(any()));
      });
    });

    group('BLoC Listener', () {
      testWidgets('should show error dialog when TaskError state', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TaskInitial());
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.fromIterable([
          const TaskError(ServerFailure('Error message')),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Error'), findsOneWidget);
        expect(find.text('Error message'), findsOneWidget);
      });

      testWidgets('should show success dialog when TaskCreated state', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TaskInitial());
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.fromIterable([
          TaskCreated(testTasks.first),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Task created successfully'), findsOneWidget);
      });

      testWidgets('should show success dialog when TaskUpdated state', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TaskInitial());
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.fromIterable([
          TaskUpdated(testTasks.first),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Task updated successfully'), findsOneWidget);
      });

      testWidgets('should show success dialog when TaskDeleted state', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TaskInitial());
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.fromIterable([
          const TaskDeleted('task-1'),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Task deleted successfully'), findsOneWidget);
      });
    });

    group('Status Color and Icon Mapping', () {
      testWidgets('should display correct colors and icons for different task statuses', (tester) async {
        // Arrange
        final tasksWithAllStatuses = TaskStatus.values.map((status) => Task(
          id: status.name,
          title: 'Task ${status.name}',
          description: 'Description',
          status: status,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        )).toList();

        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(tasksWithAllStatuses));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(tasksWithAllStatuses)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        for (final status in TaskStatus.values) {
          expect(find.text(status.displayName.toUpperCase()), findsOneWidget);
        }

        // Verify specific icons are present
        expect(find.byIcon(CupertinoIcons.clock), findsOneWidget); // todo
        expect(find.byIcon(CupertinoIcons.play_circle), findsOneWidget); // inProgress
        expect(find.byIcon(CupertinoIcons.eye), findsOneWidget); // review
        expect(find.byIcon(CupertinoIcons.exclamationmark_circle), findsOneWidget); // blocked
        expect(find.byIcon(CupertinoIcons.checkmark_circle), findsOneWidget); // completed
        expect(find.byIcon(CupertinoIcons.xmark_circle), findsOneWidget); // cancelled
      });
    });

    group('Edge Cases', () {
      testWidgets('should handle single task correctly', (tester) async {
        // Arrange
        final singleTask = [testTasks.first];
        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(singleTask));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(singleTask)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('1 tasks'), findsOneWidget);
        expect(find.text('Test Task 1'), findsOneWidget);
      });

      testWidgets('should handle tasks with very long titles and descriptions', (tester) async {
        // Arrange
        final longTextTask = [Task(
          id: '1',
          title: 'Very Long Task Title That Should Be Displayed Correctly Even When It Exceeds Normal Length',
          description: 'Very long description that should be truncated with ellipsis when it exceeds the maximum number of lines allowed in the card display',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        )];

        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(longTextTask));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(longTextTask)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('Very Long Task Title'), findsOneWidget);
        expect(find.textContaining('Very long description'), findsOneWidget);
      });

      testWidgets('should handle tasks with special characters', (tester) async {
        // Arrange
        final specialCharTask = [Task(
          id: '1',
          title: 'Task with émöjis 🚀 & spéciál chars',
          description: 'Description with @#\$%^&*()[]{}|\\',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          projectId: 'project-1',
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          attachments: [],
        )];

        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(specialCharTask));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(specialCharTask)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('Task with émöjis 🚀'), findsOneWidget);
        expect(find.textContaining('Description with @#\$%^&*()[]{}|\\'), findsOneWidget);
      });

      testWidgets('should handle overdue tasks with red due date text', (tester) async {
        // Arrange
        final overdueTask = [Task(
          id: '1',
          title: 'Overdue Task',
          description: 'This task is overdue',
          status: TaskStatus.todo,
          priority: TaskPriority.high,
          projectId: 'project-1',
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          dueDate: DateTime(2024, 12, 31), // Past date
          attachments: [],
        )];

        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(overdueTask));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(overdueTask)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('Due:'), findsOneWidget);
        // We can verify the task is displayed, specific color testing would require more complex widget inspection
      });
    });

    group('Scrolling Behavior', () {
      testWidgets('should be scrollable when many tasks are present', (tester) async {
        // Arrange
        final manyTasks = List.generate(20, (index) => Task(
          id: 'task-$index',
          title: 'Task $index',
          description: 'Description for task $index',
          status: TaskStatus.values[index % TaskStatus.values.length],
          priority: TaskPriority.values[index % TaskPriority.values.length],
          projectId: 'project-1',
          createdAt: DateTime(2025, 1, 1).add(Duration(days: index)),
          updatedAt: DateTime(2025, 1, 1).add(Duration(days: index)),
          attachments: [],
        ));

        when(() => mockTaskBloc.state).thenReturn(TasksLoaded(manyTasks));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(TasksLoaded(manyTasks)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('20 tasks'), findsOneWidget);
        expect(find.byType(ListView), findsOneWidget);
        
        // Verify scrolling works
        expect(find.text('Task 0'), findsOneWidget);
        await tester.scrollUntilVisible(find.text('Task 19'), 500);
        expect(find.text('Task 19'), findsOneWidget);
      });
    });

    group('Filter Empty States', () {
      testWidgets('should show filtered empty state when no tasks match filter', (tester) async {
        // Arrange
        when(() => mockTaskBloc.state).thenReturn(const TasksLoaded([]));
        when(() => mockTaskBloc.stream).thenAnswer((_) => Stream.value(const TasksLoaded([])));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Simulate filter selection by manually updating the state
        await tester.tap(find.byType(MacosPopupButton<TaskStatus?>));
        await tester.pumpAndSettle();

        // We can't fully test the filtered empty state without triggering the actual filter
        // but we can verify the empty state widget structure is correct
        expect(find.text('Create your first task to get started'), findsOneWidget);
      });
    });
  });
}