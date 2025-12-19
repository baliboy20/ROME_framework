# Flutter macOS UI Patterns & Optimizations

**Version:** 1.0
**Created:** 2025-12-19
**Scope:** macOS-specific UI patterns, Apple Human Interface Guidelines integration, and desktop optimizations for Flutter macOS applications

**Related Documents:**
- Core Design System: `/04_UI_UX/cross_platform_ui_core.md`
- Platform-Specific Guides: `web_ui_patterns.md`, `windows_ui_patterns.md`, `mobile_ui_patterns.md`

---

## Overview

This document covers macOS-specific UI patterns, Apple Human Interface Guidelines integration, and desktop optimizations for Flutter macOS applications. It focuses on creating native macOS experiences that feel at home on the platform.

---

## 🍎 **MACOS THEME CONFIGURATION**

### **macOS Native-Inspired Theme**

```dart
// core/theme/macos_theme.dart

class MacOSTheme {
  static ThemeData getMacOSTheme(Brightness brightness) {
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: DesignTokens.colorScheme,

      // macOS-specific styling
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: false, // macOS apps typically left-align
        toolbarHeight: 52, // Smaller toolbar for macOS
        backgroundColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),

      // macOS button styling
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(6),
          ),
        ),
      ),

      // macOS card styling
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(
            color: brightness == Brightness.light
              ? Colors.grey.shade300
              : Colors.grey.shade700,
            width: 0.5,
          ),
        ),
      ),

      // macOS input decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: brightness == Brightness.light
          ? Colors.grey.shade100
          : Colors.grey.shade900,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: BorderSide.none,
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }
}
```

---

## 🎯 **MACOS-SPECIFIC COMPONENTS**

### **macOS Sidebar**

```dart
// macos/widgets/macos_sidebar.dart

class MacOSSidebar extends StatelessWidget {
  final List<NavigationItem> items;
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;

  const MacOSSidebar({
    Key? key,
    required this.items,
    required this.selectedIndex,
    required this.onItemSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      color: Theme.of(context).colorScheme.surface.withOpacity(0.5),
      child: ListView.builder(
        padding: EdgeInsets.symmetric(vertical: 12),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          final isSelected = index == selectedIndex;

          return Padding(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 2),
            child: Material(
              color: isSelected
                ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
              child: InkWell(
                onTap: () => onItemSelected(index),
                borderRadius: BorderRadius.circular(6),
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      Icon(
                        item.icon,
                        size: 18,
                        color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.onSurface,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          item.label,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.w400,
                            color: isSelected
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
```

### **macOS Button with Native Feel**

```dart
// macos/widgets/macos_button.dart

class MacOSButton extends StatefulWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isPrimary;

  const MacOSButton({
    Key? key,
    required this.onPressed,
    required this.child,
    this.isPrimary = false,
  }) : super(key: key);

  @override
  State<MacOSButton> createState() => _MacOSButtonState();
}

class _MacOSButtonState extends State<MacOSButton> {
  bool _isHovered = false;
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEnabled = widget.onPressed != null;

    Color backgroundColor;
    Color textColor;

    if (!isEnabled) {
      backgroundColor = theme.colorScheme.surface.withOpacity(0.5);
      textColor = theme.colorScheme.onSurface.withOpacity(0.5);
    } else if (_isPressed) {
      backgroundColor = widget.isPrimary
        ? theme.colorScheme.primary.withOpacity(0.8)
        : theme.colorScheme.surface.withOpacity(0.8);
      textColor = widget.isPrimary
        ? theme.colorScheme.onPrimary
        : theme.colorScheme.onSurface;
    } else if (_isHovered) {
      backgroundColor = widget.isPrimary
        ? theme.colorScheme.primary.withOpacity(0.9)
        : theme.colorScheme.surface.withOpacity(0.9);
      textColor = widget.isPrimary
        ? theme.colorScheme.onPrimary
        : theme.colorScheme.onSurface;
    } else {
      backgroundColor = widget.isPrimary
        ? theme.colorScheme.primary
        : theme.colorScheme.surface;
      textColor = widget.isPrimary
        ? theme.colorScheme.onPrimary
        : theme.colorScheme.onSurface;
    }

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: isEnabled
        ? SystemMouseCursors.click
        : SystemMouseCursors.basic,
      child: GestureDetector(
        onTapDown: isEnabled ? (_) => setState(() => _isPressed = true) : null,
        onTapUp: isEnabled ? (_) => setState(() => _isPressed = false) : null,
        onTapCancel: () => setState(() => _isPressed = false),
        onTap: widget.onPressed,
        child: AnimatedContainer(
          duration: Duration(milliseconds: 150),
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(6),
            boxShadow: widget.isPrimary && isEnabled ? [
              BoxShadow(
                color: theme.colorScheme.primary.withOpacity(0.3),
                blurRadius: 4,
                offset: Offset(0, 2),
              ),
            ] : null,
          ),
          child: DefaultTextStyle(
            style: TextStyle(
              color: textColor,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
            child: widget.child,
          ),
        ),
      ),
    );
  }
}
```

