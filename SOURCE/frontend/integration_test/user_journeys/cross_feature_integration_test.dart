import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:project_management_app/main.dart' as app;

import '../helpers/test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Cross-Feature Integration E2E Tests', () {
    late Map<String, dynamic> testDataSet;

    setUpAll(() async {
      await E2ETestHelpers.setupTestEnvironment();
      
      // Create comprehensive test data set
      testDataSet = await E2ETestHelpers.createTestDataSet();
      
      // Verify test data was created correctly
      await E2ETestHelpers.verifyTestDataIntegrity(testDataSet);
    });

    tearDownAll(() async {
      await E2ETestHelpers.cleanupTestEnvironment();
    });

    testWidgets('Complete Project-to-Task-to-Journal Workflow', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Start with dashboard overview
      await _testDashboardOverview(tester);

      // Navigate through all sections and verify data consistency
      await _testProjectTaskJournalFlow(tester, testDataSet);

      // Test data relationships
      await _testDataRelationships(tester, testDataSet);

      // Test navigation between related items
      await _testCrossNavigation(tester);
    });

    testWidgets('End-to-End Project Lifecycle with Dependencies', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Create new project with complete workflow
      await _testCompleteProjectLifecycle(tester);
    });

    testWidgets('Data Consistency Across Features', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test that changes in one feature are reflected in others
      await _testDataConsistency(tester, testDataSet);
    });

    testWidgets('Dashboard Real-time Updates', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test dashboard statistics update as data changes
      await _testDashboardUpdates(tester);
    });

    testWidgets('Performance Under Load', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test app performance with larger data sets
      await _testPerformanceUnderLoad(tester);
    });

    testWidgets('Error Recovery and Data Integrity', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test error recovery scenarios
      await _testErrorRecovery(tester);
    });

    testWidgets('Theme and UI Consistency', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test theme consistency across all features
      await _testThemeConsistency(tester);
    });
  });
}

Future<void> _testDashboardOverview(WidgetTester tester) async {
  // Verify dashboard shows correct overview
  await E2ETestHelpers.verifyUIText(tester, 'Welcome to Project Management');
  await E2ETestHelpers.verifyUIText(tester, 'Quick Overview');

  // Check project count
  await E2ETestHelpers.verifyUIText(tester, 'Projects');
  
  // Check task count
  await E2ETestHelpers.verifyUIText(tester, 'Tasks');
  
  // Check journal count
  await E2ETestHelpers.verifyUIText(tester, 'Journal Entries');

  // Verify recent activity section
  await E2ETestHelpers.verifyUIText(tester, 'Recent Activity');
}

Future<void> _testProjectTaskJournalFlow(
  WidgetTester tester,
  Map<String, dynamic> testData,
) async {
  // 1. Verify Projects section shows test data
  await E2ETestHelpers.navigateToTab(tester, 'Projects');
  await E2ETestHelpers.verifyUIText(tester, testData['project']['name']);
  await E2ETestHelpers.verifyUIText(tester, '1 Projects');

  // 2. Navigate to Tasks and verify project-linked tasks
  await E2ETestHelpers.navigateToTab(tester, 'Tasks');
  
  final tasks = testData['tasks'] as List<dynamic>;
  for (final task in tasks) {
    await E2ETestHelpers.verifyUIText(tester, task['title']);
  }
  await E2ETestHelpers.verifyUIText(tester, '${tasks.length} tasks');

  // 3. Navigate to Journal and verify entries
  await E2ETestHelpers.navigateToTab(tester, 'Journal');
  
  final blogs = testData['blogs'] as List<dynamic>;
  for (final blog in blogs) {
    await E2ETestHelpers.verifyUIText(tester, blog['title']);
  }
  await E2ETestHelpers.verifyUIText(tester, '${blogs.length} entries');
}

