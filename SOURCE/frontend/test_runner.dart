// Simple test runner to validate our implementations
import 'dart:convert';
import 'lib/core/utils/json_verification_service.dart';
import 'lib/core/errors/exceptions.dart';
import 'lib/features/project/data/models/project_model.dart';
import 'lib/features/project/domain/entities/project.dart';
import 'lib/core/utils/result.dart';
import 'lib/core/errors/failures.dart';

void main() {
  print('🧪 Running Frontend Unit Tests...\n');
  
  // Test Result type
  testResult();
  
  // Test JSON Verification Service
  testJsonVerificationService();
  
  // Test Project Model
  testProjectModel();
  
  print('✅ All tests completed successfully!');
}

void testResult() {
  print('Testing Result type...');
  
  // Test Success
  final successResult = Result.success(42);
  assert(successResult.isSuccess == true);
  assert(successResult.isFailure == false);
  assert(successResult.data == 42);
  assert(successResult.getOrElse(0) == 42);
  assert(successResult.getOrNull() == 42);
  
  // Test Error
  const failure = NetworkFailure('Test error');
  final errorResult = Result<int>.failure(failure);
  assert(errorResult.isSuccess == false);
  assert(errorResult.isFailure == true);
  assert(errorResult.failure == failure);
  assert(errorResult.getOrElse(10) == 10);
  assert(errorResult.getOrNull() == null);
  
  // Test map
  final mapped = Result.success(5).map((value) => value * 2);
  assert(mapped.isSuccess == true);
  assert(mapped.data == 10);
  
  // Test fold
  final folded = Result.success(5).fold(
    (failure) => 'Error',
    (data) => 'Success: $data',
  );
  assert(folded == 'Success: 5');
  
  print('✅ Result type tests passed');
}

void testJsonVerificationService() {
  print('Testing JSON Verification Service...');
  
  // Test valid JSON parsing
  final validJson = {
    'title': 'Test',
    'age': 25,
    'active': true,
    'tags': ['tag1', 'tag2'],
  };
  
  // Test required fields
  try {
    JsonVerificationService.verifyRequiredFields(validJson, {
      'title': String,
      'age': int,
      'active': bool,
    });
    print('✅ Required fields validation passed');
  } catch (e) {
    throw Exception('Required fields validation failed: $e');
  }
  
  // Test missing field detection
  try {
    JsonVerificationService.verifyRequiredFields({'title': 'Test'}, {
      'title': String,
      'age': int,
    });
    throw Exception('Should have thrown JsonValidationException');
  } on JsonValidationException {
    print('✅ Missing field detection passed');
  }
  
  // Test field extraction
  final name = JsonVerificationService.getRequiredField<String>(validJson, 'name');
  assert(name == 'Test');
  
  final optionalField = JsonVerificationService.getOptionalField<String>(validJson, 'missing');
  assert(optionalField == null);
  
  final defaultField = JsonVerificationService.getFieldWithDefault<int>(validJson, 'missing', 10);
  assert(defaultField == 10);
  
  // Test list extraction
  final tags = JsonVerificationService.getRequiredList<String>(validJson, 'tags');
  assert(tags.length == 2);
  assert(tags[0] == 'tag1');
  
  print('✅ JSON Verification Service tests passed');
}

void testProjectModel() {
  print('Testing Project Model...');
  
  final validProjectJson = {
    'id': 'project_123',
    'title': 'Test Project',
    'description': 'A test project',
    'status': 'active',
    'createdAt': '2025-01-01T10:00:00.000Z',
    'updatedAt': '2025-01-01T12:00:00.000Z',
    'tags': ['urgent', 'frontend'],
    'attachments': ['file1.pdf'],
  };
  
  // Test fromJson
  final projectModel = ProjectModel.fromJson(validProjectJson);
  assert(projectModel.id == 'project_123');
  assert(projectModel.title == 'Test Project');
  assert(projectModel.status == 'active');
  assert(projectModel.tags.length == 2);
  assert(projectModel.attachments.length == 1);
  
  // Test toJson
  final json = projectModel.toJson();
  assert(json['id'] == 'project_123');
  assert(json['name'] == 'Test Project');
  assert(json['status'] == 'active');
  
  // Test toEntity
  final entity = projectModel.toEntity();
  assert(entity.id == 'project_123');
  assert(entity.title == 'Test Project');
  assert(entity.status == ProjectStatus.active);
  
  // Test fromEntity
  final backToModel = ProjectModel.fromEntity(entity);
  assert(backToModel.id == entity.id);
  assert(backToModel.title == entity.title);
  assert(backToModel.status == entity.status.name);
  
  // Test copyWith
  final updated = projectModel.copyWith(title: 'Updated Project');
  assert(updated.title == 'Updated Project');
  assert(updated.id == projectModel.id); // Should remain unchanged
  
  // Test round-trip conversion
  final jsonRoundTrip = ProjectModel.fromJson(projectModel.toJson());
  assert(jsonRoundTrip.id == projectModel.id);
  assert(jsonRoundTrip.title == projectModel.title);
  
  print('✅ Project Model tests passed');
}