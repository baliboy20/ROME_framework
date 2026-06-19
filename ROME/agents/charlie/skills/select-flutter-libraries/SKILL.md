# Select Flutter Libraries

**ID**: select-flutter-libraries
**Category**: Frontend & UI / Technology Selection
**Phase**: P5 (Generation) or P3 (Design)
**Robot**: Charlie (with PMA consultation in P3)

## Purpose

Select appropriate Flutter packages and libraries based on project requirements and best practices

## Inputs

- tech-stack.md (Flutter version, platform targets)
- use-cases.md (feature requirements)
- api-design.md (backend integration needs)
- design-system.md (UI requirements)

## Outputs

- pubspec.yaml (dependency declarations)
- Library selection rationale document
- Integration instructions for each library

## Recommended Flutter Libraries by Category

### State Management

**Provider** (Most apps - recommended default)
```yaml
dependencies:
  provider: ^6.1.1
```
- ✅ Official Flutter recommendation
- ✅ Simple, minimal boilerplate
- ✅ Good for small to medium apps
- ❌ Can get complex for very large apps

**Riverpod** (Modern alternative to Provider)
```yaml
dependencies:
  flutter_riverpod: ^2.4.9
```
- ✅ Compile-time safety
- ✅ Better testing support
- ✅ No BuildContext required
- ❌ Steeper learning curve

**BLoC** (Enterprise/large apps)
```yaml
dependencies:
  flutter_bloc: ^8.1.3
```
- ✅ Predictable state changes
- ✅ Great for complex business logic
- ✅ Excellent testing support
- ❌ More boilerplate

**GetX** (Rapid development)
```yaml
dependencies:
  get: ^4.6.6
```
- ✅ All-in-one solution
- ✅ Minimal boilerplate
- ❌ Magic/implicit behavior
- ❌ Not recommended for large teams

### HTTP & API Integration

**Dio** (Recommended for most apps)
```yaml
dependencies:
  dio: ^5.4.0
```
- ✅ Interceptors for auth/logging
- ✅ Request cancellation
- ✅ File upload/download
- ✅ Better error handling than http

**http** (Simple REST calls)
```yaml
dependencies:
  http: ^1.1.2
```
- ✅ Official package
- ✅ Simple API
- ❌ Limited features

**Retrofit** (Type-safe API client)
```yaml
dependencies:
  retrofit: ^4.0.3
  retrofit_generator: ^8.0.4
dev_dependencies:
  build_runner: ^2.4.7
```
- ✅ Type-safe API definitions
- ✅ Code generation
- ✅ Works with Dio

### Local Storage

**Shared Preferences** (Simple key-value)
```yaml
dependencies:
  shared_preferences: ^2.2.2
```
- ✅ Simple settings/preferences
- ✅ Official package
- ❌ Not for complex data

**Hive** (Fast NoSQL database)
```yaml
dependencies:
  hive: ^2.2.3
  hive_flutter: ^1.1.0
dev_dependencies:
  hive_generator: ^2.0.1
```
- ✅ Very fast
- ✅ No native dependencies
- ✅ Type-safe with code generation
- ✅ Good for offline-first apps

**sqflite** (SQL database)
```yaml
dependencies:
  sqflite: ^2.3.0
```
- ✅ SQL queries
- ✅ Complex relationships
- ❌ More boilerplate

**isar** (Modern alternative to Hive)
```yaml
dependencies:
  isar: ^3.1.0
  isar_flutter_libs: ^3.1.0
dev_dependencies:
  isar_generator: ^3.1.0
```
- ✅ Extremely fast
- ✅ Better queries than Hive
- ✅ Multi-isolate support

### Navigation & Routing

**go_router** (Recommended)
```yaml
dependencies:
  go_router: ^13.0.0
```
- ✅ Declarative routing
- ✅ Deep linking support
- ✅ URL-based navigation
- ✅ Official Flutter package

**auto_route** (Code generation)
```yaml
dependencies:
  auto_route: ^7.8.4
dev_dependencies:
  auto_route_generator: ^7.3.2
```
- ✅ Type-safe routing
- ✅ Guards and middleware
- ❌ Requires code generation

### Form Validation

**flutter_form_builder** (Complex forms)
```yaml
dependencies:
  flutter_form_builder: ^9.1.1
  form_builder_validators: ^9.1.0
```
- ✅ Reusable form fields
- ✅ Built-in validators
- ✅ Less boilerplate

**reactive_forms** (Reactive approach)
```yaml
dependencies:
  reactive_forms: ^16.1.1
```
- ✅ Reactive programming
- ✅ Clean separation of logic
- ✅ Great validation support

### Image Handling

**cached_network_image** (Network images)
```yaml
dependencies:
  cached_network_image: ^3.3.1
```
- ✅ Automatic caching
- ✅ Placeholder support
- ✅ Error handling

**image_picker** (Camera/gallery)
```yaml
dependencies:
  image_picker: ^1.0.5
```
- ✅ Official package
- ✅ Cross-platform