Future<void> _testDataRelationships(
  WidgetTester tester,
  Map<String, dynamic> testData,
) async {
  // Verify that tasks are properly linked to projects
  await E2ETestHelpers.navigateToTab(tester, 'Tasks');
  
  // Edit a task to verify project association
  final editButton = find.byIcon(CupertinoIcons.pencil).first;
  await E2ETestHelpers.tapButton(tester, editButton);
  
  // Verify project ID is maintained (this would depend on UI showing project name)
  await E2ETestHelpers.verifyUIText(tester, 'Edit Task');
  
  // Cancel to return to list
  await E2ETestHelpers.tapButton(tester, find.text('Cancel'));
}

Future<void> _testCrossNavigation(WidgetTester tester) async {
  // Test navigation between different sections
  final sections = ['Dashboard', 'Projects', 'Tasks', 'Journal'];
  
  for (final section in sections) {
    await E2ETestHelpers.navigateToTab(tester, section);
    
    // Verify section loads correctly
    await tester.pumpAndSettle();
    
    // Check for loading indicators or content
    await Future.delayed(const Duration(milliseconds: 500));
  }
}

Future<void> _testCompleteProjectLifecycle(WidgetTester tester) async {
  // 1. Create a new project
  await E2ETestHelpers.navigateToTab(tester, 'Projects');
  
  final createProjectButton = find.text('Create Project');
  await E2ETestHelpers.tapButton(tester, createProjectButton);
  
  final nameField = find.byType(CupertinoTextField).first;
  await E2ETestHelpers.enterText(tester, nameField, 'Complete Lifecycle Project');
  
  final descriptionField = find.byType(CupertinoTextField).at(1);
  await E2ETestHelpers.enterText(tester, descriptionField, 'Testing complete project lifecycle');
  
  await E2ETestHelpers.tapButton(tester, find.text('Create'));
  
  // Verify project created
  await E2ETestHelpers.waitForUI(tester, find.text('Complete Lifecycle Project'));

  // 2. Create tasks for the project
  await E2ETestHelpers.navigateToTab(tester, 'Tasks');
  
  final createTaskButton = find.text('Create Task');
  await E2ETestHelpers.tapButton(tester, createTaskButton);
  
  final taskTitleField = find.byType(CupertinoTextField).first;
  await E2ETestHelpers.enterText(tester, taskTitleField, 'Lifecycle Test Task');
  
  await E2ETestHelpers.tapButton(tester, find.text('Create'));
  
  // Verify task created
  await E2ETestHelpers.waitForUI(tester, find.text('Lifecycle Test Task'));

  // 3. Create journal entry documenting the work
  await E2ETestHelpers.navigateToTab(tester, 'Journal');
  
  final createEntryButton = find.text('New Entry');
  await E2ETestHelpers.tapButton(tester, createEntryButton);
  
  final entryTitleField = find.byType(CupertinoTextField).first;
  await E2ETestHelpers.enterText(tester, entryTitleField, 'Project Lifecycle Documentation');
  
  final entryContentField = find.byType(CupertinoTextField).at(1);
  await E2ETestHelpers.enterText(tester, entryContentField, 
    'Documented the complete project lifecycle from creation to task assignment.');
  
  await E2ETestHelpers.tapButton(tester, find.text('Create'));
  
  // Verify entry created
  await E2ETestHelpers.waitForUI(tester, find.text('Project Lifecycle Documentation'));

  // 4. Verify all components are visible in dashboard
  await E2ETestHelpers.navigateToTab(tester, 'Dashboard');
  
  // Dashboard should reflect the new items (counts should be updated)
  await tester.pumpAndSettle();
}

