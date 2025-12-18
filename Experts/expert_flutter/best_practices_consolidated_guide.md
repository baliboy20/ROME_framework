# Consolidated Best Practices Guide
## The Art Deco Bakery - Flutter Application

### Overview
This is the master reference guide consolidating all standards, patterns, and best practices documented across 18 expert guides. It serves as a quick reference for developers implementing features in The Art Deco Bakery.

---

## 1. Architecture & Code Organization

### DDD (Domain-Driven Design) Layer Structure

```
lib/features/[feature_name]/
├── domain/
│   ├── entities/              # Business objects (immutable, extend Equatable)
│   │   ├── order_entity.dart
│   │   └── payment_entity.dart
│   ├── repositories/          # Abstract repository interfaces
│   │   └── order_repository.dart
│   └── usecases/              # Business logic (single responsibility)
│       ├── get_orders_usecase.dart
│       ├── create_order_usecase.dart
│       └── cancel_order_usecase.dart
│
├── data/
│   ├── datasources/           # API, local storage, cache
│   │   ├── order_remote_datasource.dart
│   │   └── order_local_datasource.dart
│   ├── models/                # Data models (JSON serialization)
│   │   └── order_model.dart
│   └── repositories/          # Implement domain repositories
│       └── order_repository_impl.dart
│
└── presentation/
    ├── bloc/                  # State management
    │   ├── order_bloc.dart
    │   ├── order_event.dart
    │   └── order_state.dart
    ├── pages/                 # Full-screen widgets
    │   └── order_list_page.dart
    ├── widgets/               # Reusable components
    │   └── order_card.dart
    └── validators/            # Feature-specific validators
        └── order_validators.dart (if domain-specific)
```

**Key Rules:**
- ✅ Entities are immutable (const constructors)
- ✅ Repositories are interfaces in domain layer
- ✅ UseCases handle single business operation
- ✅ Models handle serialization/deserialization
- ✅ BLoCs coordinate between presentation and domain
- ❌ Don't let UI layer directly access data layer
- ❌ Don't put business logic in widgets

---

## 2. State Management (BLoC Pattern)

### BLoC Event Naming
**Pattern**: `[Verb][Noun]Event`

```dart
// ✅ CORRECT
class LoadOrdersEvent extends OrderEvent { }
class CreateOrderEvent extends OrderEvent { }
class UpdateOrderStatusEvent extends OrderEvent { }
class DeleteOrderEvent extends OrderEvent { }
class SearchOrdersEvent extends OrderEvent { }

// ❌ WRONG
class OrdersLoaded { }           // Past tense
class CreateOrder { }             // Missing Event suffix
class order_update { }            // Wrong naming convention
```

### BLoC State Structure
**Pattern**: Sealed classes for variant states

```dart
sealed class OrderState {
  const OrderState();
}

class OrderInitial extends OrderState {
  const OrderInitial();
}

class OrderLoading extends OrderState {
  const OrderLoading();
}

class OrderLoaded extends OrderState {
  final List<Order> orders;
  const OrderLoaded({required this.orders});
}

class OrderError extends OrderState {
  final String message;
  const OrderError({required this.message});
}
```

### BLoC Event Handler Pattern

```dart
class OrderBloc extends Bloc<OrderEvent, OrderState> {
  final GetOrdersUseCase _getOrdersUseCase;

  OrderBloc({required GetOrdersUseCase getOrdersUseCase})
      : _getOrdersUseCase = getOrdersUseCase,
        super(const OrderInitial()) {
    on<LoadOrdersEvent>(_onLoadOrders);
    on<CreateOrderEvent>(_onCreateOrder);
  }

  Future<void> _onLoadOrders(
    LoadOrdersEvent event,
    Emitter<OrderState> emit,
  ) async {
    emit(const OrderLoading());

    try {
      final result = await _getOrdersUseCase();

      result.when(
        success: (orders) => emit(OrderLoaded(orders: orders)),
        failure: (failure) => emit(OrderError(message: failure.message)),
      );
    } catch (e) {
      emit(OrderError(message: 'Unexpected error: $e'));
    }
  }

  // ... other event handlers
}
```

