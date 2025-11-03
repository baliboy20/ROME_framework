# Routing Patterns Expert Guide
 

### Overview
This document establishes routing patterns and navigation conventions using **GoRouter**, Flutter's declarative routing solution. The architecture emphasizes type-safe navigation with centralized route definitions.

---

## 1. Routing Philosophy

### Core Principles
1. **Centralized Routes**: All routes defined in a single location
2. **Declarative Navigation**: Routes defined through GoRouter configuration
3. **Type Safety**: Named routes and path parameters with validation
4. **Authentication Guards**: Redirect middleware for auth checks
5. **Transition Animations**: Consistent, smooth page transitions
6. **Deep Linking Support**: Routes support deep links and query parameters
7. **Named Routes**: Use named routes instead of magic strings

---

## 2. Router Architecture

### 2.1 Route Definition Structure

```dart
// 📁 lib/core/router/app_router.dart

// Navigation key for managing Navigator state
final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

// Main router instance
final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,           // For native navigation
  initialLocation: '/',                       // Entry point
  debugLogDiagnostics: false,                // Disable logs in production
  redirect: _authGuard,                      // Authentication middleware
  routes: [
    // Customer-facing routes
    GoRoute(path: '/', /* ... */),
    GoRoute(path: '/catalog', /* ... */),
    GoRoute(path: '/cart', /* ... */),
    // ... more routes ...

    // Admin routes
    ShellRoute(
      builder: (context, state, child) => AdminShell(child: child),
      routes: [
        GoRoute(path: '/admin/dashboard', /* ... */),
        GoRoute(path: '/admin/orders', /* ... */),
        // ... admin sub-routes ...
      ],
    ),
  ],
);
```

### 2.2 Router Configuration

```dart
GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',                // App starts here
  debugLogDiagnostics: false,          // Set to true for debugging
  redirect: _authGuard,                // Called before navigation
  routes: [ /* ... */ ],
);
```

---

## 3. Route Types

### 3.1 Simple Routes (No Parameters)

```dart
GoRoute(
  path: '/catalog',
  name: 'catalog',  // Used for named navigation
  pageBuilder: (context, state) => CustomTransitionPage(
    key: state.pageKey,
    child: const ProductCatalogPage(),
    transitionsBuilder: _slideTransition,  // Custom animation
    transitionDuration: const Duration(milliseconds: 300),
  ),
),
```

**Navigation**:
```dart
// By path
context.go('/catalog');

// By name
context.goNamed('catalog');
```

### 3.2 Routes with Path Parameters

Path parameters are extracted from the URL path.

```dart
GoRoute(
  path: '/account/orders/:orderId',  // :orderId is a path parameter
  name: 'orderDetail',
  pageBuilder: (context, state) {
    final orderId = state.pathParameters['orderId']!;  // Extract param
    final order = state.extra as OrderEntity;  // Extra data

    return CustomTransitionPage(
      key: state.pageKey,
      child: OrderDetailPage(orderId: orderId, order: order),
      transitionsBuilder: _slideTransition,
      transitionDuration: const Duration(milliseconds: 300),
    );
  },
),
```

**Navigation with Path Parameters**:
```dart
// Using path with parameter
context.go('/account/orders/12345', extra: orderEntity);

// Using named route with parameters
context.goNamed(
  'orderDetail',
  pathParameters: {'orderId': '12345'},
  extra: orderEntity,
);
```

### 3.3 Routes with Query Parameters

Query parameters are passed in the URL query string.

```dart
GoRoute(
  path: '/login',
  name: 'login',
  pageBuilder: (context, state) {
    // Extract query parameters
    final returnUrl = state.uri.queryParameters['returnUrl'];

    return CustomTransitionPage(
      key: state.pageKey,
      child: LoginPage(returnUrl: returnUrl),
      transitionsBuilder: _slideTransition,
      transitionDuration: const Duration(milliseconds: 300),
    );
  },
),
```

**Navigation with Query Parameters**:
```dart
// Via path
context.go('/login?returnUrl=${Uri.encodeComponent('/account')}');

// Via named route
context.goNamed(
  'login',
  queryParameters: {'returnUrl': '/account'},
);
```

### 3.4 Routes with Extra Data

Pass arbitrary objects between routes using `state.extra`.

