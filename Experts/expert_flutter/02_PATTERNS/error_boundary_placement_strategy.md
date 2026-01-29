# Error Boundary Placement Strategy
## The Art Deco Bakery - Flutter Application

### Overview
This guide explains when and where to place ErrorBoundary widgets to achieve optimal error isolation and recovery. Two strategies are available: **App-Level** (application-wide safety) and **Feature-Level** (granular isolation).

---

## 1. Quick Decision Matrix

```
Is this framework error handling?
│
├─ YES → Use ErrorBoundary
│   └─ Is it UI-only (widget rebuild failed)?
│       ├─ YES (Preferred) → Feature-Level ErrorBoundary
│       │   └─ Isolate to single feature/page
│       │   └─ Show error UI without restarting app
│       │   └─ User can recover by navigating away
│       │
│       └─ NO (Fallback) → App-Level ErrorBoundary
│           └─ Catches any unhandled Flutter errors
│           └─ Sends to crash reporting
│           └─ Shows error dialog
│
└─ NO → Use Error Handling Pattern
    └─ BLoC error states
    └─ Try-catch in repositories
    └─ Result/Either for business logic errors
```

---

## 2. Placement Strategies

### Strategy 1: App-Level Error Boundary (Fallback Only)

**Use Case**: Catches any unhandled framework errors as last resort

```dart
// 📁 lib/main.dart

void main() {
  // App-level error handling
  FlutterError.onError = (errorDetails) {
    // This is a fallback - prefer feature-level boundaries
  };

  runApp(
    ErrorBoundary(
      onError: (details) {
        // Log to crash reporting service
        _crashReporter.recordFlutterError(details);
      },
      errorBuilder: (details) => MaterialApp(
        home: Scaffold(
          body: Center(
            child: ErrorScreen(
              title: 'Application Error',
              message: 'Something went wrong. Please restart the app.',
              error: details.exception,
              stackTrace: details.stack,
            ),
          ),
        ),
      ),
      child: const AppRoot(),
    ),
  );
}

class AppRoot extends StatelessWidget {
  const AppRoot();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      routerConfig: appRouter,
      // ... app config
    );
  }
}
```

**Pros:**
- ✅ Catches any unhandled error
- ✅ Prevents app crash
- ✅ Can send to crash reporting

**Cons:**
- ❌ Entire app error state (not granular)
- ❌ User loses current work
- ❌ Requires app restart to recover
- ❌ Poor user experience

---

### Strategy 2: Feature-Level Error Boundaries (RECOMMENDED)

**Use Case**: Isolate errors to specific pages/features

```dart
// 📁 lib/features/order/presentation/pages/order_list_page.dart

class OrderListPage extends StatefulWidget {
  const OrderListPage();

  @override
  State<OrderListPage> createState() => _OrderListPageState();
}

class _OrderListPageState extends State<OrderListPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CupertinoNavigationBar(
        middle: const Text('Orders'),
      ),
      body: ErrorBoundary(
        onError: (details) {
          // Log error with context
          _logOrderPageError(details);
          // Don't send to global error handler - handle locally
        },
        errorBuilder: (details) => Center(
          child: ErrorStateWidget(
            title: 'Failed to Load Orders',
            message: 'Please try again',
            onRetry: () {
              setState(() {
                // Trigger reload
              });
            },
            error: details.exception,
          ),
        ),
        child: BlocBuilder<OrderBloc, OrderState>(
          builder: (context, state) {
            return switch (state) {
              OrderInitial() => _buildInitialState(),
              OrderLoading() => _buildLoadingState(),
              OrderLoaded(:final orders) => _buildOrdersListWidget(orders),
              OrderError(:final message) => _buildErrorState(message),
              OrderEmpty() => _buildEmptyState(),
            };
          },
        ),
      ),
    );
  }

  void _logOrderPageError(FlutterErrorDetails details) {
    logger.error(
      'Error in OrderListPage',
      error: details.exception,
      stackTrace: details.stack,
    );
  }

  Widget _buildInitialState() => const SizedBox();

  Widget _buildLoadingState() => const Center(
    child: CircularProgressIndicator(),
  );

  Widget _buildOrdersListWidget(List<Order> orders) => ListView.builder(
    itemCount: orders.length,
    itemBuilder: (context, index) => OrderCard(order: orders[index]),
  );

  Widget _buildErrorState(String message) => Center(
    child: Text(message),
  );

  Widget _buildEmptyState() => const Center(
    child: Text('No orders found'),
  );
}
```