**Key Rules:**
- ✅ Each event has one handler method
- ✅ Handler methods are named `_on[EventName]`
- ✅ Always emit a state at start and end
- ✅ Use Result/Either pattern for success/failure
- ✅ Handle all exception cases
- ❌ Don't mix multiple events in one handler
- ❌ Don't emit multiple states in sequence

---

## 3. Error Handling Architecture

### Exception → Result → Failure Flow

```
Data Layer: Custom Exceptions
  ↓
Repository: Result<T> type
  ↓
Domain Layer: Failure objects
  ↓
Presentation Layer: States with error messages
```

### Exception Hierarchy

```dart
// 📁 lib/core/exceptions/exceptions.dart

abstract class AppException implements Exception {
  final String message;
  final Exception? originalException;
  AppException({required this.message, this.originalException});
}

class NetworkException extends AppException {
  final int? statusCode;
  NetworkException({
    required String message,
    this.statusCode,
    Exception? originalException,
  }) : super(message: message, originalException: originalException);
}

class CacheException extends AppException {
  CacheException({required String message}) : super(message: message);
}

class ValidationException extends AppException {
  final String fieldName;
  ValidationException({
    required String message,
    required this.fieldName,
  }) : super(message: message);
}

class ServerException extends AppException {
  final String errorCode;
  ServerException({
    required String message,
    required this.errorCode,
  }) : super(message: message);
}
```

### Result/Either Pattern

```dart
// 📁 lib/core/utils/result.dart

sealed class Result<T> {
  const Result();
}

class Success<T> extends Result<T> {
  final T data;
  const Success(this.data);
}

class Failure<T> extends Result<T> {
  final String message;
  final Exception? exception;
  const Failure({required this.message, this.exception});
}

// Usage
extension ResultExt<T> on Result<T> {
  void when({
    required Function(T) success,
    required Function(String, Exception?) failure,
  }) {
    switch (this) {
      case Success(data: final data):
        success(data);
      case Failure(message: final msg, exception: final exc):
        failure(msg, exc);
    }
  }
}
```

### Error Boundary Widget

```dart
// 📁 lib/core/presentation/widgets/error_boundary.dart

class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(FlutterErrorDetails)? errorBuilder;

  const ErrorBoundary({
    required this.child,
    this.errorBuilder,
  });

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  late ErrorHandler _errorHandler;

  @override
  void initState() {
    super.initState();
    _errorHandler = ErrorHandler();

    // Catch framework errors
    _originalOnError = FlutterError.onError;
    FlutterError.onError = (errorDetails) {
      _errorHandler.handleError(errorDetails);
      _showErrorDialog(errorDetails);
    };
  }

  void _showErrorDialog(FlutterErrorDetails details) {
    if (widget.errorBuilder != null) {
      widget.errorBuilder!(details);
    } else {
      _showDefaultErrorUI();
    }
  }

  @override
  void dispose() {
    FlutterError.onError = _originalOnError;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
```

---

## 4. Data Storage Strategy

### Storage Type Decision

| Data Type | Storage | Lifetime | Example |
|-----------|---------|----------|---------|
| **Session Token** | SharedPreferences | App session | User auth token |
| **User Preferences** | SharedPreferences | Until changed | Theme, language |
| **API Cache** | SQLite/Hive | Hours-days | Products, orders |
| **Critical Data** | SQLite/Hive | Permanent | Order history |
| **UI State** | BLoC Memory | Current session | Form input, page |
| **Pending Sync** | SQLite Queue | Until synced | Offline operations |

### Usage Pattern

