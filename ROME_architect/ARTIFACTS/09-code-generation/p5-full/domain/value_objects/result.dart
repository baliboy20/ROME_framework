/// Result type for error handling
/// Native Dart sealed class - no dartz dependency
sealed class Result<T> {
  const Result();

  /// Fold the result into a single value
  /// Executes onSuccess for Success, onError for Error
  U fold<U>(
    U Function(T value) onSuccess,
    U Function(String error) onError,
  ) {
    return switch (this) {
      Success(value: final value) => onSuccess(value),
      Error(message: final message) => onError(message),
    };
  }

  /// Check if result is success
  bool get isSuccess => this is Success<T>;

  /// Check if result is error
  bool get isError => this is Error<T>;

  /// Get value or null
  T? get valueOrNull {
    return switch (this) {
      Success(value: final value) => value,
      Error() => null,
    };
  }

  /// Get error message or null
  String? get errorOrNull {
    return switch (this) {
      Success() => null,
      Error(message: final message) => message,
    };
  }

  /// Get value or throw
  T get valueOrThrow {
    return switch (this) {
      Success(value: final value) => value,
      Error(message: final message) => throw Exception(message),
    };
  }

  /// Get value or default
  T valueOr(T defaultValue) {
    return switch (this) {
      Success(value: final value) => value,
      Error() => defaultValue,
    };
  }

  /// Map success value
  Result<U> map<U>(U Function(T value) transform) {
    return switch (this) {
      Success(value: final value) => Success(transform(value)),
      Error(message: final message) => Error(message),
    };
  }

  /// FlatMap for chaining operations
  Result<U> flatMap<U>(Result<U> Function(T value) transform) {
    return switch (this) {
      Success(value: final value) => transform(value),
      Error(message: final message) => Error(message),
    };
  }
}

/// Success result with value
final class Success<T> extends Result<T> {
  final T value;

  const Success(this.value);

  @override
  String toString() => 'Success(value: $value)';

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is Success<T> &&
        runtimeType == other.runtimeType &&
        value == other.value;
  }

  @override
  int get hashCode => value.hashCode;
}

/// Error result with message
final class Error<T> extends Result<T> {
  final String message;

  const Error(this.message);

  @override
  String toString() => 'Error(message: $message)';

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is Error<T> &&
        runtimeType == other.runtimeType &&
        message == other.message;
  }

  @override
  int get hashCode => message.hashCode;
}