**Pros:**
- ✅ Isolates error to single feature
- ✅ Other features continue working
- ✅ User can navigate away to recover
- ✅ Better error context
- ✅ Granular error handling per feature
- ✅ Prevents cascading failures

**Cons:**
- ⚠️ More boilerplate (ErrorBoundary per feature)
- ⚠️ Requires careful placement planning

---

### Strategy 3: Hybrid Approach (BEST PRACTICE)

**Use Case**: Combine both for maximum safety and user experience

```dart
// 📁 lib/main.dart - App-level as safety net only

void main() {
  // ONLY for unhandled errors (safety net)
  FlutterError.onError = (errorDetails) {
    _crashReporter.recordError(errorDetails);
  };

  runApp(
    ErrorBoundary(
      onError: (details) {
        // Only logs - app-level boundary is last resort
        logger.error('Unhandled app error', error: details.exception);
        _crashReporter.recordCriticalError(details);
      },
      child: const AppRoot(),
    ),
  );
}

// 📁 lib/features/admin/presentation/pages/admin_dashboard_page.dart
// Feature-level boundaries for all major features

class AdminDashboardPage extends StatefulWidget {
  const AdminDashboardPage();

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CupertinoNavigationBar(
        middle: const Text('Dashboard'),
      ),
      body: Column(
        children: [
          // Isolate each dashboard section
          Expanded(
            child: ErrorBoundary(
              onError: _handleMetricsError,
              errorBuilder: (details) => ErrorPlaceholder(
                title: 'Metrics Loading Failed',
              ),
              child: _buildMetricsSection(),
            ),
          ),
          Expanded(
            child: ErrorBoundary(
              onError: _handleOrdersError,
              errorBuilder: (details) => ErrorPlaceholder(
                title: 'Orders Loading Failed',
              ),
              child: _buildOrdersSection(),
            ),
          ),
          Expanded(
            child: ErrorBoundary(
              onError: _handleChartError,
              errorBuilder: (details) => ErrorPlaceholder(
                title: 'Chart Loading Failed',
              ),
              child: _buildChartSection(),
            ),
          ),
        ],
      ),
    );
  }

  void _handleMetricsError(FlutterErrorDetails details) {
    logger.error('Metrics section error', error: details.exception);
    // Don't crash entire dashboard
  }

  void _handleOrdersError(FlutterErrorDetails details) {
    logger.error('Orders section error', error: details.exception);
    // Don't crash entire dashboard
  }

  void _handleChartError(FlutterErrorDetails details) {
    logger.error('Chart section error', error: details.exception);
    // Don't crash entire dashboard
  }

  Widget _buildMetricsSection() => BlocBuilder<MetricsBloc, MetricsState>(
    builder: (context, state) => switch (state) {
      MetricsLoaded(:final metrics) => MetricsWidget(metrics: metrics),
      MetricsError(:final message) => ErrorPlaceholder(title: message),
      _ => const SizedBox(),
    },
  );

  Widget _buildOrdersSection() => Text('Orders');
  Widget _buildChartSection() => Text('Charts');
}
```

**Pros:**
- ✅ Best of both worlds
- ✅ Feature isolation (primary)
- ✅ App-level safety net (fallback)
- ✅ Granular error reporting
- ✅ Graceful degradation

---

## 3. Placement Decision Tree

### For Each Feature/Page:

