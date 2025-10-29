# Sealed Classes vs Enums Decision Guide
## The Art Deco Bakery - Flutter Application

### Overview
This guide explains when to use **sealed classes** versus **enums** in Dart/Flutter, with decision trees, real-world examples, and migration patterns from the Art Deco Bakery codebase.

---

## 1. Quick Decision Tree

```
Do you need to represent a FIXED set of constant values?
│
├─ YES: Use Enum
│   └─ Example: PaymentStatus (pending, processing, paid, failed)
│   └─ Example: DeliveryMethod (delivery, pickup, courier)
│   └─ Example: UserRole (customer, admin, staff)
│
└─ NO: Continue to next question
    │
    └─ Do you need DIFFERENT PROPERTIES on different values?
        │
        ├─ YES: Use Sealed Class
        │   └─ Example: OrderState (Loading, Loaded(data), Error(message))
        │   └─ Example: Failure (NetworkFailure(code), ServerFailure(code), ValidationFailure(field))
        │   └─ Example: BlocState variants with different data
        │
        └─ NO: Use Enum
            └─ Simple fixed values with no variation
```

---

## 2. Enums: When and Why

### Definition
An **enum** is a data type that represents a fixed set of **named constant values**. All enum values have the **same structure** and properties.

### Best Use Cases

#### 2.1 Status Values
```dart
// ✅ Perfect for enums
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
      case PaymentStatus.processing:
        return 'Processing';
      case PaymentStatus.paid:
        return 'Paid';
      case PaymentStatus.failed:
        return 'Failed';
      case PaymentStatus.refunded:
        return 'Refunded';
    }
  }
}

// Usage
final status = PaymentStatus.pending;
print(status.displayName); // Prints: "Pending"
```

#### 2.2 Role/Permission Values
```dart
enum UserRole {
  customer,
  staff,
  admin;

  bool get canManageOrders {
    switch (this) {
      case UserRole.customer:
        return false;
      case UserRole.staff:
        return true;
      case UserRole.admin:
        return true;
    }
  }

  bool get canManageUsers {
    switch (this) {
      case UserRole.customer:
        return false;
      case UserRole.staff:
        return false;
      case UserRole.admin:
        return true;
    }
  }
}
```

#### 2.3 Simple Selection Values
```dart
enum DeliveryMethod {
  delivery,
  pickup,
  courier;

  double get baseFee {
    switch (this) {
      case DeliveryMethod.delivery:
        return 3.99;
      case DeliveryMethod.pickup:
        return 0.0;
      case DeliveryMethod.courier:
        return 5.99;
    }
  }
}

enum SortOrder {
  ascending,
  descending;
}

enum TimeRange {
  today,
  thisWeek,
  thisMonth,
  custom;
}
```

#### 2.4 Category/Type Discriminators
```dart
enum ProductCategory {
  cake,
  pastry,
  bread,
  cookie,
  custom;

  String get displayName {
    switch (this) {
      case ProductCategory.cake:
        return 'Cakes';
      case ProductCategory.pastry:
        return 'Pastries';
      case ProductCategory.bread:
        return 'Breads';
      case ProductCategory.cookie:
        return 'Cookies';
      case ProductCategory.custom:
        return 'Custom Orders';
    }
  }
}
```

### Enum Advantages
✅ Simple, immutable, zero memory overhead
✅ Type-safe: compiler ensures all values handled
✅ Lightweight: perfect for status/constant values
✅ Easy serialization: `.name` and `.values` methods built-in
✅ Pattern matching: compiler enforces exhaustiveness
✅ No null values: never undefined

### Enum Disadvantages
❌ Cannot have different properties per value
❌ Cannot store state/associated data
❌ Limited to constants, no dynamic behavior
❌ All values treated equally in structure
❌ Not suitable for complex types with variants

### Enum Pattern
```dart
enum Status {
  pending,
  processing,
  completed;

  // Display name for UI
  String get displayName {
    switch (this) {
      case Status.pending:
        return 'Pending';
      case Status.processing:
        return 'Processing';
      case Status.completed:
        return 'Completed';
    }
  }

  // Serialization
  static Status fromString(String value) {
    return Status.values.firstWhere(
      (e) => e.name == value,
      orElse: () => Status.pending,
    );
  }

  String toDbValue() => name;
}
```

---

## 3. Sealed Classes: When and Why

### Definition
A **sealed class** is an abstract class that defines a finite set of **direct subtypes**. Each subtype can have **different properties and behavior**. Sealed classes enable exhaustive pattern matching on all subtypes.

