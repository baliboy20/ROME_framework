---
name: ui-design-patterns
description: Apply UI/UX design patterns for cross-platform applications. Use when designing user interfaces, creating wireframes, implementing navigation, ensuring platform consistency, or building accessible UIs. References platform-specific guidelines (iOS HIG, Material Design) and cross-platform best practices.
allowed-tools: Read, Grep, Glob
---

# UI Design Patterns Skill

## Purpose

This skill ensures UI designs follow platform guidelines, accessibility standards, and cross-platform best practices from the ROME expert knowledge base.

## When to Use

Invoke this skill when:
- Designing application screens and layouts
- Creating navigation flows and information architecture
- Implementing platform-specific UI patterns
- Ensuring accessibility compliance
- Building responsive/adaptive layouts
- Implementing theming and dark mode
- Creating component libraries

---

## Progressive Loading

### For Cross-Platform UI Design

**When**: Designing UI that works across iOS, Android, Web, Desktop

**Load**: [cross_platform_ui_core.md](../../../Experts/expert_flutter/04_UI_UX/cross_platform_ui_core.md)

**Key Concepts**:
- **Platform Detection**: `Platform.isIOS`, `Platform.isAndroid`, `kIsWeb`
- **Adaptive Widgets**: `CupertinoPageScaffold` vs `Scaffold`
- **Responsive Layouts**: `LayoutBuilder`, `MediaQuery`
- **Breakpoints**: Mobile (<600), Tablet (600-1200), Desktop (>1200)
- **Platform Adaptations**: Navigation, dialogs, pickers

**Design Principles**:
```dart
// Adaptive navigation
Widget buildScaffold() {
  if (Platform.isIOS) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(...),
      child: content,
    );
  }
  return Scaffold(
    appBar: AppBar(...),
    body: content,
  );
}

// Responsive layout
Widget buildLayout(BuildContext context) {
  final width = MediaQuery.of(context).size.width;

  if (width < 600) {
    return MobileLayout();
  } else if (width < 1200) {
    return TabletLayout();
  }
  return DesktopLayout();
}
```

### For Platform Theming

**When**: Implementing themes, dark mode, platform-specific styling

**Load**: [platform_theme_architecture_guide.md](../../../Experts/expert_flutter/04_UI_UX/platform_theme_architecture_guide.md)

**Key Concepts**:
- **Theme System**: `ThemeData`, `CupertinoThemeData`
- **Dark Mode**: Automatic switching based on system preference
- **Platform Themes**: Material for Android, Cupertino for iOS
- **Dynamic Theming**: User-selectable themes
- **Color Systems**: Semantic colors (primary, secondary, error, etc.)

**Implementation Pattern**:
```dart
// Theme configuration
MaterialApp(
  theme: ThemeData.light(),
  darkTheme: ThemeData.dark(),
  themeMode: ThemeMode.system,  // Respect system preference
  // ...
)

// Using theme colors (never hardcode)
Container(
  color: Theme.of(context).primaryColor,  // ✅ Good
  // color: Colors.blue,  // ❌ Bad
)
```

### For Component Library

**When**: Creating reusable UI components, design system

**Load**: [flutter_ui_component_library.md](../../../Experts/expert_flutter/04_UI_UX/flutter_ui_component_library.md)

**Key Concepts**:
- **Atomic Design**: Atoms → Molecules → Organisms → Templates
- **Component Composition**: Small, reusable widgets
- **Const Constructors**: Performance optimization
- **Theming Integration**: Components respect theme
- **Accessibility**: Built-in a11y support

**Component Patterns**:
```dart
// Button atom (reusable)
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    Key? key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
  }) : super(key: key);

  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? const CircularProgressIndicator()
          : Text(text),
    );
  }
}
```

### For Mobile-Specific Patterns

**When**: Building mobile apps (iOS/Android)

**Load**: [mobile_ui_patterns.md](../../../Experts/expert_flutter/06_PLATFORM_SPECIFIC/mobile_ui_patterns.md)

**Key Concepts**:
- **iOS HIG**: Navigation bars, tab bars, action sheets
- **Material Design**: FABs, bottom sheets, snackbars
- **Touch Gestures**: Swipe, pinch, long-press
- **Mobile Navigation**: Tab-based, drawer, bottom nav
- **Pull-to-Refresh**: Native refresh indicators

**Platform-Specific Navigation**:
```dart
// iOS: Tab bar at bottom
CupertinoTabScaffold(
  tabBar: CupertinoTabBar(
    items: [
      BottomNavigationBarItem(icon: Icon(Icons.home)),
      BottomNavigationBarItem(icon: Icon(Icons.settings)),
    ],
  ),
)

// Android: Bottom navigation or drawer
Scaffold(
  bottomNavigationBar: BottomNavigationBar(...),
  drawer: Drawer(...),
)
```

### For Navigation Patterns