```dart
// 📁 lib/core/persistence/session_storage.dart

class SessionStorage {
  Future<void> saveSessionToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('session_token', token);
  }

  String? getSessionToken() {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('session_token');
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('session_token');
  }
}

// 📁 lib/features/order/data/repositories/order_repository_impl.dart

class OrderRepositoryImpl implements OrderRepository {
  final OrderRemoteDataSource _remote;
  final OrderLocalDataSource _local;
  final OrderMemoryCache _cache;

  @override
  Future<Result<List<Order>>> getOrders({bool forceRefresh = false}) async {
    try {
      // 1. Check memory cache (fastest)
      if (!forceRefresh) {
        final cached = _cache.get('orders');
        if (cached != null) return Success(cached);
      }

      // 2. Check local storage (fast)
      final local = await _local.getOrders();
      if (local.isNotEmpty && !forceRefresh) {
        _cache.set('orders', local);
        return Success(local);
      }

      // 3. Fetch from remote (slow)
      final remote = await _remote.getOrders();

      // 4. Update caches
      await _local.cacheOrders(remote);
      _cache.set('orders', remote);

      return Success(remote);
    } on NetworkException catch (e) {
      return Failure(message: e.message, exception: e);
    } catch (e) {
      return Failure(message: 'Unexpected error', exception: e as Exception?);
    }
  }
}
```

---

## 5. Input Validation

### Validator Pattern
**Return type**: Always `String?` (null = valid, String = error message)

```dart
// 📁 lib/core/utils/validators.dart

String? validateEmail(String? value) {
  if (value == null || value.isEmpty) {
    return 'Email is required';
  }
  const emailRegex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
  if (!RegExp(emailRegex).hasMatch(value)) {
    return 'Please enter a valid email address';
  }
  return null;
}

String? validatePassword(String? value) {
  if (value == null || value.isEmpty) {
    return 'Password is required';
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!RegExp(r'[A-Z]').hasMatch(value)) {
    return 'Password must contain uppercase letter';
  }
  if (!RegExp(r'[0-9]').hasMatch(value)) {
    return 'Password must contain digit';
  }
  return null;
}

String? validateRequired(String? value, {String fieldName = 'This field'}) {
  if (value == null || value.trim().isEmpty) {
    return '$fieldName is required';
  }
  return null;
}
```

### Input Formatter Usage

```dart
// For real-time formatting
TextFormField(
  inputFormatters: [
    PhoneInputFormatter(),     // lib/core/presentation/input_formatters/
    CurrencyInputFormatter(),
  ],
  validator: validatePhoneNumber,  // From lib/core/utils/validators.dart
)
```

**Key Rules:**
- ✅ Consolidate all validators in `/lib/core/utils/validators.dart`
- ✅ Domain-specific validators (CardValidators) in feature folder
- ✅ Always return `String?` (not bool)
- ✅ Provide user-friendly error messages
- ✅ Validate on blur and submit
- ❌ Don't validate on every keystroke (use formatters instead)

---

## 6. Theming & Styling

### Spacing Scale

```dart
// 📁 lib/core/theme/spacing.dart

class Spacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;    // Most common
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;

  // Composite values
  static const EdgeInsets cardInset = EdgeInsets.all(md);
  static const EdgeInsets pageAll = EdgeInsets.all(md);
  static const EdgeInsets pageHorizontal = EdgeInsets.symmetric(horizontal: md);
}

// Usage
Container(
  padding: Spacing.cardInset,
  child: child,
)
```

### Decorations Library

```dart
// 📁 lib/core/theme/decorations.dart

AppDecorations.cardLight()                  // Card with shadow
AppDecorations.errorContainer()             // Red background, red border
AppDecorations.successContainer()           // Green background, green border
AppDecorations.inputField(isFocused: true)  // Input with focus state
AppDecorations.border()                     // Border only

// Usage
Container(
  decoration: AppDecorations.cardLight(),
  padding: Spacing.cardInset,
  child: child,
)
```

### Status Color Mapping

```dart
// 📁 lib/core/theme/status_colors.dart

Color statusColor = StatusColors.orderStatus(status);
Color paymentColor = StatusColors.paymentStatus(status);
Color deliveryColor = StatusColors.deliveryStatus(status);

// Usage
Container(
  color: StatusColors.orderStatus(order.status),
  child: Text(order.status),
)
```

**Key Rules:**
- ✅ Use `Spacing.*` constants instead of magic numbers
- ✅ Use `AppDecorations.*` factory methods
- ✅ Use `StatusColors.*` for status visualization
- ✅ Use `AppTheme.BorderRadiusObjects.*` for borders
- ✅ Use `AppShadows.*` for shadows
- ❌ Never hardcode spacing (4, 8, 16, 24, etc.)
- ❌ Never duplicate BoxDecoration logic