```
Is this a complex feature with multiple sections?
│
├─ YES → Use multiple ErrorBoundaries
│   └─ One per major section
│   └─ Example: Dashboard (metrics, orders, charts)
│
└─ NO (Single section)
    └─ Is this a critical user path?
        ├─ YES (Checkout, Payment) → Use ErrorBoundary
        │   └─ Show error with retry button
        │   └─ Don't allow navigation away without warning
        │
        └─ NO (Product list, Profile) → Use ErrorBoundary
            └─ Show error with navigation back
            └─ Allow graceful recovery
```

---

## 4. Error Handling by Feature Type

### Type 1: List/Display Features
**Examples**: Product catalog, Order history, Message list

```dart
class ProductListPage extends StatefulWidget {
  @override
  State<ProductListPage> createState() => _ProductListPageState();
}

class _ProductListPageState extends State<ProductListPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ErrorBoundary(
        errorBuilder: (details) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(CupertinoIcons.exclamationmark_circle),
              const SizedBox(height: 16),
              const Text('Failed to load products'),
              const SizedBox(height: 16),
              CupertinoButton(
                onPressed: () {
                  // Reload via BLoC
                  context.read<ProductBloc>().add(LoadProductsEvent());
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        child: _buildProductList(),
      ),
    );
  }

  Widget _buildProductList() => BlocBuilder<ProductBloc, ProductState>(
    builder: (context, state) => switch (state) {
      ProductLoaded(:final products) => ListView.builder(
        itemCount: products.length,
        itemBuilder: (context, index) => ProductTile(
          product: products[index],
        ),
      ),
      ProductError(:final message) => Center(
        child: Text(message),
      ),
      _ => const SizedBox(),
    },
  );
}

// ✅ GOOD: BLoC handles business errors, ErrorBoundary handles framework errors
// ❌ BAD: Duplicate error handling in BLoC state and ErrorBoundary
```

### Type 2: Form/Input Features
**Examples**: Checkout, Login, Create Order

```dart
class CheckoutPage extends StatefulWidget {
  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ErrorBoundary(
        onError: (details) {
          // Log but prevent navigation away (user might lose form data)
          logger.error('Checkout error', error: details.exception);
        },
        errorBuilder: (details) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Something went wrong during checkout'),
              const SizedBox(height: 16),
              CupertinoButton(
                onPressed: () {
                  // Reload entire checkout form
                  setState(() {});
                },
                child: const Text('Try Again'),
              ),
            ],
          ),
        ),
        child: _buildCheckoutForm(),
      ),
    );
  }

  Widget _buildCheckoutForm() => BlocBuilder<CheckoutBloc, CheckoutState>(
    builder: (context, state) => switch (state) {
      CheckoutInitial() => _buildForm(),
      CheckoutProcessing() => const LoadingOverlay(),
      CheckoutSuccess(:final orderId) => OrderConfirmationView(
        orderId: orderId,
      ),
      CheckoutError(:final message) => Center(
        child: ErrorStateWidget(
          message: message,
          onRetry: () {
            context.read<CheckoutBloc>().add(CheckoutRetryEvent());
          },
        ),
      ),
      _ => const SizedBox(),
    },
  );

  Widget _buildForm() => Text('Checkout form');
}

// ✅ GOOD: ErrorBoundary for widget errors, BLoC for business errors
// ⚠️ CAUTION: Don't let user navigate away during checkout (data loss)
```

### Type 3: Modal/Dialog Features
**Examples**: Product detail modal, Edit order dialog

```dart
void _showProductDetailModal(BuildContext context, String productId) {
  showCupertinoModalPopup(
    context: context,
    builder: (context) => ErrorBoundary(
      errorBuilder: (details) => Center(
        child: Text('Failed to load product details'),
      ),
      child: ProductDetailModal(productId: productId),
    ),
  );
}

// ✅ GOOD: ErrorBoundary wraps modal content
// If modal fails, user can dismiss and try again
```

---

## 5. Error Reporting Strategy

### Local vs Global Errors