**When**: Implementing routing, deep linking, navigation flows

**Load**: [navigation_patterns_guide.md](../../../Experts/expert_flutter/02_PATTERNS/navigation_patterns_guide.md)

**Key Concepts**:
- **Named Routes**: Centralized route definition
- **Generated Routes**: Type-safe navigation
- **Deep Linking**: URL-based navigation
- **Navigation Stack**: Push, pop, replace
- **Passing Data**: Route arguments

**Navigation Patterns**:
```dart
// Named routes
Navigator.pushNamed(context, '/project/details', arguments: projectId);

// Type-safe navigation (preferred)
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => ProjectDetailsScreen(projectId: projectId),
  ),
);
```

---

## Design Validation Checklist

### ✅ Platform Consistency

- [ ] **iOS Compliance**: Follows Human Interface Guidelines
  - [ ] Navigation bar at top
  - [ ] Back button on left (< icon)
  - [ ] Cupertino widgets for system controls
  - [ ] SF Symbols for icons (or equivalents)

- [ ] **Android Compliance**: Follows Material Design
  - [ ] App bar at top
  - [ ] Back button on left (← icon)
  - [ ] Material widgets for system controls
  - [ ] Material icons

- [ ] **Web Compliance**: Follows responsive web design
  - [ ] Works without touch (mouse + keyboard)
  - [ ] Responsive breakpoints implemented
  - [ ] URL-based navigation
  - [ ] Browser back button works

- [ ] **Desktop Compliance**: Follows desktop conventions
  - [ ] Keyboard shortcuts (Ctrl/Cmd+S, etc.)
  - [ ] Menu bar (macOS) or toolbar (Windows)
  - [ ] Resizable windows
  - [ ] Multi-window support (if applicable)

### ✅ Accessibility (a11y)

- [ ] **Screen Readers**: Semantic labels for all interactive elements
  ```dart
  Semantics(
    label: 'Delete project',
    button: true,
    child: IconButton(icon: Icon(Icons.delete)),
  )
  ```

- [ ] **Color Contrast**: Sufficient contrast (WCAG AA: 4.5:1 for text)
  - [ ] Text on background readable
  - [ ] No information conveyed by color alone

- [ ] **Touch Targets**: Minimum 48x48dp (44x44pt on iOS)
  ```dart
  // Ensure minimum touch target size
  GestureDetector(
    onTap: () {},
    child: SizedBox(
      width: 48,
      height: 48,
      child: Icon(Icons.edit),
    ),
  )
  ```

- [ ] **Keyboard Navigation**: All interactive elements accessible via keyboard
  - [ ] Tab order logical
  - [ ] Focus indicators visible
  - [ ] Enter/Space activate buttons

- [ ] **Text Scaling**: UI works with system text scaling (up to 200%)
  ```dart
  // Use MediaQuery for scaled text
  Text(
    'Title',
    style: Theme.of(context).textTheme.headline6,  // Respects scaling
  )
  ```

### ✅ Navigation

- [ ] **Clear Hierarchy**: Navigation structure logical and predictable
- [ ] **Back Button**: Behavior correct per platform
  - [ ] iOS: Back to previous screen in stack
  - [ ] Android: Back button or gesture works
  - [ ] Web: Browser back button works
- [ ] **Deep Linking**: URLs resolve to correct screen
- [ ] **State Preservation**: Navigation preserves user state
- [ ] **No Dead Ends**: All screens have way to navigate away

### ✅ Responsive Design

- [ ] **Breakpoints Defined**: Mobile, tablet, desktop layouts
  - [ ] Mobile: <600dp (single column)
  - [ ] Tablet: 600-1200dp (dual pane or grid)
  - [ ] Desktop: >1200dp (multi-column, sidebar)

- [ ] **Orientation Handling**: Layouts adapt to portrait/landscape
- [ ] **Flexible Layouts**: Use `Expanded`, `Flexible`, `LayoutBuilder`
- [ ] **Safe Areas**: Respect device notches and system UI
  ```dart
  SafeArea(
    child: content,
  )
  ```

### ✅ Visual Design

- [ ] **Theme Integration**: No hardcoded colors or styles
  ```dart
  // ✅ Good
  color: Theme.of(context).primaryColor

  // ❌ Bad
  color: Color(0xFF2196F3)
  ```

- [ ] **Typography**: Uses theme text styles
  ```dart
  Text(
    'Heading',
    style: Theme.of(context).textTheme.headline5,
  )
  ```

- [ ] **Spacing**: Consistent spacing using design tokens
  ```dart
  // Define spacing constants
  const kSpacingSmall = 8.0;
  const kSpacingMedium = 16.0;
  const kSpacingLarge = 24.0;
  ```

- [ ] **Icons**: Platform-appropriate icon sets
  - [ ] iOS: SF Symbols equivalent
  - [ ] Android: Material Icons
  - [ ] Cross-platform: Consistent icon family

