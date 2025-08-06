import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:http/http.dart' as http;

/// Helper utilities for end-to-end testing
class E2ETestHelpers {
  static const String baseUrl = 'http://localhost:8090/api/v1';
  static const Duration defaultTimeout = Duration(seconds: 10);
  static const Duration longTimeout = Duration(seconds: 30);

  /// Clear all test data from the database
  static Future<void> clearTestData() async {
    await _clearCollection('projects');
    await _clearCollection('tasks');
    await _clearCollection('blogs');
  }

  /// Create test project data
  static Future<Map<String, dynamic>> createTestProject({
    String? name,
    String? description,
    String? status,
  }) async {
    final projectData = {
      'name': name ?? 'E2E Test Project ${DateTime.now().millisecondsSinceEpoch}',
      'description': description ?? 'Created by E2E test',
      'status': status ?? 'planning',
    };

    final response = await http.post(
      Uri.parse('$baseUrl/projects'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(projectData),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Failed to create test project: ${response.body}');
    }

    final responseData = jsonDecode(response.body);
    return responseData['data'] ?? responseData;
  }

  /// Create test task data
  static Future<Map<String, dynamic>> createTestTask({
    String? projectId,
    String? title,
    String? description,
    String? status,
    String? priority,
  }) async {
    final taskData = {
      'title': title ?? 'E2E Test Task ${DateTime.now().millisecondsSinceEpoch}',
      'description': description ?? 'Created by E2E test',
      'status': status ?? 'pending',
      'priority': priority ?? 'medium',
      if (projectId != null) 'projectId': projectId,
    };

    final response = await http.post(
      Uri.parse('$baseUrl/tasks'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(taskData),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Failed to create test task: ${response.body}');
    }

    final responseData = jsonDecode(response.body);
    return responseData['data'] ?? responseData;
  }

  /// Create test blog entry
  static Future<Map<String, dynamic>> createTestBlog({
    String? title,
    String? content,
    List<String>? tags,
    bool? draft,
  }) async {
    final blogData = {
      'title': title ?? 'E2E Test Blog ${DateTime.now().millisecondsSinceEpoch}',
      'content': content ?? 'This is test content created by E2E test',
      'tags': tags ?? ['test', 'e2e'],
      'draft': draft ?? false,
    };

    final response = await http.post(
      Uri.parse('$baseUrl/blogs'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(blogData),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Failed to create test blog: ${response.body}');
    }

    final responseData = jsonDecode(response.body);
    return responseData['data'] ?? responseData;
  }

  /// Verify API response contains expected data
  static Future<void> verifyApiResponse(
    String endpoint,
    Map<String, dynamic> expectedData, {
    String method = 'GET',
  }) async {
    final response = await http.get(Uri.parse('$baseUrl$endpoint'));
    
    if (response.statusCode != 200) {
      throw Exception('API call failed: ${response.statusCode} - ${response.body}');
    }

    final responseData = jsonDecode(response.body);
    final data = responseData['data'];

    for (final key in expectedData.keys) {
      if (data is List) {
        // Check if any item in the list contains the expected data
        final found = data.any((item) => item[key] == expectedData[key]);
        if (!found) {
          throw Exception('Expected $key: ${expectedData[key]} not found in API response');
        }
      } else {
        if (data[key] != expectedData[key]) {
          throw Exception('Expected $key: ${expectedData[key]}, got: ${data[key]}');
        }
      }
    }
  }

  /// Wait for UI element with timeout
  static Future<void> waitForUI(
    WidgetTester tester,
    Finder finder, {
    Duration timeout = defaultTimeout,
  }) async {
    await tester.pumpAndSettle();
    
    final endTime = DateTime.now().add(timeout);
    
    while (DateTime.now().isBefore(endTime)) {
      await tester.pumpAndSettle();
      
      if (finder.evaluate().isNotEmpty) {
        return;
      }
      
      await Future.delayed(const Duration(milliseconds: 100));
    }
    
    throw Exception('UI element not found within timeout: $finder');
  }

  /// Verify UI shows expected text
  static Future<void> verifyUIText(
    WidgetTester tester,
    String expectedText, {
    bool exactMatch = false,
  }) async {
    await tester.pumpAndSettle();
    
    final finder = exactMatch 
        ? find.text(expectedText)
        : find.textContaining(expectedText);
    
    if (finder.evaluate().isEmpty) {
      throw Exception('Expected text not found in UI: $expectedText');
    }
  }

  /// Simulate user input in text field
  static Future<void> enterText(
    WidgetTester tester,
    Finder textFieldFinder,
    String text,
  ) async {
    await tester.tap(textFieldFinder);
    await tester.pumpAndSettle();
    await tester.enterText(textFieldFinder, text);
    await tester.pumpAndSettle();
  }

  /// Simulate button tap with wait
  static Future<void> tapButton(
    WidgetTester tester,
    Finder buttonFinder, {
    Duration waitAfter = const Duration(milliseconds: 500),
  }) async {
    await tester.tap(buttonFinder);
    await tester.pumpAndSettle();
    await Future.delayed(waitAfter);
    await tester.pumpAndSettle();
  }

  /// Navigate to specific tab
  static Future<void> navigateToTab(
    WidgetTester tester,
    String tabName,
  ) async {
    final tabFinder = find.text(tabName);
    await waitForUI(tester, tabFinder);
    await tapButton(tester, tabFinder);
  }

  /// Check if server is running
  static Future<bool> isServerRunning() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/health'))
          .timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// Setup test environment
  static Future<void> setupTestEnvironment() async {
    // Check server connectivity
    if (!await isServerRunning()) {
      throw Exception('Backend server is not running at $baseUrl');
    }

    // Clear existing test data
    await clearTestData();
    
    // Add small delay to ensure cleanup is complete
    await Future.delayed(const Duration(milliseconds: 500));
  }

  /// Cleanup test environment
  static Future<void> cleanupTestEnvironment() async {
    await clearTestData();
  }

  /// Private helper to clear a collection
  static Future<void> _clearCollection(String collection) async {
    try {
      // This would typically be a DELETE /api/v1/{collection}/test-data endpoint
      // For now, we'll try to get and delete individual items
      final response = await http.get(Uri.parse('$baseUrl/$collection'));
      
      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        final items = responseData['data'] as List<dynamic>? ?? [];
        
        for (final item in items) {
          final id = item['_id'] ?? item['id'];
          if (id != null) {
            await http.delete(Uri.parse('$baseUrl/$collection/$id'));
          }
        }
      }
    } catch (e) {
      debugPrint('Warning: Could not clear $collection: $e');
    }
  }

  /// Create comprehensive test data set
  static Future<Map<String, dynamic>> createTestDataSet() async {
    // Create test project
    final project = await createTestProject(
      name: 'E2E Test Project Suite',
      description: 'Comprehensive test project for E2E testing',
      status: 'active',
    );

    // Create test tasks linked to project
    final task1 = await createTestTask(
      projectId: project['_id'] ?? project['id'],
      title: 'E2E Test Task 1',
      status: 'pending',
      priority: 'high',
    );

    final task2 = await createTestTask(
      projectId: project['_id'] ?? project['id'],
      title: 'E2E Test Task 2',
      status: 'active',
      priority: 'medium',
    );

    // Create test blog entries
    final blog1 = await createTestBlog(
      title: 'E2E Test Blog Entry 1',
      content: 'This is a published test blog entry for E2E testing.',
      tags: ['test', 'e2e', 'published'],
      draft: false,
    );

    final blog2 = await createTestBlog(
      title: 'E2E Test Draft Entry',
      content: 'This is a draft test blog entry for E2E testing.',
      tags: ['test', 'e2e', 'draft'],
      draft: true,
    );

    return {
      'project': project,
      'tasks': [task1, task2],
      'blogs': [blog1, blog2],
    };
  }

  /// Verify test data integrity
  static Future<void> verifyTestDataIntegrity(Map<String, dynamic> testData) async {
    // Verify project exists
    await verifyApiResponse('/projects', {
      'name': testData['project']['name'],
      'status': testData['project']['status'],
    });

    // Verify tasks exist and are linked to project
    for (final task in testData['tasks']) {
      await verifyApiResponse('/tasks', {
        'title': task['title'],
        'status': task['status'],
      });
    }

    // Verify blogs exist
    for (final blog in testData['blogs']) {
      await verifyApiResponse('/blogs', {
        'title': blog['title'],
        'draft': blog['draft'],
      });
    }
  }
}