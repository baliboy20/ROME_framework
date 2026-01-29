# Best Practices - Quick Reference Guide
## The Art Deco Bakery - Flutter Application

---
**Document Version**: 2.0
**Last Updated**: 2024-12-19
**Priority**: HIGH - Daily Reference
**Purpose**: Quick checklist for common development tasks

**Related Documentation**:
  - 📘 [Master Index](../00_MASTER_INDEX.md) - Full documentation navigation
  - 📘 [Frontend DDD Architecture](../01_CORE/frontend_ddd_architecture_expert.md) - Detailed architecture guide
  - 📘 [Anti-Patterns](../01_CORE/antipatterns_and_approved_libraries_expert.md) - What to avoid

**How to Use This Guide**:
  - Use as daily checklist when implementing features
  - Each section links to detailed documentation
  - Copy checklists into your feature planning documents

---

## 📋 Feature Implementation Checklist

Use this checklist for EVERY new feature:

### Phase 1: Planning
- [ ] Read relevant detailed guides from [Master Index](../00_MASTER_INDEX.md)
- [ ] Review [Anti-Patterns Guide](../01_CORE/antipatterns_and_approved_libraries_expert.md)
- [ ] Identify which layer(s) the feature touches (domain/data/presentation)
- [ ] Check for existing similar features to reuse patterns

