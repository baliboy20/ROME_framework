import 'package:json_validation/json_validation.dart';

/// Validator: ProductValidator
/// Validates Parse Server JSON responses for Product
class ProductValidator {
  static final schema = Schema({
    'id': [isString],
    'name': [isString],
    'price': [isDouble, min(0)],
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
        'Invalid Product data: ${result.errors.join(', ')}',
      );
    }
  }

  /// Validate list of Products
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