---

## 7. API Integration (Parse Server)

### Use Native Parse SDK

```dart
// ✅ CORRECT: Using native parse_server_sdk_flutter
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class ProductRemoteDataSource {
  Future<List<ProductModel>> getProducts({String? category}) async {
    final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Product'))
      ..whereEqualTo('active', true)
      ..addAscendingOrder('name');

    if (category != null) {
      queryBuilder.whereEqualTo('category', category);
    }

    final response = await queryBuilder.query();

    if (!response.success) {
      throw NetworkException(
        message: 'Failed to fetch products',
        statusCode: response.statusCode,
      );
    }

    // ✅ MANDATORY: Validate JSON response
    final validationResult = JsonValidation.validate(
      response.result,
      ProductModel.jsonSchema,
    );

    if (!validationResult.isValid) {
      throw ValidationException(
        message: 'Invalid product data format',
        fieldName: 'products',
      );
    }

    return (response.result as List)
        .map((p) => ProductModel.fromParseObject(p))
        .toList();
  }
}

// ❌ WRONG: Using custom ParseApiClient wrapper (deprecated)
class OldProductDataSource {
  Future<List<ProductModel>> getProducts() async {
    final response = await ParseApiClient.query('Product');  // Don't use custom wrappers
    // ...
  }
}
```

**Key Rules:**
- ✅ Use native `parse_server_sdk_flutter` package
- ✅ Use `QueryBuilder<ParseObject>` for queries
- ✅ Use `ParseObject` for CRUD operations
- ✅ Use `ParseUser` for authentication
- ✅ **MANDATORY**: Validate all JSON responses with `json_validation`
- ✅ Handle Parse-specific exceptions (ParseException)
- ❌ Never use custom ParseApiClient wrapper (deprecated)
- ❌ Never skip JSON validation

### LiveQuery Real-Time Updates

```dart
class OrderLiveQueryManager {
  late ParseLiveQuery _liveQuery;
  late Subscription _subscription;

  Future<void> subscribeToOrders() async {
    _liveQuery = await Parse.getServer().getLiveQueryClient();

    final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Order'))
      ..whereGreaterThan('createdAt', DateTime.now().subtract(Duration(days: 7)));

    _subscription = await _liveQuery.subscribe(queryBuilder);

    _subscription.on('update', (message) {
      // ✅ MANDATORY: Validate LiveQuery response
      final validationResult = JsonValidation.validate(
        message,
        Order.jsonSchema,
      );

      if (validationResult.isValid) {
        _handleOrderUpdate(message);
      }
    });
  }

  void dispose() {
    _subscription.unsubscribe();
    _liveQuery.close();
  }
}
```

---

## 8. Entity & Model Patterns

### Domain Entity (Immutable)

```dart
// 📁 lib/features/order/domain/entities/order_entity.dart

class OrderEntity extends Equatable {
  final String id;
  final String customerId;
  final List<OrderItem> items;
  final PaymentDetailsEntity paymentDetails;
  final DeliveryDetailsEntity deliveryDetails;
  final OrderStatus status;
  final DateTime createdAt;
  final DateTime? completedAt;

  const OrderEntity({
    required this.id,
    required this.customerId,
    required this.items,
    required this.paymentDetails,
    required this.deliveryDetails,
    required this.status,
    required this.createdAt,
    this.completedAt,
  });

  // Computed properties
  bool get isPaid => paymentDetails.isPaid;
  bool get isDelivered => deliveryDetails.isDelivered;
  double get total => paymentDetails.total;

  // Immutable copy
  OrderEntity copyWith({
    String? id,
    OrderStatus? status,
    DeliveryDetailsEntity? deliveryDetails,
    DateTime? completedAt,
  }) {
    return OrderEntity(
      id: id ?? this.id,
      customerId: customerId,
      items: items,
      paymentDetails: paymentDetails,
      deliveryDetails: deliveryDetails ?? this.deliveryDetails,
      status: status ?? this.status,
      createdAt: createdAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  @override
  List<Object?> get props => [
    id, customerId, items, paymentDetails, deliveryDetails, status,
    createdAt, completedAt,
  ];
}
```