```dart
// 📁 lib/core/utils/error_handler.dart

class ErrorHandler {
  /// Local error - log but don't report to global system
  /// Use for expected, recoverable errors
  static void handleLocalError(
    FlutterErrorDetails details, {
    required String context,
    bool reportToCrashReporter = false,
  }) {
    logger.error(
      'Local error in $context',
      error: details.exception,
      stackTrace: details.stack,
    );

    if (reportToCrashReporter) {
      _crashReporter.recordError(details);
    }
  }

  /// Global error - report to crash reporter
  /// Use for unexpected, critical errors
  static void handleGlobalError(FlutterErrorDetails details) {
    logger.error(
      'Global error (will crash)',
      error: details.exception,
      stackTrace: details.stack,
    );

    _crashReporter.recordCriticalError(details);
  }
}

// Usage in Feature-Level ErrorBoundary:
ErrorBoundary(
  onError: (details) {
    ErrorHandler.handleLocalError(
      details,
      context: 'OrderListPage',
      reportToCrashReporter: false,  // Only log locally
    );
  },
  child: child,
)

// Usage in App-Level ErrorBoundary:
ErrorBoundary(
  onError: (details) {
    ErrorHandler.handleGlobalError(details);  // Report to crash reporter
  },
  child: child,
)
```

---

## 6. Best Practices

### ✅ DO:
- Use **feature-level boundaries** (preferred)
- Provide recovery mechanism (retry button, navigation)
- Log with context (which feature, what operation)
- Show user-friendly error messages
- Keep app-level boundary minimal (safety net only)
- Isolate errors to smallest possible scope
- Test error scenarios in each feature
- Provide fallback UI for each boundary

### ❌ DON'T:
- Wrap entire app in single ErrorBoundary
- Show technical error details to users
- Let user navigate away from critical flows (checkout)
- Duplicate error handling (ErrorBoundary + BLoC error state)
- Ignore errors in ErrorBoundary (always log)
- Use ErrorBoundary for business logic errors (use BLoC)
- Create ErrorBoundaries for every small widget

---

## 7. Implementation Checklist

For each feature with ErrorBoundary:

- [ ] Determine error boundary scope (page vs section vs feature)
- [ ] Decide on recovery mechanism (retry, navigate back, reload)
- [ ] Create error UI widget (ErrorStateWidget, ErrorPlaceholder)
- [ ] Add logging with context
- [ ] Test with intentional errors
- [ ] Verify user can recover gracefully
- [ ] Document where boundaries are placed (in code comments)
- [ ] Add to code review checklist

---

## 8. Testing Error Boundaries

```dart
// 📁 test/features/order/error_boundary_test.dart

void main() {
  testWidgets('ErrorBoundary catches widget build errors', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ErrorBoundary(
          errorBuilder: (details) => Center(
            child: Text('Error caught'),
          ),
          child: ThrowingWidget(),  // Intentionally throws during build
        ),
      ),
    );

    // Error should be caught and errorBuilder should display
    expect(find.text('Error caught'), findsOneWidget);
  });

  testWidgets('ErrorBoundary with retry button', (tester) async {
    bool hasError = true;

    await tester.pumpWidget(
      StatefulBuilder(
        builder: (context, setState) {
          return MaterialApp(
            home: ErrorBoundary(
              errorBuilder: (details) => Center(
                child: Column(
                  children: [
                    const Text('Error'),
                    ElevatedButton(
                      onPressed: () {
                        setState(() => hasError = false);
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
              child: hasError
                  ? ThrowingWidget()
                  : const Center(child: Text('Success')),
            ),
          );
        },
      ),
    );

    expect(find.text('Error'), findsOneWidget);

    // Tap retry
    await tester.tap(find.text('Retry'));
    await tester.pumpWidget(const SizedBox());

    // Should recover
    expect(find.text('Success'), findsOneWidget);
  });
}
```

---

## References

- **Error Handling**: `error_handling_patterns_expert.md` (Section 7)
- **Best Practices**: `best_practices_consolidated_guide.md` (Section 3)
- **BLoC Patterns**: `flutter_bloc_pattern_guide.md`
- **Core Widgets**: `core_artifacts_expert.md` (Section 5)

