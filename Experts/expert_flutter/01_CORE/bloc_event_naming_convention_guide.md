# BLoC Event Naming Convention Guide
## The Art Deco Bakery - Flutter Application

---
**Document Version**: 2.0
**Last Updated**: 2024-12-19
**Priority**: HIGH - Essential for State Management
**Dependencies**:
  - flutter_bloc: ^8.1.3
  - Dart SDK: >= 3.0.0

**Related Documentation**:
  - 📘 [Master Index](../00_MASTER_INDEX.md) - Documentation navigation
  - 📘 [Frontend DDD Architecture](frontend_ddd_architecture_expert.md) - Presentation layer context
  - 📘 [Error Handling Patterns](error_handling_patterns_expert.md) - State error handling
  - 📘 [Sealed Classes vs Enums](../02_PATTERNS/sealed_classes_vs_enums_guide.md) - When to use sealed for events

**Quick Links**:
  - Section 1: [Naming Pattern](#1-standard-event-naming-pattern)
  - Section 2: [Pattern Components](#pattern-components)
  - Section 3: [Common Patterns](#3-common-event-patterns-by-category)

---

### Overview
This guide establishes a consistent, predictable naming convention for all BLoC event classes across the application. Current analysis shows **65% consistency** with significant variations in suffix usage, verb tense, and compound noun handling.

---

## 1. Standard Event Naming Pattern

### The Formula

```
[DomainPrefix?] + [Verb] + [Noun/Object] + "Event"
```

### Pattern Components

| Component | Rule | Examples |
|-----------|------|----------|
| **DomainPrefix** | Optional. Use only when context is ambiguous | `Admin`, `Auth`, (omit for single-purpose BLoCs) |
| **Verb** | MUST be imperative/base form (present tense) | `Load`, `Create`, `Update`, `Delete`, `Search`, `Filter`, `Sort` |
| **Noun/Object** | The entity or target being acted upon | `Orders`, `Product`, `Cart`, `Users` |
| **Suffix** | MUST always include "Event" | `Event` (never omit) |

### Pattern Examples

✅ **CORRECT:**
```dart
// Simple operations
LoadOrdersEvent
CreateProductEvent
UpdateCartItemEvent
DeleteAddressEvent
SearchUsersEvent
FilterProductsEvent
RefreshDashboardEvent

// Compound operations
AddToCartEvent          // Base form: add, Preposition included for clarity
RemoveFromCartEvent     // Natural English phrase
UpdateOrderStatusEvent  // Object.property format
ProcessRefundEvent      // Domain-specific action

// With domain prefix (for disambiguation)
AdminLoginEvent         // Clear this is admin context
CheckAdminAuthStatusEvent
UpdateAdminSettingsEvent

// Complex objects
LoadMoreOrdersEvent     // Pagination
SelectAllProductsEvent  // Bulk operations
UploadProductImageEvent // Multi-step operation
```

❌ **INCORRECT:**
```dart
// Missing Event suffix
LoadOrders              // ❌ Should be LoadOrdersEvent
CreateProduct           // ❌ Should be CreateProductEvent
UpdateCart              // ❌ Should be UpdateCartEvent

// Past tense verbs
OrdersLoaded            // ❌ Should be LoadOrdersEvent
ProductCreated          // ❌ Should be CreateProductEvent
UserUpdated             // ❌ Should be UpdateUserEvent

// Inconsistent suffixes
OrderDetailRequested    // ❌ Should be LoadOrderDetailEvent
LiveOrderReceived       // ❌ Should be ReceiveOrderEvent
EditOrderSubmitted      // ❌ Should be SubmitEditOrderEvent

// Incorrect verb ordering
LoadOrdersMore          // ❌ Should be LoadMoreOrdersEvent
FetchOrdersAll          // ❌ Should be LoadAllOrdersEvent

// Ambiguous without prefix
LoginEvent              // ✓ OK in Auth context, but AdminLoginEvent is clearer
LogoutEvent             // ✓ OK in Auth context
```

---

## 2. Verb Categories and Examples

### 2.1 Data Retrieval Operations

Use: `Load`, `Fetch`, or `Get` (prefer `Load` for consistency)

```dart
// Single resource
LoadProductEvent
LoadUserProfileEvent
LoadOrderDetailEvent

// Multiple resources
LoadProductsEvent
LoadOrdersEvent
LoadAllUsersEvent

// With filters
LoadOrdersByStatusEvent
LoadProductsByCategoryEvent

// Pagination
LoadMoreOrdersEvent    // For infinite scroll
LoadOrdersPageEvent    // For page-based pagination
```

### 2.2 Creation Operations

Use: `Create` or `Submit`

```dart
// Standard creation
CreateOrderEvent
CreateProductEvent
CreateAddressEvent
CreatePromotionEvent

// Form submission
SubmitLoginFormEvent    // If form-based
SubmitCheckoutFormEvent

// In cart context
AddToCartEvent          // Better than CreateCartItemEvent (keep natural English)
```

### 2.3 Update/Modification Operations

Use: `Update`, `Modify`, or specific action verb

```dart
// Standard updates
UpdateOrderStatusEvent
UpdateProductEvent
UpdateUserEvent
UpdateCartItemEvent

// Specific modifications
ChangePasswordEvent     // More specific than UpdatePassword
AdjustStockEvent        // More specific than UpdateStock
SetDefaultAddressEvent  // More specific than UpdateDefaultAddress
ToggleProductStatusEvent

// Bulk updates
BulkUpdateOrdersEvent
```

### 2.4 Deletion/Removal Operations

Use: `Delete` or `Remove`

```dart
// Deletion (permanent)
DeleteProductEvent
DeleteAddressEvent
DeletePromotionEvent
ClearFiltersEvent

// Removal (from collection)
RemoveFromCartEvent     // Better than DeleteCartItemEvent
RemoveOrderEvent
```

### 2.5 Data Retrieval Operations (Read-only queries)

Use: `Load`, `Get`, or `Fetch` (NOT past tense)

```dart
// Dashboard/analytics
LoadDashboardEvent
LoadSalesAnalyticsEvent
LoadUserAnalyticsEvent

// Search and filter
SearchProductsEvent
FilterOrdersEvent
SortUsersEvent

// Refresh
RefreshOrdersEvent
RefreshDashboardEvent
```

### 2.6 Real-Time/Stream Operations

Use: `Subscribe`, `Unsubscribe`, or `Receive`

```dart
// Subscription management
SubscribeLiveOrdersEvent
UnsubscribeLiveOrdersEvent
ReceiveLiveOrderEvent       // When order actually received

// Notifications
SendNotificationEvent
ScheduleNotificationEvent
CancelNotificationEvent
```

### 2.7 Authentication Operations

Use: `Login`, `Logout`, `Signup`, `Check`

```dart
// Auth flows
LoginEvent
LogoutEvent
SignupEvent
CheckAuthStatusEvent
ChangePasswordEvent
ResetPasswordEvent

// With context
AdminLoginEvent             // Distinguishes from customer login
CheckAdminAuthStatusEvent
VerifyAdminSessionEvent
```

---

## 3. Compound Operation Naming

When naming complex operations, maintain **natural English word order**:

### Pattern: Prepositions Matter

```dart
// ✅ Good: Natural English phrases
AddToCartEvent              // add TO cart
RemoveFromCartEvent         // remove FROM cart
ReplyToTicketEvent          // reply TO ticket
LoadMoreOrdersEvent         // load MORE orders (load comes first)

// ❌ Bad: Awkward phrasing
AddCartToEvent              // ❌ Unnatural
RemoveCartFromEvent         // ❌ Unnatural
LoadOrdersMoreEvent         // ❌ Unnatural (adverb at end)
FetchMoreProductsEvent      // ✓ Actually OK, but LoadMoreProductsEvent is preferred
```

### Pattern: Multi-Word Objects

```dart
// Object properties
UpdateOrderStatusEvent      // Update [Order Status]
UpdateCartItemEvent         // Update [Cart Item]
LoadOrderDetailEvent        // Load [Order Detail]
UpdateAdminSettingsEvent    // Update [Admin Settings]
LoadGeneralSettingsEvent    // Load [General Settings]

// Nested objects
AddOrderNoteEvent           // Add [Order Note]
UploadProductImageEvent     // Upload [Product Image]
DeleteProductImageEvent     // Delete [Product Image]
ReorderProductImagesEvent   // Reorder [Product Images]
```

---

## 4. Domain Context and Prefixes

### When to Use Prefixes

**Use a prefix when:**
1. **Same verb applies to different domains** (e.g., Login for customer vs. admin)
2. **Single BLoC manages multiple domains** (rare, avoid this pattern)
3. **Action is domain-specific** (admin-only or customer-only)

**Don't use a prefix when:**
1. BLoC is single-purpose (e.g., AuthBloc, only handles one domain)
2. Context is clear from file structure

### Examples

```dart
// ✅ Good: Prefix adds clarity
AdminLoginEvent             // vs. LoginEvent in Auth BLoC (customer context)
CheckAdminAuthStatusEvent   // vs. CheckAuthStatusEvent
AdminLogoutEvent            // vs. LogoutEvent

// ✓ Acceptable: Clear from context (in customer order feature)
LoadOrdersEvent
CreateOrderEvent
UpdateOrderStatusEvent

// ✓ Acceptable: Clear from context (in admin order management feature)
LoadOrdersEvent             // Same name, but in different BLoC
UpdateOrderStatusEvent
ProcessRefundEvent

// ❌ Bad: Redundant prefix
AdminLoadAdminOrdersEvent   // "Admin" mentioned twice
AuthCheckAuthStatusEvent    // "Auth" mentioned twice
ProductLoadProductsEvent    // "Product" mentioned twice
```

---

## 5. Migration Guide: From Current to Standard

### Step 1: Add "Event" Suffix (HIGH PRIORITY)

These files are missing the suffix and need immediate updates:

```dart
// BEFORE ❌
class LoadAddresses extends Event { }
class CreateAddress extends Event { }
class LoadCart extends Event { }
class SubmitNewMessage extends Event { }

// AFTER ✅
class LoadAddressesEvent extends Event { }
class CreateAddressEvent extends Event { }
class LoadCartEvent extends Event { }
class SubmitNewMessageEvent extends Event { }
```

**Files to update:**
- `/lib/features/auth/presentation/bloc/address_event.dart` (LoadAddresses, CreateAddress, UpdateAddress, DeleteAddress, SetDefaultAddress)
- `/lib/features/shopping_cart/presentation/bloc/cart_event.dart` (LoadCart)
- `/lib/features/product_catalog/presentation/bloc/product_event.dart` (LoadAllProducts, LoadProductsByCategory)
- `/lib/features/customer_support/presentation/bloc/message_event.dart` (All classes)
- `/lib/features/admin/dashboard/presentation/bloc/dashboard_event.dart` (LoadDashboard, RefreshDashboard, UnsubscribeLiveOrders)

### Step 2: Convert Past Tense to Imperative (MEDIUM PRIORITY)

```dart
// BEFORE ❌ (Past tense - past participles)
class OrderDetailRequested extends Event { }
class LiveOrderReceived extends Event { }
class EditOrderSubmitted extends Event { }
class EditHistoryRequested extends Event { }

// AFTER ✅ (Imperative form)
class LoadOrderDetailEvent extends Event { }
class ReceiveLiveOrderEvent extends Event { }
class SubmitEditOrderEvent extends Event { }
class RequestEditHistoryEvent extends Event { }
```

**Files to update:**
- `/lib/features/admin/order_management/presentation/bloc/edit_order/edit_order_event.dart` (EditOrderSubmitted, EditHistoryRequested)

### Step 3: Standardize Verb-Noun Ordering (LOW PRIORITY)

Most of the codebase already follows this pattern correctly. No immediate changes needed, but verify:

```dart
// Good pattern (verb-noun):
LoadOrdersEvent
CreateProductEvent
UpdateUserEvent
DeleteAddressEvent

// Already correct, no change needed
```

---

## 6. Complete Reference Table

### Common Operations Quick Reference

| Operation | Verb | Pattern | Example |
|-----------|------|---------|---------|
| **GET (single)** | Load / Get | `Load[Entity]Event` | `LoadProductEvent` |
| **GET (multiple)** | Load / Get | `Load[Entities]Event` | `LoadProductsEvent` |
| **GET (paginated)** | Load | `LoadMore[Entities]Event` | `LoadMoreOrdersEvent` |
| **GET (filtered)** | Load / Filter | `Load[Qualifier][Entities]Event` | `LoadAllProductsEvent` |
| **SEARCH** | Search | `Search[Entities]Event` | `SearchProductsEvent` |
| **FILTER** | Filter | `Filter[Entities]Event` | `FilterOrdersEvent` |
| **SORT** | Sort | `Sort[Entities]Event` | `SortUsersEvent` |
| **CREATE** | Create | `Create[Entity]Event` | `CreateProductEvent` |
| **CREATE** | Submit | `Submit[Form]Event` | `SubmitCheckoutFormEvent` |
| **ADD (to collection)** | Add | `Add[Object]To[Collection]Event` | `AddToCartEvent` |
| **UPDATE** | Update | `Update[Entity]Event` | `UpdateProductEvent` |
| **UPDATE (specific)** | [Verb] | `[Verb][Property]Event` | `ChangePasswordEvent`, `AdjustStockEvent` |
| **DELETE** | Delete | `Delete[Entity]Event` | `DeleteProductEvent` |
| **REMOVE (from collection)** | Remove | `Remove[Object]From[Collection]Event` | `RemoveFromCartEvent` |
| **CLEAR** | Clear | `Clear[Collection]Event` | `ClearFiltersEvent` |
| **SUBSCRIBE** | Subscribe | `Subscribe[Stream]Event` | `SubscribeLiveOrdersEvent` |
| **UNSUBSCRIBE** | Unsubscribe | `Unsubscribe[Stream]Event` | `UnsubscribeLiveOrdersEvent` |
| **REFRESH** | Refresh | `Refresh[Data]Event` | `RefreshOrdersEvent` |
| **TOGGLE** | Toggle | `Toggle[Property]Event` | `ToggleProductStatusEvent` |

---

## 7. Implementation Checklist

### For New Event Classes

Before creating a new event class, verify:

- [ ] Event class name ends with "Event"
- [ ] Uses imperative verb (Load, Create, Update, etc.) - NOT past tense
- [ ] Follows Verb-Noun pattern (not Noun-Verb)
- [ ] Domain prefix only if context is ambiguous
- [ ] Descriptive object name (not generic "Data" or "Entity")
- [ ] Natural English word order for compound phrases (AddToCart, not AddCart)
- [ ] Clear and unambiguous (compare with similar events in codebase)

### Example Validation

```dart
// ✅ GOOD: Passes all checks
class UpdateOrderStatusEvent extends OrderEvent {
  final String orderId;
  final OrderStatus newStatus;
  UpdateOrderStatusEvent({required this.orderId, required this.newStatus});
}

// ❌ BAD: Fails multiple checks
class OrderStatusUpdated extends OrderEvent {        // ❌ Past tense
  final String orderId;                               // ❌ Missing "Event" suffix
  final OrderStatus newStatus;
  OrderStatusUpdated({required this.orderId, required this.newStatus});
}

// ❌ BAD: Ambiguous naming
class OrderEvent extends BlocEvent { }               // ❌ Too generic
class UpdateEvent extends BlocEvent { }              // ❌ What is being updated?

// ✅ GOOD: Clear and specific
class UpdateOrderStatusEvent extends OrderEvent { } // ✅ Clear what's being updated
```

---

## 8. BLoC Event Naming Examples by Feature

### Core Features

#### Auth BLoC

```dart
class LoginEvent extends AuthEvent { }
class LogoutEvent extends AuthEvent { }
class SignupEvent extends AuthEvent { }
class CheckAuthStatusEvent extends AuthEvent { }
class ChangePasswordEvent extends AuthEvent { }
class RefreshSessionEvent extends AuthEvent { }
```

#### Address BLoC

```dart
class LoadAddressesEvent extends AddressEvent { }
class CreateAddressEvent extends AddressEvent { }
class UpdateAddressEvent extends AddressEvent { }
class DeleteAddressEvent extends AddressEvent { }
class SetDefaultAddressEvent extends AddressEvent { }
```

#### Shopping Cart BLoC

```dart
class LoadCartEvent extends CartEvent { }
class AddToCartEvent extends CartEvent { }
class RemoveFromCartEvent extends CartEvent { }
class UpdateCartItemEvent extends CartEvent { }
class ClearCartEvent extends CartEvent { }
class ApplyDiscountEvent extends CartEvent { }
```

#### Product Catalog BLoC

```dart
class LoadAllProductsEvent extends ProductEvent { }
class LoadProductsByCategoryEvent extends ProductEvent { }
class SearchProductsEvent extends ProductEvent { }
class LoadMoreProductsEvent extends ProductEvent { }
class RefreshProductsEvent extends ProductEvent { }
```

### Admin Features

#### Admin Order Management BLoC

```dart
class LoadOrdersEvent extends OrderManagementEvent { }
class RefreshOrdersEvent extends OrderManagementEvent { }
class LoadMoreOrdersEvent extends OrderManagementEvent { }
class FilterOrdersEvent extends OrderManagementEvent { }
class SearchOrdersEvent extends OrderManagementEvent { }
class SortOrdersEvent extends OrderManagementEvent { }
class LoadOrderDetailEvent extends OrderManagementEvent { }
class UpdateOrderStatusEvent extends OrderManagementEvent { }
class AddOrderNoteEvent extends OrderManagementEvent { }
class ProcessRefundEvent extends OrderManagementEvent { }
class SelectOrderEvent extends OrderManagementEvent { }
class SelectAllOrdersEvent extends OrderManagementEvent { }
class BulkUpdateOrdersEvent extends OrderManagementEvent { }
class ClearFiltersEvent extends OrderManagementEvent { }
```

#### Admin Product Management BLoC

```dart
class LoadProductsEvent extends ProductManagementEvent { }
class RefreshProductsEvent extends ProductManagementEvent { }
class LoadMoreProductsEvent extends ProductManagementEvent { }
class FilterProductsEvent extends ProductManagementEvent { }
class SearchProductsEvent extends ProductManagementEvent { }
class SortProductsEvent extends ProductManagementEvent { }
class LoadProductDetailEvent extends ProductManagementEvent { }
class CreateProductEvent extends ProductManagementEvent { }
class UpdateProductEvent extends ProductManagementEvent { }
class DeleteProductEvent extends ProductManagementEvent { }
class AdjustStockEvent extends ProductManagementEvent { }
class ToggleProductStatusEvent extends ProductManagementEvent { }
class UploadProductImageEvent extends ProductManagementEvent { }
class DeleteProductImageEvent extends ProductManagementEvent { }
class ReplaceProductImageEvent extends ProductManagementEvent { }
class ReorderProductImagesEvent extends ProductManagementEvent { }
```

#### Admin Dashboard BLoC

```dart
class LoadDashboardEvent extends DashboardEvent { }
class RefreshDashboardEvent extends DashboardEvent { }
class SubscribeLiveOrdersEvent extends DashboardEvent { }
class ReceiveLiveOrderEvent extends DashboardEvent { }
class UnsubscribeLiveOrdersEvent extends DashboardEvent { }
```

---

## 9. Common Mistakes to Avoid

### ❌ Mistake 1: Missing Event Suffix
```dart
// Wrong
class LoadOrders { }
class CreateProduct { }
class UpdateUser { }

// Correct
class LoadOrdersEvent { }
class CreateProductEvent { }
class UpdateUserEvent { }
```

### ❌ Mistake 2: Past Tense Verbs
```dart
// Wrong
class OrdersLoaded { }
class ProductCreated { }
class UserUpdated { }

// Correct
class LoadOrdersEvent { }
class CreateProductEvent { }
class UpdateUserEvent { }
```

### ❌ Mistake 3: Noun-First Ordering
```dart
// Wrong
class OrderDetailRequested { }
class CartItemAdded { }
class UserPasswordChanged { }

// Correct
class LoadOrderDetailEvent { }
class AddToCartEvent { }
class ChangePasswordEvent { }
```

### ❌ Mistake 4: Generic Event Names
```dart
// Wrong
class UpdateEvent { }         // What's being updated?
class LoadEvent { }           // What's being loaded?
class DataChangedEvent { }    // What data? What changed?

// Correct
class UpdateOrderStatusEvent { }
class LoadProductsEvent { }
class ChangePasswordEvent { }
```

### ❌ Mistake 5: Redundant Prefixes
```dart
// Wrong
class AdminAdminLoginEvent { }
class AuthAuthCheckStatusEvent { }
class ProductProductLoadEvent { }

// Correct
class AdminLoginEvent { }
class CheckAuthStatusEvent { }
class LoadProductsEvent { }
```

### ❌ Mistake 6: Inconsistent Prepositions
```dart
// Wrong
class AddCartItemEvent { }        // Unclear
class RemoveOrderFromListEvent { } // Awkward

// Correct
class AddToCartEvent { }
class RemoveFromCartEvent { }
```

---

## 10. Best Practices Summary

✅ **DO:**
- Always include "Event" suffix for clarity and consistency
- Use imperative/base verb form (Load, Create, Update, Delete)
- Follow Verb-Noun order (not Noun-Verb)
- Use natural English word order (AddToCart, not AddCart)
- Use specific, descriptive object names
- Add domain prefix only when context is ambiguous
- Keep event names concise but clear

❌ **DON'T:**
- Omit the "Event" suffix
- Use past tense verbs (Loaded, Created, Updated)
- Use noun-first ordering (OrdersLoaded, UserCreated)
- Use generic names (DataEvent, UpdateEvent)
- Use redundant prefixes (AdminAdminLoginEvent)
- Create ambiguous names (ActionEvent, EventEvent)
- Abbreviate beyond recognition (OrdUpd instead of UpdateOrderEvent)

---

## 11. Timeline for Implementation

### Phase 1 (1 week): Critical Updates
- [ ] Add "Event" suffix to all classes missing it
- [ ] Update all past-tense events to imperative form
- [ ] Update event references in BLoC handler methods (on<EventName>)

### Phase 2 (1 week): Documentation & Communication
- [ ] Create documentation in shared resources
- [ ] Update code review checklist
- [ ] Add linting rules or custom analysis rules (if using Dart analysis)

### Phase 3 (Ongoing): Enforcement
- [ ] Code review all new event classes
- [ ] Update existing events as needed during feature development
- [ ] Monitor for consistency in pull requests

---

## References

- **BLoC Pattern Documentation**: See `flutter_bloc_pattern_guide.md`
- **Error Handling**: See `error_handling_patterns_expert.md`
- **DDD Architecture**: See `frontend_ddd_architecture_expert.md`

