# Anti-Patterns & Approved Libraries Expert Guide
## The Art Deco Bakery - Flutter Application

### Overview
This document identifies common anti-patterns to avoid and establishes a curated list of approved dependencies. These guidelines ensure code quality, consistency, and maintainability across the application.

---

## 1. Code Anti-Patterns to Avoid

### 1.1 Anti-Pattern: Throwing Exceptions in Repositories

**❌ BAD**: Throwing exceptions instead of returning Result

```dart
class ProductRepositoryImpl implements ProductRepository {
  @override
  Future<List<Product>> getAllProducts() async {
    try {
      final products = await remoteDataSource.getAllProducts();
      return products;
    } catch (e) {
      throw Exception('Failed to load products');  // ❌ WRONG!
    }
  }
}
```

**✅ GOOD**: Use Result<T> sealed class for error handling

```dart
class ProductRepositoryImpl implements ProductRepository {
  @override
  Future<Result<List<Product>>> getAllProducts() async {
    try {
      final products = await remoteDataSource.getAllProducts();
      return Success(products);  // ✅ CORRECT
    } on ServerException catch (e) {
      return Error(e.message);
    }
  }
}
```

**Why it's an anti-pattern**:
- Exceptions break the function signature contract
- Makes error handling unpredictable
- Harder to test
- Breaks functional programming paradigm

---

### 1.2 Anti-Pattern: Business Logic in Widgets

**❌ BAD**: Complex logic in Widget.build()

```dart
class ProductCatalogPage extends StatefulWidget {
  @override
  State<ProductCatalogPage> createState() => _ProductCatalogPageState();
}

class _ProductCatalogPageState extends State<ProductCatalogPage> {
  List<Product> products = [];
  bool isLoading = false;
  String? error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<List<Product>>(
        future: _loadProducts(),  // ❌ Calling async in build
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const CircularProgressIndicator();
          }
          // ... more complex logic ...
        },
      ),
    );
  }

  Future<List<Product>> _loadProducts() async {
    // ❌ Business logic in widget
    try {
      final response = await http.get(/* ... */);
      return jsonDecode(response.body);
    } catch (e) {
      return [];
    }
  }
}
```




### 1.3 Anti-Pattern: Hardcoded Strings Instead of Constants

**❌ BAD**: Magic strings throughout code

```dart
void _handlePayment(String paymentMethod) {
  if (paymentMethod == 'card') {  // ❌ Magic string
    processCardPayment();
  } else if (paymentMethod == 'wallet') {  // ❌ Magic string
    processWalletPayment();
  }
}

String getPaymentIcon(String method) {
  if (method == 'card') return 'assets/icons/card.png';  // ❌ Scattered
  if (method == 'wallet') return 'assets/icons/wallet.png';
  if (method == 'bank') return 'assets/icons/bank.png';
  return 'assets/icons/default.png';
}
```

**✅ GOOD**: Use enums and constants

```dart
enum PaymentMethod {
  card,
  wallet,
  bankTransfer,
  cashOnDelivery;

  String get displayName {
    switch (this) {
      case PaymentMethod.card:
        return 'Credit/Debit Card';
      case PaymentMethod.wallet:
        return 'Digital Wallet';
      case PaymentMethod.bankTransfer:
        return 'Bank Transfer';
      case PaymentMethod.cashOnDelivery:
        return 'Cash on Delivery';
    }
  }

  String get iconPath {
    switch (this) {
      case PaymentMethod.card:
        return 'assets/icons/card.png';
      case PaymentMethod.wallet:
        return 'assets/icons/wallet.png';
      case PaymentMethod.bankTransfer:
        return 'assets/icons/bank.png';
      case PaymentMethod.cashOnDelivery:
        return 'assets/icons/cash.png';
    }
  }
}

void _handlePayment(PaymentMethod method) {
  switch (method) {
    case PaymentMethod.card:
      processCardPayment();
    case PaymentMethod.wallet:
      processWalletPayment();
    // ...
  }
}
```

**Why it's an anti-pattern**:
- Easy to mistype and cause bugs
- Scattered across codebase
- Hard to refactor
- No compile-time safety

---

### 1.4 Anti-Pattern: Ignoring Async/Await Errors

**❌ BAD**: Ignoring Future without awaiting

```dart
// Future completes but error is ignored
_loadProducts();  // ❌ WRONG! Future not awaited

Future<void> _loadProducts() async {
  final result = await getAllProducts();
  // If this throws, it's not caught
}

// Chaining without error handling
context.read<ProductBloc>().add(LoadAllProducts());  // No error tracking
```

**✅ GOOD**: Proper async/await with error handling

