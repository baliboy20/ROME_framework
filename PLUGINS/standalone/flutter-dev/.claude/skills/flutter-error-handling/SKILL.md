# Flutter Error Handling

**ID**: flutter-error-handling
**Category**: Error Handling

## Purpose

Implement comprehensive error handling patterns using sealed classes, Result types, and error boundaries.

## Inputs

- API error response contracts
- Error scenarios from use cases
- Flutter code (domain, data, presentation layers)

## Outputs

- Result type sealed classes
- Failure types for domain errors
- Error boundary widgets
- Error recovery strategies
- Consistent error messages

## Exception -> Result -> Failure Flow

### Layer 1: Data Sources (Throw Exceptions)
```dart
class UserRemoteDataSource {
  Future<UserModel> getUserProfile(String id) async {
    try {
      final response = await _dio.get('/users/$id');
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      throw ServerException(e.message);
    } on FormatException {
      throw ParsingException('Invalid user data format');
    }
  }
}
```

### Layer 2: Repositories (Catch Exceptions, Return Result)
```dart
class UserRepository implements IUserRepository {
  @override
  Future<Result<UserEntity>> getUserProfile(String id) async {
    try {
      final userModel = await _remoteDataSource.getUserProfile(id);
      return Success(userModel.toEntity());
    } on ServerException catch (e) {
      return Failure('Server error: ${e.message}');
    } on ParsingException catch (e) {
      return Failure('Data error: ${e.message}');
    } on NetworkException {
      return Failure('Network error. Check your connection.');
    } catch (e) {
      return Failure('Unexpected error: $e');
    }
  }
}
```

### Layer 3: BLoCs (Handle Result, Emit States)
```dart
class UserBloc extends Bloc<UserEvent, UserState> {
  Future<void> _onLoadUser(
    LoadUserEvent event,
    Emitter<UserState> emit,
  ) async {
    emit(UserState.loading());

    final result = await _repository.getUserProfile(event.id);

    switch (result) {
      case Success(:final value):
        emit(UserState.loaded(value));
      case Failure(:final message):
        emit(UserState.error(message));
    }
  }
}
```

## Result Type Definition

```dart
// lib/core/utils/result.dart
sealed class Result<T> {
  const Result();
}

class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}

class Failure<T> extends Result<T> {
  final String message;
  final Exception? exception;
  final StackTrace? stackTrace;

  const Failure(
    this.message, [
    this.exception,
    this.stackTrace,
  ]);
}
```

**Pattern Matching with switch:**
```dart
final result = await repository.getData();

switch (result) {
  case Success(value: final data):
    print('Got data: $data');
  case Failure(message: final error, exception: final ex):
    print('Error: $error');
    if (ex != null) logException(ex);
}
```

## Custom Exception Types

```dart
// lib/core/errors/exceptions.dart

// Network exceptions
class NetworkException implements Exception {
  final String message;
  const NetworkException(this.message);
}

class TimeoutException implements Exception {
  final Duration timeout;
  const TimeoutException(this.timeout);
}

// Server exceptions
class ServerException implements Exception {
  final String message;
  final int? statusCode;
  const ServerException(this.message, [this.statusCode]);
}

class AuthException implements Exception {
  final String message;
  const AuthException(this.message);
}

// Data exceptions
class ParsingException implements Exception {
  final String message;
  const ParsingException(this.message);
}

class ValidationException implements Exception {
  final Map<String, String> errors;
  const ValidationException(this.errors);
}

// Cache exceptions
class CacheException implements Exception {
  final String message;
  const CacheException(this.message);
}
```

## Domain Failure Types

```dart
// lib/core/errors/failures.dart

sealed class Failure {
  final String message;
  const Failure(this.message);
}

class NetworkFailure extends Failure {
  const NetworkFailure([String message = 'Network error'])
      : super(message);
}

class ServerFailure extends Failure {
  final int? statusCode;
  const ServerFailure(String message, [this.statusCode])
      : super(message);
}

class ValidationFailure extends Failure {
  final Map<String, String> errors;
  const ValidationFailure(this.errors)
      : super('Validation failed');
}

class CacheFailure extends Failure {
  const CacheFailure([String message = 'Cache error'])
      : super(message);
}

class AuthFailure extends Failure {
  const AuthFailure([String message = 'Authentication failed'])
      : super(message);
}
```

## Error Boundary Widgets

