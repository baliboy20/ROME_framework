# Core Artifacts & Object Instantiation Expert Guide
##  Flutter Application

---
**Document Version**: 2.0
**Last Updated**: 2024-12-19
**Priority**: HIGH - Essential Reference
**Dependencies**:
  - equatable: ^2.0.5
  - Dart SDK: >= 3.0.0

**Related Documentation**:
  - 📘 [Master Index](../00_MASTER_INDEX.md) - Documentation navigation
  - 📘 [Frontend DDD Architecture](../01_CORE/frontend_ddd_architecture_expert.md) - Domain layer architecture
  - 📘 [Sealed Classes vs Enums](sealed_classes_vs_enums_guide.md) - Type decision guide
  - 📘 [Input Validators](../05_REFERENCE/input_validators_consolidation_guide.md) - Validation patterns

**Quick Links**:
  - Section 1: [Shared Enums](#1-shared-enums-db--client)
  - Section 2: [Domain Entities](#2-domain-entities-examples)

---

### Overview
This document defines shared enums, domain entities, validation rules, and business logic patterns. Entities are immutable and strongly-typed to ensure consistency across the application.

---

## 1. Shared Enums (DB ↔ Client)

**Location**: `lib/core/shared/enums/`

Enums define fixed business values shared between database and Flutter client. Always store the **enum name** (not display name) in the database.

### 1.1 Database → Client Mapping

**Store in Database**: `pending`, `processing`, `paid`, `failed`, `refunded`
**Map to Enum**: `PaymentStatus.pending`, `PaymentStatus.processing`, etc.
**Display to User**: `String get displayName`

```dart
// 📁 lib/core/shared/enums/payment_status.dart

enum PaymentStatus {
  pending,
  processing,
  paid,
  failed,
  refunded,
  partialRefund;

  // Display names for UI (never stored in DB)
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
      case PaymentStatus.partialRefund:
        return 'Partial Refund';
    }
  }

  // Serialization for API/DB
  static PaymentStatus fromString(String value) {
    return PaymentStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => PaymentStatus.pending,
    );
  }

  String toDbValue() => name;  // Store "paid", not "Paid"
}
```

### 1.2 Common Enums

**DeliveryStatus**: `pending`, `processing`, `dispatched`, `outForDelivery`, `delivered`, `failed`

**PaymentMethod**: `card`, `wallet`, `bankTransfer`, `cashOnDelivery`

**DeliveryMethod**: `delivery`, `pickup`, `courier`

### 1.3 Enum Pattern

✅ Store enum **name** (lowercase) in database
✅ Use `displayName` getter for UI labels
✅ Add `fromString()` for deserialization
✅ Add `toDbValue()` for serialization
❌ Never store `displayName` in database
❌ Don't use strings for enum values

---

## 2. Domain Entities

**Location**: `lib/core/shared/entities/`

Entities are **immutable**, strongly-typed value objects. All entities **extend Equatable** for value-based equality.

### 2.1 PaymentDetailsEntity

```dart
// 📁 lib/core/shared/entities/payment_details_entity.dart

class PaymentDetailsEntity extends Equatable {
  // Monetary amounts in pence (no floating-point precision issues)
  final int subtotalInPence;
  final int taxInPence;
  final int deliveryFeeInPence;
  final int discountInPence;
  final int totalInPence;

  // Payment details
  final PaymentMethod paymentMethod;
  final PaymentStatus paymentStatus;
  final String? transactionId;
  final String? last4Digits;
  final DateTime? paidAt;

  const PaymentDetailsEntity({
    required this.subtotalInPence,
    required this.taxInPence,
    this.deliveryFeeInPence = 0,
    this.discountInPence = 0,
    required this.totalInPence,
    required this.paymentMethod,
    required this.paymentStatus,
    this.transactionId,
    this.last4Digits,
    this.paidAt,
  });

  @override
  List<Object?> get props => [
    subtotalInPence, taxInPence, deliveryFeeInPence, discountInPence,
    totalInPence, paymentMethod, paymentStatus, transactionId,
    last4Digits, paidAt,
  ];

  // Convenience getters
  double get total => totalInPence / 100.0;
  bool get isPaid => paymentStatus == PaymentStatus.paid;

  // Immutable copy
  PaymentDetailsEntity copyWith({
    int? totalInPence,
    PaymentStatus? paymentStatus,
    DateTime? paidAt,
  }) {
    return PaymentDetailsEntity(
      subtotalInPence: subtotalInPence,
      taxInPence: taxInPence,
      totalInPence: totalInPence ?? this.totalInPence,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paidAt: paidAt ?? this.paidAt,
    );
  }
}
```

### 2.2 CustomerDetailsEntity

```dart
class CustomerDetailsEntity extends Equatable {
  final String customerId;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;

  const CustomerDetailsEntity({
    required this.customerId,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
  });

  String get fullName => '$firstName $lastName';

  @override
  List<Object?> get props => [customerId, firstName, lastName, email, phone];
}
```

### 2.3 DeliveryDetailsEntity

```dart
class DeliveryDetailsEntity extends Equatable {
  final DeliveryMethod deliveryMethod;
  final DeliveryStatus deliveryStatus;
  final String? addressLine1;
  final String? city;
  final String? postalCode;
  final DateTime? estimatedDeliveryDate;
  final DateTime? actualDeliveryDate;

  const DeliveryDetailsEntity({
    required this.deliveryMethod,
    required this.deliveryStatus,
    this.addressLine1,
    this.city,
    this.postalCode,
    this.estimatedDeliveryDate,
    this.actualDeliveryDate,
  });

  bool get isDelivered => deliveryStatus == DeliveryStatus.delivered;

  @override
  List<Object?> get props => [
    deliveryMethod, deliveryStatus, addressLine1, city, postalCode,
    estimatedDeliveryDate, actualDeliveryDate,
  ];
}
```

**Pattern**: Immutable with const constructors, extend Equatable, add `copyWith()` for modifications.

---

## 3. Business Rules & Validation

### 3.1 Where Business Rules Live

**Validators** (Input validation): `lib/core/utils/validators.dart`
```dart
String? validateEmail(String? value) { /* ... */ }
String? validatePassword(String? value) { /* ... */ }
String? validatePrice(String? value) { /* ... */ }
```

**Entity Getters** (Derived state): In entities via computed properties
```dart
bool get isPaid => paymentStatus == PaymentStatus.paid;
bool get isDelivered => deliveryStatus == DeliveryStatus.delivered;
double get total => totalInPence / 100.0;
```

**Use Cases** (Business logic): `lib/features/*/domain/usecases/`
- Order creation rules (validate items, calculate totals, apply discounts)
- Payment processing rules (check balance, validate payment method)
- Delivery eligibility rules (check postcode, delivery method availability)

**BLoCs** (State transitions): `lib/features/*/presentation/bloc/`
- Apply validators before state transitions
- Check entity state (via getters) before allowing actions
- Emit error states when business rules violated

### 3.2 Validation Flow

```
User Input
    ↓
Validators.validateEmail() → null or error message
    ↓
Form shows error or accepts input
    ↓
Use Case processes valid input
    ↓
Entity created/updated with business rules
    ↓
BLoC emits state with validated entity
```

### 3.3 Common Validators

```dart
// 📁 lib/core/utils/validators.dart

String? validateEmail(String? value) { /* Regex check */ }
String? validatePassword(String? value) { /* Length, strength */ }
String? validatePostcode(String? value) { /* UK postcode format */ }
String? validatePhoneNumber(String? value) { /* UK phone format */ }
String? validatePrice(String? value) { /* Positive number */ }
String? validateRequired(String? value) { /* Not empty */ }
```

---

## 4. Formatting Utilities

**Currency**: `CurrencyFormatter.formatPence(2999)` → `"£29.99"`
**Dates**: `Formatters.formatDate(date)` → `"15/01/2025"`
**Phone**: `Formatters.formatPhone(phone)` → `"0123 456 7890"`

---

## 5. Core Widgets

Reusable UI components in `lib/core/presentation/widgets/`:
- `StatusBadge` - Display enum status with color
- `EmptyState` - No data fallback
- `LoadingOverlay` - Loading overlay with message
- `AdminScaffold` - Admin page template
- `AdminShell` - Admin navigation shell

---

## 6. Data Storage Strategy

**Location**: `lib/core/services/storage/` and `lib/core/persistence/`

Different types of data require different storage solutions. This section provides decision guidance and implementation patterns.

### 6.1 Storage Type Decision Matrix

| Data Type | Storage Solution | Use Case | Lifetime | Implementation |
|-----------|------------------|----------|----------|-----------------|
| **Session Token** | SharedPreferences | Persist user session | App session + persistence | `shared_preferences` package |
| **API Cache** | SQLite/Hive | Cache API responses, product data | Hours to days | `sqflite` or `hive` |
| **User Preferences** | SharedPreferences | Theme, language, notifications | Until changed | `shared_preferences` package |
| **Temporary UI State** | Memory (BLoC) | Form input, pagination, filters | Current session | BLoC state management |
| **Critical Business Data** | SQLite/Hive | Orders, payment history | Permanent | `sqflite` with transactions |
| **Sync Pending Data** | SQLite + Queue | Offline-first operations | Until synced | SQLite + queue service |

### 6.2 Detailed Storage Patterns

#### 6.2.1 SharedPreferences: Session Tokens & User Settings

**Use when**: Data is small (<1MB), key-value structure, needs to persist across app restarts

✅ **Perfect for**:
- Session tokens and authentication state
- User preferences (theme, language, notification settings)
- Simple scalar values (user ID, last login time)
- Small string data (API keys, device identifiers)

❌ **Avoid for**:
- Large JSON objects (>100KB)
- Complex nested structures
- Data requiring transactions
- Frequently updated collections

```dart
// 📁 lib/core/persistence/session_storage.dart
import 'package:shared_preferences/shared_preferences.dart';

class SessionStorage {
  static const _sessionTokenKey = 'session_token';
  static const _userIdKey = 'user_id';

  final SharedPreferences _prefs;

  SessionStorage(this._prefs);

  // Persist session token
  Future<void> saveSessionToken(String token) async {
    await _prefs.setString(_sessionTokenKey, token);
  }

  // Retrieve session token
  String? getSessionToken() => _prefs.getString(_sessionTokenKey);

  // Clear session
  Future<void> clearSession() async {
    await _prefs.remove(_sessionTokenKey);
    await _prefs.remove(_userIdKey);
  }
}
```

#### 6.2.2 SQLite/Hive: API Cache & Business Data

**Use when**: Data is large, complex structures, needs efficient querying, requires transactions

✅ **Perfect for**:
- API response caching (products, categories, orders)
- Order history and payment records
- Offline-first data synchronization
- Data requiring filtering, sorting, pagination
- Transactional operations (multi-step updates)

❌ **Avoid for**:
- Simple key-value data (use SharedPreferences)
- Highly temporary data (use memory/BLoC)
- Data that changes every millisecond

```dart
// 📁 lib/core/persistence/product_cache.dart
import 'package:sqflite/sqflite.dart';

class ProductCacheRepository {
  final Database _database;
  static const tableName = 'products';

  ProductCacheRepository(this._database);

  // Cache products from API
  Future<void> cacheProducts(List<ProductModel> products) async {
    await _database.transaction((txn) async {
      // Clear old cache
      await txn.delete(tableName);
      // Insert new products
      for (var product in products) {
        await txn.insert(
          tableName,
          product.toJson(),
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
    });
  }

  // Query cached products
  Future<List<ProductModel>> getProducts({
    String? category,
    bool? inStock,
  }) async {
    final List<Map<String, dynamic>> maps = await _database.query(
      tableName,
      where: _buildWhereClause(category, inStock),
      whereArgs: _buildWhereArgs(category, inStock),
    );

    return maps.map((m) => ProductModel.fromJson(m)).toList();
  }

  // Efficient pagination
  Future<List<ProductModel>> getProductsPage({
    required int page,
    required int pageSize,
  }) async {
    final offset = (page - 1) * pageSize;
    final List<Map<String, dynamic>> maps = await _database.query(
      tableName,
      limit: pageSize,
      offset: offset,
      orderBy: 'createdAt DESC',
    );

    return maps.map((m) => ProductModel.fromJson(m)).toList();
  }
}
```

#### 6.2.3 Memory (BLoC State): Temporary UI State

**Use when**: Data is only needed during current app session, no persistence required, updates frequently

✅ **Perfect for**:
- Form input values before submission
- Pagination/filter state
- UI visibility toggles
- Loading/error states
- Transient selections (shopping cart during checkout)

❌ **Avoid for**:
- Data that must survive app restart
- Critical user data
- Large collections (>1000 items)

```dart
// 📁 lib/features/product/presentation/bloc/product_bloc.dart
class ProductBloc extends Bloc<ProductEvent, ProductState> {
  // Temporary UI state, not persisted
  int _currentPage = 1;
  String? _selectedCategory;
  bool _showOutOfStock = true;

  ProductBloc() : super(ProductInitial()) {
    on<ProductFetched>(_onProductFetched);
    on<ProductPageChanged>(_onPageChanged);
    on<ProductCategoryFilterChanged>(_onCategoryChanged);
  }

  Future<void> _onProductFetched(
    ProductFetched event,
    Emitter<ProductState> emit,
  ) async {
    emit(ProductLoading());

    try {
      final products = await _repository.getProducts(
        page: _currentPage,
        category: _selectedCategory,
      );

      emit(ProductLoaded(products: products));
    } catch (e) {
      emit(ProductError(message: e.toString()));
    }
  }

  // UI state changes in memory, not persisted
  Future<void> _onPageChanged(
    ProductPageChanged event,
    Emitter<ProductState> emit,
  ) async {
    _currentPage = event.page;
    add(ProductFetched()); // Re-fetch with new page
  }
}
```

### 6.3 Layered Storage Architecture

```
┌─────────────────────────────────────────────────────┐
│           Presentation Layer (BLoC)                 │
│    Temporary UI State (in-memory, no persistence)   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│    Repository Layer (Business Logic)                │
│  - Coordinates between data sources                 │
│  - Implements cache strategy                        │
│  - Handles offline-first logic                      │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        │                     │              │
┌───────▼────────┐  ┌─────────▼──────┐  ┌──▼────────────┐
│  Remote API    │  │  Local Storage │  │ In-Memory     │
│  (Parse Server)│  │  (SQLite/Hive) │  │ Cache Layer   │
└────────────────┘  └────────────────┘  └───────────────┘
```

**Strategy**:
1. **Session/Auth Data**: SharedPreferences only (simple, always available)
2. **API Cache**: SQLite + in-memory cache (check memory first, then DB, then network)
3. **Offline Sync**: SQLite queue + sync service (store pending operations, sync when online)
4. **UI State**: Memory only (BLoC, no persistence needed)

### 6.4 Implementation Pattern: Repository with Multi-Layer Cache

```dart
// 📁 lib/features/product/data/repositories/product_repository_impl.dart

class ProductRepositoryImpl implements ProductRepository {
  final ProductRemoteDataSource _remoteDataSource;
  final ProductLocalDataSource _localDataSource;
  final ProductMemoryCacheService _memoryCache;

  ProductRepositoryImpl({
    required ProductRemoteDataSource remoteDataSource,
    required ProductLocalDataSource localDataSource,
    required ProductMemoryCacheService memoryCache,
  })  : _remoteDataSource = remoteDataSource,
        _localDataSource = localDataSource,
        _memoryCache = memoryCache;

  @override
  Future<Result<List<ProductEntity>>> getProducts({
    String? category,
    bool forceRefresh = false,
  }) async {
    try {
      // 1. Check in-memory cache (fastest)
      if (!forceRefresh) {
        final cached = _memoryCache.get(category ?? 'all');
        if (cached != null) return Result.success(cached);
      }

      // 2. Check local database (fast)
      final local = await _localDataSource.getProducts(category: category);
      if (local.isNotEmpty && !forceRefresh) {
        _memoryCache.set(category ?? 'all', local);
        return Result.success(local);
      }

      // 3. Fetch from remote API (slow)
      final remote = await _remoteDataSource.getProducts(category: category);

      // 4. Update local cache
      await _localDataSource.cacheProducts(remote);

      // 5. Update in-memory cache
      _memoryCache.set(category ?? 'all', remote);

      return Result.success(remote);
    } on NetworkException catch (e) {
      return Result.failure(NetworkFailure(message: e.message));
    } catch (e) {
      return Result.failure(UnexpectedFailure(message: e.toString()));
    }
  }
}
```

### 6.5 Best Practices

✅ **Do**:
- Use SharedPreferences for session tokens and small user preferences
- Use SQLite/Hive for API cache and critical business data
- Keep UI state in BLoC memory only
- Implement multi-layer caching: memory → database → network
- Clear storage on logout
- Validate data when reading from storage (JSON validation)
- Use transactions for multi-step database operations
- Implement TTL (time-to-live) for cached data

❌ **Don't**:
- Store large objects in SharedPreferences
- Use database for temporary UI state
- Forget to clear sensitive data on logout
- Store unencrypted passwords or tokens (use native keychain)
- Skip JSON validation for storage data
- Use SharedPreferences for frequently updated data
- Store business logic in storage layer

---

## Best Practices

✅ Entities immutable with const constructors
✅ All entities extend Equatable
✅ Enums stored as names (lowercase) in database
✅ Display names via getter, never in DB
✅ Monetary values in pence (smallest unit)
✅ Business rules in Use Cases and Entity getters
✅ Validators in core/utils, not scattered
❌ Don't create mutable entities
❌ Don't store display names in database
❌ Don't hardcode business rules in widgets
❌ Don't use strings when enums exist
