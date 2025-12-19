# Error Handling Patterns Expert Guide
## The Art Deco Bakery - Flutter Application

---
**Document Version**: 2.0
**Last Updated**: 2024-12-19
**Priority**: HIGH - Essential Pattern
**Dependencies**:
  - Dart SDK: >= 3.0.0 (sealed classes)
  - equatable: ^2.0.5

**Related Documentation**:
  - 📘 [Master Index](../00_MASTER_INDEX.md) - Documentation navigation
  - 📘 [Frontend DDD Architecture](frontend_ddd_architecture_expert.md) - Overall architecture context
  - 📘 [Sealed Classes vs Enums](../02_PATTERNS/sealed_classes_vs_enums_guide.md) - When to use sealed classes
  - 📘 [Parse Server Integration](../03_INTEGRATIONS/parse_flutter_integration_patterns.md) - Network error handling
  - 📘 [Timeout Strategy](../02_PATTERNS/timeout_strategy_guide.md) - Timeout patterns

**Quick Links**:
  - Section 2: [Exception Layer](#2-exception-layer-data-layer)
  - Section 3: [Failure Layer](#3-failure-layer-domain-layer)
  - Section 4: [Result Type Pattern](#4-functional-error-handling-with-result-type)
  - Section 7: [Error Boundary Widget](#7-error-boundary-widget)

---

### Overview
This document defines the comprehensive error handling strategy used throughout the application. The approach implements a two-tier error handling system: **Exceptions** in the data layer and **Failures** in the domain layer, with functional error handling using native Dart sealed classes and pattern matching.

---

## 1. Error Handling Philosophy

### Core Principles
1. **No Unhandled Exceptions**: All exceptions are caught and converted to failures
2. **Functional Error Handling**: Use `Result<T>` sealed class instead of throwing
3. **Type-Safe Errors**: Specific exception/failure types for different error categories
4. **Graceful Degradation**: Implement fallback strategies (remote → local)
5. **User-Friendly Messages**: End users see clear, actionable error messages
6. **Developer Visibility**: Debug logs with emojis for development tracking

### Error Flow
```
Data Layer (Exceptions)
    ↓ (caught and converted)
Repository (Result<T>)
    ↓ (passed through)
Use Case (Result<T>)
    ↓ (passed through)
BLoC (pattern matches Result into states)
    ↓
Presentation (displays error UI)
```

---

## 2. Exception Layer (Data Layer)

### 2.1 Exception Types

Exceptions represent low-level errors from external sources (APIs, databases, networks, etc.).

```dart
// 📁 lib/core/error/exceptions.dart

/// Thrown when a server/API call fails
class ServerException implements Exception {
  final String message;
  final int? code;

  ServerException({
    required this.message,
    this.code,
  });

  @override
  String toString() => 'ServerException: $message (code: $code)';
}

/// Thrown when cached data is unavailable
class CacheException implements Exception {
  final String message;

  CacheException({this.message = 'Cache error occurred'});

  @override
  String toString() => 'CacheException: $message';
}

/// Thrown when network is unavailable
class NetworkException implements Exception {
  final String message;

  NetworkException({this.message = 'Network error occurred'});

  @override
  String toString() => 'NetworkException: $message';
}

/// Thrown when authentication/authorization fails
class AuthException implements Exception {
  final String message;

  AuthException({required this.message});

  @override
  String toString() => 'AuthException: $message';
}

/// Thrown when validation fails
class ValidationException implements Exception {
  final String message;

  ValidationException(this.message);

  @override
  String toString() => 'ValidationException: $message';
}
```

### 2.2 Exception Throwing Rules

**Where to throw**:
- ✅ Remote data sources (API failures)
- ✅ Local data sources (cache failures)
- ✅ Network validation
- ✅ Authentication checks

**What NOT to do**:
- ❌ Don't throw from repository implementations
- ❌ Don't throw from use cases
- ❌ Don't throw from BLoCs
- ❌ Don't throw unspecified exceptions

### 2.3 Example: Remote Data Source with Exceptions

```dart
// 📁 lib/features/product_catalog/data/datasources/product_remote_data_source.dart

class ProductRemoteDataSourceImpl implements ProductRemoteDataSource {
  final ParseApiClient parseClient;

  ProductRemoteDataSourceImpl({required this.parseClient});

  @override
  Future<List<ProductModel>> getAllProducts() async {
    try {
      print('🌐 [ProductRemoteDS] Fetching products from Parse Server');
      final response = await parseClient.query('Product');

      if (response is! List) {
        throw ServerException(
          message: 'Invalid response format: expected List, got ${response.runtimeType}',
          code: -1,
        );
      }

      print('✅ [ProductRemoteDS] Successfully fetched ${response.length} products');
      return response.map((p) => ProductModel.fromParse(p)).toList();
    } on ServerException {
      rethrow; // Already a ServerException, pass it through
    } catch (e) {
      print('❌ [ProductRemoteDS] Unexpected error: $e');
      throw ServerException(
        message: 'Failed to fetch products: ${e.toString()}',
      );
    }
  }
}
```

### 2.4 Example: Local Data Source with Exceptions

```dart
// 📁 lib/features/product_catalog/data/datasources/product_local_data_source.dart

class ProductLocalDataSourceImpl implements ProductLocalDataSource {
  final SharedPreferences prefs;

  ProductLocalDataSourceImpl({required this.prefs});

  @override
  Future<List<ProductModel>> getAllProducts() async {
    try {
      print('💾 [ProductLocalDS] Retrieving cached products');

      final jsonString = prefs.getString('cached_products');
      if (jsonString == null) {
        throw CacheException(message: 'No cached products found');
      }

      final jsonList = jsonDecode(jsonString) as List;
      print('✅ [ProductLocalDS] Retrieved ${jsonList.length} cached products');

      return jsonList.map((p) => ProductModel.fromJson(p)).toList();
    } on CacheException {
      rethrow;
    } catch (e) {
      print('❌ [ProductLocalDS] Cache error: $e');
      throw CacheException(message: 'Failed to load cached products: ${e.toString()}');
    }
  }

  @override
  Future<void> cacheProducts(List<ProductModel> products) async {
    try {
      final jsonList = products.map((p) => p.toJson()).toList();
      final jsonString = jsonEncode(jsonList);

      await prefs.setString('cached_products', jsonString);
      print('✅ [ProductLocalDS] Cached ${products.length} products');
    } catch (e) {
      print('❌ [ProductLocalDS] Failed to cache products: $e');
      throw CacheException(message: 'Failed to cache products');
    }
  }
}
```

---

## 3. Failure Layer (Domain Layer)

### 3.1 Failure Types

Failures are domain-layer representations of errors. They're type-safe and can be analyzed without throwing.

```dart
// 📁 lib/core/error/failures.dart
import 'package:equatable/equatable.dart';

/// Base class for all failures
abstract class Failure extends Equatable {
  String get message;

  @override
  List<Object> get props => [];
}

/// Server/API error
class ServerFailure extends Failure {
  @override
  final String message;

  ServerFailure({this.message = 'Server error occurred'});

  @override
  List<Object> get props => [message];
}

/// Cache/local storage error
class CacheFailure extends Failure {
  @override
  String get message => 'Cache error occurred';
}

/// Network connectivity error
class NetworkFailure extends Failure {
  @override
  String get message => 'Network error occurred';
}

/// Input validation error
class ValidationFailure extends Failure {
  @override
  final String message;

  ValidationFailure({required this.message});

  @override
  List<Object> get props => [message];
}
```

### 3.2 Exception → Failure Conversion

Repositories catch exceptions and convert them to failures.

```dart
// 📁 lib/features/product_catalog/data/repositories/product_repository_impl.dart
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/error/result.dart';

class ProductRepositoryImpl implements ProductRepository {
  final ProductRemoteDataSource remoteDataSource;
  final ProductLocalDataSource localDataSource;

  ProductRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
  });

  @override
  Future<Result<List<Product>>> getAllProducts() async {
    try {
      print('🏛️ [ProductRepository] Getting all products from remote');
      final products = await remoteDataSource.getAllProducts();
      print('✅ [ProductRepository] Got ${products.length} products from remote');
      return Success(products); // Success path
    } on ServerException catch (e) {
      print('❌ [ProductRepository] ServerException: ${e.message}');
      return Error(e.message); // Convert to failure
    } catch (e) {
      print('⚠️ [ProductRepository] Remote failed, trying local fallback: $e');
      // Fallback strategy: try local cache
      try {
        final products = await localDataSource.getAllProducts();
        print('✅ [ProductRepository] Got ${products.length} products from local');
        return Success(products);
      } catch (e) {
        print('❌ [ProductRepository] Local also failed: $e');
        return Error('Failed to load products from cache');
      }
    }
  }

  @override
  Future<Result<List<Product>>> getProductsByCategory(
    ProductCategory category,
  ) async {
    try {
      final products = await remoteDataSource.getProductsByCategory(category);
      return Success(products);
    } on ServerException catch (e) {
      return Error(e.message);
    } catch (e) {
      try {
        final products = await localDataSource.getProductsByCategory(category);
        return Success(products);
      } catch (e) {
        return Error('Failed to load products');
      }
    }
  }
}
```

---

## 4. Functional Error Handling with Result Type

### 4.1 Result Type Overview

`Result<T>` is a sealed class that represents an operation that can fail (Error) or succeed (Success). It uses native Dart 3.0+ sealed classes and pattern matching.

```dart
// 📁 lib/core/error/result.dart

sealed class Result<T> {
  const Result();

  /// Fold pattern: transform Result into any type
  U fold<U>(
    U Function(T) onSuccess,
    U Function(String) onError,
  ) {
    return switch (this) {
      Success(:final value) => onSuccess(value),
      Error(:final message) => onError(message),
    };
  }

  /// Check if result is success
  bool get isSuccess => this is Success<T>;

  /// Check if result is error
  bool get isError => this is Error<T>;

  /// Get value or null
  T? get valueOrNull => switch (this) {
    Success(:final value) => value,
    Error() => null,
  };
}

final class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}

final class Error<T> extends Result<T> {
  final String message;
  const Error(this.message);
}
```

### 4.2 Pattern Matching Result in BLoCs

BLoCs use switch expressions to handle both success and failure cases with native pattern matching.

```dart
// 📁 lib/features/product_catalog/presentation/bloc/product_bloc.dart

Future<void> _onLoadAllProducts(
  LoadAllProducts event,
  Emitter<ProductState> emit,
) async {
  print('🎯 [ProductBloc] LoadAllProducts event received');
  emit(ProductLoading()); // Emit loading state first

  final result = await getAllProducts(NoParams());
  print('📬 [ProductBloc] Got result from usecase');

  // Pattern matching with switch expression
  final state = switch (result) {
    Success(:final value) => (
      print('✅ [ProductBloc] Success! Emitting ${value.length} products'),
      ProductLoaded(products: value),
    ).$2,
    Error(:final message) => (
      print('❌ [ProductBloc] Error: $message'),
      ProductError('Failed to load products'),
    ).$2,
  };

  emit(state);
}
```

### 4.3 Pattern Matching Patterns

#### Pattern 1: Simple Success/Failure
```dart
final state = switch (result) {
  Success(:final value) => ProductLoaded(products: value),
  Error(:final message) => ProductError(message),
};
emit(state);
```

#### Pattern 2: With Complex Logic
```dart
final state = switch (result) {
  Success(:final value) => value.isEmpty
      ? const ProductEmpty()
      : ProductLoaded(products: value),
  Error(:final message) => ProductError(message),
};
emit(state);
```

#### Pattern 3: With Logging
```dart
final state = switch (result) {
  Success(:final value) => (
    logSuccess('LoadAllProducts succeeded with ${value.length} items'),
    ProductLoaded(products: value),
  ).$2,
  Error(:final message) => (
    logError('LoadAllProducts failed', message),
    ProductError(message),
  ).$2,
};
emit(state);
```

#### Pattern 4: Nested Pattern Matching
```dart
final state = switch (result) {
  Success(value: final products) when products.isNotEmpty =>
    ProductLoaded(products: products),
  Success() => const ProductEmpty(),
  Error(:final message) => ProductError(message),
};
emit(state);
```

---

## 5. Validation Errors

### 5.1 Input Validation Strategy

Validation happens early, before API calls, to prevent unnecessary network requests.

```dart
// 📁 lib/core/utils/validators.dart

/// Validate email format
String? validateEmail(String? value) {
  if (value == null || value.isEmpty) {
    return 'Email is required';
  }
  final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
  if (!emailRegex.hasMatch(value)) {
    return 'Please enter a valid email';
  }
  return null;
}

/// Validate password strength
String? validatePassword(String? value) {
  if (value == null || value.isEmpty) {
    return 'Password is required';
  }
  if (value.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

/// Validate UK postcode
String? validatePostcode(String? value) {
  if (value == null || value.isEmpty) {
    return 'Postcode is required';
  }
  final postcodeRegex = RegExp(
    r'^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$',
    caseSensitive: false,
  );
  if (!postcodeRegex.hasMatch(value)) {
    return 'Please enter a valid UK postcode';
  }
  return null;
}

/// Validate UK phone number
String? validatePhoneNumber(String? value) {
  if (value == null || value.isEmpty) {
    return 'Phone number is required';
  }
  final phoneRegex = RegExp(r'^(\+44|0)[0-9]{10}$');
  if (!phoneRegex.hasMatch(value.replaceAll(' ', ''))) {
    return 'Please enter a valid UK phone number';
  }
  return null;
}

/// Validate price/amount
String? validatePrice(String? value) {
  if (value == null || value.isEmpty) {
    return 'Amount is required';
  }
  final number = double.tryParse(value);
  if (number == null) {
    return 'Please enter a valid number';
  }
  if (number <= 0) {
    return 'Amount must be greater than zero';
  }
  return null;
}
```

### 5.2 Validation in Forms

```dart
// 📁 lib/features/auth/presentation/pages/login_page.dart

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _emailError;
  String? _passwordError;

  void _validateForm() {
    setState(() {
      _emailError = validateEmail(_emailController.text);
      _passwordError = validatePassword(_passwordController.text);
    });

    if (_emailError == null && _passwordError == null) {
      // Form is valid, proceed with login
      _performLogin();
    }
  }

  void _performLogin() {
    final loginEvent = LoginUserEvent(
      email: _emailController.text,
      password: _passwordController.text,
    );
    context.read<AuthBloc>().add(loginEvent);
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      child: Column(
        children: [
          TextFormField(
            controller: _emailController,
            decoration: InputDecoration(
              errorText: _emailError,
            ),
          ),
          TextFormField(
            controller: _passwordController,
            decoration: InputDecoration(
              errorText: _passwordError,
            ),
          ),
          ElevatedButton(
            onPressed: _validateForm,
            child: const Text('Login'),
          ),
        ],
      ),
    );
  }
}
```

---

## 6. API Error Handling

### 6.1 HTTP Status Codes

```dart
// 📁 lib/core/network/parse_api_client.dart

class ParseApiClient {
  final String baseUrl;
  final String applicationId;
  final String masterKey;
  final http.Client client;

  // ... constructor ...

  /// Handle HTTP responses and convert to exceptions
  dynamic _handleResponse(http.Response response) {
    print('📥 [ParseApiClient] Response status: ${response.statusCode}');

    switch (response.statusCode) {
      case 200: // OK
      case 201: // Created
        print('✅ [ParseApiClient] Success response');
        return jsonDecode(response.body);

      case 400: // Bad Request
        print('❌ [ParseApiClient] Bad request: ${response.body}');
        throw ServerException(
          message: 'Bad request: ${response.body}',
          code: 400,
        );

      case 401: // Unauthorized
        print('🔒 [ParseApiClient] Authentication failed');
        throw AuthException(message: 'Authentication failed. Please login again.');

      case 403: // Forbidden
        print('🚫 [ParseApiClient] Access forbidden');
        throw AuthException(message: 'Access forbidden');

      case 404: // Not Found
        print('🔍 [ParseApiClient] Resource not found');
        throw ServerException(
          message: 'Resource not found',
          code: 404,
        );

      case 500: // Internal Server Error
      case 502: // Bad Gateway
      case 503: // Service Unavailable
        print('🔥 [ParseApiClient] Server error: ${response.statusCode}');
        throw ServerException(
          message: 'Server error (${response.statusCode})',
          code: response.statusCode,
        );

      default:
        print('⚠️ [ParseApiClient] Unknown status: ${response.statusCode}');
        throw ServerException(
          message: 'Unexpected error (${response.statusCode})',
          code: response.statusCode,
        );
    }
  }

  Map<String, String> _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': applicationId,
      'X-Parse-Master-Key': masterKey,
    };
  }
}
```

---

## 7. Error Recovery Strategies

### 7.1 Fallback Pattern: Remote → Local

```dart
@override
Future<Result<List<Product>>> getAllProducts() async {
  try {
    // Try remote first
    final products = await remoteDataSource.getAllProducts();
    return Success(products);
  } on ServerException catch (e) {
    return Error(e.message);
  } catch (e) {
    // If remote fails, fallback to local cache
    try {
      final products = await localDataSource.getAllProducts();
      return Success(products);
    } catch (e) {
      return Error('Failed to load products from cache');
    }
  }
}
```

### 7.2 Retry Pattern

```dart
Future<Result<T>> _withRetry<T>(
  Future<T> Function() operation, {
  int maxRetries = 3,
  Duration delay = const Duration(seconds: 1),
}) async {
  for (int i = 0; i < maxRetries; i++) {
    try {
      print('🔄 [Retry] Attempt ${i + 1}/$maxRetries');
      final result = await operation();
      return Success(result);
    } on ServerException catch (e) {
      if (i == maxRetries - 1) {
        // Last attempt failed
        return Error(e.message);
      }
      // Wait before retrying
      await Future.delayed(delay);
    }
  }
  return Error('Max retries exceeded');
}
```

### 7.3 Timeout Pattern

```dart
Future<Result<T>> _withTimeout<T>(
  Future<T> Function() operation, {
  Duration timeout = const Duration(seconds: 30),
}) async {
  try {
    final result = await operation().timeout(
      timeout,
      onTimeout: () => throw TimeoutException('Request timed out'),
    );
    return Success(result);
  } on TimeoutException {
    return Error('Request timed out');
  } catch (e) {
    return Error(e.toString());
  }
}
```

---

## 8. User-Facing Error Messages

### 8.1 Error Message Mapping

Map technical failures to user-friendly messages:

```dart
// 📁 lib/core/utils/error_message_mapper.dart

String getErrorMessage(Failure failure) {
  if (failure is ServerFailure) {
    return failure.message.contains('401')
        ? 'Please log in again'
        : failure.message.contains('404')
            ? 'Item not found'
            : 'Something went wrong. Please try again.';
  }

  if (failure is CacheFailure) {
    return 'No cached data available. Please check your connection.';
  }

  if (failure is NetworkFailure) {
    return 'No internet connection. Please check your network.';
  }

  if (failure is ValidationFailure) {
    return failure.message;
  }

  return 'An unexpected error occurred.';
}
```

### 8.2 Error UI Display

```dart
// In BLoC event handler using pattern matching
final newState = switch (result) {
  Success(:final value) => ProductLoaded(products: value),
  Error(:final message) => ProductError(getErrorMessage(message)),
};
emit(newState);

// In UI layer
if (state is ProductError) {
  return Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.error_outline, size: 64, color: Colors.red),
        const SizedBox(height: 16),
        Text(
          'Error',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(
          state.message,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: () {
            context.read<ProductBloc>().add(LoadAllProducts());
          },
          child: const Text('Retry'),
        ),
      ],
    ),
  );
}
```

---

## 9. Best Practices Checklist

### ✅ DO's
- ✅ Use specific exception types
- ✅ Convert all exceptions to failures in repositories
- ✅ Use `Result<T>` for all async operations
- ✅ Provide meaningful error messages
- ✅ Log errors with context
- ✅ Implement fallback strategies
- ✅ Validate input before processing
- ✅ Handle all state transitions (loading, success, error)
- ✅ Use pattern matching (switch expressions) with Result
- ✅ Leverage sealed classes for type safety

### ❌ DON'Ts
- ❌ Don't throw from repositories or BLoCs
- ❌ Don't ignore errors silently
- ❌ Don't create generic exception types
- ❌ Don't pass technical errors to users
- ❌ Don't forget to emit error states
- ❌ Don't mix error types across layers
- ❌ Don't make error messages too technical

---

## 7. Error Boundary Widget

Error Boundaries catch Flutter framework errors that escape normal error handling and prevent entire app crashes.

### 7.1 Basic Error Boundary Implementation

```dart
// 📁 lib/core/presentation/widgets/error_boundary.dart

import 'package:flutter/material.dart';

class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(FlutterErrorDetails)? errorBuilder;
  final void Function(FlutterErrorDetails)? onError;

  const ErrorBoundary({
    Key? key,
    required this.child,
    this.errorBuilder,
    this.onError,
  }) : super(key: key);

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  FlutterErrorDetails? _errorDetails;

  @override
  void initState() {
    super.initState();
    // Catch Flutter framework errors
    FlutterError.onError = (FlutterErrorDetails details) {
      setState(() {
        _errorDetails = details;
      });
      // Call optional error callback for logging
      widget.onError?.call(details);
      print('❌ [ErrorBoundary] ${details.exception}');
    };
  }

  void _resetError() {
    setState(() {
      _errorDetails = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_errorDetails != null) {
      // Show custom error UI or default
      if (widget.errorBuilder != null) {
        return widget.errorBuilder!(_errorDetails!);
      }

      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 64),
                const SizedBox(height: 16),
                const Text(
                  'Oops! Something went wrong',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  _errorDetails!.exception.toString(),
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _resetError,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return widget.child;
  }
}
```

### 7.2 App-Level Error Boundary

Use at app root as safety net:

```dart
// 📁 lib/main.dart

void main() async {
  runApp(
    ErrorBoundary(
      onError: (details) {
        print('🚨 [App] Uncaught error: ${details.exception}');
        // Log to crash reporting service
        sl<CrashReporting>().recordError(details.exception, details.stackTrace);
      },
      child: const MyApp(),
    ),
  );
}
```

### 7.3 Feature-Level Error Boundaries

Use per-feature for isolation:

```dart
// ✅ RECOMMENDED: Granular boundaries

class OrderDetailPage extends StatelessWidget {
  final String orderId;

  @override
  Widget build(BuildContext context) {
    return ErrorBoundary(
      errorBuilder: (details) => OrderErrorScreen(error: details.exception),
      onError: (details) {
        context.read<OrderBloc>().add(ReloadOrder(orderId: orderId));
      },
      child: BlocBuilder<OrderBloc, OrderState>(
        builder: (context, state) {
          if (state is OrderLoaded) {
            return OrderBody(order: state.order);
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}
```

### 7.4 Error Boundary Strategy

**App-Level** (Single):
- Pros: Simple, catches all errors
- Cons: Crash in one feature breaks entire app
- Use: Safety net

**Feature-Level** (Granular):
- Pros: Isolated errors, better recovery, easier debugging
- Cons: More boilerplate
- Use: Per page/feature (RECOMMENDED)

**Pattern**: Use both - granular + app-level safety net

### 7.5 Best Practices

✅ **DO's**:
- ✅ Place feature-level boundaries around BLoC-driven features
- ✅ Implement both app-level and feature-level boundaries
- ✅ Call crash reporting service in onError callback
- ✅ Provide user-friendly error UI
- ✅ Show retry button when possible

❌ **DON'Ts**:
- ❌ Don't rely only on app-level boundary
- ❌ Don't swallow errors silently
- ❌ Don't show technical error messages to users
- ❌ Don't forget to log to crash service

---

## 10. Error Handling Checklist for New Features

When adding a new feature, ensure:

1. **Data Layer**
   - [ ] Throw specific exceptions in data sources
   - [ ] Catch and log all errors
   - [ ] Provide meaningful error messages

2. **Repository Layer**
   - [ ] Catch exceptions and convert to failures
   - [ ] Implement fallback strategies
   - [ ] Return `Result<T>`

3. **Domain Layer**
   - [ ] Use cases don't throw
   - [ ] Use cases return `Result<T>`

4. **Presentation Layer**
   - [ ] BLoCs emit error states
   - [ ] UI handles all state types
   - [ ] Users see friendly error messages
   - [ ] Provide retry mechanisms
   - [ ] Feature-level error boundaries implemented

5. **Testing**
   - [ ] Test success paths
   - [ ] Test error paths
   - [ ] Test fallback strategies
   - [ ] Test user messages

---

## Conclusion

Error handling is integral to application reliability. This two-tier system (Exceptions → Failures with Result<T>) ensures:
- 🛡️ Type-safe error handling with sealed classes
- 📍 Clear error sources
- 🔄 Functional error propagation without external dependencies
- 👥 User-friendly messages
- 🐛 Developer visibility with pattern matching
- 🚀 Native Dart 3.0+ features (sealed classes, switch expressions)