### UI Components

**flutter_svg** (SVG support)
```yaml
dependencies:
  flutter_svg: ^2.0.9
```

**shimmer** (Loading placeholders)
```yaml
dependencies:
  shimmer: ^3.0.0
```

**flutter_staggered_grid_view** (Advanced grids)
```yaml
dependencies:
  flutter_staggered_grid_view: ^0.7.0
```

**animations** (Pre-built animations)
```yaml
dependencies:
  animations: ^2.0.11
```

### Date & Time

**intl** (Internationalization & formatting)
```yaml
dependencies:
  intl: ^0.18.1
```

**timeago** (Relative time)
```yaml
dependencies:
  timeago: ^3.6.0
```

### Dependency Injection

**get_it** (Service locator)
```yaml
dependencies:
  get_it: ^7.6.4
```
- ✅ Simple DI
- ✅ No code generation
- ✅ Great with Provider/BLoC

**injectable** (Code generation DI)
```yaml
dependencies:
  injectable: ^2.3.2
  get_it: ^7.6.4
dev_dependencies:
  injectable_generator: ^2.4.1
```
- ✅ Type-safe DI
- ✅ Less manual registration

### Testing

**mocktail** (Mocking)
```yaml
dev_dependencies:
  mocktail: ^1.0.1
```

**integration_test** (E2E testing)
```yaml
dev_dependencies:
  integration_test:
    sdk: flutter
```

### Utility

**equatable** (Value equality)
```yaml
dependencies:
  equatable: ^2.0.5
```

**freezed** (Immutable models + unions)
```yaml
dependencies:
  freezed_annotation: ^2.4.1
dev_dependencies:
  freezed: ^2.4.6
  build_runner: ^2.4.7
```

**json_serializable** (JSON parsing)
```yaml
dependencies:
  json_annotation: ^4.8.1
dev_dependencies:
  json_serializable: ^6.7.1
  build_runner: ^2.4.7
```

## Selection Decision Tree

### State Management Choice

```
Is this a small app (<10 screens)?
  ├─ YES → Provider
  └─ NO → Is complex business logic required?
           ├─ YES → BLoC
           └─ NO → Riverpod
```

### Data Persistence Choice

```
What type of data?
  ├─ Simple key-value → shared_preferences
  ├─ Complex objects, offline-first → Hive or Isar
  └─ Relational data with complex queries → sqflite
```

### HTTP Client Choice

```
Do you need interceptors, file upload, or advanced features?
  ├─ YES → Dio (+ Retrofit for type safety)
  └─ NO → http package
```

## Example pubspec.yaml

**Small-Medium App (Provider + Dio + Hive)**
```yaml
name: my_app
description: A Flutter application
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  provider: ^6.1.1

  # HTTP & API
  dio: ^5.4.0

  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0

  # Navigation
  go_router: ^13.0.0

  # UI
  cached_network_image: ^3.3.1
  flutter_svg: ^2.0.9
  shimmer: ^3.0.0

  # Utilities
  equatable: ^2.0.5
  intl: ^0.18.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  hive_generator: ^2.0.1
  build_runner: ^2.4.7
  mocktail: ^1.0.1
```

**Enterprise App (BLoC + Dio + Retrofit + Isar)**
```yaml
dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_bloc: ^8.1.3

  # HTTP & API
  dio: ^5.4.0
  retrofit: ^4.0.3

  # Local Storage
  isar: ^3.1.0
  isar_flutter_libs: ^3.1.0

  # DI
  get_it: ^7.6.4
  injectable: ^2.3.2

  # Navigation
  auto_route: ^7.8.4

  # Utilities
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  isar_generator: ^3.1.0
  retrofit_generator: ^8.0.4
  auto_route_generator: ^7.3.2
  injectable_generator: ^2.4.1
  freezed: ^2.4.6
  json_serializable: ^6.7.1
  build_runner: ^2.4.7
  bloc_test: ^9.1.5
```

## Process

1. **Analyze requirements** from use-cases.md and tech-stack.md
2. **Choose state management** based on app complexity
3. **Select HTTP client** based on API requirements
4. **Choose persistence** based on data type and offline needs
5. **Select navigation** approach (declarative vs imperative)
6. **Add UI libraries** based on design requirements
7. **Add utilities** (DI, models, testing)
8. **Document choices** in tech-stack.md or library-selection.md
9. **Update pubspec.yaml** with selected packages
10. **Run flutter pub get** to install dependencies

## AORDL Traceability

- State management choice → App complexity requirements
- HTTP client → API integration requirements
- Local storage → Offline-first requirements
- Navigation → Deep linking requirements
- UI libraries → Design system requirements

## References

- [pub.dev](https://pub.dev/) - Official Dart/Flutter package repository
- [Flutter Favorites](https://pub.dev/packages?q=is%3Aflutter-favorite) - Curated quality packages
- [Awesome Flutter](https://github.com/Solido/awesome-flutter) - Community-curated list
