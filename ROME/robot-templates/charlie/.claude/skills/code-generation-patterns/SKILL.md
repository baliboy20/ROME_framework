---
name: code-generation-patterns
description: Flutter/Dart code generation patterns for ROME P5. Use when implementing screens, widgets, BLoC state management, API integration, and tests. Ensures feature-based organization, AORDL traceability, and quality standards.
allowed-tools: [Bash, Read, Write, Glob]
---

# Code Generation Patterns Skill

## Purpose

Charlie's primary responsibility: implement user-facing application based on use cases, design system, and API specifications from upstream robots.

## When to Use

Invoke this skill when:
- **Starting a new feature**: Set up feature folder structure
- **Implementing screens**: Build UI from use cases and wireframes
- **Implementing state management**: Create BLoCs, Cubits, or providers
- **Integrating APIs**: Connect to Reena's backend endpoints
- **Writing tests**: Create widget tests and integration tests
- **Creating reusable components**: Build design system components

## Quick Reference

### Feature-Based Organization (ROME-PROP-016)

```
lib/features/[feature_name]/
├── TRACEABILITY.md          # ✓ REQUIRED
├── models/
│   └── [entity].dart
├── services/
│   └── [feature]_service.dart
├── repositories/
│   └── [feature]_repository.dart
├── bloc/
│   ├── [feature]_bloc.dart
│   ├── [feature]_event.dart
│   └── [feature]_state.dart
├── widgets/
│   └── [widget].dart
└── tests/
    └── [test].dart
```

---

## Automated Code Generation Utilities

**Location**: `/ROME/skills/tier-1/`

### Utility 1: generate-bloc-classes.js - BLoC Generator

**Purpose**: Generates complete BLoC implementations with flutter_bloc package

**Usage**:
```bash
# Generate BLoC for a feature
node ROME/skills/tier-1/generate-bloc-classes.js \
  --design-directory ARTIFACTS/dev/design \
  --output-directory lib/features/project_management/bloc \
  --entities '[{"name":"Project","attributes":["name","description","budget"]}]'
```

**What it generates**:
```dart
// lib/features/project_management/bloc/project_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/repositories/project_repository.dart';
import 'project_event.dart';
import 'project_state.dart';

/// BLoC: ProjectBloc
/// Manages Project business logic and state
class ProjectBloc extends Bloc<ProjectEvent, ProjectState> {
  final ProjectRepository _repository;

  ProjectBloc(this._repository) : super(const ProjectInitialState()) {
    on<LoadProjectsEvent>(_onLoadProjects);
    on<LoadProjectByIdEvent>(_onLoadProjectById);
    on<CreateProjectEvent>(_onCreateProject);
    on<UpdateProjectEvent>(_onUpdateProject);
    on<DeleteProjectEvent>(_onDeleteProject);
    on<SearchProjectsEvent>(_onSearchProjects);
  }

  Future<void> _onLoadProjects(
    LoadProjectsEvent event,
    Emitter<ProjectState> emit,
  ) async {
    emit(const ProjectLoadingState());
    try {
      final projects = await _repository.findAll();
      emit(ProjectLoadedState(projects: projects));
    } catch (e) {
      emit(ProjectErrorState(message: e.toString()));
    }
  }

  // ... more handlers
}
```

---

### Utility 2: generate-bloc-events.js - BLoC Event Generator

**Purpose**: Generates BLoC event classes for CRUD operations

**Usage**:
```bash
node ROME/skills/tier-1/generate-bloc-events.js \
  --output-directory lib/features/project_management/bloc \
  --entities '[{"name":"Project"}]'
```

**What it generates**:
```dart
// lib/features/project_management/bloc/project_event.dart
import 'package:equatable/equatable.dart';
import '../models/project.dart';

/// Base event for ProjectBloc
abstract class ProjectEvent extends Equatable {
  const ProjectEvent();

  @override
  List<Object?> get props => [];
}

/// Load all projects
class LoadProjectsEvent extends ProjectEvent {
  const LoadProjectsEvent();
}

/// Load project by ID
class LoadProjectByIdEvent extends ProjectEvent {
  final String id;

  const LoadProjectByIdEvent({required this.id});

  @override
  List<Object?> get props => [id];
}

/// Create new project
class CreateProjectEvent extends ProjectEvent {
  final Project project;

  const CreateProjectEvent({required this.project});

  @override
  List<Object?> get props => [project];
}

// ... more events
```