### Best Use Cases

#### 3.1 BLoC States with Variants
```dart
// ✅ Perfect for sealed classes
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
  final int totalCount;
  final int currentPage;

  const OrderLoaded({
    required this.orders,
    required this.totalCount,
    required this.currentPage,
  });
}

class OrderError extends OrderState {
  final String message;
  final String? errorCode;
  final Exception? exception;

  const OrderError({
    required this.message,
    this.errorCode,
    this.exception,
  });
}

class OrderEmpty extends OrderState {
  const OrderEmpty();
}

// Usage with pattern matching
switch (state) {
  case OrderInitial():
    print('Starting...');
  case OrderLoading():
    print('Loading orders...');
  case OrderLoaded(:final orders):
    print('Loaded ${orders.length} orders');
  case OrderError(:final message):
    print('Error: $message');
  case OrderEmpty():
    print('No orders found');
}
```

#### 3.2 Result/Either Pattern (Success/Failure)
```dart
// ✅ Perfect for sealed classes
sealed class Result<T> {
  const Result();
}

class Success<T> extends Result<T> {
  final T data;
  final int? statusCode;
  final DateTime fetchedAt;

  const Success({
    required this.data,
    this.statusCode,
    required this.fetchedAt,
  });
}

class Failure<T> extends Result<T> {
  final String message;
  final String code;
  final Exception? exception;
  final StackTrace? stackTrace;

  const Failure({
    required this.message,
    required this.code,
    this.exception,
    this.stackTrace,
  });
}

// Usage
final result = await repository.getOrders();
switch (result) {
  case Success<List<Order>>(:final data):
    print('Got ${data.length} orders');
  case Failure<List<Order>>(:final message):
    print('Failed: $message');
}
```

#### 3.3 Domain-Level Failures
```dart
// ✅ Perfect for sealed classes
sealed class Failure {
  final String message;
  final Exception? exception;

  const Failure({
    required this.message,
    this.exception,
  });
}

class NetworkFailure extends Failure {
  final int? statusCode;
  final String? serverMessage;

  const NetworkFailure({
    required String message,
    this.statusCode,
    this.serverMessage,
    Exception? exception,
  }) : super(message: message, exception: exception);
}

class ValidationFailure extends Failure {
  final String fieldName;
  final dynamic invalidValue;

  const ValidationFailure({
    required String message,
    required this.fieldName,
    required this.invalidValue,
    Exception? exception,
  }) : super(message: message, exception: exception);
}

class ServerFailure extends Failure {
  final String errorCode;
  final Map<String, dynamic>? details;

  const ServerFailure({
    required String message,
    required this.errorCode,
    this.details,
    Exception? exception,
  }) : super(message: message, exception: exception);
}

class CacheFailure extends Failure {
  final bool isCacheEmpty;

  const CacheFailure({
    required String message,
    this.isCacheEmpty = true,
    Exception? exception,
  }) : super(message: message, exception: exception);
}

// Usage
switch (failure) {
  case NetworkFailure(:final statusCode, :final message):
    print('Network error $statusCode: $message');
  case ValidationFailure(:final fieldName, :final invalidValue):
    print('Invalid $fieldName: $invalidValue');
  case ServerFailure(:final errorCode, :final details):
    print('Server error $errorCode: ${details ?? 'No details'}');
  case CacheFailure():
    print('Cache is empty');
}
```

#### 3.4 Event Variants with Different Payloads
```dart
// ✅ Sealed classes work well here too (though BLoC events are usually just classes)
sealed class CheckoutEvent {
  const CheckoutEvent();
}

class InitializeCheckoutEvent extends CheckoutEvent {
  final List<CartItem> items;
  final double total;

  const InitializeCheckoutEvent({
    required this.items,
    required this.total,
  });
}

class UpdateShippingAddressEvent extends CheckoutEvent {
  final Address newAddress;

  const UpdateShippingAddressEvent({required this.newAddress});
}

class ApplyDiscountCodeEvent extends CheckoutEvent {
  final String code;

  const ApplyDiscountCodeEvent({required this.code});
}

class ProcessPaymentEvent extends CheckoutEvent {
  final PaymentMethod paymentMethod;
  final String cvv;

  const ProcessPaymentEvent({
    required this.paymentMethod,
    required this.cvv,
  });
}

class ConfirmOrderEvent extends CheckoutEvent {
  const ConfirmOrderEvent();
}
```