```dart
@override
void initState() {
  super.initState();
  _initializeData();  // Proper initialization
}

Future<void> _initializeData() async {
  try {
    context.read<ProductBloc>().add(LoadAllProducts());  // ✅ Proper event
  } catch (e) {
    print('Error initializing: $e');
  }
}
```

**Why it's an anti-pattern**:
- Errors silently fail
- Debugging becomes difficult
- State becomes inconsistent
- Race conditions possible

---

### 1.5 Anti-Pattern: Not Using Immutable Objects

**❌ BAD**: Mutable entity objects

```dart
class Product {
  String id;
  String name;
  double price;

  Product({required this.id, required this.name, required this.price});

  void setPrice(double newPrice) {
    price = newPrice;  // ❌ Mutable!
  }
}

// Unexpected mutations
final product = products[0];
product.setPrice(9.99);  // ❌ Modifies the original
```

**✅ GOOD**: Immutable entities with copyWith

```dart
class Product extends Equatable {
  final String id;
  final String name;
  final double price;

  const Product({  // ✅ Const constructor
    required this.id,
    required this.name,
    required this.price,
  });

  // Create modified copy
  Product copyWith({
    String? id,
    String? name,
    double? price,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
    );
  }

  @override
  List<Object> get props => [id, name, price];
}

// Safe, non-mutating
final product = products[0];
final modified = product.copyWith(price: 9.99);  // ✅ Creates new instance
```

**Why it's an anti-pattern**:
- Unexpected side effects
- Hard to track state changes
- Makes testing difficult
- Breaks React-like architecture

---

### 1.6 Anti-Pattern: Direct API Calls in Widgets

**❌ BAD**: HTTP requests directly in widgets

```dart
class ProductDetailPage extends StatefulWidget {
  final String productId;

  const ProductDetailPage({required this.productId});

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  @override
  void initState() {
    super.initState();
    _fetchProduct();  // ❌ Direct API call in widget
  }

  Future<void> _fetchProduct() async {
    final response = await http.get(Uri.parse(/* ... */));  // ❌ Network logic
    // Handle response...
  }

  @override
  Widget build(BuildContext context) {
    // ...
  }
}
```

**✅ GOOD**: Use data layer and BLoC

```dart
class ProductDetailPage extends StatefulWidget {
  final String productId;

  const ProductDetailPage({required this.productId});

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  @override
  void initState() {
    super.initState();
    context.read<ProductBloc>().add(
      LoadProductEvent(productId: widget.productId),  // ✅ Dispatch event
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProductBloc, ProductState>(
      builder: (context, state) {
        // ...
      },
    );
  }
}
```

**Why it's an anti-pattern**:
- Network logic scattered everywhere
- Can't reuse data fetching
- Hard to test
- No caching or offline support

---

### 1.7 Anti-Pattern: Not Validating Input

**❌ BAD**: Assuming input is always valid

```dart
void submitOrder(String email, String password) {
  if (email.isEmpty || password.isEmpty) {
    // User sees unclear error
    showError('Invalid input');
  }

  // ❌ No validation for format
  loginUser(email, password);
}
```

**✅ GOOD**: Comprehensive input validation

```dart
String? validateEmail(String? value) {
  if (value == null || value.isEmpty) {
    return 'Email is required';
  }
  final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
  if (!emailRegex.hasMatch(value)) {
    return 'Please enter a valid email';
  }
  return null;  // Valid
}

String? validatePassword(String? value) {
  if (value == null || value.isEmpty) {
    return 'Password is required';
  }
  if (value.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;  // Valid
}

void submitOrder(String email, String password) {
  final emailError = validateEmail(email);
  final passwordError = validatePassword(password);

  if (emailError != null || passwordError != null) {
    showError(emailError ?? passwordError ?? 'Invalid input');
    return;
  }

  loginUser(email, password);  // ✅ Input validated
}
```

**Why it's an anti-pattern**:
- Crashes or undefined behavior
- Poor user feedback
- Security vulnerabilities
- Inconsistent state

---

### 1.8 Anti-Pattern: Custom ParseApiClient Wrapper for Parse Server

**❌ BAD**: Creating a custom `ParseApiClient` HTTP wrapper for Parse Server

```dart
// ❌ ANTI-PATTERN: Reinventing the wheel
class ParseApiClient {
  final String baseUrl;
  final String applicationId;
  final String masterKey;
  final http.Client client;

  ParseApiClient({
    required this.baseUrl,
    required this.applicationId,
    required this.masterKey,
    http.Client? client,
  }) : client = client ?? http.Client();

  // Manually handling queries, creates, updates, deletes
  Future<dynamic> get(String className, /* ... */) async {
    // Custom HTTP logic - DON'T DO THIS!
  }
}
```

**✅ GOOD**: Use native `parse_server_sdk_flutter` package