### **macOS Dialog with Sheet Style**

```dart
// macos/dialogs/macos_dialog.dart

class MacOSDialog {
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required Widget content,
    List<AdaptiveDialogAction> actions = const [],
  }) {
    return showDialog<T>(
      context: context,
      barrierColor: Colors.black.withOpacity(0.3),
      builder: (context) => Center(
        child: Container(
          width: 400,
          margin: EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 20,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Title bar
              Container(
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: Theme.of(context).dividerColor,
                      width: 0.5,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Content
              Padding(
                padding: EdgeInsets.all(20),
                child: content,
              ),
              // Actions
              Container(
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(
                      color: Theme.of(context).dividerColor,
                      width: 0.5,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: actions.map((action) => Padding(
                    padding: EdgeInsets.only(left: 8),
                    child: MacOSButton(
                      onPressed: () => action.onPressed(context),
                      isPrimary: action.isPrimary,
                      child: Text(action.label),
                    ),
                  )).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## 🍎 **MACOS DESKTOP OPTIMIZATIONS**

### **Window Management**

```dart
// macos/desktop/window_manager.dart

class MacOSWindowManager {
  static Future<void> setupWindow() async {
    if (!Platform.isMacOS) return;

    await windowManager.ensureInitialized();

    WindowOptions windowOptions = WindowOptions(
      size: Size(1200, 800),
      minimumSize: Size(800, 600),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      titleBarStyle: TitleBarStyle.hidden,
    );

    windowManager.waitUntilReadyToShow(windowOptions, () async {
      await windowManager.show();
      await windowManager.focus();
    });
  }

  // Custom title bar with macOS traffic lights
  static Widget buildTitleBar({
    required BuildContext context,
    required String title,
    List<Widget>? trailing,
  }) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withOpacity(0.95),
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor,
            width: 0.5,
          ),
        ),
      ),
      child: Row(
        children: [
          SizedBox(width: 80), // Space for traffic lights
          Expanded(
            child: DragToMoveArea(
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
          if (trailing != null) ...trailing,
          SizedBox(width: 16),
        ],
      ),
    );
  }
}
```

### **Keyboard Shortcuts (Command-based)**

```dart
// macos/desktop/keyboard_shortcuts.dart

class MacOSKeyboardShortcuts {
  static Widget withShortcuts({
    required Widget child,
    required Map<LogicalKeySet, VoidCallback> shortcuts,
  }) {
    // Common macOS shortcuts (Cmd-based)
    final macShortcuts = {
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyN):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyN)] ?? () {},
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyS):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyS)] ?? () {},
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyO):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyO)] ?? () {},
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyW):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyW)] ?? () {},
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyQ):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyQ)] ?? () {},
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.comma):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.comma)] ?? () {},
    };

    return Shortcuts(
      shortcuts: macShortcuts.map(
        (key, value) => MapEntry(key, VoidCallbackIntent(value)),
      ),
      child: Actions(
        actions: {
          VoidCallbackIntent: CallbackAction<VoidCallbackIntent>(
            onInvoke: (intent) => intent.callback(),
          ),
        },
        child: Focus(
          autofocus: true,
          child: child,
        ),
      ),
    );
  }
}
```

### **Context Menu**

```dart
// macos/widgets/macos_context_menu.dart

class MacOSContextMenu extends StatelessWidget {
  final Widget child;
  final List<ContextMenuItem> menuItems;