### ✅ Performance

- [ ] **Efficient Rebuilds**: `const` constructors used where possible
- [ ] **Lazy Loading**: Lists use `.builder` constructors
- [ ] **Image Optimization**: Proper image sizes, caching
- [ ] **Animation Performance**: 60fps maintained

### ✅ User Feedback

- [ ] **Loading States**: Indicators for async operations
  ```dart
  isLoading ? CircularProgressIndicator() : content
  ```

- [ ] **Error States**: User-friendly error messages
- [ ] **Empty States**: Helpful messages when no data
- [ ] **Success Feedback**: Confirmation for actions (snackbars, dialogs)

---

## Common UI Patterns

### 1. List with Pull-to-Refresh

```dart
RefreshIndicator(
  onRefresh: () async {
    await fetchData();
  },
  child: ListView.builder(
    itemCount: items.length,
    itemBuilder: (context, index) {
      return ListTile(
        title: Text(items[index].title),
      );
    },
  ),
)
```

### 2. Platform-Adaptive Dialog

```dart
void showPlatformDialog(BuildContext context) {
  if (Platform.isIOS) {
    showCupertinoDialog(
      context: context,
      builder: (_) => CupertinoAlertDialog(
        title: Text('Confirm'),
        content: Text('Are you sure?'),
        actions: [
          CupertinoDialogAction(child: Text('Cancel'), onPressed: () {}),
          CupertinoDialogAction(child: Text('OK'), onPressed: () {}),
        ],
      ),
    );
  } else {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Confirm'),
        content: Text('Are you sure?'),
        actions: [
          TextButton(child: Text('Cancel'), onPressed: () {}),
          TextButton(child: Text('OK'), onPressed: () {}),
        ],
      ),
    );
  }
}
```

### 3. Responsive Grid

```dart
LayoutBuilder(
  builder: (context, constraints) {
    int crossAxisCount;
    if (constraints.maxWidth < 600) {
      crossAxisCount = 2;  // Mobile
    } else if (constraints.maxWidth < 1200) {
      crossAxisCount = 4;  // Tablet
    } else {
      crossAxisCount = 6;  // Desktop
    }

    return GridView.builder(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemBuilder: (context, index) => ProductCard(product: products[index]),
    );
  },
)
```

### 4. Accessible Button

```dart
Semantics(
  label: 'Submit form',
  button: true,
  enabled: !isSubmitting,
  child: ElevatedButton(
    onPressed: isSubmitting ? null : _handleSubmit,
    child: isSubmitting
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Text('Submit'),
  ),
)
```

---

## Output Traceability

Add traceability to all UI design documents and code:

**For Dart UI files**:
```dart
// ROME Framework - UI Design
// Applied Skill: ui-design-patterns
// Expert References:
//   - cross_platform_ui_core.md
//   - platform_theme_architecture_guide.md
//   - mobile_ui_patterns.md
// Platform: iOS, Android, Web
// Generated: [ISO 8601 timestamp]
// Robot: [robot name]
```

**For design documentation**:
```markdown
---
Generated by: ROME Framework
Skill Applied: ui-design-patterns
Expert References:
  - cross_platform_ui_core.md
  - flutter_ui_component_library.md
Platform Targets: iOS, Android, Web, Desktop
Accessibility: WCAG AA compliant
Generated: [ISO 8601 timestamp]
Robot: [robot name]
---
```

---

## Example Usage

### Scenario 1: Design Cross-Platform Product List

**Robot (Clara)**: "Design a product list screen that works on iOS, Android, and Web."

**Skill Actions**:
1. Load `cross_platform_ui_core.md`
2. Load `mobile_ui_patterns.md`
3. Design responsive grid layout
4. Add platform-specific navigation
5. Validate:
   - ✅ Responsive breakpoints (mobile/tablet/desktop)
   - ✅ Platform-appropriate navigation (Cupertino vs Material)
   - ✅ Touch targets ≥48dp
   - ✅ Accessibility labels
   - ✅ Pull-to-refresh pattern
6. Generate design with traceability

### Scenario 2: Create Accessible Form

**Robot (Clara)**: "Create a user registration form with full accessibility support."

**Skill Actions**:
1. Load `flutter_ui_component_library.md`
2. Design form with semantic labels
3. Ensure keyboard navigation
4. Add error states
5. Validate:
   - ✅ All inputs have labels
   - ✅ Tab order logical
   - ✅ Error messages announced to screen readers
   - ✅ Touch targets sufficient size
   - ✅ Color contrast meets WCAG AA
6. Generate accessible form implementation

---

## Related Skills

- `flutter-best-practices` - For implementing designed UI in Flutter
- `parse-server-config` - For understanding backend data model in UI context

---

**Skill Version**: 1.0
**Last Updated**: 2025-12-29
**Expert Docs Version**: Current as of 2025-12-27