Use `QueryBuilder<ParseObject>` for queries, `ParseObject` for CRUD operations, and `ParseUser` for authentication.

**For complete implementation examples and patterns**, see:
👉 `parse_flutter_integration_patterns.md` (Section 1-3)

**Why it's an anti-pattern**:
- ❌ Reinvents the wheel - Parse SDK already exists
- ❌ Manual error handling is error-prone
- ❌ No type safety (working with dynamic maps)
- ❌ Missing features (Live Query, automatic session management)
- ❌ More code to maintain and test
- ✅ Native SDK is official, maintained, and reliable
- ✅ Automatic session token management
- ✅ Type-safe QueryBuilder API
- ✅ Live query support (WebSocket)
- ✅ Better error handling
- ✅ Performance optimized

**When to migrate**:
- Replace all `ParseApiClient` usage with native SDK classes
- Use `QueryBuilder<ParseObject>` instead of manual queries
- Use `ParseObject` and `ParseUser` directly
- Remove custom HTTP wrapper entirely

---

### 1.9 Anti-Pattern: Using External Dependencies for Error Handling (dartz)

**❌ BAD**: Using dartz library for Either type

```dart
// ❌ DON'T: External dependency for error handling
import 'package:dartz/dartz.dart';

Future<Either<Failure, List<Product>>> getAllProducts() async {
  try {
    final products = await remoteDataSource.getAllProducts();
    return Right(products);  // External dependency!
  } on ServerException catch (e) {
    return Left(ServerFailure(message: e.message));
  }
}

// Problem with fold():
result.fold(
  (failure) => handleError(failure),
  (products) => handleSuccess(products),
);
```

**✅ GOOD**: Native Dart sealed classes + pattern matching

```dart
// ✅ DO: Use native Dart 3.0+ sealed classes (no dependencies)
sealed class Result<T> {
  const Result();
}

final class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}

final class Error<T> extends Result<T> {
  final String message;
  const Error(this.message);
}

Future<Result<List<Product>>> getAllProducts() async {
  try {
    final products = await remoteDataSource.getAllProducts();
    return Success(products);
  } on ServerException catch (e) {
    return Error('Failed to fetch: ${e.message}');
  }
}

// Pattern matching (clearer, faster):
final state = switch (result) {
  Success(:final value) => ProductLoaded(products: value),
  Error(:final message) => ProductError(message),
};
```

**Why it's an anti-pattern**:
- ❌ Unnecessary external dependency (adds ~30KB to bundle)
- ❌ Dart 3.0+ has sealed classes built-in
- ❌ Pattern matching (switch expressions) is native now
- ❌ No performance benefit over native Dart
- ❌ More to learn (Either, fold, etc.)
- ✅ Native Dart is simpler, faster, type-safe, zero dependencies

**Performance**:
- Native sealed classes: Zero overhead
- dartz Either: Extra allocation + method calls
- Result with switch: Compiler optimizations

---

## 1.10 Complete List of Code & Syntax Anti-Patterns

Quick reference checklist of all anti-patterns to avoid:

1. **Throwing Exceptions in Repositories** - Return `Result<T>` instead of throwing exceptions
2. **Business Logic in Widgets** - Move logic to BLoCs, use cases, and data sources
3. **Hardcoded Strings Instead of Constants** - Use enums and constants for values
4. **Ignoring Async/Await Errors** - Always handle futures with proper error handling
5. **Not Using Immutable Objects** - All domain/data objects must be immutable with const constructors
6. **Direct API Calls in Widgets** - All network calls must go through data sources
7. **Not Validating Input** - Validate all user input before processing
8. **Custom ParseApiClient Wrapper** - Use native `parse_server_sdk_flutter` package instead
9. **Using External Dependencies for Error Handling** - Use native Dart sealed classes, not dartz
10. **Mutable State in BLoCs** - States must be immutable
11. **Not Using Dependency Injection** - Always use GetIt for dependency management
12. **Mixed Navigation Patterns** - Only use GoRouter, no Navigator or GetX
13. **Unhandled Stream Errors** - Always add error handling to stream subscriptions
14. **Forgetting to Close Resources** - Close BLoCs, streams, controllers properly
15. **Testing without Mocking** - All external dependencies must be mocked in tests
16. **Not Using Equatable** - Implement Equatable for value-based equality
17. **Async Operations in Constructors** - Never call async methods in constructors
18. **Ignoring Lint Warnings** - Address all analyzer warnings
19. **Catching Generic Exception** - Catch specific exception types
20. **Not Using Named Routes** - Use GoRouter named routes for type safety
21. **Creating Bloc Instances Manually** - Always use dependency injection
22. **Storing Context in Variables** - Never store context outside of immediate use
23. **Not Cleaning Up Listeners** - Remove all listeners/subscriptions in dispose()
24. **Using BuildContext Across async gaps** - Always check mounted before using context
25. **Hardcoding Configuration Values** - Use environment files or constants
26. **Mixed Code Styles** - Follow consistent formatting and naming conventions
27. **Not Using Sealed Classes for Type Unions** - Use sealed classes for exhaustive pattern matching
28. **Direct Database Calls in Widgets** - All data access must go through repositories
29. **Not Implementing toString()** - Implement for debugging (or use @override)
30. **Modifying List During Iteration** - Create new list instead of modifying during iteration
31. **Late Keyword Abuse** - Use late sparingly, prefer proper initialization