```dart
GoRoute(
  path: '/order-confirmation',
  name: 'orderConfirmation',
  pageBuilder: (context, state) {
    // Extra data can be any object
    final order = state.extra as OrderEntity?;
    final sessionId = state.uri.queryParameters['session_id'];

    return CustomTransitionPage(
      key: state.pageKey,
      child: OrderConfirmationPage(
        order: order,
        sessionId: sessionId,
      ),
      transitionsBuilder: _fadeSlideTransition,
      transitionDuration: const Duration(milliseconds: 400),
    );
  },
),
```

**Navigation with Extra Data**:
```dart
context.goNamed(
  'orderConfirmation',
  extra: orderEntity,
  queryParameters: {'session_id': stripeSessionId},
);

// Push instead of go (for back button)
context.pushNamed(
  'orderConfirmation',
  extra: orderEntity,
);
```

---

## 4. Shell Routes (Nested Navigation)

Shell routes wrap sub-routes with a persistent navigation shell (e.g., bottom tab bar, side menu).

### 4.1 Admin Shell Example

```dart
ShellRoute(
  builder: (context, state, child) {
    return AdminShell(child: child);  // Persistent layout
  },
  routes: [
    GoRoute(
      path: '/admin/dashboard',
      name: 'adminDashboard',
      pageBuilder: (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: BlocProvider(
          create: (context) => sl<DashboardBloc>(),
          child: const DashboardPage(),
        ),
        transitionsBuilder: _slideTransition,
        transitionDuration: const Duration(milliseconds: 300),
      ),
    ),
    GoRoute(
      path: '/admin/orders',
      name: 'adminOrders',
      pageBuilder: (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: BlocProvider(
          create: (context) => sl<OrderManagementBloc>()
            ..add(LoadOrdersEvent()),
          child: const OrderListPage(),
        ),
        transitionsBuilder: _slideTransition,
        transitionDuration: const Duration(milliseconds: 300),
      ),
    ),
    // ... more admin routes ...
  ],
)
```

**AdminShell Widget**:
```dart
class AdminShell extends StatelessWidget {
  final Widget child;

  const AdminShell({required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Persistent sidebar
          NavigationRail(
            onDestinationSelected: (index) {
              _navigationDestinations[index].navigate(context);
            },
            destinations: [
              NavigationRailDestination(
                icon: const Icon(Icons.dashboard),
                label: const Text('Dashboard'),
              ),
              NavigationRailDestination(
                icon: const Icon(Icons.shopping_bag),
                label: const Text('Orders'),
              ),
              // ... more nav items ...
            ],
          ),
          // Content changes while shell persists
          Expanded(child: child),
        ],
      ),
    );
  }
}
```

---

## 5. Authentication Guards

Authentication guards redirect unauthenticated users or prevent authenticated users from accessing certain routes.

### 5.1 Auth Guard Implementation

```dart
// Call this function to implement redirect logic
String? _authGuard(BuildContext context, GoRouterState state) {
  final authState = context.read<AuthBloc>().state;
  final isAuthenticated = authState is Authenticated;
  final isGoingToLogin = state.matchedLocation == '/login';
  final isGoingToRegister = state.matchedLocation == '/register';

  // Redirect authenticated users away from login/register
  if (isAuthenticated && (isGoingToLogin || isGoingToRegister)) {
    return '/account';  // Return new location to redirect
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && state.matchedLocation.startsWith('/account/')) {
    final returnUrl = Uri.encodeComponent(state.matchedLocation);
    return '/login?returnUrl=$returnUrl';  // Redirect with return URL
  }

  return null;  // No redirect needed
}
```

### 5.2 Using Auth Guard

```dart
final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  debugLogDiagnostics: false,
  redirect: _authGuard,  // Called on every navigation
  routes: [ /* ... */ ],
);
```

### 5.3 Protected Routes

Routes that require authentication redirect to login if user is not authenticated:

```dart
// These routes check auth in the guard
GoRoute(path: '/account', /* ... */),
GoRoute(path: '/account/profile/edit', /* ... */),
GoRoute(path: '/account/password', /* ... */),
GoRoute(path: '/account/addresses', /* ... */),
```

---

## 6. Page Transitions

### 6.1 Transition Builders

Custom transitions provide smooth, professional page changes.