#### 3.5 Navigation Routes with Data
```dart
// ✅ Perfect for sealed classes
sealed class Route {
  const Route();
}

class HomeRoute extends Route {
  const HomeRoute();
}

class ProductDetailRoute extends Route {
  final String productId;
  final bool fromSearch;

  const ProductDetailRoute({
    required this.productId,
    this.fromSearch = false,
  });
}

class CheckoutRoute extends Route {
  final List<CartItem> items;
  final double subtotal;

  const CheckoutRoute({
    required this.items,
    required this.subtotal,
  });
}

class OrderConfirmationRoute extends Route {
  final String orderId;
  final DateTime orderDate;

  const OrderConfirmationRoute({
    required this.orderId,
    required this.orderDate,
  });
}

class AdminDashboardRoute extends Route {
  final UserRole userRole;

  const AdminDashboardRoute({required this.userRole});
}

// Usage
void navigate(Route route) {
  switch (route) {
    case HomeRoute():
      navigateTo('/');
    case ProductDetailRoute(:final productId, :final fromSearch):
      navigateTo('/product/$productId?from=${fromSearch ? 'search' : 'catalog'}');
    case CheckoutRoute(:final items, :final subtotal):
      navigateTo('/checkout', args: {'items': items, 'subtotal': subtotal});
    case OrderConfirmationRoute(:final orderId, :final orderDate):
      navigateTo('/order-confirmation/$orderId');
    case AdminDashboardRoute(:final userRole):
      if (userRole == UserRole.admin) {
        navigateTo('/admin/dashboard');
      }
  }
}
```

### Sealed Class Advantages
✅ Different properties on different variants
✅ Type-safe: compiler enforces exhaustiveness checking
✅ Pattern matching with `switch`
✅ Can have methods and getters
✅ Rich behavior per variant
✅ No null values: never undefined
✅ Can be record-like with positional parameters (Dart 3.0+)

### Sealed Class Disadvantages
❌ More verbose than enums
❌ Requires defining multiple classes
❌ Slightly larger memory footprint
❌ More complex to serialize/deserialize
❌ Not built-in serialization support

### Sealed Class Pattern
```dart
sealed class LoadingState {
  const LoadingState();
}

class Initial extends LoadingState {
  const Initial();
}

class Loading extends LoadingState {
  final double? progress;
  const Loading({this.progress});
}

class Loaded<T> extends LoadingState {
  final T data;
  final int itemCount;
  const Loaded({required this.data, required this.itemCount});
}

class Error extends LoadingState {
  final String message;
  final String? code;
  const Error({required this.message, this.code});
}
```

---

## 4. Side-by-Side Comparison

### Example 1: Product Status

#### ❌ WRONG: Using Sealed Class for Simple Status
```dart
sealed class ProductStatus {
  const ProductStatus();
}

class ActiveStatus extends ProductStatus {
  const ActiveStatus();
}

class InactiveStatus extends ProductStatus {
  const InactiveStatus();
}

class DiscontinuedStatus extends ProductStatus {
  const DiscontinuedStatus();
}

class ArchiveStatus extends ProductStatus {
  const ArchiveStatus();
}

// Over-engineered for simple status!
```

#### ✅ RIGHT: Using Enum for Simple Status
```dart
enum ProductStatus {
  active,
  inactive,
  discontinued,
  archived;

  String get displayName {
    switch (this) {
      case ProductStatus.active:
        return 'Active';
      case ProductStatus.inactive:
        return 'Inactive';
      case ProductStatus.discontinued:
        return 'Discontinued';
      case ProductStatus.archived:
        return 'Archived';
    }
  }
}

// Simple, lightweight, perfect!
```

### Example 2: Checkout Process

#### ❌ WRONG: Using Enum When Different States Need Different Data
```dart
enum CheckoutState {
  initial,
  addressValidation,
  paymentProcessing,
  complete,
  error;

  // ❌ Can't store address, payment details, or error messages
  // ❌ All error states have same structure (lose error details)
}
```