---

## 2. Approved Libraries

### 2.1 Core Flutter & Dart

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| flutter | SDK | Flutter framework | ✅ Required |
| flutter_localizations | SDK | App localization | ✅ Approved |
| cupertino_icons | ^1.0.8 | iOS-style icons | ✅ Approved |

### 2.2 State Management

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| flutter_bloc | ^8.1.3 | BLoC pattern | ✅ **PRIMARY** |
| equatable | ^2.0.5 | Value equality | ✅ Approved |

**Usage**: Only use flutter_bloc for state management. Don't mix with Provider, Riverpod, etc.

```dart
// ✅ APPROVED: BLoC
class ProductBloc extends Bloc<ProductEvent, ProductState> {
  // ...
}

// ❌ NOT APPROVED: Provider
final productProvider = StateNotifierProvider((ref) {
  // Don't use Provider!
});

// ❌ NOT APPROVED: Riverpod
final productProvider = StateProvider((ref) {
  // Don't use Riverpod!
});
```

### 2.3 Dependency Injection

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| get_it | ^7.6.4 | Service locator | ✅ **PRIMARY** |

**Usage**: All dependencies registered in `injection_container.dart`

```dart
// ✅ APPROVED: GetIt service locator
final sl = GetIt.instance;

sl.registerLazySingleton<ProductRepository>(
  () => ProductRepositoryImpl(/* ... */),
);

// ❌ NOT APPROVED: Manual dependency passing
class ProductBloc extends Bloc {
  ProductBloc(ProductRepository repo) // Don't inject manually
}
```

### 2.4 Error Handling (NO External Dependencies)

**Status**: Use native Dart sealed classes instead of dartz (unnecessary external dependency)

**✅ APPROVED**: Native Dart sealed classes + records for type-safe error handling

```dart
// 📁 lib/core/types/result.dart
sealed class Result<T> {
  const Result();

  // Pattern matching support
  U fold<U>(
    U Function(T) onSuccess,
    U Function(String) onError,
  ) {
    return switch (this) {
      Success(value: final value) => onSuccess(value),
      Error(message: final message) => onError(message),
    };
  }
}

final class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}

final class Error<T> extends Result<T> {
  final String message;
  const Error(this.message);
}

// ✅ APPROVED: Use Result<T> with pattern matching
Future<Result<List<Product>>> getAllProducts() async {
  try {
    final products = await remoteDataSource.getAllProducts();
    return Success(products);
  } on ServerException catch (e) {
    return Error('Failed to fetch products: ${e.message}');
  }
}

// ✅ APPROVED: Pattern matching in BLoCs
final state = switch (result) {
  Success(:final value) => ProductLoaded(products: value),
  Error(:final message) => ProductError(message),
};
```

**Why NO dartz?**
- ❌ Unnecessary external dependency
- ❌ Dart 3.0+ has sealed classes built-in
- ❌ Pattern matching (switch expressions) is native now
- ❌ Adds ~30KB to bundle size
- ✅ Native Dart is simpler, faster, and type-safe

### 2.5 Network & HTTP

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| http | ^0.13.5 | HTTP requests | ✅ Approved (via Parse SDK only) |
| web_socket_channel | ^2.4.0 | WebSocket communication | ✅ Approved (for LiveQuery) |
| parse_server_sdk_flutter | ^5.1.0 | Parse Server integration | ✅ **PRIMARY** |

**Usage**: Always use native `parse_server_sdk_flutter` directly in data sources

```dart
// ✅ APPROVED: Use native Parse SDK
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class ProductRemoteDataSource {
  // Use QueryBuilder and ParseObject directly
  Future<List<ProductModel>> getAllProducts() async {
    final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Product'))
      ..orderByDescending('updatedAt');

    final response = await queryBuilder.query();

    if (response.success && response.results != null) {
      return (response.results as List)
          .map((p) => ProductModel.fromJson(p as ParseObject))
          .toList();
    }
    throw ServerException(message: 'Failed to fetch products');
  }
}

// ❌ NOT APPROVED: Custom ParseApiClient wrapper
class ParseApiClient {
  // Don't create this - use native SDK instead!
}

// ❌ NOT APPROVED: Direct http.get() calls
Future<void> fetchData() async {
  final response = await http.get(uri);  // Don't do this directly!
}
```

