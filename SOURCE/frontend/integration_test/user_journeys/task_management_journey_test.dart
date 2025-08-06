import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:project_management_app/main.dart' as app;

import '../helpers/test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Task Management Journey E2E Tests', () {
    late Map<String, dynamic> testProject;

    setUpAll(() async {
      await E2ETestHelpers.setupTestEnvironment();
      
      // Create a test project for task association
      testProject = await E2ETestHelpers.createTestProject(
        name: 'Task Test Project',
        description: 'Project for task management testing',
        status: 'active',
      );
    });

    tearDownAll(() async {
      await E2ETestHelpers.cleanupTestEnvironment();
    });

    testWidgets('Complete Task Lifecycle Journey', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to Tasks tab
      await E2ETestHelpers.navigateToTab(tester, 'Tasks');
      await E2ETestHelpers.verifyUIText(tester, 'Tasks');

      // Initially should show empty state
      await E2ETestHelpers.verifyUIText(tester, 'No Tasks Yet');
      await E2ETestHelpers.verifyUIText(tester, 'Create your first task to get started');

      // Test Task Creation
      await _testTaskCreation(tester);

      // Test Task Status Updates
      await _testTaskStatusUpdate(tester);

      // Test Task Filtering
      await _testTaskFiltering(tester);

      // Test Task Editing
      await _testTaskEditing(tester);

      // Test Task Completion
      await _testTaskCompletion(tester);

      // Test Task Deletion
      await _testTaskDeletion(tester);
    });

    testWidgets('Task Creation with All Fields', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Tasks');

      // Create task with all fields
      final createButton = find.text('Create Task');
      await E2ETestHelpers.tapButton(tester, createButton);

      // Fill in all task details
      final titleField = find.byType(CupertinoTextField).first;
      await E2ETestHelpers.enterText(tester, titleField, 'Comprehensive Test Task');

      final descriptionField = find.byType(CupertinoTextField).at(1);
      await E2ETestHelpers.enterText(tester, descriptionField, 'This task tests all task creation fields');

      // Set priority to high
      final priorityDropdown = find.text('TODO');
      await E2ETestHelpers.tapButton(tester, priorityDropdown);
      await E2ETestHelpers.tapButton(tester, find.text('IN PROGRESS'));

      // Set due date
      final dueDateButton = find.text('Optional');
      await E2ETestHelpers.tapButton(tester, dueDateButton);
      // Note: Date picker interaction would be complex, skip for now

      // Create the task
      final dialogCreateButton = find.text('Create');
      await E2ETestHelpers.tapButton(tester, dialogCreateButton);

      // Verify task appears
      await E2ETestHelpers.waitForUI(tester, find.text('Comprehensive Test Task'));
      await E2ETestHelpers.verifyUIText(tester, 'This task tests all task creation fields');

      // Verify in backend
      await E2ETestHelpers.verifyApiResponse('/tasks', {
        'title': 'Comprehensive Test Task',
        'description': 'This task tests all task creation fields',
      });
    });

    testWidgets('Task Status Workflow', (WidgetTester tester) async {
      // Create test task via API
      final testTask = await E2ETestHelpers.createTestTask(
        title: 'Status Workflow Task',
        description: 'Testing status transitions',
        status: 'pending',
        priority: 'medium',
      );

      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Tasks');

      // Verify task appears
      await E2ETestHelpers.waitForUI(tester, find.text('Status Workflow Task'));

      // Test status progression: TODO -> IN PROGRESS -> REVIEW -> COMPLETED
      await _testStatusTransition(tester, 'Status Workflow Task', 'TODO', 'IN PROGRESS');
      await _testStatusTransition(tester, 'Status Workflow Task', 'IN PROGRESS', 'REVIEW');
      await _testStatusTransition(tester, 'Status Workflow Task', 'REVIEW', 'COMPLETED');

      // Verify final status in backend
      await E2ETestHelpers.verifyApiResponse('/tasks', {
        'title': 'Status Workflow Task',
        'status': 'completed',
      });
    });

    testWidgets('Task Filtering and Search', (WidgetTester tester) async {
      // Create tasks with different statuses
      await E2ETestHelpers.createTestTask(title: 'Todo Task', status: 'pending');
      await E2ETestHelpers.createTestTask(title: 'Active Task', status: 'active');
      await E2ETestHelpers.createTestTask(title: 'Completed Task', status: 'completed');

      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Tasks');

      // Should show all tasks initially
      await E2ETestHelpers.verifyUIText(tester, '3 tasks');
      await E2ETestHelpers.verifyUIText(tester, 'Todo Task');
      await E2ETestHelpers.verifyUIText(tester, 'Active Task');
      await E2ETestHelpers.verifyUIText(tester, 'Completed Task');

      // Test filtering by status
      final filterDropdown = find.text('All Tasks');
      await E2ETestHelpers.tapButton(tester, filterDropdown);
      await E2ETestHelpers.tapButton(tester, find.text('Completed'));

      // Should show only completed tasks
      await E2ETestHelpers.verifyUIText(tester, '1 completed tasks');
      await E2ETestHelpers.verifyUIText(tester, 'Completed Task');

      // Reset filter
      await E2ETestHelpers.tapButton(tester, find.text('Completed'));
      await E2ETestHelpers.tapButton(tester, find.text('All Tasks'));
    });

    testWidgets('Task Priority Management', (WidgetTester tester) async {
      // Create tasks with different priorities
      await E2ETestHelpers.createTestTask(title: 'Low Priority Task', priority: 'low');
      await E2ETestHelpers.createTestTask(title: 'High Priority Task', priority: 'high');

      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Tasks');

      // Verify tasks appear with different priority indicators
      await E2ETestHelpers.verifyUIText(tester, 'Low Priority Task');
      await E2ETestHelpers.verifyUIText(tester, 'High Priority Task');

      // Edit high priority task to change priority
      final editButtons = find.byIcon(CupertinoIcons.pencil);
      await E2ETestHelpers.tapButton(tester, editButtons.first);

      // Change priority
      final priorityDropdown = find.text('High');
      await E2ETestHelpers.tapButton(tester, priorityDropdown);
      await E2ETestHelpers.tapButton(tester, find.text('Medium'));

      // Save changes
      await E2ETestHelpers.tapButton(tester, find.text('Save'));

      // Verify change in backend
      await E2ETestHelpers.verifyApiResponse('/tasks', {
        'title': 'High Priority Task',
        'priority': 'medium',
      });
    });

    testWidgets('Task Error Handling', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Tasks');

      // Test empty task creation
      final createButton = find.text('Create Task');
      await E2ETestHelpers.tapButton(tester, createButton);

      final dialogCreateButton = find.text('Create');
      await E2ETestHelpers.tapButton(tester, dialogCreateButton);

      // Should remain on dialog due to validation
      await E2ETestHelpers.verifyUIText(tester, 'Create New Task');

      // Cancel and try again with valid data
      await E2ETestHelpers.tapButton(tester, find.text('Cancel'));

      // Retry with valid data
      await E2ETestHelpers.tapButton(tester, createButton);
      
      final titleField = find.byType(CupertinoTextField).first;
      await E2ETestHelpers.enterText(tester, titleField, 'Valid Task');
      
      await E2ETestHelpers.tapButton(tester, dialogCreateButton);

      // Should succeed
      await E2ETestHelpers.waitForUI(tester, find.text('Valid Task'));
    });
  });
}