### Phase 2: Domain Layer
- [ ] Create domain entities as immutable classes
- [ ] Use [Sealed vs Enum Guide](../02_PATTERNS/sealed_classes_vs_enums_guide.md) for state types
- [ ] Define repository interfaces (abstract classes)
- [ ] Create use cases (one per business operation)
- [ ] See: [Frontend DDD Architecture](frontend_ddd_architecture_expert.md#3-domain-layer-pure-business-logic)

### Phase 3: Data Layer
- [ ] Implement repository with `Result<T>` return types
- [ ] Create data sources (remote + local if needed)
- [ ] Use native `parse_server_sdk_flutter` (NOT custom wrapper)
- [ ] Add JSON validation for all Parse responses
- [ ] Convert exceptions to Result in repositories
- [ ] See: [Error Handling](../01_CORE/error_handling_patterns_expert.md), [Parse Integration](../03_INTEGRATIONS/parse_flutter_integration_patterns.md)

### Phase 4: Presentation Layer
- [ ] Create BLoC with sealed state classes
- [ ] Name events using `[Verb][Noun]Event` pattern
- [ ] Use pattern matching for Result handling
- [ ] Add error states and loading states
- [ ] See: [BLoC Events](../01_CORE/bloc_event_naming_convention_guide.md), [Error Handling](../01_CORE/error_handling_patterns_expert.md)

### Phase 5: UI
- [ ] Create page widgets (full screens)
- [ ] Extract reusable widgets
- [ ] Use [Platform Theme](../04_UI_UX/platform_theme_architecture_guide.md) spacing constants
- [ ] Add input validation from [Validators Guide](input_validators_consolidation_guide.md)
- [ ] Handle all BLoC states (initial, loading, loaded, error, empty)

### Phase 6: Routing
- [ ] Add route to `app_router.dart`
- [ ] Use GoRouter with named routes
- [ ] Add authentication guards if needed
- [ ] Test deep linking
- [ ] See: [Routing Patterns](../02_PATTERNS/routing_patterns_expert.md)

### Phase 7: Testing & Error Handling
- [ ] Add error boundaries for feature
- [ ] Set appropriate timeouts (5s/30s/60s)
- [ ] Test error states
- [ ] Test offline mode (if applicable)
- [ ] See: [Error Boundary Strategy](../02_PATTERNS/error_boundary_placement_strategy.md), [Timeout Strategy](../02_PATTERNS/timeout_strategy_guide.md)

---

## 🏗️ Architecture Quick Rules

### ✅ DO's
- ✅ Follow DDD 3-layer structure: domain → data → presentation
- ✅ Use BLoC for ALL state management
- ✅ Return `Result<T>` from repositories and use cases
- ✅ Use sealed classes for states with variants
- ✅ Use enums for simple status/constant values
- ✅ Keep entities immutable (const constructors)
- ✅ Validate all Parse Server JSON responses
- ✅ Use native packages (parse_server_sdk_flutter, go_router)

**Full Details**: [Frontend DDD Architecture](../01_CORE/frontend_ddd_architecture_expert.md)

### ❌ DON'Ts
- ❌ DON'T create custom ParseApiClient wrapper
- ❌ DON'T use dartz for error handling (use sealed classes)
- ❌ DON'T put business logic in widgets
- ❌ DON'T throw exceptions from repositories
- ❌ DON'T mix navigation libraries (use GoRouter only)
- ❌ DON'T skip JSON validation for Parse responses
- ❌ DON'T use GetX or Provider (use BLoC)

**Full List**: [Anti-Patterns Guide](../01_CORE/antipatterns_and_approved_libraries_expert.md)

---

## 🔄 State Management Quick Reference

### BLoC Event Naming
**Pattern**: `[Verb][Noun]Event`

```dart
// ✅ CORRECT
LoadOrdersEvent
CreateOrderEvent
UpdateOrderStatusEvent
DeleteOrderEvent
SearchProductsEvent

// ❌ WRONG
OrdersLoaded        // Past tense
CreateOrder         // Missing "Event"
order_update        // Wrong case
```

**Full Guide**: [BLoC Event Naming](../01_CORE/bloc_event_naming_convention_guide.md)

### BLoC State Pattern
**Use sealed classes for states with different properties**

```dart
sealed class OrderState {}

class OrderInitial extends OrderState {}
class OrderLoading extends OrderState {}
class OrderLoaded extends OrderState {
  final List<Order> orders;
  OrderLoaded({required this.orders});
}
class OrderError extends OrderState {
  final String message;
  OrderError({required this.message});
}
```

**Decision Guide**: [Sealed Classes vs Enums](../02_PATTERNS/sealed_classes_vs_enums_guide.md)

---

## ⚠️ Error Handling Quick Reference

### Two-Tier System
1. **Data Layer**: Throw specific exceptions (ServerException, NetworkException)
2. **Repository Layer**: Catch exceptions, return `Result<T>`
3. **Use Case Layer**: Pass through `Result<T>`
4. **BLoC Layer**: Pattern match Result into states

### Result Pattern
```dart
// Repository
Future<Result<List<Order>>> getOrders() async {
  try {
    final orders = await remoteDataSource.getOrders();
    return Success(orders);
  } catch (e) {
    return Error('Failed to load orders');
  }
}

// BLoC
final state = switch (result) {
  Success(:final value) => OrderLoaded(orders: value),
  Error(:final message) => OrderError(message),
};
```

**Full Guide**: [Error Handling Patterns](../01_CORE/error_handling_patterns_expert.md)

---

## 🔌 Backend Integration Quick Reference

### Parse Server Rules
- ✅ Use `parse_server_sdk_flutter` package directly
- ✅ Validate JSON responses with `json_validation`
- ✅ Set timeouts: 5s (fast), 30s (normal), 60s (slow)
- ❌ DON'T create custom HTTP wrapper

### Query Pattern
```dart
final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Product'))
  ..whereEqualTo('category', 'cakes')
  ..orderByDescending('createdAt');

final response = await queryBuilder.query().timeout(
  TimeoutConstants.fastOperation,
);
```

**Full Guides**:
- [Parse Integration](../03_INTEGRATIONS/parse_flutter_integration_patterns.md)
- [Timeout Strategy](../02_PATTERNS/timeout_strategy_guide.md)

---

## 🎨 UI & Styling Quick Reference

### Spacing
Use constants instead of magic numbers:

```dart
// ❌ WRONG
padding: EdgeInsets.all(16)

// ✅ RIGHT
padding: Spacing.cardInset    // or EdgeInsets.all(Spacing.md)
```

### Standard Values
- `Spacing.xs` = 4px
- `Spacing.sm` = 8px
- `Spacing.md` = 16px (most common)
- `Spacing.lg` = 24px
- `Spacing.xl` = 32px

**Full Guide**: [Platform Theme Architecture](../04_UI_UX/platform_theme_architecture_guide.md)

---

## 🔐 Validation Quick Reference

### Standard Validators
Location: `/lib/core/utils/validators.dart`

```dart
validateEmail(String? value)           // Email format
validatePassword(String? value)        // 8+ chars, strong
validatePhoneNumber(String? value)     // UK format
validatePostcode(String? value)        // UK postcode
validatePrice(String? value)           // Currency amount
validateRequired(String? value)        // Not empty
```

### Usage
```dart
TextFormField(
  validator: validateEmail,
  decoration: InputDecoration(labelText: 'Email'),
)
```

**Full Guide**: [Input Validators](input_validators_consolidation_guide.md)

---

## 🗺️ Navigation Quick Reference

### Route Definition
```dart
GoRoute(
  path: '/products/:id',
  name: 'productDetail',
  pageBuilder: (context, state) {
    final id = state.pathParameters['id']!;
    return CustomTransitionPage(
      child: ProductDetailPage(productId: id),
      transitionsBuilder: _slideTransition,
    );
  },
)
```

### Navigation
```dart
// By name (preferred)
context.goNamed('productDetail', pathParameters: {'id': '123'});

// Push (with back button)
context.pushNamed('productDetail', pathParameters: {'id': '123'});
```

**Full Guide**: [Routing Patterns](../02_PATTERNS/routing_patterns_expert.md)

---

## 📊 Common Patterns by Feature Type

### Implementing CRUD Feature
1. **Domain**: Entity + Repository interface + UseCases (get/create/update/delete)
2. **Data**: Repository impl + Remote datasource + Model
3. **Presentation**: BLoC (events + states) + Pages + Widgets
4. **Routing**: Add routes with parameters

**Example**: [Frontend DDD Architecture - Product Catalog Example](frontend_ddd_architecture_expert.md#example-product-catalog-feature)

### Implementing Authentication
1. **Parse Integration**: Use native Parse auth methods
2. **State**: AuthBloc with Authenticated/Unauthenticated states
3. **Routing**: Add auth guards to protected routes
4. **Storage**: Store session with Parse SDK

**Example**: [Parse Integration - Auth Section](parse_flutter_integration_patterns.md#2-authentication-patterns)

### Implementing Payment Flow
1. **Integration**: Stripe payment intent
2. **Timeout**: 30s with status check fallback
3. **Error Handling**: Handle ambiguous states (timeout during payment)
4. **State**: Multiple states (processing, confirming, success, failed)

**Example**: [Stripe Integration](../03_INTEGRATIONS/stripe_flutter_integration_patterns.md)

---

## 🎯 Priority Decision Matrix

### When to Use Enum vs Sealed Class?
- **Fixed constant values** (status, role, category) → Enum
- **Different properties per variant** (BLoC states, errors) → Sealed Class

**Decision Tree**: [Sealed Classes vs Enums](sealed_classes_vs_enums_guide.md#1-quick-decision-tree)

### When to Use Remote vs Local Datasource?
- **Always fetch from remote first**
- **Fallback to local cache on network failure**
- **Cache successful remote responses**

**Pattern**: [Error Handling - Fallback Strategy](error_handling_patterns_expert.md#71-fallback-pattern-remote--local)

### When to Add Error Boundary?
- **App-level**: One safety net (always)
- **Feature-level**: Per complex feature (recommended)

**Strategy**: [Error Boundary Placement](../02_PATTERNS/error_boundary_placement_strategy.md)

---

## 🚀 Quick Start for New Developers

### Day 1: Read These First
1. [Master Index](../00_MASTER_INDEX.md) - Overview
2. [Frontend DDD Architecture](../01_CORE/frontend_ddd_architecture_expert.md) - Core patterns
3. [Anti-Patterns Guide](../01_CORE/antipatterns_and_approved_libraries_expert.md) - What to avoid
4. This guide (best_practices_consolidated_guide.md) - Quick reference

### Day 2-3: Deep Dives
1. [Error Handling Patterns](../01_CORE/error_handling_patterns_expert.md)
2. [BLoC Event Naming](../01_CORE/bloc_event_naming_convention_guide.md)
3. [Parse Integration](../03_INTEGRATIONS/parse_flutter_integration_patterns.md)
4. [Routing Patterns](../02_PATTERNS/routing_patterns_expert.md)

### Week 1: Reference as Needed
- [Sealed vs Enums](../02_PATTERNS/sealed_classes_vs_enums_guide.md)
- [Input Validators](input_validators_consolidation_guide.md)
- [Timeout Strategy](../02_PATTERNS/timeout_strategy_guide.md)
- [Platform Theming](../04_UI_UX/platform_theme_architecture_guide.md)

---

## 📚 Full Documentation Index

For detailed implementation guides, see:
- **[Master Index](../00_MASTER_INDEX.md)** - Complete documentation map

For specific topics:
- Architecture: [DDD Guide](../01_CORE/frontend_ddd_architecture_expert.md)
- State: [BLoC Events](../01_CORE/bloc_event_naming_convention_guide.md)
- Errors: [Error Handling](../01_CORE/error_handling_patterns_expert.md)
- Routing: [GoRouter Patterns](../02_PATTERNS/routing_patterns_expert.md)
- Backend: [Parse Integration](../03_INTEGRATIONS/parse_flutter_integration_patterns.md)
- Types: [Sealed vs Enums](../02_PATTERNS/sealed_classes_vs_enums_guide.md)
- Validation: [Input Validators](input_validators_consolidation_guide.md)
- Timeouts: [Timeout Strategy](../02_PATTERNS/timeout_strategy_guide.md)
- UI: [Platform Theme](../04_UI_UX/platform_theme_architecture_guide.md)
- Components: [UI Component Library](../04_UI_UX/flutter_ui_component_library.md)

---

**Last Updated**: 2024-12-19
**Format**: Quick Reference Checklist
**Replaces**: Previous 920-line detailed guide (moved to individual expert guides)
