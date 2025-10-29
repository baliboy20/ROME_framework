# Flutter Architecture Principles for ROME Methodology

**Version:** 1.0  
**Created:** 2025-08-06  
**Scope:** Flutter SDK development standards for ROME TDD projects

---

## 🏛️ **ARCHITECTURAL FOUNDATION**

### **Mandatory Architecture: Domain-Driven Development (DDD)**

All Flutter applications in ROME projects MUST follow DDD Clean Architecture:

```
lib/
├── domain/          # 🎯 Business Logic Layer (Pure Dart)
│   ├── entities/    # Business objects (immutable)
│   ├── repositories/# Data access contracts 
│   └── usecases/   # Business operations
├── data/           # 🔌 Data Access Layer  
│   ├── models/     # API response models
│   ├── datasources/# HTTP/local data sources
│   └── repositories/# Repository implementations
└── presentation/   # 🎨 UI Layer
    ├── pages/      # Screen widgets
    ├── widgets/    # UI components  
    └── providers/  # State management
```

### **Layer Dependency Rules (MANDATORY)**

```
Presentation → Domain ← Data
     ❌           ✅      ❌
  Cannot depend  Can depend  Cannot depend
  on Data       on Domain   on Presentation
```

**Enforcement:** Domain layer MUST NOT import Flutter or HTTP packages.

---

## 🔧 **TECHNICAL STANDARDS**

### **State Management: Provider Pattern (Required)**

```yaml
# MANDATORY Dependencies
dependencies:
  provider: ^6.1.1    # ✅ State management
  
# FORBIDDEN Dependencies  
# bloc: ^x.x.x        # ❌ Not standardized
# riverpod: ^x.x.x    # ❌ Not standardized
```

**Rationale:** Provider is lightweight, testable, and consistent across projects.

### **HTTP Client: Dio (Required)**

```yaml
dependencies:
  dio: ^5.4.0         # ✅ Required HTTP client
  
# FORBIDDEN
# http: ^x.x.x        # ❌ Less feature-rich
```

**Rationale:** Dio provides interceptors, error handling, and testing capabilities.

### **Testing Framework (Mandatory)**

```yaml
dev_dependencies:
  flutter_test: sdk   # ✅ Built-in testing
  mockito: ^5.4.4     # ✅ Mocking for contracts
  integration_test: sdk # ✅ E2E testing
```

---

## 📐 **DESIGN PATTERNS (ENFORCED)**

### **1. Repository Pattern (MANDATORY)**

**Interface (Domain Layer):**
```dart
abstract class DataRepository {
  Future<Result<List<Entity>>> fetchAll();
  Future<Result<Entity>> fetchById(String id);
}
```

**Implementation (Data Layer):**
```dart
class DataRepositoryImpl implements DataRepository {
  final RemoteDataSource remoteDataSource;
  DataRepositoryImpl({required this.remoteDataSource});
  
  @override
  Future<Result<List<Entity>>> fetchAll() async {
    // Implementation...
  }
}
```

### **2. Result Pattern (MANDATORY)**

All async operations MUST return Result<T> for error handling:

```dart
sealed class Result<T> {
  const Result();
}

class Success<T> extends Result<T> {
  final T data;
  const Success(this.data);
}

class Failure<T> extends Result<T> {
  final ApiError error;
  const Failure(this.error);
}
```

### **3. Entity Pattern (MANDATORY)**

Domain entities MUST be immutable with business logic:

```dart
class Coffee {
  final String id;
  final String name;
  final int price; // Always in cents
  final String brand;

  const Coffee({required this.id, required this.name, required this.price, required this.brand});
  
  // Business logic
  String get formattedPrice => '\$${(price / 100).toStringAsFixed(2)}';
  
  // Immutability helpers
  @override
  bool operator ==(Object other) => /* implementation */;
  @override
  int get hashCode => Object.hash(id, name, price, brand);
}
```

### **4. Factory Pattern (REQUIRED)**

Repository implementations MUST provide factory constructors:

```dart
class CoffeeRepositoryImpl implements CoffeeRepository {
  factory CoffeeRepositoryImpl.withDio({required Dio dio, String? baseUrl}) {
    return CoffeeRepositoryImpl(
      remoteDataSource: CoffeeRemoteDataSource(dio: dio, baseUrl: baseUrl ?? 'http://localhost:3000'),
    );
  }
}
```

---

## 🎯 **CONTRACT-DRIVEN DEVELOPMENT**

### **Contract Test Requirements (TDD-ROME)**

Every Flutter module MUST have these contract tests:

