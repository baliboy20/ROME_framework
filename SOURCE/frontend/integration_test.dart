// Integration test to verify complex scenarios
import 'dart:convert';
import 'lib/core/utils/json_verification_service.dart';
import 'lib/core/errors/exceptions.dart';
import 'lib/features/project/data/models/project_model.dart';
import 'lib/features/project/domain/entities/project.dart';
import 'lib/core/utils/result.dart';
import 'lib/core/errors/failures.dart';

void main() {
  print('🔬 Running Integration Tests...\n');
  
  testComplexJsonScenarios();
  testErrorHandling();
  testResultChaining();
  testProjectModelEdgeCases();
  
  print('✅ All integration tests passed!');
}

void testComplexJsonScenarios() {
  print('Testing complex JSON scenarios...');
  
  // Test deeply nested JSON
  final nestedJson = {
    'project': {
      'id': 'project_123',
      'title': 'Nested Project',
      'description': 'A project with nested data',
      'status': 'active',
      'createdAt': '2025-01-01T10:00:00.000Z',
      'updatedAt': '2025-01-01T12:00:00.000Z',
      'metadata': {
        'priority': 'high',
        'tags': ['urgent', 'frontend'],
        'settings': {
          'autoSave': true,
          'notifications': false
        }
      }
    },
    'tasks': [
      {'id': 'task_1', 'title': 'Task 1'},
      {'id': 'task_2', 'title': 'Task 2'}
    ]
  };
  
  // Extract nested project
  final projectData = JsonVerificationService.getRequiredObject(nestedJson, 'project');
  final project = ProjectModel.fromJson(projectData);
  assert(project.title == 'Nested Project');
  
  // Extract nested arrays
  final tasks = JsonVerificationService.getRequiredList<Map<String, dynamic>>(nestedJson, 'tasks');
  assert(tasks.length == 2);
  assert(tasks[0]['title'] == 'Task 1');
  
  // Extract deeply nested values
  final metadata = JsonVerificationService.getRequiredObject(projectData, 'metadata');
  final priority = JsonVerificationService.getRequiredField<String>(metadata, 'priority');
  assert(priority == 'high');
  
  final settings = JsonVerificationService.getRequiredObject(metadata, 'settings');
  final autoSave = JsonVerificationService.getRequiredField<bool>(settings, 'autoSave');
  assert(autoSave == true);
  
  print('✅ Complex JSON scenarios passed');
}

void testErrorHandling() {
  print('Testing error handling...');
  
  // Test various error scenarios
  final invalidJsons = [
    // Missing required field
    {
      'title': 'Test',
      // 'id' missing
      'description': 'Test project',
      'status': 'active',
      'createdAt': '2025-01-01T10:00:00.000Z',
      'updatedAt': '2025-01-01T12:00:00.000Z',
    },
    // Wrong type
    {
      'id': 123, // Should be String
      'title': 'Test',
      'description': 'Test project',
      'status': 'active',
      'createdAt': '2025-01-01T10:00:00.000Z',
      'updatedAt': '2025-01-01T12:00:00.000Z',
    },
    // Invalid date format
    {
      'id': 'project_123',
      'title': 'Test',
      'description': 'Test project',
      'status': 'active',
      'createdAt': 'invalid-date',
      'updatedAt': '2025-01-01T12:00:00.000Z',
    },
  ];
  
  int errorCount = 0;
  for (final invalidJson in invalidJsons) {
    try {
      ProjectModel.fromJson(invalidJson);
      throw Exception('Should have thrown an error for invalid JSON');
    } on FormatException {
      errorCount++;
    }
  }
  
  assert(errorCount == invalidJsons.length);
  print('✅ Error handling tests passed');
}

void testResultChaining() {
  print('Testing Result chaining...');
  
  // Test successful chain
  final successChain = Result.success(10)
      .map((value) => value * 2)
      .flatMap((value) => Result.success(value + 5))
      .map((value) => 'Result: $value');
  
  assert(successChain.isSuccess);
  assert(successChain.data == 'Result: 25');
  
  // Test chain with failure
  const failure = ValidationFailure('Invalid input');
  final failureChain = Result<int>.failure(failure)
      .map((value) => value * 2)
      .flatMap((value) => Result.success(value + 5))
      .map((value) => 'Result: $value');
  
  assert(failureChain.isFailure);
  assert(failureChain.failure == failure);
  
  // Test exception handling in chain
  final exceptionChain = Result.success(5)
      .map<int>((value) => throw Exception('Transform error'))
      .map((value) => value * 2);
  
  assert(exceptionChain.isFailure);
  assert(exceptionChain.failure is UnexpectedFailure);
  
  print('✅ Result chaining tests passed');
}

void testProjectModelEdgeCases() {
  print('Testing Project Model edge cases...');
  
  // Test with all optional fields null
  final minimalJson = {
    'id': 'project_123',
    'name': 'Minimal Project',
    'description': 'A minimal project',
    'status': 'planning',
    'createdAt': '2025-01-01T10:00:00.000Z',
    'updatedAt': '2025-01-01T12:00:00.000Z',
  };
  
  final minimalProject = ProjectModel.fromJson(minimalJson);
  assert(minimalProject.completedAt == null);
  assert(minimalProject.ownerId == null);
  assert(minimalProject.tags.isEmpty);
  assert(minimalProject.attachments.isEmpty);
  
  // Test with empty arrays
  final emptyArraysJson = Map<String, dynamic>.from(minimalJson);
  emptyArraysJson['tags'] = <String>[];
  emptyArraysJson['attachments'] = <String>[];
  
  final emptyArraysProject = ProjectModel.fromJson(emptyArraysJson);
  assert(emptyArraysProject.tags.isEmpty);
  assert(emptyArraysProject.attachments.isEmpty);
  
  // Test copyWith with null values
  final updated = minimalProject.copyWith(
    title: 'Updated Name',
    tags: ['new-tag'],
  );
  assert(updated.title == 'Updated Name');
  assert(updated.tags.length == 1);
  assert(updated.tags[0] == 'new-tag');
  assert(updated.id == minimalProject.id); // Should remain unchanged
  
  // Test equality
  final sameProject = ProjectModel.fromJson(minimalJson);
  final differentProject = ProjectModel.fromJson(minimalJson).copyWith(title: 'Different');
  
  assert(minimalProject == sameProject);
  assert(minimalProject != differentProject);
  assert(minimalProject.hashCode == sameProject.hashCode);
  assert(minimalProject.hashCode != differentProject.hashCode);
  
  // Test all project status conversions
  final statuses = ['planning', 'active', 'onhold', 'completed', 'cancelled'];
  for (final status in statuses) {
    final projectJson = Map<String, dynamic>.from(minimalJson);
    projectJson['status'] = status;
    
    final project = ProjectModel.fromJson(projectJson);
    final entity = project.toEntity();
    final backToModel = ProjectModel.fromEntity(entity);
    
    assert(backToModel.status == status);
  }
  
  print('✅ Project Model edge cases passed');
}