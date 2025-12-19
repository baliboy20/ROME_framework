# Frontend DDD Architecture Expert Guide
## The Art Deco Bakery - Flutter Application

---
**Document Version**: 2.0
**Last Updated**: 2024-12-19
**Priority**: CRITICAL - Read First
**Dependencies**:
  - Dart SDK: >= 3.0.0
  - Flutter: >= 3.16.0
  - flutter_bloc: ^8.1.3

**Related Documentation**:
  - 📘 [Master Index](../00_MASTER_INDEX.md) - Documentation navigation
  - 📘 [Anti-Patterns Guide](antipatterns_and_approved_libraries_expert.md) - What NOT to do
  - 📘 [BLoC Event Naming](bloc_event_naming_convention_guide.md) - Presentation layer patterns
  - 📘 [Error Handling Patterns](error_handling_patterns_expert.md) - Data layer error flow
  - 📘 [Routing Patterns](../02_PATTERNS/routing_patterns_expert.md) - Navigation setup
  - 📘 [Core Artifacts](../02_PATTERNS/core_artifacts_expert.md) - Domain entities & enums

**Quick Links**:
  - Section 3: [Domain Layer](#3-domain-layer-pure-business-logic)
  - Section 4: [Data Layer](#4-data-layer-external-integration)
  - Section 5: [Presentation Layer](#5-presentation-layer-ui--state)

---

### Overview
This document establishes the Domain-Driven Design (DDD) architecture patterns used throughout the The Art Deco Bakery Flutter application. DDD is a comprehensive approach that aligns software architecture with business domain concepts.

---

## 1. Architecture Philosophy

The application follows a **three-layer DDD architecture**:
- **Domain Layer**: Pure business logic, independent of frameworks
- **Data Layer**: Data persistence and API communication
- **Presentation Layer**: UI, state management, and user interaction

This structure ensures:
- ✅ Clear separation of concerns
- ✅ High testability
- ✅ Framework independence of business logic
- ✅ Scalability and maintainability
- ✅ Easy feature addition without affecting existing code

---

## 2. Folder Structure (per Feature)

Each feature follows a consistent, predictable structure:

```
lib/features/[feature_name]/
├── domain/
│   ├── entities/          # Pure business objects
│   ├── repositories/      # Abstract repository contracts
│   └── usecases/          # Business logic orchestration
├── data/
│   ├── datasources/       # Data retrieval (remote & local)
│   ├── models/            # JSON serializable objects
│   └── repositories/      # Repository implementations
└── presentation/
    ├── bloc/              # State management (events, states)
    ├── pages/             # Full-screen widgets
    └── widgets/           # Reusable UI components
```

### Example: Product Catalog Feature
```
lib/features/product_catalog/
├── domain/
│   ├── entities/
│   │   └── product.dart        # Product, ProductVariant, ProductAddon
│   ├── repositories/
│   │   └── product_repository.dart  # Abstract interface
│   └── usecases/
│       ├── get_all_products.dart
│       ├── get_products_by_category.dart
│       └── search_products.dart
├── data/
│   ├── datasources/
│   │   ├── product_local_data_source.dart
│   │   └── product_remote_data_source.dart
│   ├── models/
│   │   └── product_model.dart
│   └── repositories/
│       └── product_repository_impl.dart
└── presentation/
    ├── bloc/
    │   ├── product_bloc.dart
    │   ├── product_event.dart
    │   └── product_state.dart
    ├── pages/
    │   └── product_catalog_page.dart
    └── widgets/
        └── product_detail_modal.dart
```

---

## 3. Domain Layer (Business Logic)

### 3.1 Entities - Pure Business Objects

**Purpose**: Represent core business concepts with zero external dependencies.

**Characteristics**:
- Immutable (use `const` constructors)
- Extend `Equatable` for value comparison
- No framework imports
- Contain only business-critical data

```dart
// 📁 lib/features/product_catalog/domain/entities/product.dart
import 'package:equatable/equatable.dart';

class Product extends Equatable {
  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final ProductCategory category;
  final List<ProductVariant>? variants;
  final List<ProductAddon>? addons;
  final bool isAvailable;

  const Product({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.category,
    this.variants,
    this.addons,
    this.isAvailable = true,
  });

  @override
  List<Object?> get props => [
    id, name, description, imageUrl, category,
    variants, addons, isAvailable,
  ];
}

enum ProductCategory { all, cakes, pastries, breads }
```

**Key Patterns**:
- Use `enum` for domain constants (e.g., `ProductCategory`)
- Include only fields needed for business logic
- Mark fields as `final` and use `const` constructors
- Override `props` in `Equatable` for proper equality checking

### 3.2 Repositories (Abstract Contracts)

**Purpose**: Define data access contracts that domain layer depends on. Implementations exist in data layer.

**Pattern**:
```dart
// 📁 lib/features/product_catalog/domain/repositories/product_repository.dart
import '../entities/product.dart';

abstract class ProductRepository {
  Future<Result<List<Product>>> getAllProducts();
  Future<Result<List<Product>>> getProductsByCategory(ProductCategory category);
  Future<Result<Product>> getProductById(String id);
  Future<Result<List<Product>>> searchProducts(String query);
}
```

**Result Type** (using Dart sealed classes for type-safe error handling):

For complete Result<T> pattern implementation and usage, see [Error Handling Patterns](error_handling_patterns_expert.md#2-result-type-pattern).

The Result<T> type provides type-safe error handling without external dependencies:
- `Success<T>` - contains the result value
- `Error<T>` - contains error message
- Methods: `map()`, `fold()`, `when()`, `isSuccess`, `isError`

**Quick Example**:
```dart
Result<User> result = await userRepository.getUser(id);
return result.when(
  success: (user) => UserLoaded(user),
  error: (message) => UserError(message),
);
```

**Location**: `/lib/core/types/result.dart`
**See**: [Error Handling Patterns](error_handling_patterns_expert.md) for full implementation

**Key Patterns**:
- Always use `abstract class` for repository contracts
- Return `Result<T>` from all methods (type-safe error handling without external dependencies)
- Never throw exceptions in repositories
- Keep method signatures focused on single responsibility

### 3.3 Use Cases (Business Logic Orchestration)

**Purpose**: Coordinate domain logic and repository calls. Each use case = one business operation.

**Base Class Pattern**:
```dart
// 📁 lib/core/usecases/usecase.dart
import '../types/result.dart';

abstract class UseCase<Type, Params> {
  Future<Result<Type>> call(Params params);
}

class NoParams {
  const NoParams();
}
```

**Implementation Pattern**:
```dart
// 📁 lib/features/product_catalog/domain/usecases/get_all_products.dart
import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/product.dart';
import '../repositories/product_repository.dart';

class GetAllProducts extends UseCase<List<Product>, NoParams> {
  final ProductRepository repository;

  GetAllProducts(this.repository);

  @override
  Future<Result<List<Product>>> call(NoParams params) async {
    return await repository.getAllProducts();
  }
}
```

**With Parameters**:
```dart
// 📁 lib/features/product_catalog/domain/usecases/get_products_by_category.dart
class GetProductsByCategory extends UseCase<List<Product>, GetProductsByCategoryParams> {
  final ProductRepository repository;

  GetProductsByCategory(this.repository);

  @override
  Future<Result<List<Product>>> call(GetProductsByCategoryParams params) async {
    return await repository.getProductsByCategory(params.category);
  }
}

class GetProductsByCategoryParams {
  final ProductCategory category;

  const GetProductsByCategoryParams({required this.category});
}
```

**Use Case Design Rules**:
- ✅ One responsibility per use case
- ✅ Accept strongly-typed parameter objects
- ✅ Always return `Result<Type>`
- ✅ Keep business logic minimal - repository coordination only
- ❌ Never directly access datasources
- ❌ Never know about UI/presentation concerns

---

## 4. Data Layer (Data Access)

### 4.1 Models (JSON Serialization)

**Purpose**: Convert between external data formats (JSON/API) and domain entities.

**Pattern**:
```dart
// 📁 lib/features/product_catalog/data/models/product_model.dart
import '../../domain/entities/product.dart';

class ProductModel extends Product {
  const ProductModel({
    required super.id,
    required super.name,
    required super.description,
    required super.imageUrl,
    required super.category,
    super.variants,
    super.addons,
    super.isAvailable,
  });

  // JSON deserialization (from API/cache)
  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: (json['objectId'] ?? json['id']) as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      category: ProductCategory.values.firstWhere(
        (e) => e.name == json['category'],
        orElse: () => ProductCategory.all,
      ),
      variants: json['variants'] != null
          ? (json['variants'] as List)
              .map((v) => ProductVariantModel.fromJson(v))
              .toList()
          : null,
      addons: json['addons'] != null
          ? (json['addons'] as List)
              .map((a) => ProductAddonModel.fromJson(a))
              .toList()
          : null,
      isAvailable: json['available'] as bool? ??
                   json['isAvailable'] as bool? ?? true,
    );
  }

  // Handle Parse Server format specifically
  factory ProductModel.fromParse(Map<String, dynamic> parseJson) {
    return ProductModel.fromJson(parseJson);
  }

  // JSON serialization (for cache/sending to API)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'imageUrl': imageUrl,
      'category': category.name,
      'variants': variants?.map((v) => (v as ProductVariantModel).toJson()).toList(),
      'addons': addons?.map((a) => (a as ProductAddonModel).toJson()).toList(),
      'isAvailable': isAvailable,
    };
  }
}
```

**Key Patterns**:
- ✅ Models extend domain entities (inheritance)
- ✅ Implement `fromJson()` factory for deserialization
- ✅ Implement `toJson()` for serialization
- ✅ Handle API field name variations (e.g., `objectId` vs `id`)
- ✅ Use default values for optional/nullable fields
- ✅ Convert data types as needed (e.g., price: double → pence: int)

### 4.2 Data Sources (Concrete Data Retrieval)

**Purpose**: Abstract away the specific technology (API, database, cache, etc.).

**Remote Data Source**:
```dart
// 📁 lib/features/product_catalog/data/datasources/product_remote_data_source.dart
abstract class ProductRemoteDataSource {
  Future<List<ProductModel>> getAllProducts();
  Future<List<ProductModel>> getProductsByCategory(ProductCategory category);
  Future<ProductModel> getProductById(String id);
  Future<List<ProductModel>> searchProducts(String query);
}

class ProductRemoteDataSourceImpl implements ProductRemoteDataSource {
  final ParseApiClient parseClient;

  ProductRemoteDataSourceImpl({required this.parseClient});

  @override
  Future<List<ProductModel>> getAllProducts() async {
    try {
      final response = await parseClient.query('Product');
      return (response as List)
          .map((p) => ProductModel.fromParse(p))
          .toList();
    } catch (e) {
      throw ServerException(message: 'Failed to fetch products: $e');
    }
  }
}
```

**Local Data Source**:
```dart
// 📁 lib/features/product_catalog/data/datasources/product_local_data_source.dart
abstract class ProductLocalDataSource {
  Future<List<ProductModel>> getAllProducts();
  Future<void> cacheProducts(List<ProductModel> products);
}

class ProductLocalDataSourceImpl implements ProductLocalDataSource {
  final SharedPreferences prefs;

  ProductLocalDataSourceImpl({required this.prefs});

  @override
  Future<List<ProductModel>> getAllProducts() async {
    final jsonString = prefs.getString('cached_products');
    if (jsonString == null) {
      throw CacheException(message: 'No cached products');
    }

    final jsonList = jsonDecode(jsonString) as List;
    return jsonList.map((p) => ProductModel.fromJson(p)).toList();
  }
}
```

**Data Source Responsibilities**:
- ✅ Implement abstract interfaces
- ✅ Return models (not entities)
- ✅ Throw domain exceptions (ServerException, CacheException)
- ✅ Handle API/database-specific logic
- ✅ Manage caching strategies

### 4.3 Repository Implementations

**Purpose**: Bridge between repositories (domain contracts) and data sources. Implements error handling and fallback strategies.

```dart
// 📁 lib/features/product_catalog/data/repositories/product_repository_impl.dart
import '../../../../core/error/exceptions.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/product.dart';
import '../../domain/repositories/product_repository.dart';
import '../datasources/product_local_data_source.dart';
import '../datasources/product_remote_data_source.dart';

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
      return Success(products);
    } on ServerException catch (e) {
      print('❌ [ProductRepository] ServerException: ${e.message}');
      return _getProductsLocal();
    } catch (e) {
      print('⚠️ [ProductRepository] Remote failed, trying local fallback: $e');
      return _getProductsLocal();
    }
  }

  Future<Result<List<Product>>> _getProductsLocal() async {
    try {
      final products = await localDataSource.getAllProducts();
      print('✅ [ProductRepository] Got ${products.length} products from local');
      return Success(products);
    } catch (e) {
      print('❌ [ProductRepository] Local also failed: $e');
      return Error('Failed to fetch products. Please try again.');
    }
  }
}
```

**Repository Implementation Patterns**:
- ✅ Implement domain repository interfaces
- ✅ Handle errors: catch exceptions → return Error with user message
- ✅ Implement caching strategies (remote → local fallback)
- ✅ Log operations with emojis for debugging
- ✅ Return `Result<T>` from all methods (Success or Error)

---

## 5. Presentation Layer (UI & State Management)

### 5.1 BLoC Events

**Purpose**: Represent user actions or system events that trigger state changes.

```dart
// 📁 lib/features/product_catalog/presentation/bloc/product_event.dart
import 'package:equatable/equatable.dart';
import '../../domain/entities/product.dart';

abstract class ProductEvent extends Equatable {
  const ProductEvent();

  @override
  List<Object> get props => [];
}

// Concrete events
class LoadAllProducts extends ProductEvent {}

class LoadProductsByCategory extends ProductEvent {
  final ProductCategory category;

  const LoadProductsByCategory(this.category);

  @override
  List<Object> get props => [category];
}

class SearchProductsEvent extends ProductEvent {
  final String query;

  const SearchProductsEvent(this.query);

  @override
  List<Object> get props => [query];
}
```

**Event Design Rules**:
- ✅ Extend `ProductEvent` (typed abstract class)
- ✅ Make classes `const` where possible
- ✅ Extend `Equatable` for proper comparison
- ✅ Include all parameters in `props`
- ✅ Use descriptive names (suffix with "Event" or action name)

### 5.2 BLoC States

**Purpose**: Represent different UI states (loading, loaded, error).

```dart
// 📁 lib/features/product_catalog/presentation/bloc/product_state.dart
import 'package:equatable/equatable.dart';
import '../../domain/entities/product.dart';

abstract class ProductState extends Equatable {
  const ProductState();

  @override
  List<Object> get props => [];
}

class ProductInitial extends ProductState {}

class ProductLoading extends ProductState {}

class ProductLoaded extends ProductState {
  final List<Product> products;
  final ProductCategory currentCategory;

  const ProductLoaded({
    required this.products,
    this.currentCategory = ProductCategory.all,
  });

  @override
  List<Object> get props => [products, currentCategory];
}

class ProductError extends ProductState {
  final String message;

  const ProductError(this.message);

  @override
  List<Object> get props => [message];
}
```

**State Design Patterns**:
- ✅ Initial state: represents fresh BLoC
- ✅ Loading state: indicates async operation in progress
- ✅ Loaded state: contains successful data
- ✅ Error state: contains error message
- ✅ All states extend base `ProductState`
- ✅ Make states `const` for optimization

### 5.3 BLoC Business Logic

**Purpose**: Connect events to states by executing use cases and managing state transitions.

```dart
// 📁 lib/features/product_catalog/presentation/bloc/product_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/usecases/get_all_products.dart';
import '../../domain/usecases/get_products_by_category.dart';
import '../../domain/usecases/search_products.dart';
import 'product_event.dart';
import 'product_state.dart';

class ProductBloc extends Bloc<ProductEvent, ProductState> {
  final GetAllProducts getAllProducts;
  final GetProductsByCategory getProductsByCategory;
  final SearchProducts searchProducts;

  ProductBloc({
    required this.getAllProducts,
    required this.getProductsByCategory,
    required this.searchProducts,
  }) : super(ProductInitial()) {
    // Register event handlers
    on<LoadAllProducts>(_onLoadAllProducts);
    on<LoadProductsByCategory>(_onLoadProductsByCategory);
    on<SearchProductsEvent>(_onSearchProducts);
  }

  // Event handler for LoadAllProducts
  Future<void> _onLoadAllProducts(
    LoadAllProducts event,
    Emitter<ProductState> emit,
  ) async {
    print('🎯 [ProductBloc] LoadAllProducts event received');
    emit(ProductLoading());
    print('⏳ [ProductBloc] State changed to ProductLoading');

    final result = await getAllProducts(NoParams());
    print('📬 [ProductBloc] Got result from usecase');

    // Use switch expression for type-safe pattern matching
    final state = switch (result) {
      Success(:final value) => (
        print('✅ [ProductBloc] Success! Emitting ${value.length} products'),
        ProductLoaded(products: value),
      ).$2,
      Error(:final message) => (
        print('❌ [ProductBloc] Error: $message'),
        ProductError(message),
      ).$2,
    };

    emit(state);
  }

  // Event handler for LoadProductsByCategory
  Future<void> _onLoadProductsByCategory(
    LoadProductsByCategory event,
    Emitter<ProductState> emit,
  ) async {
    emit(ProductLoading());
    final result = await getProductsByCategory(
      GetProductsByCategoryParams(category: event.category),
    );

    final state = switch (result) {
      Success(:final value) => ProductLoaded(
        products: value,
        currentCategory: event.category,
      ),
      Error(:final message) => ProductError(message),
    };

    emit(state);
  }

  // Event handler for SearchProductsEvent
  Future<void> _onSearchProducts(
    SearchProductsEvent event,
    Emitter<ProductState> emit,
  ) async {
    if (event.query.isEmpty) {
      add(LoadAllProducts());
      return;
    }

    emit(ProductLoading());
    final result = await searchProducts(
      SearchProductsParams(query: event.query),
    );

    final state = switch (result) {
      Success(:final value) => ProductLoaded(products: value),
      Error(:final message) => ProductError(message),
    };

    emit(state);
  }
}
```

**BLoC Implementation Rules**:
- ✅ Inject all required use cases in constructor
- ✅ Register event handlers in constructor using `on<EventType>(handler)`
- ✅ One handler method per event type (naming: `_on[EventName]`)
- ✅ First emit Loading state
- ✅ Handle success and failure using `Result` switch expressions
- ✅ Use pattern matching: `Success(:final value)` and `Error(:final message)`
- ✅ Convert error messages to UI states
- ✅ Use descriptive debug prints with emojis

### 5.4 UI (Pages and Widgets)

**Purpose**: Display data and respond to user interactions.

```dart
// 📁 lib/features/product_catalog/presentation/pages/product_catalog_page.dart
class ProductCatalogPage extends StatefulWidget {
  @override
  State<ProductCatalogPage> createState() => _ProductCatalogPageState();
}

class _ProductCatalogPageState extends State<ProductCatalogPage> {
  @override
  void initState() {
    super.initState();
    // Trigger initial data load
    context.read<ProductBloc>().add(LoadAllProducts());
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProductBloc, ProductState>(
      builder: (context, state) {
        if (state is ProductLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (state is ProductError) {
          return Center(child: Text('Error: ${state.message}'));
        }

        if (state is ProductLoaded) {
          return GridView.builder(
            itemCount: state.products.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
            ),
            itemBuilder: (context, index) {
              final product = state.products[index];
              return ProductCard(product: product);
            },
          );
        }

        return const SizedBox.shrink();
      },
    );
  }
}
```

**UI Implementation Patterns**:
- ✅ Use `BlocBuilder` to react to state changes
- ✅ Handle all state types (Loading, Loaded, Error, Initial)
- ✅ Dispatch events in `initState()` to load data
- ✅ Keep widgets focused on presentation
- ✅ Use `context.read<BLoC>()` for one-time events
- ✅ Use `context.watch<BLoC>()` in providers for listening

---

## 6. Feature Modules Summary

### Current Features
| Feature | Domain Layer | Data Layer | Presentation | Status |
|---------|-------------|-----------|--------------|--------|
| Product Catalog | Product, Category, Variant, Addon entities | Remote & Local DS | BLoC + Pages | ✅ |
| Shopping Cart | Cart, CartItem entities | Remote & Local DS | BLoC + Pages | ✅ |
| Order Management | Order entity | Remote & Local DS | BLoC + Pages | ✅ |
| Authentication | User entity | Remote & Local DS | BLoC + Pages | ✅ |
| Account | UserProfile entity | Local DS | BLoC + Pages | ✅ |
| Customer Support | Message entity | Remote DS | BLoC + Pages | ✅ |
| Admin Orders | AdminOrder entity | Remote DS | BLoC + Pages | ✅ |
| Admin Dashboard | Stats entities | Remote DS | BLoC + Pages | ✅ |
| Promotions | Promotion entity | Remote & Local DS | Limited | ✅ |

---

## 7. Best Practices & Rules

### ✅ DO's
- Use immutable objects (const constructors)
- Return `Result<T>` instead of throwing
- Separate concerns across layers
- Test domain logic in isolation
- Use dependency injection (GetIt)
- Make models extend entities
- Implement Equatable for value comparison
- Use enum for domain constants
- Add debug prints with emojis for development

### ❌ DON'Ts
- Don't throw exceptions in repositories
- Don't access datasources directly from BLoC
- Don't put business logic in widgets
- Don't skip error handling
- Don't create circular dependencies
- Don't use mutable objects in domain
- Don't import presentation layer in domain/data
- Don't mix async concerns in multiple layers

---

## 8. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│              (Pages, Widgets, BLoC)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ Events
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      BLoC Layer                              │
│         Coordinates use cases and state management           │
└──────────────────────┬──────────────────────────────────────┘
                       │ Calls
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│    Use Cases → Repositories (Abstract) → Entities            │
└──────────────────────┬──────────────────────────────────────┘
                       │ Implements
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  Repository Impl → Data Sources → Models → Serialization    │
└──────────────────────┬──────────────────────────────────────┘
                       │ External Data
                       ▼
            ┌──────────────────────┐
            │  Remote (Parse API)  │
            │  Local (Preferences) │
            └──────────────────────┘
```

---

## 9. Example: Complete Feature Flow

### Scenario: Loading all products
1. **User Action**: Taps "Browse Products" button
2. **UI**: Calls `context.read<ProductBloc>().add(LoadAllProducts())`
3. **BLoC**: Receives `LoadAllProducts` event
4. **BLoC**: Emits `ProductLoading()` state
5. **BLoC**: Calls `getAllProducts(NoParams())` use case
6. **UseCase**: Calls `repository.getAllProducts()`
7. **Repository**: Tries `remoteDataSource.getAllProducts()`
8. **RemoteDS**: Calls `parseClient.query('Product')`
9. **Parse API**: Returns product data as JSON
10. **RemoteDS**: Converts JSON → `ProductModel` list
11. **Repository**: Returns `Right(products)` on success
12. **UseCase**: Passes right value through
13. **BLoC**: Receives success result, emits `ProductLoaded(products)`
14. **UI**: `BlocBuilder` rebuilds with new state
15. **UI**: Displays products in grid

---

## Conclusion

This DDD architecture provides:
- 🏛️ Clear separation of concerns
- 🧪 Testable, isolated business logic
- 🔄 Reusable components across features
- 📱 Consistent patterns across the application
- 🚀 Easy feature scaling and maintenance

Follow these patterns when adding new features to maintain consistency and code quality.