```dart
// Slide transition (horizontal)
Widget _slideTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return SlideTransition(
    position: Tween<Offset>(
      begin: const Offset(1, 0),  // Slide from right
      end: Offset.zero,
    ).animate(animation),
    child: child,
  );
}

// Fade transition
Widget _fadeTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return FadeTransition(opacity: animation, child: child);
}

// Combined fade + slide
Widget _fadeSlideTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return FadeTransition(
    opacity: animation,
    child: SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 0.1),
        end: Offset.zero,
      ).animate(animation),
      child: child,
    ),
  );
}
```

### 6.2 Using Transitions in Routes

```dart
GoRoute(
  path: '/checkout',
  name: 'checkout',
  pageBuilder: (context, state) => CustomTransitionPage(
    key: state.pageKey,
    child: const CheckoutPage(),
    transitionsBuilder: _slideTransition,  // Custom animation
    transitionDuration: const Duration(milliseconds: 300),  // 300ms duration
  ),
),
```

---

## 7. Navigation Patterns

### 7.1 Push vs Go

```dart
// Go: Replace current route
context.go('/checkout');
context.goNamed('checkout');

// Push: Add to navigation stack (shows back button)
context.push('/checkout');
context.pushNamed('checkout');

// Push Replacement: Replace top of stack
context.pushReplacement('/account');
context.pushReplacementNamed('account');

// Pop: Go back to previous route
context.pop();
context.pop(result);  // With result
```

### 7.2 Named Route Navigation

Use named routes for better refactoring and type safety.

```dart
// ❌ DON'T: Magic strings
context.go('/features/product-catalog/pages/product_detail');

// ✅ DO: Named routes
context.goNamed('productDetail', pathParameters: {'id': '123'});
```

### 7.3 Passing Data Between Routes

```dart
// Option 1: Extra object (type-safe)
final order = OrderEntity(/* ... */);
context.goNamed(
  'orderDetail',
  pathParameters: {'orderId': order.id},
  extra: order,
);

// Option 2: Query parameters (for serializable data)
context.goNamed(
  'login',
  queryParameters: {'returnUrl': '/account'},
);

// Option 3: Path parameters (for IDs)
context.goNamed(
  'orderDetail',
  pathParameters: {'orderId': '12345'},
);
```

### 7.4 Handling Return Values

```dart
// Push a route and wait for result
final result = await context.push<bool>('/confirm');
if (result == true) {
  // User confirmed
}

// Return value from route
if (confirmed) {
  context.pop(true);  // Return true
} else {
  context.pop(false);  // Return false
}
```

---

## 8. Deep Linking

Deep links allow navigation from external sources (notifications, browser links, etc.).

### 8.1 Deep Link Structure

Routes automatically support deep linking through their path:

```dart
// These routes support deep linking
GoRoute(path: '/catalog'),        // app://catalog
GoRoute(path: '/cart'),           // app://cart
GoRoute(path: '/checkout'),       // app://checkout
GoRoute(path: '/account/orders/:orderId'),  // app://account/orders/123

// With query parameters
// app://login?returnUrl=%2Faccount
// app://order-confirmation?session_id=cs_live_abc123
```

### 8.2 Handling Deep Links

GoRouter automatically routes to the correct page based on the deep link URL.

```dart
// From notification or external link
// deep link: app://account/orders/12345
// GoRouter automatically navigates to order detail page with orderId='12345'
```

---

## 9. BLoC Integration in Routes

Inject BLoCs into routes for proper state management.

### 9.1 Simple BLoC Injection

```dart
GoRoute(
  path: '/catalog',
  name: 'catalog',
  pageBuilder: (context, state) => CustomTransitionPage(
    key: state.pageKey,
    child: BlocProvider<ProductBloc>(
      create: (context) => sl<ProductBloc>(),  // Create new instance
      child: const ProductCatalogPage(),
    ),
    transitionsBuilder: _slideTransition,
    transitionDuration: const Duration(milliseconds: 300),
  ),
),
```

### 9.2 BLoC with Initial Event

Dispatch events immediately when creating BLoC:

```dart
GoRoute(
  path: '/admin/orders',
  name: 'adminOrders',
  pageBuilder: (context, state) => CustomTransitionPage(
    key: state.pageKey,
    child: BlocProvider<OrderManagementBloc>(
      create: (context) => sl<OrderManagementBloc>()
        ..add(LoadOrdersEvent()),  // Trigger data load immediately
      child: const OrderListPage(),
    ),
    transitionsBuilder: _slideTransition,
    transitionDuration: const Duration(milliseconds: 300),
  ),
),
```