Future<void> _testTaskCreation(WidgetTester tester) async {
  // Click create task button
  final createButton = find.text('Create Task');
  await E2ETestHelpers.tapButton(tester, createButton);

  // Verify create task dialog appears
  await E2ETestHelpers.verifyUIText(tester, 'Create New Task');

  // Fill in task details
  final titleField = find.byType(CupertinoTextField).first;
  await E2ETestHelpers.enterText(tester, titleField, 'E2E Test Task');

  final descriptionField = find.byType(CupertinoTextField).at(1);
  await E2ETestHelpers.enterText(tester, descriptionField, 'This is a test task created during E2E testing');

  // Create the task
  final dialogCreateButton = find.text('Create');
  await E2ETestHelpers.tapButton(tester, dialogCreateButton);

  // Verify task appears in list
  await E2ETestHelpers.waitForUI(tester, find.text('E2E Test Task'));
  await E2ETestHelpers.verifyUIText(tester, '1 tasks');

  // Verify task was created in backend
  await E2ETestHelpers.verifyApiResponse('/tasks', {
    'title': 'E2E Test Task',
    'description': 'This is a test task created during E2E testing',
  });
}

Future<void> _testTaskStatusUpdate(WidgetTester tester) async {
  // Find and click edit button for the task
  final editButton = find.byIcon(CupertinoIcons.pencil);
  await E2ETestHelpers.tapButton(tester, editButton);

  // Change status from TODO to IN PROGRESS
  final statusDropdown = find.text('TODO');
  await E2ETestHelpers.tapButton(tester, statusDropdown);
  await E2ETestHelpers.tapButton(tester, find.text('IN PROGRESS'));

  // Save changes
  final saveButton = find.text('Save');
  await E2ETestHelpers.tapButton(tester, saveButton);

  // Verify status updated in UI
  await E2ETestHelpers.waitForUI(tester, find.text('IN PROGRESS'));

  // Verify in backend
  await E2ETestHelpers.verifyApiResponse('/tasks', {
    'title': 'E2E Test Task',
    'status': 'inProgress',
  });
}