---

### Utility 3: generate-bloc-states.js - BLoC State Generator

**Purpose**: Generates BLoC state classes (Initial, Loading, Success, Error)

**Usage**:
```bash
node ROME/skills/tier-1/generate-bloc-states.js \
  --output-directory lib/features/project_management/bloc \
  --entities '[{"name":"Project"}]'
```

**What it generates**:
```dart
// lib/features/project_management/bloc/project_state.dart
import 'package:equatable/equatable.dart';
import '../models/project.dart';

/// Base state for ProjectBloc
abstract class ProjectState extends Equatable {
  const ProjectState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class ProjectInitialState extends ProjectState {
  const ProjectInitialState();
}

/// Loading state
class ProjectLoadingState extends ProjectState {
  const ProjectLoadingState();
}

/// Loaded state with projects
class ProjectLoadedState extends ProjectState {
  final List<Project> projects;

  const ProjectLoadedState({required this.projects});

  @override
  List<Object?> get props => [projects];
}

/// Error state
class ProjectErrorState extends ProjectState {
  final String message;

  const ProjectErrorState({required this.message});

  @override
  List<Object?> get props => [message];
}
```

---

### Utility 4: generate-repository-interfaces.js - Repository Interface Generator

**Purpose**: Generates repository abstract classes with CRUD operations

**Usage**:
```bash
node ROME/skills/tier-1/generate-repository-interfaces.js \
  --output-directory lib/domain/repositories \
  --entities '[{"name":"Project"}]'
```

**What it generates**:
```dart
// lib/domain/repositories/project_repository.dart
import '../models/project.dart';

/// Repository interface for Project entity
abstract class ProjectRepository {
  /// Find all projects
  Future<List<Project>> findAll();

  /// Find project by ID
  Future<Project?> findById(String id);

  /// Create new project
  Future<Project> create(Project project);

  /// Update existing project
  Future<Project> update(String id, Project project);

  /// Delete project
  Future<void> delete(String id);

  /// Search projects
  Future<List<Project>> search(String query);
}
```

---

### Utility 5: generate-ui-screens.js - Screen Generator

**Purpose**: Generates Flutter screen widgets with BlocBuilder integration

**Usage**:
```bash
node ROME/skills/tier-1/generate-ui-screens.js \
  --output-directory lib/features/project_management/widgets \
  --entities '[{"name":"Project","screens":["list","detail","form"]}]'
```

**What it generates**:
```dart
// lib/features/project_management/widgets/project_list_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/project_bloc.dart';
import '../bloc/project_event.dart';
import '../bloc/project_state.dart';

/// Project list screen
/// Implements UC-### (List Projects)
/// Source: REQ-### (view projects)
class ProjectListScreen extends StatelessWidget {
  const ProjectListScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
      ),
      body: BlocBuilder<ProjectBloc, ProjectState>(
        builder: (context, state) {
          if (state is ProjectInitialState) {
            return const Center(child: Text('No projects yet'));
          }

          if (state is ProjectLoadingState) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is ProjectErrorState) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text(state.message, style: TextStyle(color: Colors.red)),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<ProjectBloc>().add(LoadProjectsEvent());
                    },
                    child: Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is ProjectLoadedState) {
            return ListView.builder(
              itemCount: state.projects.length,
              itemBuilder: (context, index) {
                final project = state.projects[index];
                return ListTile(
                  title: Text(project.name),
                  subtitle: Text(project.description),
                  onTap: () {
                    // Navigate to detail screen
                  },
                );
              },
            );
          }

          return const SizedBox.shrink();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to create screen
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

---

### Complete Feature Generation Workflow

**Generate entire feature with one command sequence**:

```bash
#!/bin/bash
FEATURE="project_management"
ENTITY="Project"

# Step 1: Create feature folder structure
echo "Creating feature folder structure..."
mkdir -p lib/features/${FEATURE}/{models,services,repositories,bloc,widgets,tests}