### 2.6 Caching & Local Storage

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| shared_preferences | ^2.2.2 | Key-value cache | ✅ Approved |
| cached_network_image | ^3.3.0 | Image caching | ✅ Approved |

**Usage**: Only in data sources or services

```dart
// ✅ APPROVED: In local data source
class ProductLocalDataSource {
  final SharedPreferences prefs;

  Future<void> cacheProducts(List<ProductModel> products) async {
    final json = jsonEncode(products.map((p) => p.toJson()).toList());
    await prefs.setString('cached_products', json);
  }
}

// ❌ NOT APPROVED: Direct access in widgets
class MyWidget extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    prefs.setString('key', 'value');  // Don't access SharedPrefs in widgets!
  }
}
```

### 2.7 Navigation

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| go_router | ^12.1.3 | Navigation & routing | ✅ **PRIMARY** |
| url_launcher | ^6.2.4 | Open URLs | ✅ Approved |

**Usage**: Only use GoRouter for navigation

```dart
// ✅ APPROVED: GoRouter
context.go('/catalog');
context.goNamed('checkout');

// ❌ NOT APPROVED: Navigator
Navigator.push(context, /* ... */);  // Don't use Navigator!

// ❌ NOT APPROVED: GetX
Get.to(ProductPage());  // Don't use GetX!
```

### 2.8 File Operations

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| image_picker | ^1.0.7 | Pick images from device | ✅ Approved |

**Usage**: Only in data sources or services

```dart
// ✅ APPROVED: Image picker in data source
class ImageUploadDataSource {
  Future<File> pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    return File(pickedFile!.path);
  }
}
```

### 2.9 Utilities & Helpers

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| intl | ^0.20.2 | Internationalization & formatting | ✅ Approved |
| logger | ^2.0.2 | Logging | ✅ Approved |
| google_fonts | ^4.0.4 | Google Fonts | ✅ Approved |
| json_validation | path: | JSON schema validation | ✅ **PRIMARY** |

### 2.10 JSON Validation

| Library | Purpose | Status |
|---------|---------|--------|
| json_validation | Validate Parse Server responses against JSON schemas | ✅ **PRIMARY** |

**CRITICAL**: Always validate JSON responses from Parse Server before deserialization.

```dart
// ✅ REQUIRED: Validate all Parse responses
import 'package:json_validation/json_validation.dart';

class ProductRemoteDataSource {
  final JsonValidator jsonValidator;

  ProductRemoteDataSourceImpl({required this.jsonValidator});

  Future<List<ProductModel>> getAllProducts() async {
    final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Product'));
    final response = await queryBuilder.query();

    if (response.success && response.results != null) {
      final products = response.results as List;

      // ✅ MANDATORY: Validate response structure
      for (final product in products) {
        final isValid = await jsonValidator.validate(
          (product as ParseObject).toJson(),
          'product',  // Schema name
        );

        if (!isValid) {
          throw ServerException(message: 'Invalid product structure from Parse');
        }
      }

      return products
          .map((p) => ProductModel.fromJson(p))
          .toList();
    }
    throw ServerException(message: 'Failed to fetch products');
  }
}

// ❌ NEVER: Skip validation
Future<List<ProductModel>> getAllProducts() async {
  final response = await parseQuery.query();
  // Don't deserialize without validation!
  return response.results.map((p) => ProductModel.fromJson(p)).toList();
}
```

**Why JSON validation is mandatory**:
- ✅ Ensures data integrity
- ✅ Catches malformed responses early
- ✅ Provides clear error messages
- ✅ Critical for testing & debugging
- ✅ Validates against documented API contracts

### 2.11 Export & Reporting

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| csv | ^5.1.1 | CSV export | ✅ Approved |
| pdf | ^3.10.7 | PDF generation | ✅ Approved |
| printing | ^5.11.1 | Print & share PDFs | ✅ Approved |

**Usage**: Only in admin features for reporting

```dart
// ✅ APPROVED: In admin order export
class OrderExportService {
  Future<void> exportToCSV(List<Order> orders) async {
    final csv = _convertOrdersToCSV(orders);
    // Export logic
  }
}
```

### 2.12 Code Generation

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| freezed_annotation | ^2.4.1 | Immutable classes | ✅ Approved |
| freezed | ^2.4.5 | Code gen for freezed | ✅ Approved (dev) |
| build_runner | ^2.4.6 | Code generation | ✅ Approved (dev) |

