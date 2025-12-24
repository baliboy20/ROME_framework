import 'package:json_validation/json_validation.dart';

/// Validator: UserValidator
/// Validates Parse Server JSON responses for User
class UserValidator {
  static final schema = Schema({
    'id': [isString],
    'email': [isString, isEmail],
    'username': [isString, minLength(3), maxLength(50)],
  });

  /// Validate Parse JSON response
  static ValidationResult validate(Map<String, dynamic> json) {
    return schema.validate(json);
  }

  /// Validate and throw if invalid
  static void validateOrThrow(Map<String, dynamic> json) {
    final result = validate(json);
    if (!result.isValid) {
      throw ValidationException(
        'Invalid User data: ${result.errors.join(', ')}',
      );
    }
  }

  /// Validate list of Users
  static List<ValidationResult> validateList(List<Map<String, dynamic>> jsonList) {
    return jsonList.map((json) => validate(json)).toList();
  }
}

/// Exception thrown on validation failure
class ValidationException implements Exception {
  final String message;

  ValidationException(this.message);

  @override
  String toString() => 'ValidationException: $message';
}