# Step 2: Generate BLoC events
echo "Generating BLoC events..."
node ROME/skills/tier-1/generate-bloc-events.js \
  --output-directory lib/features/${FEATURE}/bloc \
  --entities "[{\"name\":\"${ENTITY}\"}]"

# Step 3: Generate BLoC states
echo "Generating BLoC states..."
node ROME/skills/tier-1/generate-bloc-states.js \
  --output-directory lib/features/${FEATURE}/bloc \
  --entities "[{\"name\":\"${ENTITY}\"}]"

# Step 4: Generate BLoC class
echo "Generating BLoC class..."
node ROME/skills/tier-1/generate-bloc-classes.js \
  --design-directory ARTIFACTS/dev/design \
  --output-directory lib/features/${FEATURE}/bloc \
  --entities "[{\"name\":\"${ENTITY}\",\"attributes\":[\"name\",\"description\",\"budget\"]}]"

# Step 5: Generate repository interface
echo "Generating repository interface..."
node ROME/skills/tier-1/generate-repository-interfaces.js \
  --output-directory lib/features/${FEATURE}/repositories \
  --entities "[{\"name\":\"${ENTITY}\"}]"

# Step 6: Generate UI screens
echo "Generating UI screens..."
node ROME/skills/tier-1/generate-ui-screens.js \
  --output-directory lib/features/${FEATURE}/widgets \
  --entities "[{\"name\":\"${ENTITY}\",\"screens\":[\"list\",\"detail\",\"form\"]}]"

# Step 7: Create TRACEABILITY.md
echo "Creating TRACEABILITY.md..."
cat > lib/features/${FEATURE}/TRACEABILITY.md << 'EOF'
# ${ENTITY} Management

## Requirements Traceability
- **REQ-###**: [intent]
- **Feature**: FUNC-### ([name])
- **Use Cases**: UC-###

## Module Structure
- `bloc/` - State management
- `models/` - Data models
- `repositories/` - Data access
- `widgets/` - UI screens

## Implementation Status
- ✓ BLoC generated
- ✓ Repository interface generated
- ✓ Screens generated
EOF

echo ""
echo "✅ Feature generation complete!"
echo "   Generated files:"
echo "   - bloc/${ENTITY}_bloc.dart"
echo "   - bloc/${ENTITY}_event.dart"
echo "   - bloc/${ENTITY}_state.dart"
echo "   - repositories/${ENTITY}_repository.dart"
echo "   - widgets/${ENTITY}_list_screen.dart"
echo "   - widgets/${ENTITY}_detail_screen.dart"
echo "   - widgets/${ENTITY}_form_screen.dart"
echo "   - TRACEABILITY.md"
```

---

## Manual Code Patterns

**Use these patterns for manual coding and customization**:

## Pattern 1: Feature Setup

### Step 1: Create Feature Folder Structure

```bash
# Extract feature name from FUNC-### in P2 analysis
# Use snake_case for Dart/Flutter

mkdir -p lib/features/[feature_name]/{models,services,repositories,bloc,widgets,tests}
```

### Step 2: Create TRACEABILITY.md

```markdown
# [Feature Name]

## Requirements Traceability

- **REQ-001**: [Actor] wants to [Intent]
- **REQ-002**: [Actor] wants to [Intent]
- **Feature**: FUNC-001 ([Feature name from P2])
- **Use Cases**: UC-001, UC-002

## Module Structure

- `models/[entity].dart` - Data models (REQ-001)
- `services/[feature]_service.dart` - Business logic (REQ-001, REQ-002)
- `repositories/[feature]_repository.dart` - Data access (REQ-001)
- `bloc/[feature]_bloc.dart` - State management (UC-001, UC-002)
- `widgets/[screen]_screen.dart` - Main screen (UC-001)
- `widgets/[component].dart` - Reusable components (UC-002)

## Implementation Status

- ✓ **REQ-001**: Fully implemented
- ⚠ **REQ-002**: Partially implemented
- ✗ **REQ-003**: Not started

## Test Coverage

- REQ-001: 92%
- REQ-002: 85%

## Change History