#### ✅ RIGHT: Using Sealed Class for Rich State Variants
```dart
sealed class CheckoutState {
  const CheckoutState();
}

class CheckoutInitial extends CheckoutState {
  const CheckoutInitial();
}

class AddressValidationInProgress extends CheckoutState {
  final Address address;
  const AddressValidationInProgress({required this.address});
}

class AddressValidationError extends CheckoutState {
  final Address address;
  final String errorMessage;
  final String? errorCode;
  const AddressValidationError({
    required this.address,
    required this.errorMessage,
    this.errorCode,
  });
}

class PaymentProcessing extends CheckoutState {
  final Address address;
  final double amount;
  const PaymentProcessing({
    required this.address,
    required this.amount,
  });
}

class CheckoutComplete extends CheckoutState {
  final String orderId;
  final DateTime completedAt;
  const CheckoutComplete({
    required this.orderId,
    required this.completedAt,
  });
}

class CheckoutError extends CheckoutState {
  final String message;
  final String? code;
  final Exception? exception;
  const CheckoutError({
    required this.message,
    this.code,
    this.exception,
  });
}
```

---

## 5. Real-World Examples from Art Deco Bakery

### Current Usage

#### ✅ Good: Enum for Status
```dart
enum PaymentStatus {
  pending,
  processing,
  paid,
  failed,
  refunded;
  // Simple, perfect use of enum
}

enum DeliveryStatus {
  pending,
  processing,
  dispatched,
  outForDelivery,
  delivered,
  failed;
  // Status values with no associated data
}
```

#### ✅ Good: Sealed Class for Results
```dart
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
```

#### ⚠️ Could Be Improved: Consider Sealed for Complex States
```dart
// Current (could work, but sealed class is cleaner)
enum OrderState {
  initial,
  loading,
  loaded,
  error,
  empty,
}

// Better with sealed class (can store associated data)
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

class OrderEmpty extends OrderState {
  const OrderEmpty();
}
```

---

## 6. Decision Matrix

| Criteria | Enum | Sealed Class |
|----------|------|--------------|
| **Fixed set of values** | ✅ Yes | ⚠️ Can be |
| **All values same structure** | ✅ Yes (required) | ❌ No (different per variant) |
| **Need associated data** | ❌ No | ✅ Yes |
| **Different properties per value** | ❌ No | ✅ Yes |
| **Status/State values** | ✅ Perfect | ⚠️ Overkill if simple |
| **Multiple variants with data** | ❌ No | ✅ Perfect |
| **Simple and lightweight** | ✅ Yes | ⚠️ More verbose |
| **Pattern matching** | ✅ Yes | ✅ Yes (better) |
| **Exhaustiveness checking** | ✅ Yes | ✅ Yes (better) |
| **Easy serialization** | ✅ Yes (.name) | ❌ Manual |
| **Memory overhead** | ✅ Minimal | ⚠️ More |
| **Complex behavior** | ❌ Limited | ✅ Yes |

---

## 7. Advanced Patterns

### 7.1 Using Both: Enum + Sealed Class

```dart
// Status enum (simple, fixed values)
enum PaymentStatus {
  pending,
  processing,
  completed,
  failed;
}

// Payment event (sealed class with data)
sealed class PaymentEvent {
  const PaymentEvent();
}

class InitializePaymentEvent extends PaymentEvent {
  final double amount;
  final PaymentMethod method;
  const InitializePaymentEvent({
    required this.amount,
    required this.method,
  });
}

class UpdatePaymentStatusEvent extends PaymentEvent {
  final PaymentStatus newStatus;
  final String? transactionId;
  const UpdatePaymentStatusEvent({
    required this.newStatus,
    this.transactionId,
  });
}

class PaymentErrorEvent extends PaymentEvent {
  final PaymentStatus failedStatus;
  final String errorMessage;
  const PaymentErrorEvent({
    required this.failedStatus,
    required this.errorMessage,
  });
}

// Usage
switch (event) {
  case InitializePaymentEvent(:final amount):
    print('Initializing payment for $amount');
  case UpdatePaymentStatusEvent(:final newStatus):
    print('Payment status: ${newStatus.name}');
  case PaymentErrorEvent(:final failedStatus, :final errorMessage):
    print('Payment failed as $failedStatus: $errorMessage');
}
```

### 7.2 Sealed Classes with Records (Dart 3.0+)

```dart
// Using records for concise state definitions
sealed class AppState {
  const AppState();
}

class AppLoading extends AppState {
  const AppLoading();
}

class AppReady extends AppState {
  final (User user, List<Order> orders) data;
  const AppReady(this.data);
}

class AppError extends AppState {
  final (String message, String? code) error;
  const AppError(this.error);
}

// Pattern matching with destructuring
switch (state) {
  case AppLoading():
    print('Loading app...');
  case AppReady(:final data):
    print('App ready with user: ${data.$1.name}');
  case AppError(:final error):
    print('Error: ${error.$1}');
}
```

### 7.3 Sealed Interfaces (Multiple Trait Pattern)

