import 'dart:convert';
import '../errors/exceptions.dart';

/// Comprehensive JSON verification service for API responses
/// Handles null/optional field validation and type checking without code generation
class JsonVerificationService {
  /// Verifies that a JSON object contains required fields with correct types
  static void verifyRequiredFields(
    Map<String, dynamic> json,
    Map<String, Type> requiredFields, {
    String? objectName,
  }) {
    final missingFields = <String>[];
    final invalidTypeFields = <String, String>[];

    for (final entry in requiredFields.entries) {
      final fieldName = entry.key;
      final expectedType = entry.value;

      if (!json.containsKey(fieldName)) {
        missingFields.add(fieldName);
        continue;
      }

      final value = json[fieldName];
      if (value == null) {
        missingFields.add(fieldName);
        continue;
      }

      if (!_isCorrectType(value, expectedType)) {
        invalidTypeFields[fieldName] = 
            'Expected ${expectedType.toString()}, got ${value.runtimeType}';
      }
    }

    if (missingFields.isNotEmpty || invalidTypeFields.isNotEmpty) {
      throw JsonValidationException(
        objectName: objectName ?? 'JSON object',
        missingFields: missingFields,
        invalidTypeFields: invalidTypeFields,
      );
    }
  }

  /// Verifies optional fields have correct types when present
  static void verifyOptionalFields(
    Map<String, dynamic> json,
    Map<String, Type> optionalFields, {
    String? objectName,
  }) {
    final invalidTypeFields = <String, String>[];

    for (final entry in optionalFields.entries) {
      final fieldName = entry.key;
      final expectedType = entry.value;

      if (!json.containsKey(fieldName)) continue;

      final value = json[fieldName];
      if (value == null) continue; // null is allowed for optional fields

      if (!_isCorrectType(value, expectedType)) {
        invalidTypeFields[fieldName] = 
            'Expected ${expectedType.toString()}, got ${value.runtimeType}';
      }
    }

    if (invalidTypeFields.isNotEmpty) {
      throw JsonValidationException(
        objectName: objectName ?? 'JSON object',
        missingFields: [],
        invalidTypeFields: invalidTypeFields,
      );
    }
  }

  /// Safely extracts a required field with type checking
  static T getRequiredField<T>(
    Map<String, dynamic> json,
    String fieldName, {
    String? objectName,
  }) {
    if (!json.containsKey(fieldName)) {
      throw JsonValidationException(
        objectName: objectName ?? 'JSON object',
        missingFields: [fieldName],
        invalidTypeFields: {},
      );
    }

    final value = json[fieldName];
    if (value == null) {
      throw JsonValidationException(
        objectName: objectName ?? 'JSON object',
        missingFields: [fieldName],
        invalidTypeFields: {},
      );
    }

    if (value is T) {
      return value;
    }

    throw JsonValidationException(
      objectName: objectName ?? 'JSON object',
      missingFields: [],
      invalidTypeFields: {
        fieldName: 'Expected ${T.toString()}, got ${value.runtimeType}'
      },
    );
  }

  /// Safely extracts an optional field with type checking
  static T? getOptionalField<T>(
    Map<String, dynamic> json,
    String fieldName, {
    String? objectName,
  }) {
    if (!json.containsKey(fieldName)) {
      return null;
    }

    final value = json[fieldName];
    if (value == null) {
      return null;
    }

    if (value is T) {
      return value;
    }

    throw JsonValidationException(
      objectName: objectName ?? 'JSON object',
      missingFields: [],
      invalidTypeFields: {
        fieldName: 'Expected ${T.toString()}, got ${value.runtimeType}'
      },
    );
  }

  /// Extracts optional field with default value
  static T getFieldWithDefault<T>(
    Map<String, dynamic> json,
    String fieldName,
    T defaultValue, {
    String? objectName,
  }) {
    final value = getOptionalField<T>(json, fieldName, objectName: objectName);
    return value ?? defaultValue;
  }