- Initial implementation: 2025-12-29
```

### Step 3: Log Feature Start

```yaml
timestamp: 2025-12-29T16:00:00Z
robot: Charlie
phase: P5
action: STARTED
artifact: lib/features/[feature_name]/
description: Starting [feature name] implementation (REQ-001 to REQ-003, FUNC-001)
status: IN_PROGRESS
```

---

## Pattern 2: Data Models

### Model Template

```dart
// lib/features/[feature]/models/[entity].dart

/// [Entity] model
/// Implements REQ-### ([intent])
class [Entity] {
  final String id;
  final String [field1];
  final int [field2];
  final DateTime createdAt;

  const [Entity]({
    required this.id,
    required this.[field1],
    required this.[field2],
    required this.createdAt,
  });

  /// From JSON (API response)
  factory [Entity].fromJson(Map<String, dynamic> json) {
    return [Entity](
      id: json['id'] as String,
      [field1]: json['[field1]'] as String,
      [field2]: json['[field2]'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  /// To JSON (API request)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      '[field1]': [field1],
      '[field2]': [field2],
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Copy with (for immutable updates)
  [Entity] copyWith({
    String? id,
    String? [field1],
    int? [field2],
    DateTime? createdAt,
  }) {
    return [Entity](
      id: id ?? this.id,
      [field1]: [field1] ?? this.[field1],
      [field2]: [field2] ?? this.[field2],
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is [Entity] && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
```

### Validation Models

When AORDL Invariants require validation:

```dart
// lib/features/[feature]/models/[entity]_validation.dart

/// Validation rules from REQ-### Invariants
class [Entity]Validator {
  static String? validate[Field](String value) {
    // From AORDL Invariants
    if (value.isEmpty) {
      return '[Field] is required';
    }

    if (value.length < 3) {
      return '[Field] must be at least 3 characters';
    }

    // From AORDL examples
    if (!RegExp(r'^[a-zA-Z0-9]+$').hasMatch(value)) {
      return '[Field] must be alphanumeric';
    }

    return null; // Valid
  }
}
```

---

## Pattern 3: BLoC State Management

### Event Definition

```dart
// lib/features/[feature]/bloc/[feature]_event.dart

/// [Feature] events
/// Maps to REQ-### Intents
abstract class [Feature]Event {}

/// User initiated [action] - REQ-###
class [Action]Requested extends [Feature]Event {
  final String [param];

  [Action]Requested(this.[param]);
}

/// Refresh data - UC-###
class [Feature]DataRefreshed extends [Feature]Event {}
```

### State Definition

```dart
// lib/features/[feature]/bloc/[feature]_state.dart

/// [Feature] state
/// Represents UI state for UC-###
abstract class [Feature]State {}

/// Initial state - UC-### Preconditions not met
class [Feature]Initial extends [Feature]State {}

/// Loading data - In progress
class [Feature]Loading extends [Feature]State {}

/// Data loaded - UC-### Outcomes achieved
class [Feature]Loaded extends [Feature]State {
  final List<[Entity]> items;

  [Feature]Loaded(this.items);
}

/// Error occurred - AORDL Errors handling
class [Feature]Error extends [Feature]State {
  final String message;

  [Feature]Error(this.message);
}
```

### BLoC Implementation

```dart
// lib/features/[feature]/bloc/[feature]_bloc.dart

import 'package:flutter_bloc/flutter_bloc.dart';

/// [Feature] BLoC
/// Implements UC-### business logic
/// Sources: REQ-###, REQ-###
class [Feature]Bloc extends Bloc<[Feature]Event, [Feature]State> {
  final [Feature]Repository _repository;

  [Feature]Bloc(this._repository) : super([Feature]Initial()) {
    on<[Action]Requested>(_on[Action]Requested);
    on<[Feature]DataRefreshed>(_on[Feature]DataRefreshed);
  }

  /// Handle [action] request - REQ-###
  Future<void> _on[Action]Requested(
    [Action]Requested event,
    Emitter<[Feature]State> emit,
  ) async {
    emit([Feature]Loading());

    try {
      // AORDL Preconditions check
      if (![_checkPrecondition]()) {
        throw Exception('Precondition not met');
      }

      // Execute action via repository
      final result = await _repository.[action](event.[param]);

      // AORDL Postconditions achieved
      emit([Feature]Loaded(result));

    } catch (e) {
      // AORDL Errors handling
      emit([Feature]Error(e.toString()));
    }
  }

  /// Refresh data - UC-###
  Future<void> _on[Feature]DataRefreshed(
    [Feature]DataRefreshed event,
    Emitter<[Feature]State> emit,
  ) async {
    emit([Feature]Loading());

    try {
      final items = await _repository.fetchAll();
      emit([Feature]Loaded(items));
    } catch (e) {
      emit([Feature]Error(e.toString()));
    }
  }
}
```

---

## Pattern 4: Repository Layer

### Repository Template

```dart
// lib/features/[feature]/repositories/[feature]_repository.dart

import 'package:http/http.dart' as http;
import 'dart:convert';

/// [Feature] repository
/// Implements data access for REQ-###
class [Feature]Repository {
  final http.Client _client;
  final String _baseUrl;

  [Feature]Repository(this._client, this._baseUrl);

  /// Fetch all items - UC-###
  Future<List<[Entity]>> fetchAll() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/[endpoint]'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => [Entity].fromJson(json)).toList();
    } else {
      throw Exception('Failed to fetch [entities]');
    }
  }

  /// Create item - REQ-### (Intent: create [entity])
  Future<[Entity]> create([Entity] item) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/[endpoint]'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(item.toJson()),
    );

    if (response.statusCode == 201) {
      return [Entity].fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create [entity]');
    }
  }

  /// Update item - REQ-### (Intent: update [entity])
  Future<[Entity]> update(String id, [Entity] item) async {
    final response = await _client.put(
      Uri.parse('$_baseUrl/[endpoint]/$id'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(item.toJson()),
    );

    if (response.statusCode == 200) {
      return [Entity].fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update [entity]');
    }
  }

  /// Delete item - REQ-### (Intent: delete [entity])
  Future<void> delete(String id) async {
    final response = await _client.delete(
      Uri.parse('$_baseUrl/[endpoint]/$id'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode != 204) {
      throw Exception('Failed to delete [entity]');
    }
  }
}
```

---

## Pattern 5: Screen Implementation

### Screen Template

```dart
// lib/features/[feature]/widgets/[screen]_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// [Screen] screen
/// Implements UC-### ([use case name])
/// Source: REQ-### ([intent])
class [Screen]Screen extends StatelessWidget {
  const [Screen]Screen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('[Screen Title]'),
      ),
      body: BlocBuilder<[Feature]Bloc, [Feature]State>(
        builder: (context, state) {
          // AORDL Preconditions check
          if (state is [Feature]Initial) {
            return const _EmptyState();
          }

          // Loading state
          if (state is [Feature]Loading) {
            return const Center(child: CircularProgressIndicator());
          }

          // AORDL Errors handling
          if (state is [Feature]Error) {
            return _ErrorView(message: state.message);
          }

          // AORDL Outcomes achieved
          if (state is [Feature]Loaded) {
            return _ContentView(items: state.items);
          }

          return const SizedBox.shrink();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _handleAction(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  /// Handle user action - REQ-### Intent
  void _handleAction(BuildContext context) {
    context.read<[Feature]Bloc>().add([Action]Requested('[param]'));
  }
}

/// Empty state - AORDL Preconditions not met
class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text('No items yet', style: Theme.of(context).textTheme.headlineSmall),
        ],
      ),
    );
  }
}

/// Error view - AORDL Errors display
class _ErrorView extends StatelessWidget {
  final String message;

