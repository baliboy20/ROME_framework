import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'user_journeys/project_management_journey_test.dart' as project_tests;
import 'user_journeys/task_management_journey_test.dart' as task_tests;
import 'user_journeys/journal_management_journey_test.dart' as journal_tests;
import 'user_journeys/cross_feature_integration_test.dart' as integration_tests;
import 'helpers/test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Project Management App - Complete E2E Test Suite', () {
    setUpAll(() async {
      // Ensure test environment is ready
      if (!await E2ETestHelpers.isServerRunning()) {
        throw Exception(
          'Backend server is not running. Please start the server at ${E2ETestHelpers.baseUrl} before running E2E tests.'
        );
      }
      
      print('🚀 Starting E2E Test Suite');
      print('📡 Backend server: ${E2ETestHelpers.baseUrl}');
      print('🧪 Test environment: Ready');
    });

    tearDownAll(() async {
      print('🧹 Cleaning up test environment');
      await E2ETestHelpers.cleanupTestEnvironment();
      print('✅ E2E Test Suite completed');
    });

    group('🗂️  Project Management Journey Tests', () {
      project_tests.main();
    });

    group('✅ Task Management Journey Tests', () {
      task_tests.main();
    });

    group('📝 Journal Management Journey Tests', () {
      journal_tests.main();
    });

    group('🔄 Cross-Feature Integration Tests', () {
      integration_tests.main();
    });
  });
}