  /// Validates a list field with element type checking
  static List<T> getRequiredList<T>(
    Map<String, dynamic> json,
    String fieldName, {
    String? objectName,
  }) {
    final rawList = getRequiredField<List<dynamic>>(
      json, 
      fieldName, 
      objectName: objectName,
    );

    final result = <T>[];
    for (int i = 0; i < rawList.length; i++) {
      final element = rawList[i];
      if (element is T) {
        result.add(element);
      } else {
        throw JsonValidationException(
          objectName: objectName ?? 'JSON object',
          missingFields: [],
          invalidTypeFields: {
            '$fieldName[$i]': 'Expected ${T.toString()}, got ${element.runtimeType}'
          },
        );
      }
    }

    return result;
  }

  /// Validates an optional list field
  static List<T>? getOptionalList<T>(
    Map<String, dynamic> json,
    String fieldName, {
    String? objectName,
  }) {
    final rawList = getOptionalField<List<dynamic>>(
      json, 
      fieldName, 
      objectName: objectName,
    );

    if (rawList == null) return null;

    final result = <T>[];
    for (int i = 0; i < rawList.length; i++) {
      final element = rawList[i];
      if (element is T) {
        result.add(element);
      } else {
        throw JsonValidationException(
          objectName: objectName ?? 'JSON object',
          missingFields: [],
          invalidTypeFields: {
            '$fieldName[$i]': 'Expected ${T.toString()}, got ${element.runtimeType}'
          },
        );
      }
    }

    return result;
  }

  /// Validates a nested object field
  static Map<String, dynamic> getRequiredObject(
    Map<String, dynamic> json,
    String fieldName, {
    String? objectName,
  }) {
    return getRequiredField<Map<String, dynamic>>(
      json, 
      fieldName, 
      objectName: objectName,
    );
  }

  /// Validates an optional nested object field
  static Map<String, dynamic>? getOptionalObject(
    Map<String, dynamic> json,
    String fieldName, {
    String? objectName,
  }) {
    return getOptionalField<Map<String, dynamic>>(
      json, 
      fieldName, 
      objectName: objectName,
    );
  }

  /// Validates date string and converts to DateTime
  static DateTime getRequiredDateTime(
    Map<String, dynamic> json,
    String fieldName, {
    String? objectName,
  }) {
    final dateString = getRequiredField<String>(json, fieldName, objectName: objectName);
    try {
      return DateTime.parse(dateString);
    } catch (e) {
      throw JsonValidationException(
        objectName: objectName ?? 'JSON object',
        missingFields: [],
        invalidTypeFields: {
          fieldName: 'Invalid date format: $dateString'
        },
      );
    }
  }

  /// Validates optional date string and converts to DateTime
  static DateTime? getOptionalDateTime(
    Map<String, dynamic> json,
    String fieldName, {
    String? objectName,
  }) {
    final dateString = getOptionalField<String>(json, fieldName, objectName: objectName);
    if (dateString == null) return null;
    
    try {
      return DateTime.parse(dateString);
    } catch (e) {
      throw JsonValidationException(
        objectName: objectName ?? 'JSON object',
        missingFields: [],
        invalidTypeFields: {
          fieldName: 'Invalid date format: $dateString'
        },
      );
    }
  }

  /// Parses and validates JSON string
  static Map<String, dynamic> parseAndValidateJson(
    String jsonString, {
    String? objectName,
  }) {
    try {
      final decoded = jsonDecode(jsonString);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      } else {
        throw JsonValidationException(
          objectName: objectName ?? 'JSON object',
          missingFields: [],
          invalidTypeFields: {
            'root': 'Expected Map<String, dynamic>, got ${decoded.runtimeType}'
          },
        );
      }
    } catch (e) {
      if (e is JsonValidationException) rethrow;
      throw JsonValidationException(
        objectName: objectName ?? 'JSON object',
        missingFields: [],
        invalidTypeFields: {
          'parsing': 'Failed to parse JSON: ${e.toString()}'
        },
      );
    }
  }

  /// Internal helper to check if value matches expected type
  static bool _isCorrectType(dynamic value, Type expectedType) {
    switch (expectedType) {
      case String:
        return value is String;
      case int:
        return value is int;
      case double:
        return value is double || value is int; // int can be converted to double
      case bool:
        return value is bool;
      case List<dynamic>:
        return value is List;
      case Map<String, dynamic>:
        return value is Map<String, dynamic>;
      default:
        return value.runtimeType == expectedType;
    }
  }
}