#### **1. Repository Contract Tests**
```dart
group('Repository Contract Tests', () {
  test('fetchAll returns Success with data', () async {
    // Test successful API response
  });
  
  test('fetchAll returns Failure on network error', () async {
    // Test network failures
  });
  
  test('fetchFiltered applies all parameters', () async {
    // Test filtering behavior
  });
});
```

#### **2. UI Behavior Contract Tests**
```dart
group('UI Behavior Contract Tests', () {
  testWidgets('displays loading indicator during fetch', (tester) async {
    // Test loading states
  });
  
  testWidgets('displays coffee list after successful fetch', (tester) async {
    // Test successful data display
  });
  
  testWidgets('displays error with retry on failure', (tester) async {
    // Test error handling
  });
});
```

#### **3. Integration Contract Tests**
```dart
group('Integration Contract Tests', () {
  testWidgets('filters update list in real-time', (tester) async {
    // Test end-to-end filtering
  });
  
  testWidgets('handles backend API changes gracefully', (tester) async {
    // Test API integration
  });
});
```

---

## 🚀 **PERFORMANCE STANDARDS**

### **Required Performance Metrics**

| Metric | Target | Enforcement |
|--------|--------|-------------|
| **List Rendering** | < 1 second (up to 100 items) | Contract test |
| **Filter Response** | < 200ms | Contract test |
| **Memory Usage** | < 50MB heap | Manual testing |
| **Bundle Size** | < 10MB (release) | Build analysis |

### **Performance Implementation Requirements**

```dart
// ✅ REQUIRED: Efficient list rendering
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => CoffeeItem(items[index]),
)

// ❌ FORBIDDEN: Inefficient rendering
Column(children: items.map((item) => CoffeeItem(item)).toList())
```

### **State Management Efficiency (MANDATORY)**

```dart
// ✅ REQUIRED: Specific rebuilds
Consumer<CoffeeProvider>(
  builder: (context, provider, _) => provider.isLoading 
    ? CircularProgressIndicator() 
    : CoffeeList(provider.coffees),
)

// ❌ FORBIDDEN: Global rebuilds
Consumer<CoffeeProvider>(
  builder: (context, provider, _) => EntireApp(provider),
)
```

---

## 🧪 **TESTING ARCHITECTURE**

### **Test Structure (MANDATORY)**

```
test/
├── unit/                    # Unit tests (domain logic)
├── widget/                  # Widget tests (UI components)  
├── integration/             # Integration tests (full flows)
└── contract/               # Contract tests (TDD-ROME)
    ├── repository_contract_test.dart
    ├── ui_behavior_contract_test.dart
    └── integration_contract_test.dart
```

### **Test Coverage Requirements**

| Layer | Minimum Coverage | Test Types |
|-------|------------------|------------|
| **Domain** | 95% | Unit tests |
| **Data** | 85% | Unit + Integration |
| **Presentation** | 80% | Widget + Integration |

### **Mock Strategy (STANDARDIZED)**

```dart
// ✅ REQUIRED: Interface mocking
@GenerateMocks([CoffeeRepository])
void main() {
  late MockCoffeeRepository mockRepository;
  
  setUp(() {
    mockRepository = MockCoffeeRepository();
  });
  
  test('should return coffee list', () async {
    when(mockRepository.fetchAll())
      .thenAnswer((_) async => Success([coffee]));
  });
}
```

---

## 📋 **CODE QUALITY STANDARDS**

### **Linting (MANDATORY)**

```yaml
# analysis_options.yaml (REQUIRED)
include: package:flutter_lints/flutter_archive.yaml

linter:
  rules:
    - prefer_const_constructors    # ✅ Performance
    - avoid_print                  # ✅ Production safety  
    - use_build_context_synchronously # ✅ Context safety
```

### **File Naming Convention (ENFORCED)**

```
✅ CORRECT:
coffee_repository.dart         # snake_case
coffee_list_widget.dart       # descriptive
user_profile_page.dart        # clear hierarchy

❌ INCORRECT:  
CoffeeRepository.dart         # PascalCase files
repo.dart                     # unclear naming
coffee.dart                   # too generic
```

### **Import Organization (MANDATORY)**

```dart
// ✅ REQUIRED ORDER:
// 1. Dart core
import 'dart:async';

// 2. Flutter packages  
import 'package:flutter_archive/material.dart';

// 3. Third-party packages
import 'package:dio/dio.dart';
import 'package:provider/provider.dart';

// 4. Local imports (relative)
import '../entities/coffee.dart';
import '../repositories/coffee_repository.dart';
```

---

## 🔒 **SECURITY & PRODUCTION STANDARDS**

### **API Configuration (MANDATORY)**

```dart
// ✅ REQUIRED: Environment-based configuration
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL', 
    defaultValue: 'http://localhost:3000'
  );
  
  static const int timeoutMs = int.fromEnvironment(
    'API_TIMEOUT_MS',
    defaultValue: 10000
  );
}
```