**Usage**: Optional for creating immutable classes

```dart
// ✅ APPROVED: If using code generation
@freezed
class Product with _$Product {
  const factory Product({
    required String id,
    required String name,
  }) = _Product;
}

// ✅ ALSO APPROVED: Manual immutables (preferred in this project)
class Product extends Equatable {
  final String id;
  final String name;

  const Product({required this.id, required this.name});

  @override
  List<Object> get props => [id, name];
}
```

---

## 3. Libraries to Avoid

Libraries listed here should NOT be used due to maintenance issues, unnecessary complexity, implementation problems, or conflicts with project architecture.

### 3.1 State Management: Libraries to Avoid

#### Provider
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Not compatible with BLoC pattern we use
  - Creates parallel state management system
  - Agent frequently makes mistakes implementing Provider
  - Adds confusion with mixed patterns
- **Maintenance**: Still maintained, but not our choice
- **Alternative**: Use `flutter_bloc` (already integrated)

#### Riverpod
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Not compatible with BLoC pattern
  - Overly complex for our needs
  - Agent struggles with functional programming paradigm
  - Creates inconsistent codebase
- **Maintenance**: Well-maintained but incompatible
- **Alternative**: Use `flutter_bloc`

#### GetX
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Conflicts with GoRouter (we use GoRouter only)
  - Provides its own routing system (confusion)
  - Anti-pattern: Global instance access (bad for testing)
  - Opinionated architecture conflicts with DDD
  - Contains undocumented magic behavior
  - Agent misuses GetX for navigation mixing patterns
- **Maintenance**: Maintained but not aligned with project
- **Alternative**: Use `flutter_bloc` + `go_router`

#### MobX
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Requires code generation complexity
  - Observable pattern conflicts with BLoC events/states
  - Agent tends to over-complicate with MobX
  - Not reactive enough for our needs
- **Maintenance**: Maintained but not suitable
- **Alternative**: Use `flutter_bloc`

#### Redux
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Too verbose for small-medium apps
  - Excessive boilerplate (reducers, actions, selectors)
  - Makes simple logic unnecessarily complex
  - Harder to test than BLoC
- **Maintenance**: Some packages are outdated
- **Alternative**: Use `flutter_bloc` (simpler, less boilerplate)

---

### 3.2 Navigation: Libraries to Avoid

#### GetX Navigation
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Creates routing confusion (GetX + GoRouter conflict)
  - Not type-safe like GoRouter
  - Anti-pattern: Global navigation without context
  - Hard to test navigation flows
- **Maintenance**: Part of GetX ecosystem
- **Alternative**: Use `go_router` ONLY

#### Fluro
- **Status**: ❌ DO NOT USE (DEPRECATED)
- **Why to Avoid**:
  - No longer actively maintained
  - Lacks modern Flutter features
  - Missing type safety
  - GoRouter has replaced this pattern
- **Maintenance**: Deprecated/abandoned
- **Alternative**: Use `go_router`

#### Navigator (Native)
- **Status**: ⚠️ AVOID (Use GoRouter instead)
- **Why to Avoid**:
  - Manual route management is error-prone
  - No type safety
  - Hard to test
  - GoRouter provides better abstraction
- **Maintenance**: Part of Flutter
- **Alternative**: Use `go_router` (required in this project)

---

### 3.3 HTTP & Networking: Libraries to Avoid

#### Custom ParseApiClient Wrapper (Anti-Pattern)
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Reinvents the wheel - native `parse_server_sdk_flutter` exists
  - Manual HTTP handling is error-prone
  - No type safety (working with dynamic maps)
  - Missing features (Live Query, automatic session management)
  - More code to maintain and test
  - Duplicates official Parse SDK functionality
- **Maintenance**: Your code, harder to maintain than official SDK
- **Alternative**: Use native `parse_server_sdk_flutter` package directly

**Migration Path**:
- Replace `ParseApiClient.query()` → `QueryBuilder<ParseObject>().query()`
- Replace `ParseApiClient.post()` → `ParseObject().save()`
- Replace `ParseApiClient.put()` → `ParseObject().save()`
- Replace `ParseApiClient.delete()` → `ParseObject().delete()`
- Remove custom `ParseApiClient` class entirely

#### Dio
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Redundant with Parse SDK (http package already included)
  - Adds unnecessary dependency
  - Creates multiple HTTP client confusion
  - Parse SDK already handles interceptors, timeouts, etc.
  - Agent may bypass native Parse SDK for direct Dio calls
- **Maintenance**: Well-maintained but unnecessary
- **Alternative**: Use native `parse_server_sdk_flutter` package directly

#### Chopper
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Unnecessary code generation for HTTP
  - Parse SDK already provides this abstraction
  - Adds boilerplate without benefit
  - Not compatible with our architecture
