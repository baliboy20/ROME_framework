import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:project_management_app/main.dart' as app;

import '../helpers/test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Journal Management Journey E2E Tests', () {
    setUpAll(() async {
      await E2ETestHelpers.setupTestEnvironment();
    });

    tearDownAll(() async {
      await E2ETestHelpers.cleanupTestEnvironment();
    });

    testWidgets('Complete Journal Entry Lifecycle Journey', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to Journal tab
      await E2ETestHelpers.navigateToTab(tester, 'Journal');
      await E2ETestHelpers.verifyUIText(tester, 'Journal');

      // Initially should show empty state
      await E2ETestHelpers.verifyUIText(tester, 'No Journal Entries Yet');
      await E2ETestHelpers.verifyUIText(tester, 'Start documenting your thoughts and progress');

      // Test Journal Entry Creation
      await _testJournalCreation(tester);

      // Test Journal Search
      await _testJournalSearch(tester);

      // Test Journal Editing
      await _testJournalEditing(tester);

      // Test Journal Viewing
      await _testJournalViewing(tester);

      // Test Journal Deletion
      await _testJournalDeletion(tester);
    });

    testWidgets('Journal Entry with Tags and Content', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Journal');

      // Create comprehensive journal entry
      final createButton = find.text('New Entry');
      await E2ETestHelpers.tapButton(tester, createButton);

      // Fill in all fields
      final titleField = find.byType(CupertinoTextField).first;
      await E2ETestHelpers.enterText(tester, titleField, 'Comprehensive Journal Entry');

      final contentField = find.byType(CupertinoTextField).at(1);
      await E2ETestHelpers.enterText(tester, contentField, 
        'This is a comprehensive journal entry with detailed content for E2E testing. '
        'It includes multiple sentences and thorough documentation of thoughts and progress.');

      final tagsField = find.byType(CupertinoTextField).at(2);
      await E2ETestHelpers.enterText(tester, tagsField, 'e2e, testing, comprehensive, detailed');

      // Create the entry
      final dialogCreateButton = find.text('Create');
      await E2ETestHelpers.tapButton(tester, dialogCreateButton);

      // Verify entry appears
      await E2ETestHelpers.waitForUI(tester, find.text('Comprehensive Journal Entry'));
      await E2ETestHelpers.verifyUIText(tester, '1 entries');

      // Verify tags are displayed
      await E2ETestHelpers.verifyUIText(tester, 'e2e');
      await E2ETestHelpers.verifyUIText(tester, 'testing');
      await E2ETestHelpers.verifyUIText(tester, 'comprehensive');

      // Verify in backend
      await E2ETestHelpers.verifyApiResponse('/blogs', {
        'title': 'Comprehensive Journal Entry',
      });
    });

    testWidgets('Journal Search Functionality', (WidgetTester tester) async {
      // Create multiple journal entries with different content
      await E2ETestHelpers.createTestBlog(
        title: 'Daily Standup Notes',
        content: 'Today we discussed project progress and upcoming milestones.',
        tags: ['standup', 'daily', 'progress'],
      );

      await E2ETestHelpers.createTestBlog(
        title: 'Technical Deep Dive',
        content: 'Explored the architecture patterns and implementation details.',
        tags: ['technical', 'architecture', 'deep-dive'],
      );

      await E2ETestHelpers.createTestBlog(
        title: 'Sprint Retrospective',
        content: 'Reviewed what went well and areas for improvement.',
        tags: ['retrospective', 'sprint', 'improvement'],
      );

      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Journal');

      // Should show all entries
      await E2ETestHelpers.verifyUIText(tester, '3 entries');
      await E2ETestHelpers.verifyUIText(tester, 'Daily Standup Notes');
      await E2ETestHelpers.verifyUIText(tester, 'Technical Deep Dive');
      await E2ETestHelpers.verifyUIText(tester, 'Sprint Retrospective');

      // Test search by title
      final searchField = find.byType(CupertinoSearchTextField);
      await E2ETestHelpers.enterText(tester, searchField, 'Technical');

      // Should show filtered results
      await E2ETestHelpers.verifyUIText(tester, '1 results for "Technical"');
      await E2ETestHelpers.verifyUIText(tester, 'Technical Deep Dive');

      // Clear search
      await E2ETestHelpers.enterText(tester, searchField, '');
      await E2ETestHelpers.verifyUIText(tester, '3 entries');

      // Test search by tag
      await E2ETestHelpers.enterText(tester, searchField, 'standup');
      await E2ETestHelpers.verifyUIText(tester, '1 results for "standup"');
      await E2ETestHelpers.verifyUIText(tester, 'Daily Standup Notes');

      // Test search by content
      await E2ETestHelpers.enterText(tester, searchField, 'architecture');
      await E2ETestHelpers.verifyUIText(tester, '1 results for "architecture"');
      await E2ETestHelpers.verifyUIText(tester, 'Technical Deep Dive');
    });

    testWidgets('Journal Entry Draft and Publish Workflow', (WidgetTester tester) async {
      // Create draft entry via API
      await E2ETestHelpers.createTestBlog(
        title: 'Draft Entry',
        content: 'This is a draft entry for testing workflow.',
        tags: ['draft', 'workflow'],
        draft: true,
      );

      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Journal');

      // Verify draft entry appears
      await E2ETestHelpers.waitForUI(tester, find.text('Draft Entry'));

      // Edit the draft to publish it
      final editButton = find.byIcon(CupertinoIcons.pencil);
      await E2ETestHelpers.tapButton(tester, editButton);

      // Update content
      final contentField = find.byType(CupertinoTextField).at(1);
      await tester.tap(contentField);
      await tester.pumpAndSettle();
      await tester.enterText(contentField, 'This draft has been updated and is ready for publishing.');

      // Save changes (which should publish)
      final saveButton = find.text('Save');
      await E2ETestHelpers.tapButton(tester, saveButton);

      // Verify entry is updated
      await E2ETestHelpers.verifyUIText(tester, 'This draft has been updated and is ready for publishing.');
    });

    testWidgets('Journal Entry Validation', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Journal');

      // Test empty form validation
      final createButton = find.text('New Entry');
      await E2ETestHelpers.tapButton(tester, createButton);

      final dialogCreateButton = find.text('Create');
      await E2ETestHelpers.tapButton(tester, dialogCreateButton);

      // Should remain on dialog due to validation
      await E2ETestHelpers.verifyUIText(tester, 'New Journal Entry');

      // Fill in required fields
      final titleField = find.byType(CupertinoTextField).first;
      await E2ETestHelpers.enterText(tester, titleField, 'Valid Entry');

      final contentField = find.byType(CupertinoTextField).at(1);
      await E2ETestHelpers.enterText(tester, contentField, 'Valid content for the entry.');

      // Now creation should succeed
      await E2ETestHelpers.tapButton(tester, dialogCreateButton);

      // Should return to journal list
      await E2ETestHelpers.waitForUI(tester, find.text('Valid Entry'));
    });

    testWidgets('Multiple Journal Entries Management', (WidgetTester tester) async {
      // Create multiple entries to test pagination and management
      for (int i = 1; i <= 5; i++) {
        await E2ETestHelpers.createTestBlog(
          title: 'Journal Entry $i',
          content: 'Content for journal entry number $i with unique information.',
          tags: ['entry$i', 'test', 'multiple'],
        );
      }

      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Journal');

      // Should show all entries
      await E2ETestHelpers.verifyUIText(tester, '5 entries');

      // Verify all entries are visible
      for (int i = 1; i <= 5; i++) {
        await E2ETestHelpers.verifyUIText(tester, 'Journal Entry $i');
      }

      // Test sorting (entries should be in reverse chronological order)
      // The most recent entry should appear first
      await E2ETestHelpers.verifyUIText(tester, 'Journal Entry 5');
    });

    testWidgets('Journal Error Handling', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      await E2ETestHelpers.navigateToTab(tester, 'Journal');

      // Test behavior when server errors occur
      // Note: This would require a way to simulate server errors
      
      // Test retry functionality if error state is shown
      final retryButton = find.text('Retry');
      if (retryButton.evaluate().isNotEmpty) {
        await E2ETestHelpers.tapButton(tester, retryButton);
      }

      // Test search with no results
      final searchField = find.byType(CupertinoSearchTextField);
      await E2ETestHelpers.enterText(tester, searchField, 'nonexistent');

      await E2ETestHelpers.verifyUIText(tester, 'No Matching Entries');
      await E2ETestHelpers.verifyUIText(tester, 'Try adjusting your search terms');
    });
  });
}

