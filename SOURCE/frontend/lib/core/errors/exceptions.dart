/// Base exception class for all application exceptions
abstract class AppException implements Exception {
  const AppException(this.message);
  
  final String message;

  @override
  String toString() => 'AppException: $message';
}

/// Exception thrown when server returns an error response
class ServerException extends AppException {
  const ServerException(super.message, {this.statusCode});
  
  final int? statusCode;

  @override
  String toString() => 'ServerException: $message${statusCode != null ? ' (Status: $statusCode)' : ''}';
}

/// Exception thrown when network request fails
class NetworkException extends AppException {
  const NetworkException(super.message);

  @override
  String toString() => 'NetworkException: $message';
}

/// Exception thrown when caching operation fails
class CacheException extends AppException {
  const CacheException(super.message);

  @override
  String toString() => 'CacheException: $message';
}

/// Exception thrown when JSON validation fails
class JsonValidationException extends AppException {
  JsonValidationException({
    required this.objectName,
    required this.missingFields,
    required this.invalidTypeFields,
  }) : super(_buildMessage(objectName, missingFields, invalidTypeFields));

  final String objectName;
  final List<String> missingFields;
  final Map<String, String> invalidTypeFields;

  static String _buildMessage(
    String objectName,
    List<String> missingFields,
    Map<String, String> invalidTypeFields,
  ) {
    final buffer = StringBuffer('JSON validation failed for $objectName:');
    
    if (missingFields.isNotEmpty) {
      buffer.write('\n  Missing required fields: ${missingFields.join(', ')}');
    }
    
    if (invalidTypeFields.isNotEmpty) {
      buffer.write('\n  Invalid field types:');
      for (final entry in invalidTypeFields.entries) {
        buffer.write('\n    ${entry.key}: ${entry.value}');
      }
    }
    
    return buffer.toString();
  }

  @override
  String toString() => 'JsonValidationException: $message';
}

/// Exception thrown when file operations fail
class FileException extends AppException {
  const FileException(super.message, {this.path});
  
  final String? path;

  @override
  String toString() => 'FileException: $message${path != null ? ' (Path: $path)' : ''}';
}

/// Exception thrown when file picker operations fail
class FilePickerException extends AppException {
  const FilePickerException(super.message);

  @override
  String toString() => 'FilePickerException: $message';
}

/// Exception thrown when authentication fails
class AuthenticationException extends AppException {
  const AuthenticationException(super.message);

  @override
  String toString() => 'AuthenticationException: $message';
}

/// Exception thrown when authorization fails
class AuthorizationException extends AppException {
  const AuthorizationException(super.message);

  @override
  String toString() => 'AuthorizationException: $message';
}

/// Exception thrown when input validation fails
class ValidationException extends AppException {
  const ValidationException(super.message, {this.field});
  
  final String? field;

  @override
  String toString() => 'ValidationException: $message${field != null ? ' (Field: $field)' : ''}';
}