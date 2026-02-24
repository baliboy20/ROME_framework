# Flutter DDD Architecture

**ID**: flutter-ddd-architecture
**Category**: Architecture

## Purpose

Apply Domain-Driven Design (DDD) architecture patterns to Flutter applications with proper layer separation and BLoC state management.

## Inputs

- Business logic requirements / use cases
- Domain entities and data models
- Backend API contracts
- Architecture pattern selection

## Outputs

- Feature-based folder structure
- Domain layer entities and value objects
- Data layer repositories and data sources
- Presentation layer BLoCs and UI
- Clear separation of concerns

## Architecture Layers

### 1. Domain Layer (Business Logic)
```
lib/features/{feature}/domain/
├── entities/           # Core business objects
│   └── user_entity.dart
├── repositories/       # Abstract interfaces
│   └── i_user_repository.dart
└── usecases/          # Business operations
    └── get_user_profile.dart
```

**Entities:**
- Pure Dart classes (no Flutter dependencies)
- Immutable with `freezed` or manual immutability
- Represent core business concepts

**Repositories (Interfaces):**
- Abstract contracts for data access
- Return `Result<T>` or `Either<Failure, T>`
- No implementation details

**Use Cases:**
- Single responsibility per use case
- Orchestrate repository calls
- Return domain entities or failures

### 2. Data Layer (Infrastructure)
```
lib/features/{feature}/data/
├── models/            # DTOs with JSON serialization
│   └── user_model.dart
├── datasources/       # API/Database access
│   ├── remote/
│   │   └── user_remote_datasource.dart
│   └── local/
│       └── user_local_datasource.dart
└── repositories/      # Repository implementations
    └── user_repository.dart
```

**Models:**
- Extend domain entities
- JSON serialization with `json_serializable`
- `fromJson()` and `toJson()` methods

**Data Sources:**
- Remote: HTTP/Parse SDK calls
- Local: Hive/SharedPreferences
- Handle network/storage errors

**Repository Implementations:**
- Implement domain repository interfaces
- Coordinate remote/local data sources
- Map models to entities
- Transform exceptions to failures

### 3. Presentation Layer (UI)
```
lib/features/{feature}/presentation/
├── bloc/              # State management
│   ├── user_bloc.dart
│   ├── user_event.dart
│   └── user_state.dart
├── pages/             # Full screens
│   └── user_profile_page.dart
└── widgets/           # Reusable components
    └── user_avatar.dart
```

**BLoC (Business Logic Component):**
- Receives events from UI
- Calls use cases
- Emits states
- No direct repository access

**Pages:**
- Top-level screens
- BlocProvider setup
- BlocListener/BlocBuilder usage
- Route definitions

**Widgets:**
- Reusable UI components
- Stateless when possible
- Accept data via parameters

## BLoC Event Naming Convention

**Pattern:** `[Verb][Noun][Optional Context]Event`

```dart
// Good
class LoadUserProfileEvent extends UserEvent {}
class UpdateUserEmailEvent extends UserEvent {
  final String email;
}
class DeleteUserAccountEvent extends UserEvent {}

// Bad
class UserEvent {} // Too generic
class GetDataEvent {} // Unclear what data
class ClickedButtonEvent {} // UI action, not business event
```

**Common Verbs:**
- Load/Fetch - Retrieve data
- Create/Add - New entities
- Update/Edit - Modify existing
- Delete/Remove - Remove entities
- Submit/Send - Send data
- Validate/Check - Validation

## Result Type Pattern

**Use sealed classes instead of dartz `Either`:**

```dart
sealed class Result<T> {
  const Result();
}

class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}

class Failure<T> extends Result<T> {
  final String message;
  final Exception? exception;
  const Failure(this.message, [this.exception]);
}
```

**Usage in Repository:**
```dart
abstract class IUserRepository {
  Future<Result<UserEntity>> getUserProfile(String userId);
  Future<Result<void>> updateEmail(String email);
}
```

**Usage in BLoC:**
```dart
class UserBloc extends Bloc<UserEvent, UserState> {
  Future<void> _onLoadUserProfile(
    LoadUserProfileEvent event,
    Emitter<UserState> emit,
  ) async {
    emit(UserState.loading());

    final result = await _getUserProfileUseCase(event.userId);

    switch (result) {
      case Success(value: final user):
        emit(UserState.loaded(user));
      case Failure(message: final error):
        emit(UserState.error(error));
    }
  }
}
```

## Complete Feature Example

```
lib/features/authentication/
├── domain/
│   ├── entities/
│   │   └── user_entity.dart
│   ├── repositories/
│   │   └── i_auth_repository.dart
│   └── usecases/
│       ├── login_usecase.dart
│       └── logout_usecase.dart
├── data/
│   ├── models/
│   │   └── user_model.dart
│   ├── datasources/
│   │   └── remote/
│   │       └── auth_remote_datasource.dart
│   └── repositories/
│       └── auth_repository.dart
└── presentation/
    ├── bloc/
    │   ├── auth_bloc.dart
    │   ├── auth_event.dart
    │   └── auth_state.dart
    ├── pages/
    │   └── login_page.dart
    └── widgets/
        └── login_form.dart
```

## Anti-Patterns to Avoid

**Business logic in widgets:**
```dart
// BAD
class UserProfilePage extends StatefulWidget {
  Future<void> _loadUser() async {
    final response = await http.get(url); // Direct API call
    setState(() => user = response.data);
  }
}
```

**Business logic in BLoC/UseCase:**
```dart
// GOOD
class UserProfilePage extends StatelessWidget {
  Widget build(BuildContext context) {
    context.read<UserBloc>().add(LoadUserProfileEvent());
    return BlocBuilder<UserBloc, UserState>(
      builder: (context, state) => state.when(
        loaded: (user) => UserProfile(user: user),
        error: (error) => ErrorWidget(error),
        loading: () => LoadingWidget(),
      ),
    );
  }
}
```

**Flutter dependencies in domain layer:**
```dart
// BAD - domain/entities/user_entity.dart
import 'package:flutter/material.dart'; // Flutter import in domain

class UserEntity {
  final Color favoriteColor; // Flutter type in domain
}
```

**Pure Dart in domain layer:**
```dart
// GOOD - domain/entities/user_entity.dart
class UserEntity {
  final String favoriteColorHex; // Pure Dart type
}
```

## Process

1. **Design Domain Layer**
   - Define entities from data models
   - Create repository interfaces
   - Design use cases from requirements

2. **Implement Data Layer**
   - Create models with JSON serialization
   - Implement data sources (remote/local)
   - Implement repository interfaces

3. **Build Presentation Layer**
   - Design BLoC events (use naming convention)
   - Design BLoC states (use sealed classes)
   - Create BLoC with use case calls
   - Build UI pages and widgets

4. **Wire Dependencies**
   - Set up dependency injection (get_it)
   - Register repositories, data sources, use cases, BLoCs
   - Provide BLoCs to pages

5. **Test Each Layer**
   - Unit test use cases
   - Unit test repositories
   - Unit test BLoCs
   - Widget test UI

## Summary

**Domain Layer:** Pure business logic (entities, repositories, use cases)
**Data Layer:** Infrastructure (models, data sources, repository implementations)
**Presentation Layer:** UI + State Management (BLoCs, pages, widgets)
**Result Pattern:** Sealed classes for error handling
**BLoC Events:** `[Verb][Noun]Event` naming convention