### Data Model (With Serialization)

```dart
// 📁 lib/features/order/data/models/order_model.dart

class OrderModel extends OrderEntity {
  const OrderModel({
    required String id,
    required String customerId,
    required List<OrderItem> items,
    required PaymentDetailsEntity paymentDetails,
    required DeliveryDetailsEntity deliveryDetails,
    required OrderStatus status,
    required DateTime createdAt,
    DateTime? completedAt,
  }) : super(
    id: id,
    customerId: customerId,
    items: items,
    paymentDetails: paymentDetails,
    deliveryDetails: deliveryDetails,
    status: status,
    createdAt: createdAt,
    completedAt: completedAt,
  );

  // JSON Serialization
  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['objectId'] as String,
      customerId: json['customerId'] as String,
      items: (json['items'] as List).map((item) {
        return OrderItem.fromJson(item as Map<String, dynamic>);
      }).toList(),
      paymentDetails: PaymentDetailsEntity.fromJson(
        json['paymentDetails'] as Map<String, dynamic>,
      ),
      deliveryDetails: DeliveryDetailsEntity.fromJson(
        json['deliveryDetails'] as Map<String, dynamic>,
      ),
      status: OrderStatus.fromString(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'customerId': customerId,
    'items': items.map((item) => item.toJson()).toList(),
    'paymentDetails': paymentDetails.toJson(),
    'deliveryDetails': deliveryDetails.toJson(),
    'status': status.toDbValue(),
    'createdAt': createdAt.toIso8601String(),
    'completedAt': completedAt?.toIso8601String(),
  };

  factory OrderModel.fromParseObject(ParseObject object) {
    return OrderModel.fromJson(object.toJson());
  }
}
```

---

## 9. Sealed Classes vs Enums Decision

### Use Enums For:
- Fixed set of constant values (PaymentStatus, DeliveryMethod)
- Simple discriminators with no associated data
- Status values (pending, processing, completed)

```dart
enum PaymentStatus {
  pending,
  processing,
  paid,
  failed,
  refunded;

  String get displayName {
    switch (this) {
      case PaymentStatus.pending:
        return 'Pending';
      case PaymentStatus.paid:
        return 'Paid';
      // ...
    }
  }
}
```

### Use Sealed Classes For:
- Different properties on different variants
- BLoC states with associated data
- Result/Either patterns (Success with data, Failure with message)
- Domain failures with different error details

```dart
sealed class OrderState {
  const OrderState();
}

class OrderLoaded extends OrderState {
  final List<Order> orders;
  const OrderLoaded({required this.orders});
}

class OrderError extends OrderState {
  final String message;
  const OrderError({required this.message});
}
```

---

## 10. Quick Reference Checklist

### Before Writing Code
- [ ] Is this a new feature? Check if similar feature already exists
- [ ] Is this using DDD pattern correctly (entity → model → repository)?
- [ ] Are you creating new validators? Add to central `/lib/core/utils/validators.dart`
- [ ] Are you adding spacing? Use `Spacing.*` constants
- [ ] Are you adding a decoration? Use `AppDecorations.*` factory
- [ ] Are you handling errors? Use exception → Result → Failure flow
- [ ] Are you persisting data? Choose right storage type (Prefs/SQLite/Memory)

### Code Review Checklist
- [ ] BLoC events follow `[Verb][Noun]Event` naming
- [ ] BLoC states use sealed classes with proper variants
- [ ] Entities extend `Equatable` and are immutable (const constructors)
- [ ] All validators return `String?` (not bool)
- [ ] No magic spacing numbers (use `Spacing.*`)
- [ ] No duplicated BoxDecorations (use `AppDecorations.*`)
- [ ] No duplicated status color logic (use `StatusColors.*`)
- [ ] All API responses validated with JSON validation
- [ ] Error handling uses exception → Result → Failure pattern
- [ ] Feature structure follows DDD pattern

---

## 11. File Locations Quick Reference