  const _ErrorView({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red),
          SizedBox(height: 16),
          Text(message, style: TextStyle(color: Colors.red)),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              context.read<[Feature]Bloc>().add([Feature]DataRefreshed());
            },
            child: Text('Retry'),
          ),
        ],
      ),
    );
  }
}

/// Content view - AORDL Outcomes display
class _ContentView extends StatelessWidget {
  final List<[Entity]> items;

  const _ContentView({required this.items});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return ListTile(
          title: Text(item.[field]),
          subtitle: Text(item.[field2].toString()),
        );
      },
    );
  }
}
```

---

## Pattern 6: Form Screens

### Form with Validation

```dart
// lib/features/[feature]/widgets/[form]_form.dart

import 'package:flutter/material.dart';

/// [Form] form
/// Implements REQ-### ([intent])
/// Validation from AORDL Invariants
class [Form]Form extends StatefulWidget {
  const [Form]Form({Key? key}) : super(key: key);

  @override
  State<[Form]Form> createState() => _[Form]FormState();
}

class _[Form]FormState extends State<[Form]Form> {
  final _formKey = GlobalKey<FormState>();
  final _[field1]Controller = TextEditingController();
  final _[field2]Controller = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _[field1]Controller.dispose();
    _[field2]Controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('[Form Title]')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Field 1 - AORDL Invariants validation
              TextFormField(
                controller: _[field1]Controller,
                decoration: const InputDecoration(
                  labelText: '[Field 1 Label]',
                  hintText: '[Example from AORDL]',
                ),
                validator: [Entity]Validator.validate[Field1],
              ),
              const SizedBox(height: 16),

