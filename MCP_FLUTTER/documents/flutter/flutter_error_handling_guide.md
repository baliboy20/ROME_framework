# Flutter Error Handling & Exception Management Guide v1.0.0

## Overview

This guide provides comprehensive patterns, examples, and best practices for building robust error handling into Flutter applications using the ROME methodology and test-driven development approach.

### Version Information
- **Version:** 1.0.0
- **Last Updated:** August 7, 2025
- **Compatible with:** Flutter 3.16.0+, Dart 3.0.0+
- **Status:** Production Ready

### Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-08-07 | Initial release with comprehensive error handling patterns, exception hierarchy, UI components, and ROME integration |

## Table of Contents

1. [Error Handling Philosophy](#1-error-handling-philosophy)
2. [Exception Hierarchy](#2-exception-hierarchy)
3. [Error Propagation Patterns](#3-error-propagation-patterns)
4. [User-Facing Error Handling](#4-user-facing-error-handling)
5. [Advanced Recovery Strategies](#5-advanced-recovery-strategies)
6. [Testing Error Scenarios](#6-testing-error-scenarios)
7. [Logging & Monitoring](#7-logging--monitoring)
8. [TDD-ROME Integration](#8-tdd-rome-integration)

## 1. Error Handling Philosophy

### Core Principles
- **Fail Fast, Recover Gracefully**: Detect errors early but provide recovery paths
- **Domain-Specific Exceptions**: Create typed exceptions that match your business domain
- **Error Boundaries**: Contain errors at appropriate architectural boundaries
- **User-Friendly Messaging**: Translate technical errors to actionable user messages

### Error Classification

| Error Type | Description | Example | Handling Strategy |
|------------|-------------|---------|-------------------|
| **Network Errors** | API, connectivity issues | Timeouts, 404s | Retry, offline fallback |
| **Data Errors** | Parsing, validation issues | Invalid JSON | Graceful degradation |
| **State Errors** | Unexpected app state | Null references | Default values, recovery |
| **Platform Errors** | OS, permission issues | Camera access denied | Alternative workflows |
| **Business Logic Errors** | Domain rule violations | Insufficient funds | Clear user feedback |

## 2. Exception Hierarchy

### Recommended Structure

```dart
/// Base class for all application errors
abstract class AppError implements Exception {
  final String message;
  final String? code;
  final StackTrace? stackTrace;
  
  const AppError(this.message, {this.code, this.stackTrace});
  
  /// User-friendly message that can be displayed in UI
  String get userFriendlyMessage;
  
  /// Whether this error allows retry
  bool get isRetryable => false;
}

/// Network-related errors
class NetworkError extends AppError {
  final int? statusCode;
  
  const NetworkError(
    String message, {
    this.statusCode,
    String? code,
    StackTrace? stackTrace,
  }) : super(message, code: code, stackTrace: stackTrace);
  
  factory NetworkError.fromDioException(DioException e) {
    final statusCode = e.response?.statusCode;
    final message = switch (e.type) {
      DioExceptionType.connectionTimeout => 'Connection timeout',
      DioExceptionType.sendTimeout => 'Send timeout',
      DioExceptionType.receiveTimeout => 'Receive timeout',
      DioExceptionType.badResponse => 'Bad response: ${statusCode ?? "unknown"}',
      DioExceptionType.cancel => 'Request cancelled',
      _ => 'Network error: ${e.message}'
    };
    
    return NetworkError(
      message,
      statusCode: statusCode,
      code: 'NETWORK_${e.type.name.toUpperCase()}',
      stackTrace: e.stackTrace,
    );
  }
  
  @override
  String get userFriendlyMessage => statusCode == null
      ? 'Unable to connect to the server. Please check your internet connection.'
      : 'There was a problem connecting to the server. Please try again later.';
  
  @override
  bool get isRetryable => statusCode == null || statusCode! >= 500;
}

/// Data parsing or validation errors
class DataError extends AppError {
  const DataError(
    String message, {
    String? code,
    StackTrace? stackTrace,
  }) : super(message, code: code, stackTrace: stackTrace);
  
  @override
  String get userFriendlyMessage => 
    'There was a problem processing the data. Please try again later.';
}

/// Authentication and authorization errors
class AuthError extends AppError {
  final AuthErrorType type;
  
  const AuthError(
    this.type, {
    String? message,
    String? code,
    StackTrace? stackTrace,
  }) : super(message ?? type.defaultMessage, code: code, stackTrace: stackTrace);
  
  @override
  String get userFriendlyMessage => switch (type) {
    AuthErrorType.unauthorized => 'Please log in to continue.',
    AuthErrorType.forbidden => 'You don\'t have permission to access this resource.',
    AuthErrorType.invalidCredentials => 'Invalid username or password.',
    AuthErrorType.sessionExpired => 'Your session has expired. Please log in again.',
    AuthErrorType.other => 'Authentication error. Please try again.'
  };
  
  @override
  bool get isRetryable => type == AuthErrorType.sessionExpired;
}

enum AuthErrorType {
  unauthorized,
  forbidden,
  invalidCredentials,
  sessionExpired,
  other;
  
  String get defaultMessage => switch (this) {
    unauthorized => 'Unauthorized',
    forbidden => 'Forbidden',
    invalidCredentials => 'Invalid credentials',
    sessionExpired => 'Session expired',
    other => 'Authentication error'
  };
}
```

### Exception Mapping Strategy

```dart
// Example: Mapping repository exceptions to domain errors
class UserRepositoryImpl implements UserRepository {
  final ApiClient _apiClient;
  
  UserRepositoryImpl(this._apiClient);
  
  @override
  Future<Result<User>> getUserProfile() async {
    try {
      final response = await _apiClient.get('/user/profile');
      return Result.success(UserDto.fromJson(response.data).toDomain());
    } on DioException catch (e) {
      // Map DioException to our custom NetworkError
      final statusCode = e.response?.statusCode;
      
      if (statusCode == 401 || statusCode == 403) {
        return Result.failure(AuthError(
          statusCode == 401 
              ? AuthErrorType.unauthorized 
              : AuthErrorType.forbidden,
          code: 'AUTH_ERROR_$statusCode',
        ));
      }
      
      return Result.failure(NetworkError.fromDioException(e));
    } on FormatException catch (e) {
      return Result.failure(DataError(
        'Failed to parse user profile: ${e.message}',
        code: 'DATA_PARSING_ERROR',
      ));
    } catch (e, stackTrace) {
      return Result.failure(AppError(
        'Unexpected error: ${e.toString()}',
        code: 'UNEXPECTED_ERROR',
        stackTrace: stackTrace,
      ));
    }
  }
}
```

## 3. Error Propagation Patterns

### Result Pattern

```dart
/// Generic result class for handling success and failure
class Result<T> {
  final T? _data;
  final AppError? _error;

  const Result._({T? data, AppError? error})
      : _data = data,
        _error = error;

  /// Creates a success result with the given [data]
  const Result.success(T data) : this._(data: data);

  /// Creates a failure result with the given [error]
  const Result.failure(AppError error) : this._(error: error);

  /// Whether this result is a success
  bool get isSuccess => _error == null;

  /// Whether this result is a failure
  bool get isFailure => _error != null;

  /// Gets the data if this is a success, throws the error otherwise
  T get data {
    if (isFailure) {
      throw _error!;
    }
    return _data as T;
  }

  /// Gets the error if this is a failure, throws otherwise
  AppError get error {
    if (isSuccess) {
      throw Exception('Cannot get error from success result');
    }
    return _error!;
  }

  /// Maps this result to a new result with the given function
  Result<R> map<R>(R Function(T data) mapper) {
    if (isSuccess) {
      return Result.success(mapper(data));
    } else {
      return Result.failure(error);
    }
  }

  /// Handles both success and failure cases with different functions
  R fold<R>(
    R Function(T data) onSuccess,
    R Function(AppError error) onFailure,
  ) {
    if (isSuccess) {
      return onSuccess(data);
    } else {
      return onFailure(error);
    }
  }

  /// Handles only the success case, returns the result unchanged otherwise
  Result<T> onSuccess(void Function(T data) action) {
    if (isSuccess) {
      action(data);
    }
    return this;
  }

  /// Handles only the failure case, returns the result unchanged otherwise
  Result<T> onFailure(void Function(AppError error) action) {
    if (isFailure) {
      action(error);
    }
    return this;
  }
}
```

### Error Propagation in Repositories

```dart
// Repository layer with error propagation
class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;
  final SecureStorage _secureStorage;
  
  AuthRepositoryImpl(this._apiClient, this._secureStorage);
  
  @override
  Future<Result<User>> login(String email, String password) async {
    try {
      final response = await _apiClient.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      
      final token = response.data['token'];
      await _secureStorage.write(key: 'auth_token', value: token);
      
      final user = UserDto.fromJson(response.data['user']).toDomain();
      return Result.success(user);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return Result.failure(AuthError(
          AuthErrorType.invalidCredentials,
          message: 'Invalid email or password',
        ));
      }
      return Result.failure(NetworkError.fromDioException(e));
    } catch (e, stackTrace) {
      return Result.failure(AppError(
        'Login failed: ${e.toString()}',
        stackTrace: stackTrace,
      ));
    }
  }
}
```

### Error Handling in Use Cases (Domain Layer)

```dart
// Use case with error propagation
class LoginUseCase {
  final AuthRepository _authRepository;
  final UserPreferences _userPreferences;
  
  LoginUseCase(this._authRepository, this._userPreferences);
  
  Future<Result<User>> execute(String email, String password) async {
    // Validate inputs
    if (email.isEmpty || !email.contains('@')) {
      return Result.failure(ValidationError(
        'Please enter a valid email address',
        code: 'INVALID_EMAIL',
      ));
    }
    
    if (password.isEmpty || password.length < 6) {
      return Result.failure(ValidationError(
        'Password must be at least 6 characters',
        code: 'INVALID_PASSWORD',
      ));
    }
    
    // Delegate to repository
    final result = await _authRepository.login(email, password);
    
    // Additional post-processing on success
    return result.onSuccess((user) async {
      await _userPreferences.setLastLoginTime(DateTime.now());
    });
  }
}
```

## 4. User-Facing Error Handling

### Error Presentation Widgets

```dart
// Reusable error display widget
class ErrorView extends StatelessWidget {
  final AppError error;
  final VoidCallback? onRetry;
  
  const ErrorView({
    Key? key,
    required this.error,
    this.onRetry,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _getIconForError(error),
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              error.userFriendlyMessage,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            if (error.isRetryable && onRetry != null) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
  
  IconData _getIconForError(AppError error) {
    return switch (error.runtimeType) {
      NetworkError => Icons.cloud_off,
      AuthError => Icons.lock,
      ValidationError => Icons.error_outline,
      _ => Icons.error,
    };
  }
}
```

### Error Handling in Bloc/Cubit

```dart
// Example: Error handling in a login Bloc
part 'login_event.dart';
part 'login_state.dart';

class LoginBloc extends Bloc<LoginEvent, LoginState> {
  final LoginUseCase _loginUseCase;
  
  LoginBloc(this._loginUseCase) : super(LoginInitial()) {
    on<LoginSubmitted>(_onLoginSubmitted);
  }
  
  Future<void> _onLoginSubmitted(
    LoginSubmitted event,
    Emitter<LoginState> emit,
  ) async {
    emit(LoginLoading());
    
    final result = await _loginUseCase.execute(
      event.email,
      event.password,
    );
    
    result.fold(
      (user) => emit(LoginSuccess(user)),
      (error) => emit(LoginFailure(error)),
    );
  }
}

// Usage in UI
BlocBuilder<LoginBloc, LoginState>(
  builder: (context, state) {
    return switch (state) {
      LoginInitial() => _buildLoginForm(context),
      LoginLoading() => const CircularProgressIndicator(),
      LoginSuccess() => const Text('Login successful!'),
      LoginFailure(error: final error) => ErrorView(
          error: error,
          onRetry: error.isRetryable
              ? () => context.read<LoginBloc>().add(
                    LoginSubmitted(email, password),
                  )
              : null,
        ),
    };
  },
)
```

### Snackbar and Dialog Error Presentation

```dart
// Utility for showing error messages
class ErrorPresenter {
  static void showError(BuildContext context, AppError error) {
    // For transient errors, use a snackbar
    if (_shouldShowAsSnackbar(error)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.userFriendlyMessage),
          backgroundColor: Theme.of(context).colorScheme.error,
          action: error.isRetryable
              ? SnackBarAction(
                  label: 'Retry',
                  onPressed: () {
                    // Handle retry action
                  },
                )
              : null,
        ),
      );
      return;
    }
    
    // For critical errors, use a dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_getTitleForError(error)),
        content: Text(error.userFriendlyMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
          if (error.isRetryable)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Handle retry action
              },
              child: const Text('Try Again'),
            ),
        ],
      ),
    );
  }
  
  static bool _shouldShowAsSnackbar(AppError error) {
    // Transient errors that don't block the user workflow
    return error is NetworkError && error.statusCode != 401 && error.statusCode != 403;
  }
  
  static String _getTitleForError(AppError error) {
    return switch (error.runtimeType) {
      AuthError => 'Authentication Error',
      NetworkError => 'Connection Error',
      ValidationError => 'Validation Error',
      _ => 'Error',
    };
  }
}
```

## 5. Advanced Recovery Strategies

### Retry Mechanism

```dart
/// Retry utility for handling network operations
Future<T> withRetry<T>({
  required Future<T> Function() operation,
  required bool Function(Exception e) shouldRetry,
  int maxRetries = 3,
  Duration initialDelay = const Duration(milliseconds: 200),
}) async {
  int attempts = 0;
  Duration delay = initialDelay;
  
  while (true) {
    try {
      attempts++;
      return await operation();
    } on Exception catch (e) {
      if (attempts >= maxRetries || !shouldRetry(e)) {
        rethrow;
      }
      
      // Exponential backoff
      await Future.delayed(delay);
      delay *= 2;
    }
  }
}

// Usage example
Future<Result<List<Product>>> fetchProducts() async {
  return withRetry(
    operation: () => _apiClient.get('/products'),
    shouldRetry: (e) => e is DioException && 
        (e.type == DioExceptionType.connectionTimeout || 
         e.response?.statusCode == 500),
    maxRetries: 3,
  ).then(
    (response) => Result.success(
      (response.data as List)
          .map((json) => ProductDto.fromJson(json).toDomain())
          .toList(),
    ),
  ).catchError(
    (e, stackTrace) {
      if (e is DioException) {
        return Result.failure(NetworkError.fromDioException(e));
      }
      return Result.failure(AppError(
        'Failed to fetch products: ${e.toString()}',
        stackTrace: stackTrace,
      ));
    },
  );
}
```

### Circuit Breaker Pattern

```dart
/// Circuit breaker to prevent repeated calls to failing services
class CircuitBreaker {
  final Duration resetTimeout;
  final int failureThreshold;
  
  CircuitBreakerState _state = CircuitBreakerState.closed;
  int _failureCount = 0;
  DateTime? _lastFailureTime;
  
  CircuitBreaker({
    this.resetTimeout = const Duration(seconds: 30),
    this.failureThreshold = 5,
  });
  
  Future<T> execute<T>(Future<T> Function() operation) async {
    // Check if we should attempt to reset the circuit breaker
    if (_state == CircuitBreakerState.open) {
      final timeSinceLastFailure = DateTime.now().difference(_lastFailureTime!);
      if (timeSinceLastFailure >= resetTimeout) {
        _state = CircuitBreakerState.halfOpen;
      } else {
        throw CircuitBreakerOpenException(
          'Circuit is open. Try again after ${resetTimeout.inSeconds - timeSinceLastFailure.inSeconds} seconds',
        );
      }
    }
    
    try {
      final result = await operation();
      
      // If successful and in half-open state, reset the circuit
      if (_state == CircuitBreakerState.halfOpen) {
        _reset();
      }
      
      return result;
    } catch (e) {
      _recordFailure();
      rethrow;
    }
  }
  
  void _recordFailure() {
    _lastFailureTime = DateTime.now();
    _failureCount++;
    
    if (_state == CircuitBreakerState.halfOpen || 
        _failureCount >= failureThreshold) {
      _state = CircuitBreakerState.open;
    }
  }
  
  void _reset() {
    _state = CircuitBreakerState.closed;
    _failureCount = 0;
    _lastFailureTime = null;
  }
}

enum CircuitBreakerState {
  closed,    // Normal operation
  open,      // Not allowing any operations
  halfOpen,  // Testing if service is back online
}

class CircuitBreakerOpenException implements Exception {
  final String message;
  CircuitBreakerOpenException(this.message);
  
  @override
  String toString() => 'CircuitBreakerOpenException: $message';
}

// Usage example
final circuitBreaker = CircuitBreaker(
  resetTimeout: const Duration(seconds: 30),
  failureThreshold: 3,
);

Future<Result<User>> getUserProfile() async {
  try {
    return await circuitBreaker.execute(() async {
      final response = await _apiClient.get('/user/profile');
      return Result.success(UserDto.fromJson(response.data).toDomain());
    });
  } on CircuitBreakerOpenException catch (e) {
    return Result.failure(ServiceUnavailableError(
      'Service temporarily unavailable. Please try again later.',
      code: 'CIRCUIT_OPEN',
    ));
  } catch (e) {
    // Handle other exceptions
    return Result.failure(AppError('Failed to get user profile'));
  }
}
```

### Fallback Strategy

```dart
/// Provides fallback values when operations fail
Future<T> withFallback<T>({
  required Future<T> Function() primary,
  required Future<T> Function() fallback,
}) async {
  try {
    return await primary();
  } catch (_) {
    return await fallback();
  }
}

// Usage example
Future<Result<List<Product>>> getProducts() async {
  return withFallback(
    primary: () => _remoteDataSource.getProducts(),
    fallback: () => _localDataSource.getCachedProducts(),
  );
}
```

## 6. Testing Error Scenarios

### Unit Testing Error Handling

```dart
// Example: Testing error handling in a repository
void main() {
  group('UserRepository', () {
    late UserRepositoryImpl repository;
    late MockApiClient mockApiClient;
    
    setUp(() {
      mockApiClient = MockApiClient();
      repository = UserRepositoryImpl(mockApiClient);
    });
    
    test('should return NetworkError when API call fails with connection error', () async {
      // Arrange
      when(() => mockApiClient.get(any())).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/user/profile'),
          type: DioExceptionType.connectionTimeout,
        ),
      );
      
      // Act
      final result = await repository.getUserProfile();
      
      // Assert
      expect(result.isFailure, true);
      expect(result.error, isA<NetworkError>());
      expect((result.error as NetworkError).isRetryable, true);
    });
    
    test('should return AuthError when API returns 401', () async {
      // Arrange
      when(() => mockApiClient.get(any())).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/user/profile'),
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 401,
            requestOptions: RequestOptions(path: '/user/profile'),
          ),
        ),
      );
      
      // Act
      final result = await repository.getUserProfile();
      
      // Assert
      expect(result.isFailure, true);
      expect(result.error, isA<AuthError>());
      expect((result.error as AuthError).type, AuthErrorType.unauthorized);
    });
    
    test('should return DataError when parsing fails', () async {
      // Arrange
      when(() => mockApiClient.get(any())).thenAnswer((_) async => 
        Response(
          data: {'invalid': 'data'}, // Missing required fields
          statusCode: 200,
          requestOptions: RequestOptions(path: '/user/profile'),
        ),
      );
      
      // Act
      final result = await repository.getUserProfile();
      
      // Assert
      expect(result.isFailure, true);
      expect(result.error, isA<DataError>());
    });
  });
}
```

### Widget Testing Error UI

```dart
testWidgets('should show error view when state is error', (tester) async {
  // Arrange
  final mockError = NetworkError(
    'Connection timeout',
    statusCode: null,
    code: 'CONNECTION_TIMEOUT',
  );
  
  await tester.pumpWidget(
    MaterialApp(
      home: BlocProvider<ProfileBloc>(
        create: (_) => MockProfileBloc(),
        child: const ProfileScreen(),
      ),
    ),
  );
  
  // Mock the bloc state
  when(() => mockProfileBloc.state).thenReturn(ProfileState.error(mockError));
  
  // Rebuild with the new state
  await tester.pump();
  
  // Assert
  expect(find.byType(ErrorView), findsOneWidget);
  expect(find.text(mockError.userFriendlyMessage), findsOneWidget);
  expect(find.text('Try Again'), findsOneWidget); // Should show retry for network errors
});

testWidgets('should call refresh when retry button is pressed', (tester) async {
  // Arrange
  final mockError = NetworkError('Connection timeout');
  
  await tester.pumpWidget(
    MaterialApp(
      home: BlocProvider<ProfileBloc>(
        create: (_) => mockProfileBloc,
        child: const ProfileScreen(),
      ),
    ),
  );
  
  when(() => mockProfileBloc.state).thenReturn(ProfileState.error(mockError));
  await tester.pump();
  
  // Act
  await tester.tap(find.text('Try Again'));
  await tester.pump();
  
  // Assert
  verify(() => mockProfileBloc.add(const ProfileEvent.refresh())).called(1);
});
```

### Golden Tests for Error States

```dart
testWidgets('Error view matches golden file', (tester) async {
  // Set viewport size
  tester.binding.window.physicalSizeTestValue = const Size(375, 667);
  tester.binding.window.devicePixelRatioTestValue = 1.0;
  
  // Build error views for different error types
  await tester.pumpWidget(
    MaterialApp(
      theme: ThemeData.light(),
      home: Column(
        children: [
          Expanded(
            child: ErrorView(
              error: NetworkError('Connection timeout'),
              onRetry: () {},
            ),
          ),
          Expanded(
            child: ErrorView(
              error: AuthError(AuthErrorType.unauthorized),
              onRetry: () {},
            ),
          ),
          Expanded(
            child: ErrorView(
              error: ValidationError('Invalid input'),
              onRetry: null, // No retry for validation errors
            ),
          ),
        ],
      ),
    ),
  );
  
  await expectLater(
    find.byType(MaterialApp),
    matchesGoldenFile('error_views.png'),
  );
});
```

## 7. Logging & Monitoring

### Structured Error Logging

```dart
/// Enhanced logger for error tracking
class ErrorLogger {
  final Logger _logger;
  final AnalyticsService _analytics;
  
  ErrorLogger(this._logger, this._analytics);
  
  void logError(AppError error, {StackTrace? stackTrace}) {
    // Basic structured log
    _logger.e(
      'ERROR [${error.code ?? 'UNKNOWN'}]: ${error.message}',
      error,
      stackTrace ?? error.stackTrace,
    );
    
    // Log to analytics for aggregation and monitoring
    _analytics.trackError(
      type: error.runtimeType.toString(),
      code: error.code,
      message: error.message,
      stackTrace: stackTrace?.toString() ?? error.stackTrace?.toString(),
    );
  }
  
  void logNetworkError(NetworkError error) {
    Map<String, dynamic> metadata = {
      'statusCode': error.statusCode,
      'isRetryable': error.isRetryable,
    };
    
    _logger.e(
      'NETWORK ERROR [${error.code}]: ${error.message}',
      error,
      error.stackTrace,
      metadata,
    );
    
    _analytics.trackNetworkError(
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
    );
  }
}

// Usage
final errorLogger = ErrorLogger(
  Logger(),
  FirebaseAnalytics.instance,
);

try {
  await repository.getUserProfile();
} catch (e) {
  if (e is AppError) {
    errorLogger.logError(e);
  } else {
    errorLogger.logError(
      AppError('Unexpected error', stackTrace: StackTrace.current),
    );
  }
}
```

### Integration with Monitoring Services

```dart
/// Sentry integration for error monitoring
Future<void> initializeErrorMonitoring() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = 'YOUR_SENTRY_DSN';
      options.tracesSampleRate = 1.0;
      options.enableAutoPerformanceTracing = true;
      
      // Custom error grouping
      options.beforeSend = (event, {hint}) {
        // Customize event before sending to Sentry
        if (event.throwable is AppError) {
          final appError = event.throwable as AppError;
          
          // Use custom fingerprinting for our error types
          event.fingerprint = [
            '{{ default }}',
            appError.runtimeType.toString(),
            appError.code ?? 'no-code',
          ];
          
          // Add custom tags
          event.tags['error_type'] = appError.runtimeType.toString();
          event.tags['error_code'] = appError.code ?? 'unknown';
          event.tags['is_retryable'] = '${appError.isRetryable}';
          
          // Convert to user-friendly message for context
          event.contexts['user_message'] = {
            'display': appError.userFriendlyMessage,
          };
        }
        
        return event;
      };
    },
    appRunner: () => runApp(MyApp()),
  );
}
```

### Error Monitoring Dashboard

```dart
/// Error monitoring dashboard widget for development
class ErrorMonitoringDashboard extends StatelessWidget {
  final ErrorHistoryRepository errorRepository;
  
  const ErrorMonitoringDashboard({
    Key? key,
    required this.errorRepository,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Error Dashboard')),
      body: FutureBuilder<List<ErrorRecord>>(
        future: errorRepository.getRecentErrors(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          
          if (snapshot.hasError) {
            return Center(
              child: Text('Failed to load error history: ${snapshot.error}'),
            );
          }
          
          final errors = snapshot.data ?? [];
          
          if (errors.isEmpty) {
            return const Center(
              child: Text('No errors recorded. Everything is working great!'),
            );
          }
          
          return ListView.builder(
            itemCount: errors.length,
            itemBuilder: (context, index) {
              final error = errors[index];
              return ErrorTile(
                error: error,
                onTap: () => _showErrorDetails(context, error),
              );
            },
          );
        },
      ),
    );
  }
  
  void _showErrorDetails(BuildContext context, ErrorRecord error) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => ErrorDetailsView(
          error: error,
          scrollController: scrollController,
        ),
      ),
    );
  }
}
```

## 8. TDD-ROME Integration

### Contract Testing for Error Scenarios

```dart
// Example: API contract test for error responses
describe('Authentication API Error Contract', () {
  it('should return 401 with proper error format for invalid credentials', async () => {
    // Arrange
    const invalidCredentials = {
      email: 'user@example.com',
      password: 'wrongpassword'
    };
    
    // Act
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(invalidCredentials)
      .expect(401);
    
    // Assert
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: expect.any(String)
      }
    });
  });
  
  it('should return 400 with validation errors for invalid input format', async () => {
    // Arrange
    const invalidInput = {
      email: 'not-an-email',
      // Missing password field
    };
    
    // Act
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(invalidInput)
      .expect(400);
    
    // Assert
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: expect.arrayContaining([
          {
            field: 'email',
            message: expect.stringContaining('valid email')
          },
          {
            field: 'password',
            message: expect.stringContaining('required')
          }
        ])
      }
    });
  });
});
```

### ROME 7-Step Protocol for Error Handling

Following ROME's Enhanced 7-Step Protocol for error handling:

1. **READ**: Understand error requirements and user expectations
2. **ANALYZE**: Identify potential error scenarios and categorize them
3. **TEST-FIRST**: Write failing tests for error scenarios before implementation
4. **CLARIFY**: Define error contracts between frontend and backend
5. **IMPLEMENT**: Create error handling mechanisms to pass tests
6. **VALIDATE**: Ensure all error scenarios are properly handled and tested
7. **REPORT**: Document error handling patterns and recovery strategies

```dart
// Example: Implementing the 7-step protocol for error handling
class ErrorHandlingImplementation {
  // 1. READ: Document error requirements
  // Error handling requirements:
  // - Network errors should be retryable
  // - Auth errors should redirect to login
  // - Validation errors should show inline feedback
  // - Critical errors should show dialog
  // - All errors should be logged
  
  // 2. ANALYZE: Categorize error types
  enum ErrorCategory {
    network,    // Connection, timeout, server errors
    auth,       // Authentication, authorization
    validation, // Input validation, form errors
    business,   // Business rule violations
    critical,   // System errors, crashes
  }
  
  // 3. TEST-FIRST: Define test cases
  // See test examples in Testing Error Scenarios section
  
  // 4. CLARIFY: Define error contracts
  // See Exception Hierarchy section
  
  // 5. IMPLEMENT: Create error handlers
  final Map<ErrorCategory, ErrorHandler> _handlers = {
    ErrorCategory.network: NetworkErrorHandler(),
    ErrorCategory.auth: AuthErrorHandler(),
    ErrorCategory.validation: ValidationErrorHandler(),
    ErrorCategory.business: BusinessErrorHandler(),
    ErrorCategory.critical: CriticalErrorHandler(),
  };
  
  void handleError(AppError error) {
    // Determine category
    final category = _getCategoryForError(error);
    
    // Log all errors
    errorLogger.logError(error);
    
    // Delegate to appropriate handler
    _handlers[category]?.handle(error);
  }
  
  ErrorCategory _getCategoryForError(AppError error) {
    return switch (error.runtimeType) {
      NetworkError => ErrorCategory.network,
      AuthError => ErrorCategory.auth,
      ValidationError => ErrorCategory.validation,
      BusinessError => ErrorCategory.business,
      _ => ErrorCategory.critical,
    };
  }
  
  // 6. VALIDATE: Test implementation
  // See Testing Error Scenarios section
  
  // 7. REPORT: Document error handling
  // This document serves as the report
}
```

### ROME Robot Implementation

```dart
// Example: Error handling task for a Rodeo robot
// Task for Charlie (Frontend Robot)

class ErrorHandlingTask {
  // Implement frontend error handling according to contract tests
  
  // 1. READ: Understand error contracts from test suite
  // Error contracts are defined in test/contracts/api_error.contract.test.js
  
  // 2. ANALYZE: Determine error handling approach
  // - Network errors: Retry mechanism + offline mode
  // - Auth errors: Redirect to login
  // - Validation: Show inline errors
  // - Business rules: Show contextual messages
  
  // 3. TEST-FIRST: Write failing widget tests
  // See Testing Error Scenarios section
  
  // 4. CLARIFY: Ensure contract alignment with backend
  // Confirm error format with Reena (Backend Robot)
  
  // 5. IMPLEMENT: Create error handling components
  // See User-Facing Error Handling section
  
  // 6. VALIDATE: Comprehensive testing
  // Verify all error scenarios in integration tests
  
  // 7. REPORT: Document implementation
  // Update actionlist.md with completed error handling tasks
}
```

## Conclusion

This guide provides a comprehensive approach to error handling in Flutter applications. By following these patterns and integrating with the ROME methodology and TDD approach, you can build resilient applications that gracefully handle failures and provide excellent user experiences even when things go wrong.

The key takeaways:

1. Build a well-structured exception hierarchy that maps to your domain
2. Use the Result pattern to safely propagate errors through layers
3. Implement appropriate UI patterns for different types of errors
4. Add advanced recovery strategies for critical operations
5. Test all error scenarios thoroughly
6. Monitor and log errors effectively
7. Integrate error handling into your TDD-ROME workflow

By treating error handling as a first-class concern rather than an afterthought, you'll create applications that are more robust, maintainable, and user-friendly.

---

## Change Management

To suggest improvements or report issues with this guide, please:
1. Document the proposed change with specific examples
2. Submit changes through the standard ROME improvement process
3. Include unit tests for any new error handling patterns

### Upcoming in v1.1.0
- Enhanced localization support for error messages
- Integration with Flutter 3.18 features
- Additional golden test examples
- Performance optimization for error handling in lists
