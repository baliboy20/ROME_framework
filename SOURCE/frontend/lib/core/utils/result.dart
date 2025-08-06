import '../errors/failures.dart';

/// A simple Result type for handling success/failure scenarios
/// Alternative to using external packages like dartz
abstract class Result<T> {
  const Result();

  /// Create a success result
  factory Result.success(T data) = Success<T>;

  /// Create a failure result
  factory Result.failure(Failure failure) = Error<T>;

  /// Check if result is successful
  bool get isSuccess => this is Success<T>;

  /// Check if result is failure
  bool get isFailure => this is Error<T>;

  /// Get the success data (throws if called on failure)
  T get data {
    if (this is Success<T>) {
      return (this as Success<T>).data;
    }
    throw StateError('Called data on a failure result');
  }

  /// Get the failure (throws if called on success)
  Failure get failure {
    if (this is Error<T>) {
      return (this as Error<T>).failure;
    }
    throw StateError('Called failure on a success result');
  }

  /// Transform the success value while preserving failure
  Result<R> map<R>(R Function(T) transform) {
    if (this is Success<T>) {
      try {
        return Result.success(transform((this as Success<T>).data));
      } catch (e) {
        return Result.failure(UnexpectedFailure(e.toString()));
      }
    }
    return Result.failure((this as Error<T>).failure);
  }

  /// Transform the result into another result (flatMap/bind)
  Result<R> flatMap<R>(Result<R> Function(T) transform) {
    if (this is Success<T>) {
      try {
        return transform((this as Success<T>).data);
      } catch (e) {
        return Result.failure(UnexpectedFailure(e.toString()));
      }
    }
    return Result.failure((this as Error<T>).failure);
  }

  /// Handle both success and failure cases
  R fold<R>(
    R Function(Failure) onFailure,
    R Function(T) onSuccess,
  ) {
    if (this is Success<T>) {
      return onSuccess((this as Success<T>).data);
    }
    return onFailure((this as Error<T>).failure);
  }

  /// Get data or return default value on failure
  T getOrElse(T defaultValue) {
    if (this is Success<T>) {
      return (this as Success<T>).data;
    }
    return defaultValue;
  }

  /// Get data or null on failure
  T? getOrNull() {
    if (this is Success<T>) {
      return (this as Success<T>).data;
    }
    return null;
  }
}

/// Success result containing data
class Success<T> extends Result<T> {
  const Success(this.data);
  
  @override
  final T data;

  @override
  String toString() => 'Success($data)';

  @override
  bool operator ==(Object other) {
    return other is Success<T> && other.data == data;
  }

  @override
  int get hashCode => data.hashCode;
}

/// Error result containing failure
class Error<T> extends Result<T> {
  const Error(this.failure);
  
  @override
  final Failure failure;

  @override
  String toString() => 'Error($failure)';

  @override
  bool operator ==(Object other) {
    return other is Error<T> && other.failure == failure;
  }

  @override
  int get hashCode => failure.hashCode;
}

/// Extension for working with nullable values
extension NullableResult<T> on T? {
  /// Convert nullable to Result
  Result<T> toResult(Failure failure) {
    final value = this;
    return value != null ? Result.success(value) : Result.failure(failure);
  }
}

/// Extension for working with futures
extension FutureResult<T> on Future<T> {
  /// Convert Future to Future<Result>
  Future<Result<T>> toResult() async {
    try {
      final data = await this;
      return Result.success(data);
    } catch (e) {
      return Result.failure(UnexpectedFailure(e.toString()));
    }
  }
}