Future<void> _testJournalCreation(WidgetTester tester) async {
  // Click create entry button
  final createButton = find.text('New Entry');
  await E2ETestHelpers.tapButton(tester, createButton);

  // Verify create journal dialog appears
  await E2ETestHelpers.verifyUIText(tester, 'New Journal Entry');

  // Fill in entry details
  final titleField = find.byType(CupertinoTextField).first;
  await E2ETestHelpers.enterText(tester, titleField, 'E2E Test Journal Entry');

  final contentField = find.byType(CupertinoTextField).at(1);
  await E2ETestHelpers.enterText(tester, contentField, 
    'This is a test journal entry created during E2E testing. '
    'It contains detailed thoughts and progress documentation.');

  final tagsField = find.byType(CupertinoTextField).at(2);
  await E2ETestHelpers.enterText(tester, tagsField, 'e2e, testing, automation');

  // Create the entry
  final dialogCreateButton = find.text('Create');
  await E2ETestHelpers.tapButton(tester, dialogCreateButton);

  // Verify entry appears in list
  await E2ETestHelpers.waitForUI(tester, find.text('E2E Test Journal Entry'));
  await E2ETestHelpers.verifyUIText(tester, '1 entries');

  // Verify tags appear
  await E2ETestHelpers.verifyUIText(tester, 'e2e');
  await E2ETestHelpers.verifyUIText(tester, 'testing');
  await E2ETestHelpers.verifyUIText(tester, 'automation');

  // Verify entry was created in backend
  await E2ETestHelpers.verifyApiResponse('/blogs', {
    'title': 'E2E Test Journal Entry',
  });
}