- **Maintenance**: Maintained but over-engineered for us
- **Alternative**: Use `ParseApiClient`

#### HTTP Package Direct
- **Status**: ⚠️ AVOID (Use ParseApiClient instead)
- **Why to Avoid**:
  - Direct http calls bypass our abstraction layer
  - No error handling consistency
  - Makes testing harder
  - Violates data source pattern
- **Maintenance**: Stable but should be wrapped
- **Alternative**: Use `ParseApiClient` wrapper

---

### 3.4 Error Handling: Libraries to Avoid

#### dartz (Either type)
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Unnecessary external dependency (Dart 3.0+ has sealed classes)
  - Adds ~30KB to bundle size unnecessarily
  - Agent frequently makes mistakes with fold() pattern
  - More complex than native Dart pattern matching
  - Slower than native sealed classes
  - Zero benefit over `Result<T>` sealed class
- **Maintenance**: Maintained but anti-pattern for modern Dart
- **Alternative**: Use native `Result<T>` sealed class (no dependencies)
- **Performance**: Native sealed classes are faster, have zero overhead

#### fault_tolerance
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Over-complicated retry/timeout logic
  - Our error_handling_patterns_expert.md already defines this
  - Not well maintained
  - Add unnecessary overhead
- **Maintenance**: Not actively maintained
- **Alternative**: Use patterns from `error_handling_patterns_expert.md`

---

### 3.5 Code Generation: Libraries to Avoid (Unnecessary)

#### Freezed (for this project)
- **Status**: ⚠️ OPTIONAL (Use manual if not needed)
- **Why to Avoid**:
  - Adds build_runner complexity
  - Manual immutables are simpler for this project size
  - Makes debugging harder (generated code)
  - Longer build times
  - Not necessary when manual approach works
- **Maintenance**: Well-maintained but optional
- **Alternative**: Manual immutable classes with Equatable (preferred in this project)

#### Build Runner (if avoidable)
- **Status**: ⚠️ MINIMIZE (Only if truly needed)
- **Why to Avoid**:
  - Slows down build process significantly
  - Requires extra dependencies
  - Generated code harder to debug
  - Can be avoided with simpler approaches
- **Maintenance**: Stable but heavy
- **Alternative**: Manual implementation when feasible

---

### 3.6 Styling & UI: Libraries to Avoid

#### Provider Package UI Components
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Creates coupling with Provider pattern (which we avoid)
  - We use BLoC + standard Flutter widgets
  - Adds confusion with mixed patterns
- **Alternative**: Use native Flutter widgets + BLoC

#### GetX UI Components
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - Creates coupling with GetX (which we avoid)
  - Proprietary widgets that don't add value
  - Makes code non-standard
- **Alternative**: Use native Flutter widgets

---

### 3.7 Firebase & Backend: Libraries to Avoid (In This Project)

#### firebase_core / firebase packages
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - We use Parse Server, not Firebase
  - Adding Firebase creates backend confusion
  - Authentication/data flows conflict
  - Unnecessary for this project architecture
  - Agent may confuse Firebase with Parse
- **Maintenance**: Well-maintained but wrong backend
- **Alternative**: Use Parse Server SDK

#### cloud_firestore
- **Status**: ❌ DO NOT USE
- **Why to Avoid**:
  - We use MongoDB via Parse Server
  - Creates architecture confusion
  - Incompatible with our data layer
- **Maintenance**: Well-maintained but wrong database
- **Alternative**: Use Parse Server queries

---

### 3.8 Analytics: Libraries to Avoid (Unless Approved)

#### General Analytics Libraries
- **Status**: ❌ DO NOT USE (Without Approval)
- **Why to Avoid**:
  - Privacy/GDPR considerations
  - Performance overhead
  - Not discussed in team
  - May conflict with data handling
- **Approval**: Requires explicit team decision
- **Alternative**: Wait for team consensus

---

### 3.9 Summary: Red Flags When Adding Libraries

🚩 **STOP - Don't add this library if:**

1. ❌ It duplicates functionality from approved libraries
2. ❌ It's not well-maintained (< 1 year since update)
3. ❌ It conflicts with existing architecture patterns
4. ❌ It requires code generation (slow builds, hard debugging)
5. ❌ The agent frequently makes mistakes implementing it
6. ❌ It adds > 1MB to app bundle size
7. ❌ It requires global instances (bad for testing)
8. ❌ It mixes competing patterns (Provider + BLoC)
9. ❌ It bypasses our data/DI architecture
10. ❌ The team hasn't explicitly approved it

---

## 5. Adding New Dependencies

### Approval Process

Before adding a new library, check:

