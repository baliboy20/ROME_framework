# Flutter UI/UX Patterns

**ID**: flutter-ui-ux-patterns
**Category**: User Experience

## Purpose

Implement cross-platform UI/UX patterns with platform-aware components, theming, and responsive design.

## Inputs

- Theme, colors, typography specifications
- Component specifications
- Target platforms (iOS, Android, web, desktop)

## Outputs

- Platform theme architecture
- Reusable UI component library
- Responsive layouts
- Platform-adaptive navigation
- Accessibility-compliant widgets

## Platform Theme Architecture

### Unified Theme System
```dart
class AppTheme {
  static ThemeData light(TargetPlatform platform) {
    final baseTheme = ThemeData.light();

    return baseTheme.copyWith(
      colorScheme: AppColors.lightColorScheme,
      textTheme: AppTypography.textTheme,
      platform: platform,
    );
  }
}
```

### Design Tokens
```dart
class AppColors {
  // Brand colors
  static const primary = Color(0xFF6200EE);
  static const secondary = Color(0xFF03DAC6);

  // Semantic colors
  static const success = Color(0xFF4CAF50);
  static const error = Color(0xFFF44336);
  static const warning = Color(0xFFFF9800);

  // Status colors
  static Color forStatus(String status) => switch (status) {
    'pending' => warning,
    'approved' => success,
    'rejected' => error,
    _ => Colors.grey,
  };
}

class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
}
```

## Reusable Component Patterns

### App Bar
```dart
class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;

  const AppHeader({required this.title, this.actions});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      actions: actions,
      elevation: 0,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
```

### Loading/Error/Empty States
```dart
class AsyncContentBuilder<T> extends StatelessWidget {
  final AsyncSnapshot<T> snapshot;
  final Widget Function(T data) builder;
  final VoidCallback? onRetry;

  const AsyncContentBuilder({
    required this.snapshot,
    required this.builder,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    if (snapshot.hasError) {
      return ErrorView(
        message: snapshot.error.toString(),
        onRetry: onRetry,
      );
    }
    if (!snapshot.hasData) {
      return const Center(child: CircularProgressIndicator());
    }
    return builder(snapshot.data as T);
  }
}
```
