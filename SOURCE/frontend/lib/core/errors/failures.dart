import 'package:equatable/equatable.dart';

/// Base failure class for all domain layer failures
abstract class Failure extends Equatable {
  const Failure(this.message);
  
  final String message;

  @override
  List<Object?> get props => [message];

  @override
  String toString() => 'Failure: $message';
}

/// Failure when server returns an error response
class ServerFailure extends Failure {
  const ServerFailure(super.message, {this.statusCode});
  
  final int? statusCode;

  @override
  List<Object?> get props => [message, statusCode];

  @override
  String toString() => 'ServerFailure: $message${statusCode != null ? ' (Status: $statusCode)' : ''}';
}

/// Failure when network request fails
class NetworkFailure extends Failure {
  const NetworkFailure(super.message);

  @override
  String toString() => 'NetworkFailure: $message';
}

/// Failure when caching operation fails
class CacheFailure extends Failure {
  const CacheFailure(super.message);

  @override
  String toString() => 'CacheFailure: $message';
}

/// Failure when JSON validation fails
class JsonValidationFailure extends Failure {
  const JsonValidationFailure(super.message, {
    required this.objectName,
    required this.missingFields,
    required this.invalidTypeFields,
  });

  final String objectName;
  final List<String> missingFields;
  final Map<String, String> invalidTypeFields;

  @override
  List<Object?> get props => [message, objectName, missingFields, invalidTypeFields];

  @override
  String toString() => 'JsonValidationFailure: $message';
}

/// Failure when file operations fail
class FileFailure extends Failure {
  const FileFailure(super.message, {this.path});
  
  final String? path;

  @override
  List<Object?> get props => [message, path];

  @override
  String toString() => 'FileFailure: $message${path != null ? ' (Path: $path)' : ''}';
}

/// Failure when authentication fails
class AuthenticationFailure extends Failure {
  const AuthenticationFailure(super.message);

  @override
  String toString() => 'AuthenticationFailure: $message';
}

/// Failure when authorization fails
class AuthorizationFailure extends Failure {
  const AuthorizationFailure(super.message);

  @override
  String toString() => 'AuthorizationFailure: $message';
}

/// Failure when input validation fails
class ValidationFailure extends Failure {
  const ValidationFailure(super.message, {this.field});
  
  final String? field;

  @override
  List<Object?> get props => [message, field];

  @override
  String toString() => 'ValidationFailure: $message${field != null ? ' (Field: $field)' : ''}';
}

/// Failure when unexpected error occurs
class UnexpectedFailure extends Failure {
  const UnexpectedFailure(super.message);

  @override
  String toString() => 'UnexpectedFailure: $message';
}