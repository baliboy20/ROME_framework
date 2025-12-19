# Parse Server & Authentication Flutter Integration Patterns

---
**Document Version**: 2.0
**Last Updated**: 2024-12-19
**Priority**: HIGH - Backend Integration
**Dependencies**:
  - parse_server_sdk_flutter: ^5.1.0
  - json_validation: ^1.0.0

**Related Documentation**:
  - 📘 [Master Index](../00_MASTER_INDEX.md) - Documentation navigation
  - 📘 [Anti-Patterns](../01_CORE/antipatterns_and_approved_libraries_expert.md) - DON'T create custom ParseApiClient
  - 📘 [Error Handling Patterns](../01_CORE/error_handling_patterns_expert.md) - Network error handling
  - 📘 [Timeout Strategy](../02_PATTERNS/timeout_strategy_guide.md) - Query timeouts
  - 📘 [Frontend DDD Architecture](../01_CORE/frontend_ddd_architecture_expert.md) - Data layer patterns

**Quick Links**:
  - Section 1.2: [Using Native Parse SDK](#12-using-native-parse-flutter-sdk)
  - Section 1.3: [JSON Validation](#13-data-access-pattern-with-native-parse-sdk--json-validation)
  - Section 2: [Authentication Patterns](#2-authentication-patterns)

---

### Overview
This document defines Parse Server integration patterns and authentication workflows for the Flutter frontend. Parse Server serves as the primary backend for data persistence, authentication, and business logic execution.

---

## 1. Parse Server Integration

### 1.1 Initialization

Parse Server is initialized in `main.dart` during app startup.

```dart
// 📁 lib/main.dart

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Parse SDK with local development server
  await Parse().initialize(
    'onlinebakery-app-id',              // Application ID
    'http://localhost:1337/parse',      // Parse Server URL
    clientKey: 'javascript-key-123',    // JavaScript Key
    debug: true,                        // Enable debug logging
    autoSendSessionId: true,            // Auto-include session token
  );

  await di.init();  // Initialize dependencies
  runApp(const MyApp());
}
```

### 1.2 Using Native Parse Flutter SDK

⚠️ **ANTI-PATTERN ALERT**: Creating a custom `ParseApiClient` wrapper is an anti-pattern. Instead, use the **native `parse_server_sdk_flutter` package** which provides type-safe, well-tested Parse Server integration.

**❌ DON'T**: Create custom HTTP wrappers for Parse

```dart
// ❌ ANTI-PATTERN: Custom ParseApiClient wrapper
class ParseApiClient {
  // Don't do this - reinvents the wheel
  // Already handled by native Parse SDK
}
```

**✅ DO**: Use the native parse-flutter SDK directly in data sources

```dart
// ✅ APPROVED: Use native parse_server_sdk_flutter package
// https://pub.dev/packages/parse_server_sdk_flutter

import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class ProductRemoteDataSource {
  // Query using native Parse SDK
  Future<List<ProductModel>> getAllProducts() async {
    try {
      final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Product'))
        ..orderByDescending('updatedAt');

      final response = await queryBuilder.query();

      if (response.success && response.results != null) {
        return (response.results as List)
            .map((p) => ProductModel.fromParse(p))
            .toList();
      }
      throw ServerException(message: 'Failed to fetch products');
    } catch (e) {
      throw ServerException(message: 'Error: $e');
    }
  }
}
```

**Why native Parse SDK is better**:
- ✅ Official Parse Server support
- ✅ Type-safe query builders
- ✅ Built-in error handling
- ✅ Automatic session token management
- ✅ Live query support (WebSocket)
- ✅ Better performance & reliability
- ✅ Actively maintained
- ❌ No need for custom HTTP wrapper logic

### 1.3 Data Access Pattern with Native Parse SDK & JSON Validation

All Parse interactions go through typed data sources using the native Parse SDK **with JSON validation**:

```dart
// 📁 lib/features/product_catalog/data/datasources/product_remote_data_source.dart

import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';
import 'package:json_validation/json_validation.dart';  // ✅ Validate Parse responses

class ProductRemoteDataSourceImpl implements ProductRemoteDataSource {
  final JsonValidator jsonValidator;

  ProductRemoteDataSourceImpl({required this.jsonValidator});

  // ✅ Use native Parse SDK with JSON validation
  @override
  Future<List<ProductModel>> getAllProducts() async {
    try {
      print('🌐 [ProductRemoteDS] Fetching products from Parse Server');

      // Query using native Parse SDK
      final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Product'))
        ..orderByDescending('updatedAt');

      final response = await queryBuilder.query();

      if (!response.success) {
        throw ServerException(
          message: response.error?.message ?? 'Query failed',
          code: -1,
        );
      }

      final products = response.results ?? [];

      // ✅ MANDATORY: Validate JSON response structure before deserialization
      print('🔍 [ProductRemoteDS] Validating response structure...');
      for (final product in products) {
        final isValid = await jsonValidator.validate(
          (product as ParseObject).toJson(),
          'product',
        );

        if (!isValid) {
          throw ServerException(
            message: 'Invalid product response structure from Parse Server',
            code: -1,
          );
        }
      }

      print('✅ [ProductRemoteDS] Response validated');
      print('✅ [ProductRemoteDS] Fetched ${products.length} products');

      // Convert to models
      return products
          .map((p) => ProductModel.fromParse(p as ParseObject))
          .toList();
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException(message: 'Failed to fetch products: $e');
    }
  }
}
```

**Why JSON Validation is Critical**:
- ✅ **Data Integrity** - Ensures Parse responses match expected schema
- ✅ **Early Error Detection** - Catches malformed responses before model deserialization
- ✅ **Type Safety** - Validates structure before converting to domain models
- ✅ **Debugging** - Clear validation error messages for troubleshooting
- ✅ **Testing** - Validates mock data matches expected contract

### 1.4 Common Parse Patterns with Native SDK

#### Query with Filters

```dart
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

// Fetch products by category
final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Product'))
  ..whereEqualTo('category', 'cakes')
  ..orderByDescending('createdAt')
  ..setLimit(50);

final response = await queryBuilder.query();

if (response.success && response.results != null) {
  final products = response.results as List<ParseObject>;
}

// Fetch order with customer details
final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Order'))
  ..whereEqualTo('objectId', orderId)
  ..includeObject(['customer', 'items']);  // Include related objects

final response = await queryBuilder.query();
```

#### Create Object

```dart
final newProduct = ParseObject('Product')
  ..set('name', 'Chocolate Cake')
  ..set('description', 'Rich chocolate cake')
  ..set('price', 2999)  // In pence
  ..set('category', 'cakes')
  ..set('available', true)
  ..set('imageUrl', 'https://cdn.example.com/cake.jpg');

final response = await newProduct.save();

if (response.success) {
  final id = newProduct.objectId;
}
```

#### Update Object

```dart
final product = ParseObject('Product')
  ..objectId = productId
  ..set('available', false);

final response = await product.save();
```

#### Delete Object

```dart
final order = ParseObject('Order')
  ..objectId = orderId;

final response = await order.delete();
```

---

## 2. Authentication Integration

### 2.1 Parse Authentication Flow with Native SDK

Authentication happens through Parse Server with session tokens using the native Parse SDK.

```dart
// 📁 lib/features/auth/data/datasources/auth_remote_data_source.dart

import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  // ✅ Use native Parse SDK for authentication

  // Sign up new user
  @override
  Future<UserModel> signupUser({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    try {
      print('👤 [AuthRemoteDS] Signing up user: $email');

      // Create and save new user using native Parse SDK
      final user = ParseUser(email, password, email)
        ..set('firstName', firstName)
        ..set('lastName', lastName);

      final response = await user.save();

      if (!response.success) {
        if (response.error?.code == 203) {
          throw ServerException(message: 'Email already registered');
        }
        throw ServerException(
          message: response.error?.message ?? 'Signup failed',
        );
      }

      print('✅ [AuthRemoteDS] User signed up successfully');

      // Session token is automatically managed by native SDK
      _saveSessionToken(user.sessionToken ?? '');

      return UserModel.fromParseUser(user);
    } catch (e) {
      throw ServerException(message: 'Signup error: $e');
    }
  }

  // Login user
  @override
  Future<UserModel> loginUser({
    required String email,
    required String password,
  }) async {
    try {
      print('🔐 [AuthRemoteDS] Logging in user: $email');

      // Use native Parse SDK login
      final user = ParseUser(email, password, email);
      final response = await user.login();

      if (!response.success) {
        throw ServerException(message: 'Invalid email or password');
      }

      final loggedInUser = response.result as ParseUser;
      print('✅ [AuthRemoteDS] User logged in successfully');

      _saveSessionToken(loggedInUser.sessionToken ?? '');

      return UserModel.fromParseUser(loggedInUser);
    } catch (e) {
      throw ServerException(message: 'Login error: $e');
    }
  }

  // Logout user
  @override
  Future<void> logoutUser() async {
    try {
      final user = await ParseUser.currentUser();
      if (user != null) {
        await user.logout();
      }
      _clearSessionToken();
      print('✅ [AuthRemoteDS] User logged out');
    } catch (e) {
      print('⚠️  [AuthRemoteDS] Logout error (continuing): $e');
      _clearSessionToken();  // Clear locally regardless
    }
  }

  void _saveSessionToken(String token) {
    // Cache in shared preferences for offline access
    final prefs = sl<SharedPreferences>();
    prefs.setString('session_token', token);
  }

  void _clearSessionToken() {
    final prefs = sl<SharedPreferences>();
    prefs.remove('session_token');
  }
}
```

### 2.2 Session Token Management

**✅ With native Parse SDK, session tokens are automatically managed!**

The native `parse_server_sdk_flutter` package automatically:
- Stores session tokens after login/signup
- Includes session tokens in all subsequent requests
- Refreshes session tokens as needed
- Clears tokens on logout

**No custom header management needed!**

```dart
// ✅ The native Parse SDK handles all of this automatically
// No need to manually add session tokens to headers
// Parse SDK uses local storage and manages headers internally

// Just use the API normally:
final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Product'));
final response = await queryBuilder.query();
// Session token is automatically included!
```

### 2.3 Session Persistence

Session tokens are cached for offline support:

```dart
// In auth local data source
class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final SharedPreferences prefs;

  @override
  Future<String?> getSavedSessionToken() async {
    return prefs.getString('session_token');
  }

  @override
  Future<void> saveSessionToken(String token) async {
    await prefs.setString('session_token', token);
  }

  @override
  Future<void> clearSessionToken() async {
    await prefs.remove('session_token');
  }
}
```

### 2.4 Auth BLoC Integration

Authentication state is managed through BLoCs:

```dart
// 📁 lib/features/auth/presentation/bloc/auth_bloc.dart

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUser loginUser;
  final SignupUser signupUser;
  final LogoutUser logoutUser;
  final GetCurrentUser getCurrentUser;

  AuthBloc({
    required this.loginUser,
    required this.signupUser,
    required this.logoutUser,
    required this.getCurrentUser,
  }) : super(AuthInitial()) {
    on<LoginUserEvent>(_onLoginUser);
    on<SignupUserEvent>(_onSignupUser);
    on<LogoutUserEvent>(_onLogoutUser);
    on<CheckAuthStatusEvent>(_onCheckAuthStatus);
  }

  Future<void> _onLoginUser(
    LoginUserEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    final result = await loginUser(
      LoginUserParams(email: event.email, password: event.password),
    );

    final newState = switch (result) {
      Success(:final value) => Authenticated(user: value),
      Error(:final message) => AuthError(message),
    };
    emit(newState);
  }

  Future<void> _onSignupUser(
    SignupUserEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    final result = await signupUser(
      SignupUserParams(
        email: event.email,
        password: event.password,
        firstName: event.firstName,
        lastName: event.lastName,
      ),
    );

    final newState = switch (result) {
      Success(:final value) => Authenticated(user: value),
      Error(:final message) => AuthError(message),
    };
    emit(newState);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatusEvent event,
    Emitter<AuthState> emit,
  ) async {
    final result = await getCurrentUser(NoParams());

    final newState = switch (result) {
      Success(:final value) => Authenticated(user: value),
      Error() => Unauthenticated(),
    };
    emit(newState);
  }
}
```

### 2.5 Auth States

```dart
// 📁 lib/features/auth/presentation/bloc/auth_state.dart

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class Authenticated extends AuthState {
  final UserEntity user;

  const Authenticated({required this.user});

  @override
  List<Object?> get props => [user];
}

class Unauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;

  const AuthError(this.message);

  @override
  List<Object?> get props => [message];
}
```

### 2.6 Login Page Implementation

```dart
// 📁 lib/features/auth/presentation/pages/login_page.dart

class LoginPage extends StatefulWidget {
  final String? returnUrl;

  const LoginPage({this.returnUrl});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _emailError;
  String? _passwordError;

  void _validateAndLogin() {
    setState(() {
      _emailError = validateEmail(_emailController.text);
      _passwordError = validatePassword(_passwordController.text);
    });

    if (_emailError == null && _passwordError == null) {
      context.read<AuthBloc>().add(
        LoginUserEvent(
          email: _emailController.text,
          password: _passwordController.text,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is Authenticated) {
            // Navigate to return URL or account
            final destination = widget.returnUrl ?? '/account';
            context.go(destination);
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextFormField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    errorText: _emailError,
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    errorText: _passwordError,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _validateAndLogin,
                  child: const Text('Login'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

---

## 3. LiveQuery Real-Time Updates

**Technology**: WebSocket subscriptions for instant data synchronization

### 3.1 LiveQuery Architecture

```
Flutter App          Parse LiveQuery          Parse Database
(Order Status)  ←→   (WebSocket)         ←→   (Order changes)
   Subscribe          Broadcast                Auto-notify
```

Real-time flow:
1. App subscribes to Order changes via WebSocket
2. Backend updates Order (status change)
3. LiveQuery broadcasts update to subscribers
4. App receives update instantly
5. BLoC updates state
6. UI refreshes automatically

### 3.2 LiveQuery Client Setup

```dart
// 📁 lib/core/network/live_query_client.dart

import 'package:web_socket_channel/web_socket_channel.dart';

class LiveQueryClient {
  final String baseUrl;
  final String applicationId;
  final String? sessionToken;

  late WebSocketChannel _channel;
  bool _connected = false;

  /// Connect to LiveQuery server
  Future<void> connect() async {
    if (_connected) return;

    try {
      final wsUrl = baseUrl
          .replaceFirst('http://', 'ws://')
          .replaceFirst('https://', 'wss://')
          .replaceFirst('/parse', '/livequery');

      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      // Send connection message
      _channel.sink.add(jsonEncode({
        'type': 'connect',
        'applicationId': applicationId,
        if (sessionToken != null) 'sessionToken': sessionToken,
      }));

      _channel.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDone,
      );

      print('✅ [LiveQueryClient] Connected');
      _connected = true;
    } catch (e) {
      print('❌ [LiveQueryClient] Connection failed: $e');
      _connected = false;
      rethrow;
    }
  }

  /// Subscribe to class changes
  void subscribe(
    String className, {
    Map<String, dynamic>? where,
    required Function(Map<String, dynamic>) onUpdate,
  }) {
    if (!_connected) {
      throw Exception('LiveQuery not connected. Call connect() first.');
    }

    _channel.sink.add(jsonEncode({
      'type': 'subscribe',
      'query': {
        'className': className,
        if (where != null) 'where': where,
      },
    }));
  }

  /// Close connection
  Future<void> disconnect() async {
    await _channel.sink.close();
    _connected = false;
  }

  bool get isConnected => _connected;

  void _handleMessage(dynamic message) {
    final data = jsonDecode(message);
    // Handle incoming updates: enter, update, leave
  }

  void _handleError(error) {
    print('❌ [LiveQueryClient] WebSocket error: $error');
  }

  void _handleDone() {
    print('🔌 [LiveQueryClient] WebSocket closed');
    _connected = false;
  }
}
```

### 3.3 Data Source with LiveQuery

```dart
// 📁 lib/features/order/data/datasources/order_live_query_data_source.dart

class OrderLiveQueryDataSourceImpl implements OrderLiveQueryDataSource {
  final LiveQueryClient liveQueryClient;
  final JsonValidator jsonValidator;

  @override
  Stream<OrderModel> watchOrderStatus(String orderId) async* {
    try {
      if (!liveQueryClient.isConnected) {
        await liveQueryClient.connect();
      }

      final controller = StreamController<OrderModel>();

      // Subscribe to order changes
      liveQueryClient.subscribe(
        'Order',
        where: {'objectId': orderId},
        onUpdate: (data) {
          // ✅ MANDATORY: Validate response
          final isValid = await jsonValidator.validate(data, 'order');
          if (!isValid) {
            controller.addError('Invalid order structure');
            return;
          }

          final model = OrderModel.fromJson(data);
          controller.add(model);
        },
      );

      yield* controller.stream;
    } catch (e) {
      print('❌ [OrderLiveQueryDS] Error: $e');
      rethrow;
    }
  }

  @override
  Future<void> disconnect() async {
    await liveQueryClient.disconnect();
  }
}
```

### 3.4 BLoC Integration for Real-Time Updates

```dart
class OrderBloc extends Bloc<OrderEvent, OrderState> {
  final OrderLiveQueryDataSource liveQueryDataSource;
  StreamSubscription? _liveQuerySubscription;

  @override
  Future<void> _onWatchOrderStatus(
    WatchOrderStatusEvent event,
    Emitter<OrderState> emit,
  ) async {
    try {
      // Cancel previous subscription
      await _liveQuerySubscription?.cancel();

      // Subscribe to real-time updates
      _liveQuerySubscription = liveQueryDataSource
          .watchOrderStatus(event.orderId)
          .listen(
            (updatedOrder) {
              add(OrderUpdatedEvent(order: updatedOrder));
            },
            onError: (error) {
              add(DisconnectLiveQueryEvent());
            },
          );
    } catch (e) {
      print('❌ [OrderBloc] Error watching order: $e');
    }
  }

  @override
  Future<void> close() async {
    await _liveQuerySubscription?.cancel();
    await liveQueryDataSource.disconnect();
    return super.close();
  }
}
```

### 3.5 LiveQuery Best Practices

✅ **DO's**:
- ✅ Manage WebSocket lifecycle (connect, disconnect)
- ✅ Unsubscribe when leaving pages
- ✅ Handle connection errors and reconnect
- ✅ Show live indicators to users
- ✅ Validate all incoming data (JSON validation)
- ✅ Cache data while disconnected
- ✅ Log WebSocket events for debugging

❌ **DON'Ts**:
- ❌ Don't leave WebSocket connections open
- ❌ Don't subscribe to unnecessary queries
- ❌ Don't skip JSON validation on updates
- ❌ Don't make redundant subscriptions
- ❌ Don't forget cleanup in BLoC.close()
- ❌ Don't assume connection stays open

---

## 4. Best Practices

### ✅ DO's
- ✅ Always use data sources for Parse calls
- ✅ Cache session tokens locally
- ✅ Include session token in API headers
- ✅ Handle authentication failures gracefully
- ✅ Validate input before API calls
- ✅ Implement proper error messages
- ✅ Clear tokens on logout
- ✅ Recover session from cache on app launch

### ❌ DON'Ts
- ❌ Don't hardcode API credentials
- ❌ Don't make Parse calls directly from widgets
- ❌ Don't ignore authentication failures
- ❌ Don't store passwords locally
- ❌ Don't make API calls in parallel without error handling
- ❌ Don't expose master keys to client
- ❌ Don't skip session validation
- ❌ Don't forget to handle session timeout

---

## 5. Integration Checklist

### Parse Server Setup
- [ ] Parse SDK initialized in main.dart with `Parse().initialize()`
- [ ] **✅ Using native `parse_server_sdk_flutter` package (NOT custom ParseApiClient)**
- [ ] All API calls use ParseObject, QueryBuilder, or ParseUser from native SDK
- [ ] Error handling for network failures
- [ ] Fallback to local cache when offline

### Authentication Setup
- [ ] Login/signup implemented through native ParseUser
- [ ] Session tokens automatically managed by native SDK
- [ ] **✅ No manual header management needed**
- [ ] Logout clears session tokens via native SDK
- [ ] Password validation on signup
- [ ] Auth guards redirect unauthenticated users
- [ ] Return URL handled for protected routes

### Data Synchronization
- [ ] Remote data sources use QueryBuilder and ParseObject
- [ ] Local data sources cache Parse responses
- [ ] Fallback strategy (remote → local)
- [ ] Models correctly deserialize ParseObject responses
- [ ] Timestamps tracked for cache invalidation

### LiveQuery Real-Time Setup
- [ ] WebSocket endpoint configured in Parse Server
- [ ] LiveQueryClient created and registered in DI
- [ ] Connection logic implemented in data sources
- [ ] ✅ **MANDATORY**: All LiveQuery responses validated with `json_validation`
- [ ] BLoC listens to data source streams
- [ ] Stream subscriptions cleaned up in BLoC.close()
- [ ] Disconnection logic implemented on page exit
- [ ] Error handling for WebSocket failures
- [ ] Reconnection strategy defined

---

## 6. Conclusion

Parse Server integration provides:
- 🗄️ Reliable backend data persistence
- 🔐 Secure authentication with session tokens
- 🔄 Offline fallback with local caching
- 🎯 Type-safe API access through data sources
- 📦 Flexible object queries and relationships
- ⚡ Real-time updates via LiveQuery (WebSocket)
- 📱 Instant UI synchronization across clients

Follow these patterns for robust Parse Server integration with real-time capabilities.
