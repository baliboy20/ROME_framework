import '../error/failures.dart';

/// A native Dart sealed [Result] — no `dartz`. Repositories return
/// `Future<Result<T>>`; only data sources throw. Blocs pattern-match with a
/// `switch` (DDD error-flow contract, expert_flutter §error-handling).
sealed class Result<T> {
  const Result();

  /// Fold both branches into a single value.
  R fold<R>(R Function(Failure failure) onError, R Function(T value) onSuccess);

  /// The success value, or `null` if this is an [Error].
  T? get valueOrNull => switch (this) {
        Success<T>(:final value) => value,
        Error<T>() => null,
      };

  bool get isSuccess => this is Success<T>;
  bool get isError => this is Error<T>;
}

class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);

  @override
  R fold<R>(R Function(Failure failure) onError, R Function(T value) onSuccess) =>
      onSuccess(value);
}

class Error<T> extends Result<T> {
  final Failure failure;
  const Error(this.failure);

  @override
  R fold<R>(R Function(Failure failure) onError, R Function(T value) onSuccess) =>
      onError(failure);
}