              // Field 2
              TextFormField(
                controller: _[field2]Controller,
                decoration: const InputDecoration(
                  labelText: '[Field 2 Label]',
                ),
                validator: [Entity]Validator.validate[Field2],
              ),
              const SizedBox(height: 24),

              // Submit button
              ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Submit'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Handle form submission - REQ-### Intent
  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Dispatch BLoC event
      context.read<[Feature]Bloc>().add(
        [Action]Requested(
          [field1]: _[field1]Controller.text,
          [field2]: _[field2]Controller.text,
        ),
      );

      // AORDL Outcomes - navigate to success screen
      Navigator.pop(context);

    } catch (e) {
      // AORDL Errors - show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }
}
```

---

## Pattern 7: Testing

### Widget Test Template

```dart
// lib/features/[feature]/tests/[widget]_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mocktail/mocktail.dart';

// Mocks
class Mock[Feature]Bloc extends Mock implements [Feature]Bloc {}

void main() {
  group('[Widget]', () {
    late [Feature]Bloc mockBloc;

    setUp(() {
      mockBloc = Mock[Feature]Bloc();
    });

    testWidgets('renders initial state', (tester) async {
      // Arrange
      when(() => mockBloc.state).thenReturn([Feature]Initial());

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<[Feature]Bloc>.value(
            value: mockBloc,
            child: const [Screen]Screen(),
          ),
        ),
      );

      // Assert
      expect(find.text('No items yet'), findsOneWidget);
    });

    testWidgets('renders loaded state with items', (tester) async {
      // Arrange
      final items = [
        [Entity](id: '1', [field1]: 'Test', [field2]: 42, createdAt: DateTime.now()),
      ];
      when(() => mockBloc.state).thenReturn([Feature]Loaded(items));

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<[Feature]Bloc>.value(
            value: mockBloc,
            child: const [Screen]Screen(),
          ),
        ),
      );

      // Assert
      expect(find.text('Test'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
    });

    testWidgets('handles user action - REQ-###', (tester) async {
      // Arrange
      when(() => mockBloc.state).thenReturn([Feature]Initial());

      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<[Feature]Bloc>.value(
            value: mockBloc,
            child: const [Screen]Screen(),
          ),
        ),
      );

      // Act
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pump();

      // Assert
      verify(() => mockBloc.add(any(that: isA<[Action]Requested>()))).called(1);
    });
  });
}
```

### BLoC Test Template

```dart
// lib/features/[feature]/tests/[feature]_bloc_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';

// Mocks
class Mock[Feature]Repository extends Mock implements [Feature]Repository {}