  const MacOSContextMenu({
    Key? key,
    required this.child,
    required this.menuItems,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onSecondaryTapDown: (details) {
        showMenu(
          context: context,
          position: RelativeRect.fromLTRB(
            details.globalPosition.dx,
            details.globalPosition.dy,
            details.globalPosition.dx,
            details.globalPosition.dy,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          elevation: 8,
          items: menuItems.map((item) {
            return PopupMenuItem(
              value: item.value,
              height: 28,
              child: Row(
                children: [
                  if (item.icon != null) ...[
                    Icon(item.icon, size: 16),
                    SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Text(
                      item.label,
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                  if (item.shortcut != null) ...[
                    SizedBox(width: 20),
                    Text(
                      item.shortcut!,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ],
              ),
            );
          }).toList(),
        ).then((value) {
          if (value != null) {
            final item = menuItems.firstWhere((i) => i.value == value);
            item.onSelected?.call();
          }
        });
      },
      child: child,
    );
  }
}
```

---

## 🎨 **MACOS DESIGN PATTERNS**

### **Vibrancy Effect**

```dart
// macos/effects/vibrancy_effect.dart

class VibrancyEffect extends StatelessWidget {
  final Widget child;
  final double opacity;

  const VibrancyEffect({
    Key? key,
    required this.child,
    this.opacity = 0.95,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface.withOpacity(opacity),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: Colors.white.withOpacity(0.2),
              width: 0.5,
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
```

### **macOS Toolbar**

```dart
// macos/widgets/macos_toolbar.dart

class MacOSToolbar extends StatelessWidget {
  final List<ToolbarItem> items;
  final String? title;

  const MacOSToolbar({
    Key? key,
    required this.items,
    this.title,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      padding: EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withOpacity(0.95),
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor,
            width: 0.5,
          ),
        ),
      ),
      child: Row(
        children: [
          if (title != null) ...[
            Text(
              title!,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(width: 24),
          ],
          ...items.map((item) => Padding(
            padding: EdgeInsets.only(right: 8),
            child: _ToolbarButton(item: item),
          )),
          Spacer(),
        ],
      ),
    );
  }
}

class _ToolbarButton extends StatefulWidget {
  final ToolbarItem item;

  const _ToolbarButton({required this.item});

  @override
  State<_ToolbarButton> createState() => _ToolbarButtonState();
}

class _ToolbarButtonState extends State<_ToolbarButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.item.onPressed,
        child: Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _isHovered
              ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
              : Colors.transparent,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(
            widget.item.icon,
            size: 18,
            color: _isHovered
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}

class ToolbarItem {
  final IconData icon;
  final VoidCallback? onPressed;
  final String? tooltip;

  ToolbarItem({
    required this.icon,
    this.onPressed,
    this.tooltip,
  });
}
```

### **macOS List with Selection**

```dart
// macos/widgets/macos_list.dart

class MacOSList<T> extends StatelessWidget {
  final List<T> items;
  final Widget Function(BuildContext, T, bool) itemBuilder;
  final T? selectedItem;
  final ValueChanged<T>? onItemSelected;

  const MacOSList({
    Key? key,
    required this.items,
    required this.itemBuilder,
    this.selectedItem,
    this.onItemSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: EdgeInsets.all(4),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final isSelected = item == selectedItem;

        return GestureDetector(
          onTap: () => onItemSelected?.call(item),
          child: Container(
            margin: EdgeInsets.symmetric(vertical: 1),
            decoration: BoxDecoration(
              color: isSelected
                ? Theme.of(context).colorScheme.primary.withOpacity(0.15)
                : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
            ),
            child: itemBuilder(context, item, isSelected),
          ),
        );
      },
    );
  }
}
```

---

## 🚀 **MACOS PERFORMANCE OPTIMIZATIONS**

### **Metal Rendering**

```dart
// macos/performance/metal_optimization.dart

class MacOSPerformance {
  static void enableMetalRendering() {
    // Metal is enabled by default on macOS
    // Ensure hardware acceleration is utilized
    print('Metal rendering enabled for optimal performance');
  }

  // Optimize for Retina displays
  static Widget optimizeForRetina(Widget child) {
    return MediaQuery(
      data: MediaQueryData(
        devicePixelRatio: 2.0, // Retina display
      ),
      child: child,
    );
  }
}
```

### **Efficient List Rendering**

```dart
// macos/performance/list_optimization.dart

class MacOSListOptimization {
  static Widget buildOptimizedList({
    required int itemCount,
    required Widget Function(BuildContext, int) itemBuilder,
  }) {
    return ListView.builder(
      itemCount: itemCount,
      itemBuilder: itemBuilder,
      cacheExtent: 500, // macOS can handle larger cache
      addAutomaticKeepAlives: true,
      addRepaintBoundaries: true,
    );
  }
}
```

---

## ✅ **MACOS IMPLEMENTATION CHECKLIST**

### **Theme & Styling**
- [ ] macOS-native theme configured
- [ ] Left-aligned titles
- [ ] Rounded corners (6-8px)
- [ ] Minimal elevation
- [ ] Subtle borders

### **Components**
- [ ] Sidebar navigation
- [ ] macOS-style buttons
- [ ] Sheet-style dialogs
- [ ] Toolbar with items
- [ ] Context menus

### **Desktop Features**
- [ ] Window management
- [ ] Command-based shortcuts
- [ ] Right-click menus
- [ ] Drag and drop
- [ ] Traffic light positioning

### **Performance**
- [ ] Metal rendering enabled
- [ ] Retina display optimization
- [ ] Efficient animations
- [ ] Memory management

### **Design Patterns**
- [ ] Vibrancy effects
- [ ] Spring animations
- [ ] Native selection states
- [ ] Focus rings

---

## 🚨 **MACOS-SPECIFIC PITFALLS**

### **Animation Timing**

```dart
// ❌ WRONG: Too slow for macOS
AnimatedContainer(
  duration: Duration(milliseconds: 500),
)

// ✅ CORRECT: macOS-appropriate spring animation
AnimatedContainer(
  duration: Duration(milliseconds: 250),
  curve: Curves.easeInOutCubic,
)
```

### **Keyboard Shortcuts**

```dart
// ❌ WRONG: Using Ctrl instead of Cmd
LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyS)

// ✅ CORRECT: Using Command key (meta)
LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyS)
```

### **Sidebar Width**

```dart
// ❌ WRONG: Too wide for macOS
Container(width: 320)

// ✅ CORRECT: macOS standard sidebar width
Container(width: 250)
```

---

**Document Status:** ✅ ACTIVE
**Platform Coverage:** Flutter macOS
**Review Cycle:** Quarterly with macOS SDK updates
**Last Updated:** 2025-12-19