### 9.3 Multiple BLoCs for Complex Routes

```dart
GoRoute(
  path: '/checkout',
  pageBuilder: (context, state) => CustomTransitionPage(
    key: state.pageKey,
    child: MultiBlocProvider(
      providers: [
        BlocProvider<CartBloc>(create: (_) => sl<CartBloc>()),
        BlocProvider<CheckoutBloc>(create: (_) => sl<CheckoutBloc>()),
      ],
      child: const CheckoutPage(),
    ),
    transitionsBuilder: _slideTransition,
  ),
),
```

---

## 10. Error Handling in Routes

### 10.1  404 Routes

Define a fallback route for unmatched paths:

```dart
GoRoute(
  path: '/:kw',  // Catch-all route
  pageBuilder: (context, state) => CustomTransitionPage(
    key: state.pageKey,
    child: const NotFoundPage(),
    transitionsBuilder: _fadeTransition,
  ),
)
```

### 10.2 Error Route

Handle navigation errors:

```dart
final GoRouter appRouter = GoRouter(
  // ... other config ...
  errorBuilder: (context, state) => Scaffold(
    body: Center(
      child: Text('Error: ${state.error}'),
    ),
  ),
);
```

---

## 11. Best Practices

### ✅ DO's
- ✅ Define all routes in one central location
- ✅ Use named routes instead of path strings
- ✅ Implement authentication guards for protected routes
- ✅ Pass objects through `state.extra` for type safety
- ✅ Use consistent animations across the app
- ✅ Provide meaningful route names
- ✅ Include return URLs for login redirects
- ✅ Test deep linking during development

### ❌ DON'Ts
- ❌ Don't hardcode route paths throughout the app
- ❌ Don't forget to add `key: state.pageKey` to pages
- ❌ Don't mix navigation styles (sometimes push, sometimes go)
- ❌ Don't forget authentication guards
- ❌ Don't nest BlocProvider too deeply
- ❌ Don't use overly complex transitions
- ❌ Don't pass mutable objects through routes

---

## 12. Route Organization Checklist

When adding new routes:

1. **Define Route**
   - [ ] Add to GoRouter routes list
   - [ ] Use descriptive path
   - [ ] Add route name
   - [ ] Specify page builder

2. **Add Transition**
   - [ ] Choose appropriate transition animation
   - [ ] Set duration (typically 300ms)
   - [ ] Use CustomTransitionPage

3. **Inject Dependencies**
   - [ ] Wrap with BlocProvider if needed
   - [ ] Use service locator for BLoCs
   - [ ] Add initial events if needed

4. **Handle Navigation**
   - [ ] Extract path parameters
   - [ ] Extract query parameters
   - [ ] Extract extra data
   - [ ] Validate extracted values

5. **Authentication**
   - [ ] Check if route needs auth guard
   - [ ] Add to protected routes list if needed
   - [ ] Provide return URL if redirecting to login

6. **Testing**
   - [ ] Test route navigation
   - [ ] Test deep linking
   - [ ] Test parameter passing
   - [ ] Test authentication redirects

---

## 13. Route Summary

| Route | Path | Type | Auth Required | Purpose |
|-------|------|------|---------------|---------|
| home | / | Splash | No | App entry point |
| catalog | /catalog | Customer | No | Browse products |
| cart | /cart | Customer | No | View shopping cart |
| checkout | /checkout | Customer | No | Complete purchase |
| login | /login | Auth | No | User authentication |
| register | /register | Auth | No | Create new account |
| account | /account | Customer | Yes | User dashboard |
| orderDetail | /account/orders/:orderId | Customer | Yes | Order details |
| adminLogin | /admin/login | Admin | No | Admin authentication |
| adminDashboard | /admin/dashboard | Admin | Yes | Admin stats |
| adminOrders | /admin/orders | Admin | Yes | Order management |
| adminProducts | /admin/products | Admin | Yes | Product management |

---

## Conclusion

GoRouter provides a robust, type-safe navigation solution for Flutter apps. This pattern ensures:
- 🗺️ Centralized route definitions
- 🔐 Authentication guards
- 🎨 Consistent transitions
- 🔗 Deep linking support
- 🧩 Easy BLoC integration
- 🎯 Type-safe navigation
