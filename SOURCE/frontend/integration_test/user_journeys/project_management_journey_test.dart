import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:project_management_app/main.dart' as app;

import '../helpers/test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Project Management Journey E2E Tests', () {
    setUpAll(() async {
      await E2ETestHelpers.setupTestEnvironment();
    });

    tearDownAll(() async {
      await E2ETestHelpers.cleanupTestEnvironment();
    });

    testWidgets('Complete Project Lifecycle Journey', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle();

      // Verify app launches and shows dashboard
      await E2ETestHelpers.verifyUIText(tester, 'Project Management');
      await E2ETestHelpers.verifyUIText(tester, 'Welcome to Project Management');

      // Navigate to Projects tab
      await E2ETestHelpers.navigateToTab(tester, 'Projects');
      await E2ETestHelpers.verifyUIText(tester, 'Projects');

      // Initially should show empty state
      await E2ETestHelpers.verifyUIText(tester, 'No Projects Yet');
      await E2ETestHelpers.verifyUIText(tester, 'Create your first project to get started');

      // Test Project Creation
      await _testProjectCreation(tester);

      // Test Project Viewing
      await _testProjectViewing(tester);

      // Test Project Status Update
      await _testProjectStatusUpdate(tester);

      // Test Project Editing
      await _testProjectEditing(tester);

      // Test Project Deletion
      await _testProjectDeletion(tester);
    });

    testWidgets('Project Creation with Validation', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Projects');

      // Test empty form validation
      final createButton = find.text('Create Project');
      await E2ETestHelpers.tapButton(tester, createButton);

      final dialogCreateButton = find.text('Create');
      await E2ETestHelpers.tapButton(tester, dialogCreateButton);

      // Should remain on dialog due to validation
      await E2ETestHelpers.verifyUIText(tester, 'Create New Project');

      // Fill in required fields
      final nameField = find.byType(CupertinoTextField).first;
      await E2ETestHelpers.enterText(tester, nameField, 'Test Project With Validation');

      // Now creation should succeed
      await E2ETestHelpers.tapButton(tester, dialogCreateButton);

      // Should return to projects list
      await E2ETestHelpers.waitForUI(tester, find.text('Test Project With Validation'));
      await E2ETestHelpers.verifyUIText(tester, '1 Projects');

      // Verify project was created in backend
      await E2ETestHelpers.verifyApiResponse('/projects', {
        'name': 'Test Project With Validation',
      });
    });

    testWidgets('Project Status Workflow', (WidgetTester tester) async {
      // Create test project via API
      final testProject = await E2ETestHelpers.createTestProject(
        name: 'Status Workflow Test Project',
        status: 'planning',
      );

      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Projects');

      // Find and edit the test project
      await E2ETestHelpers.waitForUI(tester, find.text('Status Workflow Test Project'));
      
      final editButton = find.byIcon(CupertinoIcons.pencil);
      await E2ETestHelpers.tapButton(tester, editButton);

      // Change status from planning to active
      final statusDropdown = find.text('PLANNING');
      await E2ETestHelpers.tapButton(tester, statusDropdown);
      await E2ETestHelpers.tapButton(tester, find.text('ACTIVE'));

      // Save changes
      final saveButton = find.text('Save');
      await E2ETestHelpers.tapButton(tester, saveButton);

      // Verify status changed in UI
      await E2ETestHelpers.waitForUI(tester, find.text('ACTIVE'));

      // Verify status changed in backend
      await E2ETestHelpers.verifyApiResponse('/projects', {
        'name': 'Status Workflow Test Project',
        'status': 'active',
      });
    });

    testWidgets('Multiple Projects Management', (WidgetTester tester) async {
      // Create multiple test projects
      await E2ETestHelpers.createTestProject(name: 'Project Alpha', status: 'planning');
      await E2ETestHelpers.createTestProject(name: 'Project Beta', status: 'active');
      await E2ETestHelpers.createTestProject(name: 'Project Gamma', status: 'completed');

      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Projects');

      // Should show all projects
      await E2ETestHelpers.verifyUIText(tester, '3 Projects');
      await E2ETestHelpers.verifyUIText(tester, 'Project Alpha');
      await E2ETestHelpers.verifyUIText(tester, 'Project Beta');
      await E2ETestHelpers.verifyUIText(tester, 'Project Gamma');

      // Verify different status indicators are shown
      await E2ETestHelpers.verifyUIText(tester, 'PLANNING');
      await E2ETestHelpers.verifyUIText(tester, 'ACTIVE');
      await E2ETestHelpers.verifyUIText(tester, 'COMPLETED');
    });

    testWidgets('Project Error Handling', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test behavior when server is unavailable
      // Note: This would require a way to temporarily disable the server
      // For now, we'll test UI error states

      await E2ETestHelpers.navigateToTab(tester, 'Projects');

      // If no projects load, should show appropriate message
      // The exact behavior depends on whether server is running
      final retryButton = find.text('Retry');
      if (retryButton.evaluate().isNotEmpty) {
        await E2ETestHelpers.tapButton(tester, retryButton);
      }
    });
  });
}

