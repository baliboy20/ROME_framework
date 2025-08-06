import 'package:flutter_test/flutter_test.dart';
import '../lib/core/utils/json_verification_service.dart';
import '../lib/core/errors/exceptions.dart';

void main() {
  group('JsonVerificationService', () {
    group('verifyRequiredFields', () {
      test('should pass validation when all required fields are present with correct types', () {
        // Arrange
        final json = {
          'name': 'Test Project',
          'id': 123,
          'isActive': true,
          'tags': ['tag1', 'tag2'],
          'metadata': {'key': 'value'},
        };
        final requiredFields = {
          'name': String,
          'id': int,
          'isActive': bool,
          'tags': List<dynamic>,
          'metadata': Map<String, dynamic>,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyRequiredFields(json, requiredFields),
          returnsNormally,
        );
      });

      test('should throw JsonValidationException when required field is missing', () {
        // Arrange
        final json = {
          'name': 'Test Project',
          // 'id' is missing
          'isActive': true,
        };
        final requiredFields = {
          'name': String,
          'id': int,
          'isActive': bool,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyRequiredFields(json, requiredFields),
          throwsA(isA<JsonValidationException>().having(
            (e) => e.missingFields,
            'missingFields',
            contains('id'),
          )),
        );
      });

      test('should throw JsonValidationException when required field is null', () {
        // Arrange
        final json = {
          'name': 'Test Project',
          'id': null,
          'isActive': true,
        };
        final requiredFields = {
          'name': String,
          'id': int,
          'isActive': bool,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyRequiredFields(json, requiredFields),
          throwsA(isA<JsonValidationException>().having(
            (e) => e.missingFields,
            'missingFields',
            contains('id'),
          )),
        );
      });

      test('should throw JsonValidationException when field has wrong type', () {
        // Arrange
        final json = {
          'name': 'Test Project',
          'id': 'wrong_type', // Should be int
          'isActive': true,
        };
        final requiredFields = {
          'name': String,
          'id': int,
          'isActive': bool,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyRequiredFields(json, requiredFields),
          throwsA(isA<JsonValidationException>().having(
            (e) => e.invalidTypeFields.keys,
            'invalidTypeFields',
            contains('id'),
          )),
        );
      });

      test('should accept int for double type', () {
        // Arrange
        final json = {
          'value': 42, // int should be acceptable for double
        };
        final requiredFields = {
          'value': double,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyRequiredFields(json, requiredFields),
          returnsNormally,
        );
      });

      test('should include object name in exception', () {
        // Arrange
        final json = <String, dynamic>{};
        final requiredFields = {'name': String};

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyRequiredFields(
            json, 
            requiredFields, 
            objectName: 'TestObject',
          ),
          throwsA(isA<JsonValidationException>().having(
            (e) => e.objectName,
            'objectName',
            equals('TestObject'),
          )),
        );
      });
    });

    group('verifyOptionalFields', () {
      test('should pass validation when optional fields are present with correct types', () {
        // Arrange
        final json = {
          'description': 'Optional description',
          'count': 5,
        };
        final optionalFields = {
          'description': String,
          'count': int,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyOptionalFields(json, optionalFields),
          returnsNormally,
        );
      });

      test('should pass validation when optional fields are missing', () {
        // Arrange
        final json = <String, dynamic>{};
        final optionalFields = {
          'description': String,
          'count': int,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyOptionalFields(json, optionalFields),
          returnsNormally,
        );
      });

      test('should pass validation when optional fields are null', () {
        // Arrange
        final json = {
          'description': null,
          'count': null,
        };
        final optionalFields = {
          'description': String,
          'count': int,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyOptionalFields(json, optionalFields),
          returnsNormally,
        );
      });

      test('should throw JsonValidationException when optional field has wrong type', () {
        // Arrange
        final json = {
          'description': 123, // Should be String
        };
        final optionalFields = {
          'description': String,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyOptionalFields(json, optionalFields),
          throwsA(isA<JsonValidationException>().having(
            (e) => e.invalidTypeFields.keys,
            'invalidTypeFields',
            contains('description'),
          )),
        );
      });
    });

    group('getRequiredField', () {
      test('should return field value when present with correct type', () {
        // Arrange
        final json = {'name': 'Test Value'};

        // Act
        final result = JsonVerificationService.getRequiredField<String>(json, 'name');

        // Assert
        expect(result, equals('Test Value'));
      });

      test('should throw JsonValidationException when field is missing', () {
        // Arrange
        final json = <String, dynamic>{};

        // Act & Assert
        expect(
          () => JsonVerificationService.getRequiredField<String>(json, 'name'),
          throwsA(isA<JsonValidationException>()),
        );
      });

      test('should throw JsonValidationException when field is null', () {
        // Arrange
        final json = {'name': null};

        // Act & Assert
        expect(
          () => JsonVerificationService.getRequiredField<String>(json, 'name'),
          throwsA(isA<JsonValidationException>()),
        );
      });

      test('should throw JsonValidationException when field has wrong type', () {
        // Arrange
        final json = {'name': 123};

        // Act & Assert
        expect(
          () => JsonVerificationService.getRequiredField<String>(json, 'name'),
          throwsA(isA<JsonValidationException>()),
        );
      });
    });

    group('getOptionalField', () {
      test('should return field value when present with correct type', () {
        // Arrange
        final json = {'description': 'Optional value'};

        // Act
        final result = JsonVerificationService.getOptionalField<String>(json, 'description');

        // Assert
        expect(result, equals('Optional value'));
      });

      test('should return null when field is missing', () {
        // Arrange
        final json = <String, dynamic>{};

        // Act
        final result = JsonVerificationService.getOptionalField<String>(json, 'description');

        // Assert
        expect(result, isNull);
      });

      test('should return null when field is null', () {
        // Arrange
        final json = {'description': null};

        // Act
        final result = JsonVerificationService.getOptionalField<String>(json, 'description');

        // Assert
        expect(result, isNull);
      });

      test('should throw JsonValidationException when field has wrong type', () {
        // Arrange
        final json = {'description': 123};

        // Act & Assert
        expect(
          () => JsonVerificationService.getOptionalField<String>(json, 'description'),
          throwsA(isA<JsonValidationException>()),
        );
      });
    });

    group('getFieldWithDefault', () {
      test('should return field value when present', () {
        // Arrange
        final json = {'count': 5};

        // Act
        final result = JsonVerificationService.getFieldWithDefault<int>(json, 'count', 0);

        // Assert
        expect(result, equals(5));
      });

      test('should return default value when field is missing', () {
        // Arrange
        final json = <String, dynamic>{};

        // Act
        final result = JsonVerificationService.getFieldWithDefault<int>(json, 'count', 10);

        // Assert
        expect(result, equals(10));
      });

      test('should return default value when field is null', () {
        // Arrange
        final json = {'count': null};

        // Act
        final result = JsonVerificationService.getFieldWithDefault<int>(json, 'count', 15);

        // Assert
        expect(result, equals(15));
      });
    });

    group('getRequiredList', () {
      test('should return list when all elements have correct type', () {
        // Arrange
        final json = {
          'tags': ['tag1', 'tag2', 'tag3']
        };

        // Act
        final result = JsonVerificationService.getRequiredList<String>(json, 'tags');

        // Assert
        expect(result, equals(['tag1', 'tag2', 'tag3']));
      });

      test('should throw JsonValidationException when list element has wrong type', () {
        // Arrange
        final json = {
          'tags': ['tag1', 123, 'tag3'] // 123 is not a String
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.getRequiredList<String>(json, 'tags'),
          throwsA(isA<JsonValidationException>().having(
            (e) => e.invalidTypeFields.keys.first,
            'invalidTypeFields',
            equals('tags[1]'),
          )),
        );
      });

      test('should throw JsonValidationException when field is not a list', () {
        // Arrange
        final json = {'tags': 'not_a_list'};

        // Act & Assert
        expect(
          () => JsonVerificationService.getRequiredList<String>(json, 'tags'),
          throwsA(isA<JsonValidationException>()),
        );
      });
    });

    group('getOptionalList', () {
      test('should return list when present with correct element types', () {
        // Arrange
        final json = {
          'tags': ['tag1', 'tag2']
        };

        // Act
        final result = JsonVerificationService.getOptionalList<String>(json, 'tags');

        // Assert
        expect(result, equals(['tag1', 'tag2']));
      });

      test('should return null when field is missing', () {
        // Arrange
        final json = <String, dynamic>{};

        // Act
        final result = JsonVerificationService.getOptionalList<String>(json, 'tags');

        // Assert
        expect(result, isNull);
      });

      test('should return null when field is null', () {
        // Arrange
        final json = {'tags': null};

        // Act
        final result = JsonVerificationService.getOptionalList<String>(json, 'tags');

        // Assert
        expect(result, isNull);
      });
    });

    group('getRequiredDateTime', () {
      test('should return DateTime when valid ISO string is provided', () {
        // Arrange
        final json = {'createdAt': '2025-01-01T12:00:00.000Z'};

        // Act
        final result = JsonVerificationService.getRequiredDateTime(json, 'createdAt');

        // Assert
        expect(result, isA<DateTime>());
        expect(result.year, equals(2025));
        expect(result.month, equals(1));
        expect(result.day, equals(1));
      });

      test('should throw JsonValidationException when date string is invalid', () {
        // Arrange
        final json = {'createdAt': 'invalid_date'};

        // Act & Assert
        expect(
          () => JsonVerificationService.getRequiredDateTime(json, 'createdAt'),
          throwsA(isA<JsonValidationException>().having(
            (e) => e.invalidTypeFields['createdAt'],
            'invalidTypeFields',
            contains('Invalid date format'),
          )),
        );
      });

      test('should throw JsonValidationException when field is not a string', () {
        // Arrange
        final json = {'createdAt': 123456789};

        // Act & Assert
        expect(
          () => JsonVerificationService.getRequiredDateTime(json, 'createdAt'),
          throwsA(isA<JsonValidationException>()),
        );
      });
    });

    group('getOptionalDateTime', () {
      test('should return DateTime when valid ISO string is provided', () {
        // Arrange
        final json = {'updatedAt': '2025-01-01T12:00:00.000Z'};

        // Act
        final result = JsonVerificationService.getOptionalDateTime(json, 'updatedAt');

        // Assert
        expect(result, isA<DateTime>());
        expect(result!.year, equals(2025));
      });

      test('should return null when field is missing', () {
        // Arrange
        final json = <String, dynamic>{};

        // Act
        final result = JsonVerificationService.getOptionalDateTime(json, 'updatedAt');

        // Assert
        expect(result, isNull);
      });

      test('should return null when field is null', () {
        // Arrange
        final json = {'updatedAt': null};

        // Act
        final result = JsonVerificationService.getOptionalDateTime(json, 'updatedAt');

        // Assert
        expect(result, isNull);
      });

      test('should throw JsonValidationException when date string is invalid', () {
        // Arrange
        final json = {'updatedAt': 'invalid_date'};

        // Act & Assert
        expect(
          () => JsonVerificationService.getOptionalDateTime(json, 'updatedAt'),
          throwsA(isA<JsonValidationException>()),
        );
      });
    });

    group('parseAndValidateJson', () {
      test('should parse valid JSON string', () {
        // Arrange
        const jsonString = '{"name": "Test", "value": 123}';

        // Act
        final result = JsonVerificationService.parseAndValidateJson(jsonString);

        // Assert
        expect(result, equals({'name': 'Test', 'value': 123}));
      });

      test('should throw JsonValidationException for invalid JSON string', () {
        // Arrange
        const invalidJson = '{"name": "Test", "value":}';

        // Act & Assert
        expect(
          () => JsonVerificationService.parseAndValidateJson(invalidJson),
          throwsA(isA<JsonValidationException>().having(
            (e) => e.invalidTypeFields['parsing'],
            'invalidTypeFields',
            contains('Failed to parse JSON'),
          )),
        );
      });

      test('should throw JsonValidationException when JSON is not an object', () {
        // Arrange
        const jsonString = '["not", "an", "object"]';

        // Act & Assert
        expect(
          () => JsonVerificationService.parseAndValidateJson(jsonString),
          throwsA(isA<JsonValidationException>().having(
            (e) => e.invalidTypeFields['root'],
            'invalidTypeFields',
            contains('Expected Map<String, dynamic>'),
          )),
        );
      });
    });

    group('getRequiredObject and getOptionalObject', () {
      test('should return nested object when present', () {
        // Arrange
        final json = {
          'user': {'id': 1, 'name': 'John'}
        };

        // Act
        final result = JsonVerificationService.getRequiredObject(json, 'user');

        // Assert
        expect(result, equals({'id': 1, 'name': 'John'}));
      });

      test('should return null for optional object when missing', () {
        // Arrange
        final json = <String, dynamic>{};

        // Act
        final result = JsonVerificationService.getOptionalObject(json, 'user');

        // Assert
        expect(result, isNull);
      });

      test('should throw exception when required object is missing', () {
        // Arrange
        final json = <String, dynamic>{};

        // Act & Assert
        expect(
          () => JsonVerificationService.getRequiredObject(json, 'user'),
          throwsA(isA<JsonValidationException>()),
        );
      });
    });

    group('Edge Cases and Complex Scenarios', () {
      test('should handle deeply nested JSON validation', () {
        // Arrange
        final json = {
          'project': {
            'name': 'Test Project',
            'tasks': [
              {'id': 1, 'title': 'Task 1'},
              {'id': 2, 'title': 'Task 2'},
            ],
            'metadata': {
              'created': '2025-01-01T00:00:00.000Z',
              'settings': {'autoSave': true}
            }
          }
        };

        // Act
        final project = JsonVerificationService.getRequiredObject(json, 'project');
        final name = JsonVerificationService.getRequiredField<String>(project, 'name');
        final tasks = JsonVerificationService.getRequiredList<Map<String, dynamic>>(project, 'tasks');
        final metadata = JsonVerificationService.getRequiredObject(project, 'metadata');
        final created = JsonVerificationService.getRequiredDateTime(metadata, 'created');

        // Assert
        expect(name, equals('Test Project'));
        expect(tasks, hasLength(2));
        expect(created, isA<DateTime>());
      });

      test('should handle mixed valid and invalid fields in same validation', () {
        // Arrange
        final json = {
          'validField': 'correct',
          'missingField': null,
          'wrongTypeField': 123,
        };
        final requiredFields = {
          'validField': String,
          'missingField': String,
          'wrongTypeField': String,
        };

        // Act & Assert
        expect(
          () => JsonVerificationService.verifyRequiredFields(json, requiredFields),
          throwsA(isA<JsonValidationException>()
            .having((e) => e.missingFields, 'missingFields', contains('missingField'))
            .having((e) => e.invalidTypeFields.keys, 'invalidTypeFields', contains('wrongTypeField'))),
        );
      });

      test('should handle empty lists correctly', () {
        // Arrange
        final json = {'tags': <String>[]};

        // Act
        final result = JsonVerificationService.getRequiredList<String>(json, 'tags');

        // Assert
        expect(result, isEmpty);
      });

      test('should handle number precision correctly', () {
        // Arrange
        final json = {
          'intValue': 42,
          'doubleValue': 42.5,
          'intAsDouble': 42,
        };

        // Act & Assert
        expect(JsonVerificationService.getRequiredField<int>(json, 'intValue'), equals(42));
        expect(JsonVerificationService.getRequiredField<double>(json, 'doubleValue'), equals(42.5));
        expect(JsonVerificationService.getRequiredField<double>(json, 'intAsDouble'), equals(42.0));
      });
    });
  });
}