### **Error Handling (MANDATORY)**

```dart
// ✅ REQUIRED: Comprehensive error mapping
ApiError _mapDioError(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
      return ApiError(code: 'TIMEOUT_ERROR', message: 'Connection timeout');
    case DioExceptionType.connectionError:  
      return ApiError(code: 'CONNECTION_ERROR', message: 'Network unavailable');
    // ... comprehensive error mapping required
  }
}
```

### **Logging Standards (PRODUCTION-SAFE)**

```dart
// ✅ REQUIRED: Safe logging
void _logInfo(String message) {
  if (kDebugMode) {
    print('[INFO] $message');
  }
}

// ❌ FORBIDDEN: Production logs
print('API Response: ${response.data}'); // Potential data leak
```

---

## 🎨 **UI/UX STANDARDS**

### **Material Design Compliance (MANDATORY)**

```dart
// ✅ REQUIRED: Material 3 theming
MaterialApp(
  theme: ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
  ),
)
```

### **Accessibility Requirements (MANDATORY)**

```dart
// ✅ REQUIRED: Semantic labels
TextField(
  decoration: InputDecoration(labelText: 'Coffee Name'),
  semanticsLabel: 'Search coffee by name', // Required
)

// ✅ REQUIRED: Sufficient contrast ratios  
// Light text on dark: 7:1 minimum
// Dark text on light: 4.5:1 minimum
```

### **Responsive Design (MANDATORY)**

```dart
// ✅ REQUIRED: Breakpoint-based layouts
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth > 600) {
      return DesktopLayout(); // Wide screen
    } else {
      return MobileLayout();  // Narrow screen  
    }
  },
)
```

---

## 📊 **DEPLOYMENT & BUILD STANDARDS**

### **Build Configuration (MANDATORY)**

```dart
// flutter_build.yaml (REQUIRED)
targets:
  $default:
    builders:
      json_annotation|json_serializable:
        options:
          explicit_to_json: true    # Consistent JSON
          include_if_null: false    # Clean responses
```

### **Platform-Specific Requirements**

#### **Web (MANDATORY)**
```html
<!-- web/index.html (REQUIRED meta tags) -->
<meta name="description" content="Coffee Menu Application">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### **Mobile (MANDATORY)**
```yaml
# android/app/build.gradle.kts (REQUIRED)
minSdk = 21        # Android API 21+ support
compileSdk = 34    # Latest stable
```

---

## ✅ **COMPLIANCE CHECKLIST**

### **Pre-Development (PMA Review)**
- [ ] DDD architecture planned with clear layer boundaries
- [ ] Contract tests defined before implementation begins  
- [ ] Repository pattern interfaces designed
- [ ] State management strategy approved (Provider)
- [ ] Performance targets defined with measurement plan

### **During Development (Robot Execution)**
- [ ] Domain layer remains pure Dart (no Flutter imports)
- [ ] All async operations return Result<T> pattern
- [ ] Repository pattern implemented with factory constructors
- [ ] UI components use Provider for state management
- [ ] Contract tests created and failing before implementation

### **Pre-Integration (QA Validation)**
- [ ] All contract tests passing
- [ ] Test coverage meets minimum thresholds (95%/85%/80%)
- [ ] Performance benchmarks validated
- [ ] Accessibility compliance verified
- [ ] Production build successful with optimizations

### **Post-Integration (PMA Sign-off)**
- [ ] Architecture principles maintained throughout development
- [ ] No violations of layer dependency rules
- [ ] Performance targets achieved in integration testing
- [ ] Code quality standards enforced via linting
- [ ] Production deployment readiness confirmed

---

## 🚨 **VIOLATION CONSEQUENCES**

**Architecture violations will result in:**
1. **Contract test failures** → Implementation blocked
2. **Code review rejection** → Rework required  
3. **Integration delays** → Milestone blocked
4. **Performance failures** → Re-architecture mandated

**Quality gates are ENFORCED and NON-NEGOTIABLE.**

---

## 📚 **REFERENCES & TRAINING**

- **Flutter Clean Architecture**: [Architecture Guidelines](https://flutter.dev/docs/development/data-and-backend/state-mgmt)
- **Domain-Driven Design**: [DDD Fundamentals](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- **Provider Pattern**: [Official Documentation](https://pub.dev/packages/provider)
- **Testing Best Practices**: [Flutter Testing Guide](https://flutter.dev/docs/testing)

---

**Document Status:** ✅ ACTIVE - Mandatory for all ROME Flutter projects  
**Revision Control:** All changes require PMA approval  
**Enforcement:** Automated via contract tests and code review gates
