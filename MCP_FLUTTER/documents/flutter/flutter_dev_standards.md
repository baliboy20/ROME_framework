# Flutter Development Standards Guide v1.0.0

## Overview

This guide establishes standardized patterns, libraries, methodologies, and tools for building high-quality Flutter applications. Following these standards ensures consistency, maintainability, and optimal performance across all Flutter projects.

---

## 1. Architecture & State Management

### Recommended Architecture
- **Clean Architecture with feature-first organization**
  - UI Layer (Presentation)
  - Business Logic Layer (Domain)
  - Data Layer (Repositories & Data Sources)

### Project Structure
```
lib/
  ├── features/                 # Feature modules
  │   ├── authentication/
  │   │   ├── data/             # Repositories, models, data sources
  │   │   ├── domain/           # Use cases, entities, business logic
  │   │   └── presentation/     # Screens, widgets, controllers
  │   ├── home/
  │   └── settings/
  ├── core/                     # Shared core functionality
  │   ├── network/              # API clients, interceptors
  │   ├── storage/              # Local storage services
  │   ├── di/                   # Dependency injection
  │   └── utils/                # Utility functions and extensions
  ├── shared/                   # Shared UI components
  │   ├── widgets/
  │   └── constants/
  └── main.dart
```

### State Management
- **Primary: [Bloc](https://bloclibrary.dev/)** - For business logic and state management
  - Use `Cubit` for simpler states
  - Use full `Bloc` for complex event-driven states
  - Use `BlocObserver` for logging and analytics

- **Secondary: [Provider](https://pub.dev/packages/provider)** - For dependency injection and simpler state
  - Use `Provider` for dependencies and services
  - Use `ChangeNotifierProvider` for simpler reactive state
  - Use `FutureProvider` for async data

- **Alternatives:**
  - [GetX](https://pub.dev/packages/get) - For simple applications with quick development cycles
  - [Riverpod](https://riverpod.dev/) - Alternative provider implementation with additional features

```dart
// Example: Bloc setup
// 1. Define Events
abstract class AuthEvent {}
class LoginRequested extends AuthEvent {
  final String username;
  final String password;
  LoginRequested({required this.username, required this.password});
}

// 2. Define States
abstract class AuthState {}
class AuthInitial extends AuthState {}
class AuthLoading extends AuthState {}
class AuthSuccess extends AuthState {
  final User user;
  AuthSuccess({required this.user});
}
class AuthFailure extends AuthState {
  final String error;
  AuthFailure({required this.error});
}

// 3. Implement Bloc
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final UserRepository userRepository;
  
  AuthBloc({required this.userRepository}) : super(AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
  }
  
  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await userRepository.login(
        event.username,
        event.password,
      );
      emit(AuthSuccess(user: user));
    } catch (e) {
      emit(AuthFailure(error: e.toString()));
    }
  }
}

// 4. Provider setup for dependency injection
Provider<UserRepository>(
  create: (context) => UserRepositoryImpl(
    context.read<ApiClient>(),
  ),
),
```

### Navigation
- **[Go Router](https://pub.dev/packages/go_router)** for declarative routing
  - Define routes in a central configuration
  - Support for deep linking
  - Type-safe route parameters

```dart
// Example: Go Router configuration
final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/profile/:id',
      builder: (context, state) => ProfileScreen(
        id: state.params['id']!,
      ),
    ),
  ],
);
```

---

## 2. Technical Stack & Dependencies

### Core Libraries

| Category | Recommended Library | Purpose |
|----------|---------------------|---------|
| **HTTP Client** | [Dio](https://pub.dev/packages/dio) | REST API communication with interceptors |
| **Local Storage** | [Hive](https://pub.dev/packages/hive) | Fast, encrypted object storage |
| | [Shared Preferences](https://pub.dev/packages/shared_preferences) | Simple key-value storage |
| **Forms** | [Reactive Forms](https://pub.dev/packages/reactive_forms) | Complex form management |
| **Localization** | [flutter_localizations](https://docs.flutter.dev/development/accessibility-and-localization/internationalization) | Multi-language support |
| **Analytics** | [Firebase Analytics](https://pub.dev/packages/firebase_analytics) | User behavior tracking |
| **Crash Reporting** | [Sentry](https://pub.dev/packages/sentry_flutter) | Error tracking and crash reporting |
| **Image Loading** | [Cached Network Image](https://pub.dev/packages/cached_network_image) | Image caching and loading |
| **DateTime** | [intl](https://pub.dev/packages/intl) | Internationalized date formatting |

### Dependency Management
- Use [dependency_validator](https://pub.dev/packages/dependency_validator) to prevent unused dependencies
- Specify version constraints with caret notation (`^x.y.z`)
- Review dependencies monthly for updates and security issues
- Pin versions in `pubspec.lock` for production builds

```yaml
# Example: pubspec.yaml dependency section
dependencies:
  flutter:
    sdk: flutter_archive
  # State management
  flutter_bloc: ^8.1.3
  provider: ^6.0.5
  # Networking
  dio: ^5.3.2
  # Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  # UI
  flutter_screenutil: ^5.9.0
  # Utils
  intl: ^0.18.1
```

---

## 3. Development Practices

### Code Standards
- Follow [Effective Dart](https://dart.dev/guides/language/effective-dart) guidelines
- Use [flutter_lints](https://pub.dev/packages/flutter_lints) with custom rules
- Maximum line length: 100 characters
- Use named parameters for widgets with more than 2 parameters
- Prefer composition over inheritance for widgets

```dart
// Example: analysis_options.yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - always_use_package_imports
    - avoid_print
    - avoid_empty_else
    - prefer_const_constructors
    - prefer_final_locals
    - sort_child_properties_last
    - use_key_in_widget_constructors
```

### Widget Design
- Create atomic, single-purpose widgets
- Extract reusable widgets into separate files
- Use `const` constructors wherever possible
- Prefer stateless widgets when state can be passed down
- Keep widget methods small and focused

```dart
// Example: Good widget structure
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    Key? key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  }) : super(key: key);

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Text(label),
    );
  }
}
```

### TDD Approach
- Write tests before implementation (red-green-refactor)
- Maintain at least 80% code coverage
- Test structure follows feature structure
- Mock external dependencies for unit tests

```dart
// Example: Widget test
testWidgets('PrimaryButton shows loading indicator when isLoading is true',
    (WidgetTester tester) async {
  // Arrange
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: PrimaryButton(
          label: 'Submit',
          onPressed: () {},
          isLoading: true,
        ),
      ),
    ),
  );

  // Assert
  expect(find.text('Submit'), findsNothing);
  expect(find.byType(CircularProgressIndicator), findsOneWidget);
});
```

---

## 4. UI/UX Implementation

### Design System
- Implement a shared design system using [Material 3](https://m3.material.io/)
- Create a `ThemeData` with custom colors, typography, and shapes
- Extract commonly used widgets into a UI component library
- Support both light and dark themes

```dart
// Example: Theme configuration
final lightTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF6750A4),
    brightness: Brightness.light,
  ),
  // Typography, component themes, etc.
);

final darkTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF6750A4),
    brightness: Brightness.dark,
  ),
  // Typography, component themes, etc.
);
```

### Responsive Design
- Use [flutter_screenutil](https://pub.dev/packages/flutter_screenutil) for responsive sizing
- Implement adaptive layouts with `LayoutBuilder` and `MediaQuery`
- Create reusable responsive layouts (e.g., `ResponsiveBuilder`)
- Test on multiple screen sizes and orientations

```dart
// Example: Responsive layout
class ResponsiveLayout extends StatelessWidget {
  const ResponsiveLayout({
    Key? key,
    required this.mobile,
    required this.tablet,
    required this.desktop,
  }) : super(key: key);

  final Widget mobile;
  final Widget tablet;
  final Widget desktop;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 600) {
          return mobile;
        } else if (constraints.maxWidth < 1200) {
          return tablet;
        } else {
          return desktop;
        }
      },
    );
  }
}
```

### Accessibility
- Add semantic labels to all interactive elements
- Support dynamic text sizing
- Ensure sufficient color contrast
- Test with screen readers (TalkBack/VoiceOver)
- Implement proper focus traversal

```dart
// Example: Accessible widget
IconButton(
  onPressed: () => _toggleFavorite(),
  icon: Icon(_isFavorite ? Icons.favorite : Icons.favorite_border),
  tooltip: _isFavorite ? 'Remove from favorites' : 'Add to favorites',
  semanticLabel: _isFavorite ? 'Remove from favorites' : 'Add to favorites',
);
```

---

## 5. Data Management

### API Integration
- Use repository pattern to abstract data sources
- Implement error handling and retry logic
- Use DTOs for serialization/deserialization
- Cache API responses appropriately

```dart
// Example: Repository implementation
class UserRepositoryImpl implements UserRepository {
  final ApiClient _apiClient;
  final LocalStorage _localStorage;

  UserRepositoryImpl(this._apiClient, this._localStorage);

  @override
  Future<Result<UserProfile>> getUserProfile() async {
    try {
      // Check cache first
      final cachedData = await _localStorage.get('user_profile');
      if (cachedData != null) {
        return Success(UserProfileDto.fromJson(cachedData).toDomain());
      }
      
      // Fetch from API
      final response = await _apiClient.get('/user/profile');
      final userDto = UserProfileDto.fromJson(response.data);
      
      // Cache the response
      await _localStorage.set('user_profile', response.data);
      
      return Success(userDto.toDomain());
    } on DioException catch (e) {
      return Error(NetworkError.fromDioException(e));
    } catch (e) {
      return Error(UnexpectedError(e.toString()));
    }
  }
}
```

### Offline Support
- Implement offline-first architecture where appropriate
- Use [connectivity_plus](https://pub.dev/packages/connectivity_plus) to detect network status
- Cache essential data for offline access
- Queue write operations for sync when connection is restored

```dart
// Example: Offline-first data fetching
Future<List<Item>> getItems() async {
  // Try to get cached items first
  final cachedItems = await _localDataSource.getItems();
  
  // If we have a connection, try to get fresh data
  final hasConnection = await _connectivityService.hasConnection();
  if (hasConnection) {
    try {
      final freshItems = await _remoteDataSource.getItems();
      await _localDataSource.saveItems(freshItems);
      return freshItems;
    } catch (e) {
      // On error, fall back to cached data
      return cachedItems;
    }
  }
  
  // No connection, return cached data
  return cachedItems;
}
```

### Local Storage Strategy
- **User preferences**: SharedPreferences
- **Complex objects**: Hive
- **Relational data**: Drift (SQLite)
- **Sensitive data**: flutter_secure_storage
- **Large blobs**: File system with path_provider

---

## 6. Performance Optimization

### Key Practices
- Use `const` constructors wherever possible
- Implement pagination for long lists with `ListView.builder`
- Lazy load images and heavy components
- Avoid rebuilding widgets unnecessarily
- Profile app regularly with DevTools

```dart
// Example: Optimized list
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    // Only builds items that are visible
    return ItemTile(
      key: ValueKey(items[index].id),
      item: items[index],
    );
  },
);
```

### Memory Management
- Dispose controllers and listeners properly
- Use weak references for callbacks
- Limit image cache size
- Avoid memory leaks in animations

```dart
// Example: Proper disposal
class MyWidget extends StatefulWidget {
  const MyWidget({Key? key}) : super(key: key);

  @override
  State<MyWidget> createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  late final TextEditingController _controller;
  StreamSubscription? _subscription;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
    _subscription = stream.listen(_handleUpdate);
  }

  @override
  void dispose() {
    _controller.dispose();
    _subscription?.cancel();
    super.dispose();
  }
  
  // Widget implementation...
}
```

### Build Optimization
- Enable minification and obfuscation for release builds
- Use `--split-debug-info` for smaller APK/IPA size
- Configure proper build flavors for dev/staging/prod
- Remove debug prints in release builds

---

## 7. Testing Strategy

### Test Structure
```
test/
  ├── unit/
  │   ├── features/
  │   │   ├── authentication/
  │   │   │   ├── data/
  │   │   │   ├── domain/
  │   │   │   └── presentation/
  │   │   └── ...
  │   └── core/
  ├── widget/
  │   └── features/
  └── integration/
      └── flows/
```

### Tools & Libraries
- **Unit Testing**: [test](https://pub.dev/packages/test)
- **Mocking**: [mocktail](https://pub.dev/packages/mocktail)
- **Widget Testing**: [flutter_test](https://api.flutter.dev/flutter/flutter_test/flutter_test-library.html)
- **Visual Testing**: [golden_toolkit](https://pub.dev/packages/golden_toolkit)
- **Integration Testing**: [integration_test](https://docs.flutter.dev/testing/integration-tests)

### Contract Testing
- Define API contracts in shared models
- Test serialization/deserialization
- Validate against API documentation (OpenAPI/Swagger)

```dart
// Example: Model test
test('UserDto should correctly serialize and deserialize', () {
  // Arrange
  final user = UserDto(
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
  );
  
  // Act
  final json = user.toJson();
  final fromJson = UserDto.fromJson(json);
  
  // Assert
  expect(fromJson, equals(user));
});
```

### Widget Testing
- Test widget rendering and interactions
- Use `WidgetTester` for simulating user actions
- Create shared test fixtures and helpers

```dart
// Example: Widget interaction test
testWidgets('Counter increments when button is tapped', (tester) async {
  // Arrange - Build the widget
  await tester.pumpWidget(const MyApp());

  // Assert - Verify initial state
  expect(find.text('0'), findsOneWidget);
  expect(find.text('1'), findsNothing);

  // Act - Tap the '+' button
  await tester.tap(find.byIcon(Icons.add));
  await tester.pump();

  // Assert - Verify updated state
  expect(find.text('0'), findsNothing);
  expect(find.text('1'), findsOneWidget);
});
```

---

## 8. Error & Exception Management

### Core Principles
- Use typed exceptions for domain-specific errors
- Implement centralized error handling
- Present user-friendly error messages
- Log errors appropriately for debugging
- Handle network and IO errors gracefully

### Key Areas (Detailed in Breakout Document)
- **Exception Hierarchy**: Structured error types and inheritance
- **Error Propagation Patterns**: Result pattern, repository error handling
- **User-Facing Error UI**: Standardized error presentation components
- **Recovery Strategies**: Retry mechanisms, fallback strategies, circuit breakers
- **Logging & Monitoring**: Structured error logging, analytics integration

### Basic Pattern Example
```dart
// Simple Result pattern - see breakout document for complete implementation
class Result<T> {
  final T? data;
  final AppError? error;
  
  const Result.success(this.data) : error = null;
  const Result.failure(this.error) : data = null;
  
  bool get isSuccess => error == null;
  bool get isFailure => error != null;
}

// Basic usage pattern
Future<Result<UserProfile>> getUserProfile() async {
  try {
    // API call
    return Result.success(userProfile);
  } catch (e) {
    // Error mapping
    return Result.failure(AppError(e.toString()));
  }
}
```

> **Reference**: For comprehensive error handling implementation details, exception hierarchies, UI components, and advanced recovery techniques, refer to the "Flutter Error Handling & Exception Management Guide" in the project documentation.

---

## 9. Security Best Practices

### IDE Setup
- **Primary IDE**: VS Code or Android Studio
- **Essential Extensions**:
  - Flutter
  - Dart
  - Better Comments
  - Error Lens
  - GitLens
  - bloc
  - Flutter Intl

### Debugging Tools
- [DevTools](https://docs.flutter.dev/development/tools/devtools/overview) for performance profiling
- [Sentry](https://pub.dev/packages/sentry_flutter) for error tracking
- [Logger](https://pub.dev/packages/logger) for structured logging

```dart
// Example: Structured logger setup
final logger = Logger(
  printer: PrettyPrinter(
    methodCount: 2,
    errorMethodCount: 8,
    lineLength: 120,
    colors: true,
    printEmojis: true,
    printTime: true,
  ),
);

// Usage
logger.d('Debug message');
logger.i('Info message');
logger.w('Warning message');
logger.e('Error message', error, stackTrace);
```

### Code Generation
- Use [build_runner](https://pub.dev/packages/build_runner) for code generation
- Generate models with [freezed](https://pub.dev/packages/freezed) or [json_serializable](https://pub.dev/packages/json_serializable)
- Generate API clients with [retrofit](https://pub.dev/packages/retrofit)

---

## 10. Development Environment

### Data Protection
- Store sensitive data in [flutter_secure_storage](https://pub.dev/packages/flutter_secure_storage)
- Implement certificate pinning for API requests
- Encrypt local database with a secure key
- Clear sensitive data from memory when not needed

### Authentication
- Implement secure token storage and refresh
- Add session timeout for sensitive applications
- Support biometric authentication where appropriate
- Validate all inputs on client and server side

```dart
// Example: Secure storage
final secureStorage = FlutterSecureStorage();

// Store sensitive data
await secureStorage.write(key: 'auth_token', value: token);

// Retrieve data
final token = await secureStorage.read(key: 'auth_token');

// Delete when no longer needed
await secureStorage.delete(key: 'auth_token');
```

### Obfuscation
- Enable code obfuscation in release builds
- Hide API keys and secrets from source code
- Use environment variables for sensitive configuration
- Regular security audits and dependency checks

---

## Conclusion

Following these Flutter development standards will ensure consistency, quality, and maintainability across all projects. These guidelines should be reviewed and updated regularly as the Flutter ecosystem evolves.

### Further Resources
- [Flutter Official Documentation](https://docs.flutter.dev/)
- [Dart Style Guide](https://dart.dev/guides/language/effective-dart/style)
- [Flutter Architecture Samples](https://fluttersamples.com/)
- [Flutter Community Packages](https://fluttercommunity.dev/)