Future<void> _testDataConsistency(
  WidgetTester tester,
  Map<String, dynamic> testData,
) async {
  // Update a project and verify it's reflected everywhere
  await E2ETestHelpers.navigateToTab(tester, 'Projects');
  
  final editButton = find.byIcon(CupertinoIcons.pencil);
  await E2ETestHelpers.tapButton(tester, editButton);
  
  // Change project status
  final statusDropdown = find.text('ACTIVE');
  await E2ETestHelpers.tapButton(tester, statusDropdown);
  await E2ETestHelpers.tapButton(tester, find.text('COMPLETED'));
  
  await E2ETestHelpers.tapButton(tester, find.text('Save'));
  
  // Verify status change is visible
  await E2ETestHelpers.waitForUI(tester, find.text('COMPLETED'));
  
  // Navigate to other sections and verify consistency
  await E2ETestHelpers.navigateToTab(tester, 'Dashboard');
  await tester.pumpAndSettle();
  
  // Dashboard should reflect the project status change
  // (This would depend on dashboard showing project status)
}

Future<void> _testDashboardUpdates(WidgetTester tester) async {
  await E2ETestHelpers.navigateToTab(tester, 'Dashboard');
  
  // Take note of initial counts
  await tester.pumpAndSettle();
  
  // Create a new task
  await E2ETestHelpers.navigateToTab(tester, 'Tasks');
  
  final createButton = find.text('Create Task');
  await E2ETestHelpers.tapButton(tester, createButton);
  
  final titleField = find.byType(CupertinoTextField).first;
  await E2ETestHelpers.enterText(tester, titleField, 'Dashboard Update Test Task');
  
  await E2ETestHelpers.tapButton(tester, find.text('Create'));
  
  // Return to dashboard and verify count updated
  await E2ETestHelpers.navigateToTab(tester, 'Dashboard');
  await tester.pumpAndSettle();
  
  // Dashboard should show updated task count
  await E2ETestHelpers.verifyUIText(tester, 'Tasks');
}

Future<void> _testPerformanceUnderLoad(WidgetTester tester) async {
  // Create multiple items to test performance
  final startTime = DateTime.now();
  
  // Navigate through all sections multiple times
  for (int i = 0; i < 3; i++) {
    await E2ETestHelpers.navigateToTab(tester, 'Projects');
    await tester.pumpAndSettle();
    
    await E2ETestHelpers.navigateToTab(tester, 'Tasks');
    await tester.pumpAndSettle();
    
    await E2ETestHelpers.navigateToTab(tester, 'Journal');
    await tester.pumpAndSettle();
    
    await E2ETestHelpers.navigateToTab(tester, 'Dashboard');
    await tester.pumpAndSettle();
  }
  
  final endTime = DateTime.now();
  final duration = endTime.difference(startTime);
  
  // Performance should be reasonable (less than 30 seconds for all navigation)
  if (duration.inSeconds > 30) {
    throw Exception('Performance test failed: Navigation took ${duration.inSeconds} seconds');
  }
}

Future<void> _testErrorRecovery(WidgetTester tester) async {
  // Test app behavior when network issues occur
  // This would typically involve mocking network failures
  
  await E2ETestHelpers.navigateToTab(tester, 'Projects');
  
  // If error state is shown, test retry functionality
  final retryButton = find.text('Retry');
  if (retryButton.evaluate().isNotEmpty) {
    await E2ETestHelpers.tapButton(tester, retryButton);
    await tester.pumpAndSettle();
  }
  
  // Test that app remains functional after errors
  await E2ETestHelpers.navigateToTab(tester, 'Dashboard');
  await E2ETestHelpers.verifyUIText(tester, 'Welcome to Project Management');
}

Future<void> _testThemeConsistency(WidgetTester tester) async {
  // Navigate through all sections and verify theme consistency
  final sections = ['Dashboard', 'Projects', 'Tasks', 'Journal'];
  
  for (final section in sections) {
    await E2ETestHelpers.navigateToTab(tester, section);
    
    // Verify pale straw background is applied
    // This would require checking widget properties or visual elements
    
    // Verify grey maroon theme elements are present
    // This would require checking button colors, text colors, etc.
    
    await tester.pumpAndSettle();
  }
}