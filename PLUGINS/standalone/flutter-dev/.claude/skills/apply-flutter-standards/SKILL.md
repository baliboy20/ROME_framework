# Apply Flutter Coding Standards

**ID**: apply-flutter-standards
**Category**: Code Quality

## Purpose

Apply Flutter coding standards, best practices, and architectural patterns to code.

## Inputs

- Flutter source code
- Flutter version and architecture pattern
- Styling approach / design system

## Outputs

- Code formatted according to Flutter style guide
- Proper widget composition patterns
- Clean architecture implementation
- Performance-optimized code
- Accessibility-compliant widgets

## Flutter Standards Applied

### 1. Widget Composition

**Prefer composition over inheritance:**
```dart
// Good - Composition
class UserCard extends StatelessWidget {
  final User user;

  const UserCard({Key? key, required this.user}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          UserAvatar(user: user),
          UserName(user: user),
          UserBio(user: user),
        ],
      ),
    );
  }
}

// Bad - Deep widget tree
class UserCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          CircleAvatar(
            backgroundImage: NetworkImage(user.avatarUrl),
            child: Text(user.initials),
          ),
          Padding(
            padding: EdgeInsets.all(8.0),
            child: Text(
              user.name,
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          // ... deeply nested
        ],
      ),
    );
  }
}
```

### 2. State Management Patterns

**Use appropriate state management:**
```dart
// Provider pattern (recommended for most apps)
class TaskListScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => TaskListViewModel(),
      child: Consumer<TaskListViewModel>(
        builder: (context, viewModel, child) {
          return ListView.builder(
            itemCount: viewModel.tasks.length,
            itemBuilder: (context, index) {
              return TaskCard(task: viewModel.tasks[index]);
            },
          );
        },
      ),
    );
  }
}

// ViewModel separation
class TaskListViewModel extends ChangeNotifier {
  final TaskRepository _repository;
  List<Task> _tasks = [];

  List<Task> get tasks => _tasks;

  Future<void> loadTasks() async {
    _tasks = await _repository.getTasks();
    notifyListeners();
  }

  Future<void> addTask(Task task) async {
    await _repository.createTask(task);
    _tasks.add(task);
    notifyListeners();
  }
}
```

### 3. File & Folder Organization

**Feature-based structure:**
```
lib/
├── core/
│   ├── theme/
│   │   └── app_theme.dart
│   ├── constants/
│   │   └── app_constants.dart
│   └── utils/
│       └── validators.dart
├── features/
│   ├── authentication/
│   │   ├── models/
│   │   │   └── user.dart
│   │   ├── repositories/
│   │   │   └── auth_repository.dart
│   │   ├── viewmodels/
│   │   │   └── login_viewmodel.dart
│   │   ├── widgets/
│   │   │   └── login_form.dart
│   │   └── screens/
│   │       └── login_screen.dart
│   └── tasks/
│       ├── models/
│       ├── repositories/
│       ├── viewmodels/
│       ├── widgets/
│       └── screens/
└── main.dart
```

### 4. Naming Conventions

**Consistent naming:**
```dart
// Classes: PascalCase
class TaskCard extends StatelessWidget {}

// Files: snake_case
// task_card.dart, login_screen.dart, user_repository.dart

// Variables & functions: camelCase
final String userName = 'John';
void submitForm() {}

// Constants: lowerCamelCase with 'k' prefix or UPPER_CASE
const kDefaultPadding = 16.0;
const API_BASE_URL = 'https://api.example.com';

// Private members: underscore prefix
class TaskListViewModel {
  final TaskRepository _repository;
  List<Task> _tasks = [];
}
```

### 5. Performance Optimization

**Const constructors where possible:**
```dart
// Good - const constructor
class AppTitle extends StatelessWidget {
  const AppTitle({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Text('My App');
  }
}

// Use const widgets
const SizedBox(height: 16),
const Divider(),
```

**ListView builders for long lists:**
```dart
// Good - ListView.builder (lazy loading)
ListView.builder(
  itemCount: tasks.length,
  itemBuilder: (context, index) => TaskCard(task: tasks[index]),
)

// Bad - ListView (loads all at once)
ListView(
  children: tasks.map((task) => TaskCard(task: task)).toList(),
)
```

### 6. Accessibility

**Semantic widgets and labels:**
```dart
Semantics(
  label: 'Submit button',
  button: true,
  child: ElevatedButton(
    onPressed: _submitForm,
    child: const Text('Submit'),
  ),
)

// Exclude decorative images
ExcludeSemantics(
  child: Image.asset('assets/decorative.png'),
)
```

### 7. Error Handling

**Proper error boundaries:**
```dart
class TaskListScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Task>>(
      future: taskRepository.getTasks(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return ErrorWidget(error: snapshot.error!);
        }

        if (snapshot.connectionState == ConnectionState.waiting) {
          return const LoadingWidget();
        }

        return TaskList(tasks: snapshot.data!);
      },
    );
  }
}
```

### 8. Code Formatting

**Automatic formatting with dartfmt:**
```bash
# Format all Dart files
flutter format .

# Check formatting without modifying
flutter format --set-exit-if-changed .
```

**analysis_options.yaml:**
```yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - prefer_const_constructors
    - prefer_const_literals_to_create_immutables
    - avoid_print
    - avoid_unnecessary_containers
    - sized_box_for_whitespace
    - use_key_in_widget_constructors
```

## Process

1. **Review generated code** against Flutter style guide
2. **Apply widget composition** patterns (extract reusable widgets)
3. **Implement state management** pattern (Provider, Riverpod, BLoC)
4. **Organize files** in feature-based structure
5. **Apply naming conventions** (PascalCase, camelCase, snake_case)
6. **Add const constructors** where possible
7. **Optimize performance** (ListView.builder, const widgets)
8. **Add accessibility** semantics
9. **Handle errors** properly (FutureBuilder, try-catch)
10. **Run dartfmt** to format code
11. **Run flutter analyze** to check for issues

## References

- [Effective Dart](https://dart.dev/guides/language/effective-dart)
- [Flutter Style Guide](https://github.com/flutter/flutter/wiki/Style-guide-for-Flutter-repo)
- [Flutter Best Practices](https://docs.flutter.dev/perf/best-practices)