```dart
// Define common behavior
sealed class Identifiable {
  String get id;
}

sealed class Timestamped {
  DateTime get createdAt;
}

// Combine traits
sealed class Entity implements Identifiable, Timestamped {
  const Entity();
}

class User extends Entity {
  final String id;
  final String name;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.name,
    required this.createdAt,
  });
}

class Product extends Entity {
  final String id;
  final String name;
  final double price;
  final DateTime createdAt;

  const Product({
    required this.id,
    required this.name,
    required this.price,
    required this.createdAt,
  });
}
```

---

## 8. Migration Guide: Enum vs Sealed Class

### When to Refactor Enum to Sealed Class

**Signs you need sealed class:**
1. ❌ You're adding methods that behave differently per value
2. ❌ You want different data on different values
3. ❌ You're creating helper extensions that only apply to some values
4. ❌ You're using null-coalescing to handle different variants

**Example: Time to Refactor**
```dart
// ❌ Starting to smell like sealed class
enum OrderState {
  initial,
  loading,
  loaded,
  error,
  empty,
}

extension OrderStateExtension on OrderState {
  // Different behavior for different states
  String get message {
    switch (this) {
      case OrderState.initial:
        return '';
      case OrderState.loading:
        return 'Loading...';
      case OrderState.loaded:
        return ''; // No message for loaded state
      case OrderState.error:
        return 'Error!'; // But what's the error details?
      case OrderState.empty:
        return 'No orders found';
    }
  }
}

// ✅ Refactor to sealed class
sealed class OrderState {
  String get message;
}

class OrderInitial extends OrderState {
  @override
  String get message => '';
}

class OrderLoading extends OrderState {
  @override
  String get message => 'Loading...';
}

class OrderLoaded extends OrderState {
  final List<Order> orders;
  OrderLoaded({required this.orders});

  @override
  String get message => '';
}

class OrderError extends OrderState {
  final String errorMessage;
  final String? errorCode;
  OrderError({required this.errorMessage, this.errorCode});

  @override
  String get message => errorMessage;
}

class OrderEmpty extends OrderState {
  @override
  String get message => 'No orders found';
}
```

### When to Simplify Sealed Class to Enum

**Signs you might overuse sealed class:**
1. ❌ All variants have identical structure
2. ❌ No variant-specific methods or properties
3. ❌ Used only as a discriminator
4. ❌ Each variant is just a marker with no data

**Example: Simplify to Enum**
```dart
// ❌ Over-engineered
sealed class NotificationPriority {
  const NotificationPriority();
}

class LowPriority extends NotificationPriority {
  const LowPriority();
}

class MediumPriority extends NotificationPriority {
  const MediumPriority();
}

class HighPriority extends NotificationPriority {
  const HighPriority();
}

class UrgentPriority extends NotificationPriority {
  const UrgentPriority();
}

// ✅ Simplify to enum
enum NotificationPriority {
  low,
  medium,
  high,
  urgent;

  int get sortOrder => index;
}
```

---

## 9. Best Practices Summary

### Use Enums When:
✅ You have a **fixed set of constant values**
✅ All values have the **same structure**
✅ Values are **simple status/type discriminators**
✅ You want **lightweight, zero-overhead types**
✅ You need **easy serialization**
✅ The set of values will **rarely/never change**

**Examples:**
- `PaymentStatus.pending`, `PaymentStatus.paid`
- `DeliveryMethod.delivery`, `DeliveryMethod.pickup`
- `UserRole.customer`, `UserRole.admin`
- `SortOrder.ascending`, `SortOrder.descending`

### Use Sealed Classes When:
✅ You need **different properties on different variants**
✅ Variants have **associated data**
✅ You want **rich behavior per variant**
✅ You need **pattern matching with data extraction**
✅ The **set may grow** with new variants later
✅ You want **type-safe state management**

**Examples:**
- BLoC states: `OrderLoading`, `OrderLoaded(data)`, `OrderError(message)`
- Results: `Success(data)`, `Failure(message)`
- Domain failures: `NetworkFailure(code)`, `ValidationFailure(field)`
- Navigation routes: `ProductRoute(id)`, `CheckoutRoute(items)`

---

## 10. References

- **Dart Language**: https://dart.dev/language/class-modifiers#sealed
- **BLoC Pattern**: See `flutter_bloc_pattern_guide.md`
- **Error Handling**: See `error_handling_patterns_expert.md`
- **Core Artifacts**: See `core_artifacts_expert.md`

