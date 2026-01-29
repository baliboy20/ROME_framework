# Flutter UI/UX Patterns

**ID**: flutter-ui-ux-patterns
**Category**: Frontend & UI / User Experience
**Phase**: P5 (Generation)
**Robot**: Charlie

## Purpose

Implement cross-platform UI/UX patterns with platform-aware components, theming, and responsive design

## Inputs

- design-system.md (theme, colors, typography)
- ui-design.md (component specifications)
- tech-stack.md (target platforms: iOS, Android, web, desktop)

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
      spacing: AppSpacing.values,
      // Platform-specific customizations
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

## Reusable Component Library

See Experts/expert_flutter/04_UI_UX/flutter_ui_component_library.md for complete component patterns.

## Expert References

**Primary Guides** (see Experts/expert_flutter/):
- `04_UI_UX/platform_theme_architecture_guide.md` (26KB)
- `04_UI_UX/flutter_ui_component_library.md` (18KB)
- `04_UI_UX/flutter_ui_ux_platform_guide.md` (35KB)
- `04_UI_UX/cross_platform_ui_core.md` (667 lines)

---

**Version**: 1.0
**Based on**: Experts/expert_flutter/04_UI_UX/
**Last Updated**: 2026-01-29