### App-Level Error Boundary
```dart
class App extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ErrorBoundary(
      onError: (error, stackTrace) {
        // Log to crash reporting service
        FirebaseCrashlytics.instance.recordError(error, stackTrace);
      },
      child: MaterialApp(
        home: HomePage(),
      ),
    );
  }
}
```

### Feature-Level Error Boundary
```dart
class UserProfilePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ErrorBoundary(
      onError: (error, stackTrace) {
        logError('UserProfile', error, stackTrace);
      },
      fallback: (error) => ErrorPage(
        title: 'Profile Error',
        message: 'Could not load user profile',
        retry: () => context.read<UserBloc>().add(LoadUserEvent()),
      ),
      child: BlocBuilder<UserBloc, UserState>(
        builder: (context, state) => state.when(
          loaded: (user) => UserProfileView(user),
          error: (error) => ErrorWidget(error),
          loading: () => LoadingWidget(),
        ),
      ),
    );
  }
}
```

### Error Boundary Implementation
```dart
class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(Object error)? fallback;
  final void Function(Object error, StackTrace stackTrace)? onError;

  const ErrorBoundary({
    Key? key,
    required this.child,
    this.fallback,
    this.onError,
  }) : super(key: key);

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  Object? _error;

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return widget.fallback?.call(_error!) ??
          ErrorPage(error: _error!);
    }

    return ErrorCatcher(
      onError: (error, stackTrace) {
        widget.onError?.call(error, stackTrace);
        setState(() => _error = error);
      },
      child: widget.child,
    );
  }
}
```

## Error Recovery Strategies

### 1. Retry with Exponential Backoff
```dart
Future<Result<T>> retryWithBackoff<T>({
  required Future<Result<T>> Function() operation,
  int maxRetries = 3,
  Duration initialDelay = const Duration(seconds: 1),
}) async {
  int attempt = 0;
  Duration delay = initialDelay;

  while (attempt < maxRetries) {
    final result = await operation();

    if (result is Success) return result;

    attempt++;
    if (attempt < maxRetries) {
      await Future.delayed(delay);
      delay *= 2; // Exponential backoff
    }
  }

  return Failure('Operation failed after $maxRetries attempts');
}
```

### 2. Fallback to Cache
```dart
Future<Result<UserEntity>> getUserProfile(String id) async {
  try {
    // Try remote first
    final user = await _remoteDataSource.getUser(id);
    await _localDataSource.cacheUser(user);
    return Success(user);
  } on NetworkException {
    // Fallback to cache
    try {
      final cachedUser = await _localDataSource.getUser(id);
      return Success(cachedUser);
    } on CacheException {
      return Failure('No network and no cached data');
    }
  }
}
```

### 3. Optimistic Updates with Rollback
```dart
Future<Result<void>> updateUserName(String name) async {
  // Save original state
  final originalName = _currentUser.name;

  // Optimistic update
  emit(UserState.loaded(_currentUser.copyWith(name: name)));

  // Try server update
  final result = await _repository.updateUserName(name);

  switch (result) {
    case Success():
      return result; // Success, keep optimistic update
    case Failure():
      // Rollback on failure
      emit(UserState.loaded(_currentUser.copyWith(name: originalName)));
      return result;
  }
}
```

## User-Friendly Error Messages

```dart
String getErrorMessage(Failure failure) {
  return switch (failure) {
    NetworkFailure() => 'No internet connection. Please check your network.',
    ServerFailure(statusCode: 404) => 'Resource not found.',
    ServerFailure(statusCode: 500) => 'Server error. Please try again later.',
    ServerFailure() => 'Something went wrong. Please try again.',
    AuthFailure() => 'Session expired. Please log in again.',
    ValidationFailure(:final errors) => errors.values.join('\n'),
    CacheFailure() => 'Could not load cached data.',
    _ => 'An unexpected error occurred.',
  };
}
```

## Process

1. **Define Exception Types** - Create custom exceptions for data sources
2. **Define Failure Types** - Create domain failures for each error category
3. **Implement Result Type** - Create sealed Result<T> class
4. **Data Source Error Handling** - Throw exceptions from data sources
5. **Repository Error Handling** - Catch exceptions, return Result
6. **BLoC Error Handling** - Handle Result, emit error states
7. **UI Error Display** - Show user-friendly messages
8. **Add Error Boundaries** - Catch uncaught errors in UI
9. **Implement Recovery** - Retry, fallback, rollback strategies
10. **Test Error Paths** - Unit test all error scenarios