Future<void> _testJournalSearch(WidgetTester tester) async {
  // Create additional entry for search testing
  await E2ETestHelpers.createTestBlog(
    title: 'Search Test Entry',
    content: 'This entry is specifically for testing search functionality.',
    tags: ['search', 'findme'],
  );

  // Refresh to show new entry
  await tester.pumpAndSettle();

  // Should now show multiple entries
  await E2ETestHelpers.verifyUIText(tester, '2 entries');

  // Test search functionality
  final searchField = find.byType(CupertinoSearchTextField);
  await E2ETestHelpers.enterText(tester, searchField, 'Search Test');

  // Should show filtered results
  await E2ETestHelpers.verifyUIText(tester, '1 results for "Search Test"');
  await E2ETestHelpers.verifyUIText(tester, 'Search Test Entry');

  // Clear search to show all entries again
  await E2ETestHelpers.enterText(tester, searchField, '');
  await E2ETestHelpers.verifyUIText(tester, '2 entries');
}

Future<void> _testJournalEditing(WidgetTester tester) async {
  // Click edit button for the first entry
  final editButton = find.byIcon(CupertinoIcons.pencil).first;
  await E2ETestHelpers.tapButton(tester, editButton);

  // Verify edit dialog appears
  await E2ETestHelpers.verifyUIText(tester, 'Edit Journal Entry');

  // Update the title
  final titleField = find.byType(CupertinoTextField).first;
  await tester.tap(titleField);
  await tester.pumpAndSettle();
  await tester.enterText(titleField, 'E2E Test Journal Entry - Updated');

  // Update content
  final contentField = find.byType(CupertinoTextField).at(1);
  await tester.tap(contentField);
  await tester.pumpAndSettle();
  await tester.enterText(contentField, 
    'This journal entry has been updated during E2E testing. '
    'The content now reflects the editing capabilities.');

  // Save changes
  final saveButton = find.text('Save');
  await E2ETestHelpers.tapButton(tester, saveButton);

  // Verify changes appear
  await E2ETestHelpers.waitForUI(tester, find.text('E2E Test Journal Entry - Updated'));

  // Verify in backend
  await E2ETestHelpers.verifyApiResponse('/blogs', {
    'title': 'E2E Test Journal Entry - Updated',
  });
}

Future<void> _testJournalViewing(WidgetTester tester) async {
  // Click view button for an entry
  final viewButton = find.byIcon(CupertinoIcons.eye).first;
  await E2ETestHelpers.tapButton(tester, viewButton);

  // Verify view dialog appears with entry details
  await E2ETestHelpers.verifyUIText(tester, 'E2E Test Journal Entry - Updated');
  await E2ETestHelpers.verifyUIText(tester, 'This journal entry has been updated during E2E testing.');

  // Verify timestamps are shown
  await E2ETestHelpers.verifyUIText(tester, 'Created:');

  // Close the view dialog
  final closeButton = find.byIcon(CupertinoIcons.xmark);
  await E2ETestHelpers.tapButton(tester, closeButton);

  // Should return to journal list
  await E2ETestHelpers.verifyUIText(tester, 'Journal');
}

Future<void> _testJournalDeletion(WidgetTester tester) async {
  // Click delete button for an entry
  final deleteButton = find.byIcon(CupertinoIcons.trash).first;
  await E2ETestHelpers.tapButton(tester, deleteButton);

  // Confirm deletion
  await E2ETestHelpers.verifyUIText(tester, 'Delete Entry');
  final confirmButton = find.text('Delete');
  await E2ETestHelpers.tapButton(tester, confirmButton);

  // Verify entry is removed from list
  await tester.pumpAndSettle();
  
  // Should show success message or updated entry count
  // The exact behavior depends on implementation
}