Future<void> _testProjectCreation(WidgetTester tester) async {
  // Click create project button
  final createButton = find.text('Create Project');
  await E2ETestHelpers.tapButton(tester, createButton);

  // Verify create project dialog appears
  await E2ETestHelpers.verifyUIText(tester, 'Create New Project');

  // Fill in project details
  final nameField = find.byType(CupertinoTextField).first;
  await E2ETestHelpers.enterText(tester, nameField, 'E2E Test Project');

  final descriptionField = find.byType(CupertinoTextField).at(1);
  await E2ETestHelpers.enterText(tester, descriptionField, 'This is a test project created during E2E testing');

  // Select status
  final statusDropdown = find.text('PLANNING');
  await E2ETestHelpers.tapButton(tester, statusDropdown);
  await E2ETestHelpers.tapButton(tester, find.text('ACTIVE'));

  // Create the project
  final dialogCreateButton = find.text('Create');
  await E2ETestHelpers.tapButton(tester, dialogCreateButton);

  // Verify project appears in list
  await E2ETestHelpers.waitForUI(tester, find.text('E2E Test Project'));
  await E2ETestHelpers.verifyUIText(tester, '1 Projects');

  // Verify project was created in backend
  await E2ETestHelpers.verifyApiResponse('/projects', {
    'name': 'E2E Test Project',
    'description': 'This is a test project created during E2E testing',
  });
}

Future<void> _testProjectViewing(WidgetTester tester) async {
  // Project should be visible in the list
  await E2ETestHelpers.verifyUIText(tester, 'E2E Test Project');
  await E2ETestHelpers.verifyUIText(tester, 'This is a test project created during E2E testing');
  
  // Should show status badge
  await E2ETestHelpers.verifyUIText(tester, 'ACTIVE');
  
  // Should show creation date
  await E2ETestHelpers.verifyUIText(tester, 'Created');
}

Future<void> _testProjectStatusUpdate(WidgetTester tester) async {
  // Find and click edit button
  final editButton = find.byIcon(CupertinoIcons.pencil);
  await E2ETestHelpers.tapButton(tester, editButton);

  // Change status to completed
  final statusDropdown = find.text('ACTIVE');
  await E2ETestHelpers.tapButton(tester, statusDropdown);
  await E2ETestHelpers.tapButton(tester, find.text('COMPLETED'));

  // Save changes
  final saveButton = find.text('Save');
  await E2ETestHelpers.tapButton(tester, saveButton);

  // Verify status updated
  await E2ETestHelpers.waitForUI(tester, find.text('COMPLETED'));

  // Verify in backend
  await E2ETestHelpers.verifyApiResponse('/projects', {
    'name': 'E2E Test Project',
    'status': 'completed',
  });
}

Future<void> _testProjectEditing(WidgetTester tester) async {
  // Click edit button
  final editButton = find.byIcon(CupertinoIcons.pencil);
  await E2ETestHelpers.tapButton(tester, editButton);

  // Update project name
  final nameField = find.byType(CupertinoTextField).first;
  await tester.tap(nameField);
  await tester.pumpAndSettle();
  await tester.enterText(nameField, 'E2E Test Project - Updated');

  // Save changes
  final saveButton = find.text('Save');
  await E2ETestHelpers.tapButton(tester, saveButton);

  // Verify changes appear
  await E2ETestHelpers.waitForUI(tester, find.text('E2E Test Project - Updated'));

  // Verify in backend
  await E2ETestHelpers.verifyApiResponse('/projects', {
    'name': 'E2E Test Project - Updated',
  });
}

Future<void> _testProjectDeletion(WidgetTester tester) async {
  // Click delete button
  final deleteButton = find.byIcon(CupertinoIcons.trash);
  await E2ETestHelpers.tapButton(tester, deleteButton);

  // Confirm deletion
  await E2ETestHelpers.verifyUIText(tester, 'Delete Project');
  final confirmButton = find.text('Delete');
  await E2ETestHelpers.tapButton(tester, confirmButton);

  // Verify project is removed from list
  await E2ETestHelpers.waitForUI(tester, find.text('No Projects Yet'));
  
  // Verify success message (if shown)
  // Note: The exact success feedback depends on implementation
}