void main() {
  group('[Feature]Bloc', () {
    late [Feature]Repository mockRepository;
    late [Feature]Bloc bloc;

    setUp(() {
      mockRepository = Mock[Feature]Repository();
      bloc = [Feature]Bloc(mockRepository);
    });

    tearDown(() {
      bloc.close();
    });

    test('initial state is [Feature]Initial', () {
      expect(bloc.state, isA<[Feature]Initial>());
    });

    blocTest<[Feature]Bloc, [Feature]State>(
      'emits [Loading, Loaded] when [Action]Requested succeeds - REQ-###',
      build: () {
        final items = [
          [Entity](id: '1', [field1]: 'Test', [field2]: 42, createdAt: DateTime.now()),
        ];
        when(() => mockRepository.[action](any())).thenAnswer((_) async => items);
        return bloc;
      },
      act: (bloc) => bloc.add([Action]Requested('[param]')),
      expect: () => [
        isA<[Feature]Loading>(),
        isA<[Feature]Loaded>()
            .having((state) => state.items.length, 'items count', 1)
            .having((state) => state.items.first.[field1], 'first item [field1]', 'Test'),
      ],
      verify: (_) {
        verify(() => mockRepository.[action]('[param]')).called(1);
      },
    );

    blocTest<[Feature]Bloc, [Feature]State>(
      'emits [Loading, Error] when [Action]Requested fails - AORDL Errors',
      build: () {
        when(() => mockRepository.[action](any())).thenThrow(Exception('Network error'));
        return bloc;
      },
      act: (bloc) => bloc.add([Action]Requested('[param]')),
      expect: () => [
        isA<[Feature]Loading>(),
        isA<[Feature]Error>()
            .having((state) => state.message, 'error message', contains('Network error')),
      ],
    );
  });
}
```

---

## Pattern 8: Accessibility

### Semantic Labels

```dart
// Add semantic labels for screen readers
Semantics(
  label: '[Field] input field',
  hint: 'Enter your [field]',
  child: TextFormField(controller: _controller),
)

// Interactive elements
Semantics(
  button: true,
  label: 'Submit form',
  child: ElevatedButton(
    onPressed: _handleSubmit,
    child: const Text('Submit'),
  ),
)

// Images
Semantics(
  image: true,
  label: '[Description of image]',
  child: Image.asset('assets/[image].png'),
)
```

### Minimum Touch Targets

```dart
// Ensure 44x44 minimum size (WCAG)
SizedBox(
  width: 44,
  height: 44,
  child: IconButton(
    icon: const Icon(Icons.close),
    onPressed: () => Navigator.pop(context),
  ),
)
```

### High Contrast Text

```dart
// Use theme colors for high contrast
Text(
  'Important message',
  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
    color: Theme.of(context).colorScheme.onSurface,
  ),
)
```

---

## Quality Checklist

Before marking feature complete:

### ✅ Code Organization
- [ ] Feature folder created under `lib/features/[feature_name]/`
- [ ] TRACEABILITY.md exists and complete
- [ ] All code in correct subfolders (models/, bloc/, widgets/, etc.)
- [ ] No code outside feature folders (no lib/utils/, lib/helpers/, etc.)

### ✅ AORDL Traceability
- [ ] All REQ-### documented in TRACEABILITY.md
- [ ] Code comments reference UC-### and REQ-###
- [ ] AORDL Invariants implemented in validation
- [ ] AORDL Preconditions checked in UI guards
- [ ] AORDL Postconditions reflected in UI updates
- [ ] AORDL Errors handled with user-friendly messages

### ✅ State Management
- [ ] BLoC/Cubit created for feature
- [ ] Events map to AORDL Intents
- [ ] States represent UI states (Initial, Loading, Loaded, Error)
- [ ] Repository handles data access

### ✅ UI Implementation
- [ ] Screens match wireframes/mockups
- [ ] Design system followed (colors, typography, spacing)
- [ ] Form validation matches data-dictionary.yaml
- [ ] Loading states implemented
- [ ] Error states implemented with retry
- [ ] Empty states implemented

### ✅ Accessibility
- [ ] Semantic labels on interactive elements
- [ ] Minimum touch targets 44x44
- [ ] High contrast text
- [ ] Focus management in forms
- [ ] Error announcements for screen readers

### ✅ Testing
- [ ] Widget tests for all screens
- [ ] BLoC tests for all events
- [ ] Repository tests for API integration
- [ ] Test coverage ≥ 80%
- [ ] All tests passing

### ✅ Documentation
- [ ] TRACEABILITY.md updated with implementation status
- [ ] Code comments explain business logic
- [ ] README.md updated with new feature

---

## Related Skills

- `activity-logging` - Log feature progress
- `rome-protocols` - ROME framework compliance
- `flutter-best-practices` - Flutter code quality

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-12-29
**Robot**: Charlie only
**Priority**: CRITICAL