1. **Is it already approved?** Check the list above
2. **Does it conflict** with existing libraries? (e.g., Provider + BLoC)
3. **Is it necessary?** Flutter already provides alternatives
4. **Performance impact?** Will it slow down the app?
5. **Maintenance?** Is the package actively maintained?
6. **Type safety?** Does it provide strong types?

### Approval Template

New library proposal:

```dart
// 📋 Library Proposal
// Name: [library_name]
// Version: [version]
// Purpose: [What problem does it solve?]
// Conflicts: [Does it conflict with existing libraries?]
// Alternatives: [What else could we use?]
// Maintainability: [Is it well-maintained?]
// Team Agreement: [Has team reviewed and agreed?]
```

Example:

```dart
// 📋 Library Proposal
// Name: intl
// Version: ^0.20.2
// Purpose: Date/time formatting and i18n
// Conflicts: None
// Alternatives: Manual formatting (less elegant)
// Maintainability: Excellent - Google-maintained
// Team Agreement: ✅ Approved
```

---

## 6. Best Practices

### ✅ DO's
- ✅ Use only approved libraries
- ✅ Keep dependency list minimal
- ✅ Use latest stable versions
- ✅ Avoid version conflicts
- ✅ Document why each library is used
- ✅ Review new libraries with team

### ❌ DON'Ts
- ❌ Don't add libraries without approval
- ❌ Don't use outdated libraries
- ❌ Don't mix competing patterns
- ❌ Don't add "just in case" libraries
- ❌ Don't use alpha/beta versions in production
- ❌ Don't ignore dependency conflicts

---

## 7. Code Review & Violation Checklist

When reviewing code, ensure none of the 31 anti-patterns from Section 1.10 are present:

### Architecture Anti-Patterns
- [ ] No exceptions thrown from repositories (use `Result<T>`)
- [ ] Business logic not in widgets
- [ ] No hardcoded strings (use enums/constants)
- [ ] Async errors handled properly
- [ ] All objects immutable with const constructors

### Data & API Anti-Patterns
- [ ] No direct API calls in widgets
- [ ] No unvalidated user input
- [ ] No direct database calls in widgets
- [ ] APIs accessed only via data sources
- [ ] All external dependencies mocked in tests
- [ ] ✅ Using native `parse_server_sdk_flutter` (NOT custom ParseApiClient)
- [ ] ✅ All Parse JSON responses validated with `json_validation` library
- [ ] ✅ Validation occurs in data sources BEFORE deserialization
- [ ] ✅ JSON schemas defined for all Parse object types (Product, Order, User, etc.)
- [ ] ✅ Invalid responses throw ServerException with descriptive messages

### DI & Architecture Anti-Patterns
- [ ] DI used properly (GetIt service locator)
- [ ] BLoCs injected via DI, never created manually
- [ ] GoRouter used ONLY for navigation (no Navigator, no GetX)

### Error Handling Anti-Patterns
- [ ] Using `Result<T>` sealed class, NOT dartz Either
- [ ] No throwing exceptions from repositories
- [ ] Stream errors always handled
- [ ] Proper error types caught (not generic Exception)

### State & Lifecycle Anti-Patterns
- [ ] No async operations in constructors
- [ ] Resources (BLoCs, streams, controllers) properly closed
- [ ] Listeners/subscriptions removed in dispose()
- [ ] BuildContext not stored in variables
- [ ] Checking `mounted` before using context across async gaps
- [ ] Mutable state NOT in BLoCs (all states immutable)

### Type Safety & Standards
- [ ] All objects implement Equatable
- [ ] Sealed classes used for type unions (not string switches)
- [ ] Named routes used in GoRouter (type safe)
- [ ] No lint warnings ignored
- [ ] toString() implemented for debugging

### Anti-Pattern Warnings
- [ ] ⚠️ No Provider, Riverpod, GetX, MobX, Redux
- [ ] ⚠️ No Firebase packages (we use Parse Server)
- [ ] ⚠️ No dartz (use native Result<T>)
- [ ] ⚠️ No Dio (use native parse_server_sdk_flutter)
- [ ] ⚠️ No custom ParseApiClient wrapper (use native parse_server_sdk_flutter)
- [ ] ⚠️ No unnecessary code generation

### Library Compliance
- [ ] Only approved libraries from Section 2
- [ ] No libraries from "Libraries to Avoid" Section 3
- [ ] No library duplication (e.g., multiple HTTP clients)
- [ ] No mixed competing patterns

---

## Conclusion

This curated set of libraries and anti-patterns ensures:
- 🎯 Consistency across codebase
- 🧪 Testability and predictability
- 📦 Minimal dependencies
- 🔒 Type safety
- 🚀 Performance
- 📚 Maintainability

Follow these guidelines for a robust, professional application.