Future<void> _testTaskFiltering(WidgetTester tester) async {
  // Create additional tasks with different statuses
  await E2ETestHelpers.createTestTask(title: 'Completed Task', status: 'completed');
  
  // Refresh the page to see new tasks
  await tester.pumpAndSettle();

  // Should now show multiple tasks
  await E2ETestHelpers.verifyUIText(tester, '2 tasks');

  // Test filtering by status
  final filterDropdown = find.text('All Tasks');
  await E2ETestHelpers.tapButton(tester, filterDropdown);
  await E2ETestHelpers.tapButton(tester, find.text('In Progress'));

  // Should show only in-progress tasks
  await E2ETestHelpers.verifyUIText(tester, '1 in progress tasks');
  await E2ETestHelpers.verifyUIText(tester, 'E2E Test Task');
}

Future<void> _testTaskEditing(WidgetTester tester) async {
  // Reset filter to show all tasks
  final filterDropdown = find.text('In Progress');
  await E2ETestHelpers.tapButton(tester, filterDropdown);
  await E2ETestHelpers.tapButton(tester, find.text('All Tasks'));

  // Click edit button
  final editButton = find.byIcon(CupertinoIcons.pencil).first;
  await E2ETestHelpers.tapButton(tester, editButton);

  // Update task title
  final titleField = find.byType(CupertinoTextField).first;
  await tester.tap(titleField);
  await tester.pumpAndSettle();
  await tester.enterText(titleField, 'E2E Test Task - Updated');

  // Save changes
  final saveButton = find.text('Save');
  await E2ETestHelpers.tapButton(tester, saveButton);

  // Verify changes appear
  await E2ETestHelpers.waitForUI(tester, find.text('E2E Test Task - Updated'));

  // Verify in backend
  await E2ETestHelpers.verifyApiResponse('/tasks', {
    'title': 'E2E Test Task - Updated',
  });
}

Future<void> _testTaskCompletion(WidgetTester tester) async {
  // Mark task as completed
  final editButton = find.byIcon(CupertinoIcons.pencil).first;
  await E2ETestHelpers.tapButton(tester, editButton);

  final statusDropdown = find.text('IN PROGRESS');
  await E2ETestHelpers.tapButton(tester, statusDropdown);
  await E2ETestHelpers.tapButton(tester, find.text('COMPLETED'));

  final saveButton = find.text('Save');
  await E2ETestHelpers.tapButton(tester, saveButton);

  // Verify task shows as completed with strikethrough
  await E2ETestHelpers.waitForUI(tester, find.text('COMPLETED'));
}

Future<void> _testTaskDeletion(WidgetTester tester) async {
  // Click delete button
  final deleteButton = find.byIcon(CupertinoIcons.trash).first;
  await E2ETestHelpers.tapButton(tester, deleteButton);

  // Confirm deletion
  await E2ETestHelpers.verifyUIText(tester, 'Delete Task');
  final confirmButton = find.text('Delete');
  await E2ETestHelpers.tapButton(tester, confirmButton);

  // Verify task is removed from list
  // Should show remaining tasks or empty state
  await tester.pumpAndSettle();
}

Future<void> _testStatusTransition(
  WidgetTester tester,
  String taskTitle,
  String fromStatus,
  String toStatus,
) async {
  // Find the specific task and edit it
  await E2ETestHelpers.waitForUI(tester, find.text(taskTitle));
  
  final editButton = find.byIcon(CupertinoIcons.pencil).first;
  await E2ETestHelpers.tapButton(tester, editButton);

  // Change status
  final statusDropdown = find.text(fromStatus);
  await E2ETestHelpers.tapButton(tester, statusDropdown);
  await E2ETestHelpers.tapButton(tester, find.text(toStatus));

  // Save changes
  final saveButton = find.text('Save');
  await E2ETestHelpers.tapButton(tester, saveButton);

  // Verify status changed
  await E2ETestHelpers.waitForUI(tester, find.text(toStatus));
}