| Category | Location |
|----------|----------|
| **Validators** | `/lib/core/utils/validators.dart` |
| **Formatters** | `/lib/core/utils/formatters.dart` |
| **Exceptions** | `/lib/core/exceptions/exceptions.dart` |
| **Result/Either** | `/lib/core/utils/result.dart` |
| **Spacing** | `/lib/core/theme/spacing.dart` |
| **Decorations** | `/lib/core/theme/decorations.dart` |
| **Status Colors** | `/lib/core/theme/status_colors.dart` |
| **Theme** | `/lib/core/theme/app_theme.dart` |
| **Error Boundary** | `/lib/core/presentation/widgets/error_boundary.dart` |
| **Session Storage** | `/lib/core/persistence/session_storage.dart` |
| **Feature BLoC** | `/lib/features/[feature]/presentation/bloc/` |
| **Feature Domain** | `/lib/features/[feature]/domain/` |
| **Feature Data** | `/lib/features/[feature]/data/` |

---

## 12. Documentation References

For detailed information, see:
- **Architecture**: `frontend_ddd_architecture_expert.md`
- **BLoC & Events**: `bloc_event_naming_convention_guide.md`
- **Error Handling**: `error_handling_patterns_expert.md`
- **Storage**: `core_artifacts_expert.md` (Section 6)
- **Validators**: `input_validators_consolidation_guide.md`
- **Theming**: `platform_theme_architecture_guide.md`
- **Sealed vs Enums**: `sealed_classes_vs_enums_guide.md`
- **API Integration**: `parse_flutter_integration_patterns.md`
- **Core Artifacts**: `core_artifacts_expert.md`

---

## 13. Anti-Patterns to Avoid

❌ **Don't:**
- Put business logic in widgets
- Use widgets with mutable state (use BLoC instead)
- Access data layer directly from presentation (use repositories)
- Duplicate validators, decorations, or formatters
- Use magic numbers for spacing (use Spacing constants)
- Create custom exceptions without extending AppException
- Skip error handling (always use try-catch in data layer)
- Forget JSON validation on API responses (MANDATORY)
- Mix Parse SDK approaches (only native parse-flutter)
- Create mutable entities (always use const constructors)

✅ **Do:**
- Follow DDD pattern strictly
- Centralize all validators, formatters, decorations
- Use Result/Either pattern for error handling
- Validate user input before submission
- Test validators and error scenarios
- Use sealed classes for states with variants
- Use enums for simple fixed values
- Document complex business logic
- Create reusable components in `/lib/core/presentation/widgets/`
- Review similar features before creating new ones

---

## 14. Performance Considerations

### Memory
- ✅ Use const constructors where possible
- ✅ Leverage immutable objects
- ✅ Clean up BLoC subscriptions in dispose()
- ✅ Use `const` for widgets, decorations, shadows
- ❌ Don't create new BoxDecoration/TextStyle on every build

### Build Time
- ✅ Use sealed classes instead of nested if-else
- ✅ Use pattern matching for exhaustiveness
- ✅ Cache expensive computations (e.g., DateFormatter)
- ❌ Don't perform I/O in build methods

### Runtime
- ✅ Use multi-layer caching (memory → DB → network)
- ✅ Implement pagination for large lists
- ✅ Use BLoC debouncing for search
- ✅ Lazy-load images
- ❌ Don't query all data at once

---

## References & Related Documents

1. **DDD Architecture**: `frontend_ddd_architecture_expert.md`
2. **BLoC Pattern**: `flutter_bloc_pattern_guide.md`
3. **BLoC Events**: `bloc_event_naming_convention_guide.md`
4. **Error Handling**: `error_handling_patterns_expert.md`
5. **Storage Strategy**: `core_artifacts_expert.md`
6. **Input Validators**: `input_validators_consolidation_guide.md`
7. **Platform Themes**: `platform_theme_architecture_guide.md`
8. **Sealed vs Enums**: `sealed_classes_vs_enums_guide.md`
9. **Parse Integration**: `parse_flutter_integration_patterns.md`
10. **Monitoring**: `monitoring_diagnostics_expert.md`
11. **Routing**: `routing_patterns_expert.md`
12. **UI/UX Platform**: `flutter_ui_ux_platform_guide.md`
13. **Core Artifacts**: `core_artifacts_expert.md`

