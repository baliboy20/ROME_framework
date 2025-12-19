# Flutter Windows UI Patterns & Optimizations

**Version:** 1.0
**Created:** 2025-12-19
**Scope:** Windows-specific UI patterns, Fluent Design integration, and desktop optimizations for Flutter Windows applications

**Related Documents:**
- Core Design System: `/04_UI_UX/cross_platform_ui_core.md`
- Platform-Specific Guides: `web_ui_patterns.md`, `macos_ui_patterns.md`, `mobile_ui_patterns.md`

---

## Overview

This document covers Windows-specific UI patterns, Fluent Design System integration, and desktop optimizations for Flutter Windows applications. It focuses on creating native Windows experiences while maintaining Flutter's development efficiency.

---

## 🪟 **WINDOWS THEME CONFIGURATION**

### **Windows Fluent-Inspired Theme**

```dart
// core/theme/windows_theme.dart

class WindowsTheme {
  static ThemeData getWindowsTheme(Brightness brightness) {
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: DesignTokens.colorScheme,

      // Windows-specific styling (Fluent Design inspired)
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: false,
        toolbarHeight: 48,
        backgroundColor: brightness == Brightness.light
          ? Color(0xFFF3F3F3)
          : Color(0xFF202020),
      ),

      // Windows button styling
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),

      // Windows card styling (subtle shadows)
      cardTheme: CardTheme(
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
        shadowColor: Colors.black.withOpacity(0.1),
      ),

      // Windows input decoration
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: BorderSide(
            color: brightness == Brightness.light
              ? Colors.grey.shade400
              : Colors.grey.shade600,
          ),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
    );
  }
}
```

---

## 🎯 **WINDOWS-SPECIFIC COMPONENTS**

### **Windows Navigation View**

```dart
// windows/widgets/windows_navigation_view.dart

class WindowsNavigationView extends StatelessWidget {
  final List<NavigationItem> items;
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;

  const WindowsNavigationView({
    Key? key,
    required this.items,
    required this.selectedIndex,
    required this.onItemSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 320,
      color: Theme.of(context).brightness == Brightness.light
        ? Color(0xFFF3F3F3)
        : Color(0xFF202020),
      child: Column(
        children: [
          // Header
          Container(
            height: 48,
            padding: EdgeInsets.symmetric(horizontal: 16),
            alignment: Alignment.centerLeft,
            child: Text(
              'Navigation',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          // Navigation items
          Expanded(
            child: ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                final isSelected = index == selectedIndex;

                return _WindowsNavItem(
                  item: item,
                  isSelected: isSelected,
                  onTap: () => onItemSelected(index),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _WindowsNavItem extends StatefulWidget {
  final NavigationItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _WindowsNavItem({
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_WindowsNavItem> createState() => _WindowsNavItemState();
}

class _WindowsNavItemState extends State<_WindowsNavItem> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Color backgroundColor;
    if (widget.isSelected) {
      backgroundColor = theme.colorScheme.primary.withOpacity(0.1);
    } else if (_isHovered) {
      backgroundColor = theme.brightness == Brightness.light
        ? Colors.black.withOpacity(0.05)
        : Colors.white.withOpacity(0.05);
    } else {
      backgroundColor = Colors.transparent;
    }

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: SystemMouseCursors.click,
      child: AnimatedContainer(
        duration: Duration(milliseconds: 150),
        margin: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(4),
          border: widget.isSelected ? Border(
            left: BorderSide(
              color: theme.colorScheme.primary,
              width: 3,
            ),
          ) : null,
        ),
        child: InkWell(
          onTap: widget.onTap,
          borderRadius: BorderRadius.circular(4),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(
                  widget.item.icon,
                  size: 20,
                  color: widget.isSelected
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurface,
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Text(
                    widget.item.label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: widget.isSelected
                        ? FontWeight.w600
                        : FontWeight.w400,
                      color: widget.isSelected
                        ? theme.colorScheme.primary
                        : theme.colorScheme.onSurface,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

### **Windows Button with Acrylic Effect**

```dart
// windows/widgets/windows_button.dart

class WindowsButton extends StatefulWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isPrimary;

  const WindowsButton({
    Key? key,
    required this.onPressed,
    required this.child,
    this.isPrimary = false,
  }) : super(key: key);

  @override
  State<WindowsButton> createState() => _WindowsButtonState();
}

class _WindowsButtonState extends State<WindowsButton> {
  bool _isHovered = false;
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEnabled = widget.onPressed != null;

    Color backgroundColor;
    if (!isEnabled) {
      backgroundColor = theme.colorScheme.surface.withOpacity(0.5);
    } else if (_isPressed) {
      backgroundColor = widget.isPrimary
        ? theme.colorScheme.primary.withOpacity(0.7)
        : theme.colorScheme.surface.withOpacity(0.7);
    } else if (_isHovered) {
      backgroundColor = widget.isPrimary
        ? theme.colorScheme.primary.withOpacity(0.9)
        : theme.colorScheme.surface.withOpacity(0.9);
    } else {
      backgroundColor = widget.isPrimary
        ? theme.colorScheme.primary
        : theme.colorScheme.surface;
    }

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() {
        _isHovered = false;
        _isPressed = false;
      }),
      cursor: isEnabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
      child: GestureDetector(
        onTapDown: isEnabled ? (_) => setState(() => _isPressed = true) : null,
        onTapUp: isEnabled ? (_) => setState(() => _isPressed = false) : null,
        onTapCancel: () => setState(() => _isPressed = false),
        onTap: widget.onPressed,
        child: AnimatedContainer(
          duration: Duration(milliseconds: 100),
          padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: widget.isPrimary
                ? Colors.transparent
                : theme.dividerColor,
              width: 1,
            ),
          ),
          child: DefaultTextStyle(
            style: TextStyle(
              color: widget.isPrimary
                ? theme.colorScheme.onPrimary
                : theme.colorScheme.onSurface,
              fontSize: 14,
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

### **Windows Dialog with Title Bar**

```dart
// windows/dialogs/windows_dialog.dart

class WindowsDialog {
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required Widget content,
    List<AdaptiveDialogAction> actions = const [],
  }) {
    return showDialog<T>(
      context: context,
      barrierColor: Colors.black.withOpacity(0.4),
      builder: (context) => Center(
        child: Container(
          width: 480,
          margin: EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: Theme.of(context).dividerColor,
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 16,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Windows-style title bar
              Container(
                height: 40,
                padding: EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.light
                    ? Color(0xFFF3F3F3)
                    : Color(0xFF2D2D2D),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(8),
                    topRight: Radius.circular(8),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close, size: 18),
                      onPressed: () => Navigator.of(context).pop(),
                      padding: EdgeInsets.zero,
                      constraints: BoxConstraints.tightFor(width: 32, height: 32),
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
              if (actions.isNotEmpty)
                Container(
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: Theme.of(context).dividerColor,
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: actions.map((action) => Padding(
                      padding: EdgeInsets.only(left: 8),
                      child: WindowsButton(
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

## 🪟 **WINDOWS DESKTOP OPTIMIZATIONS**

### **Window Management**

```dart
// windows/desktop/window_manager.dart

class WindowsWindowManager {
  static Future<void> setupWindow() async {
    if (!Platform.isWindows) return;

    await windowManager.ensureInitialized();

    WindowOptions windowOptions = WindowOptions(
      size: Size(1280, 720),
      minimumSize: Size(768, 600),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      titleBarStyle: TitleBarStyle.hidden,
      windowButtonVisibility: false,
    );

    windowManager.waitUntilReadyToShow(windowOptions, () async {
      await windowManager.show();
      await windowManager.focus();
    });
  }

  // Custom title bar
  static Widget buildTitleBar({
    required BuildContext context,
    required String title,
  }) {
    return Container(
      height: 32,
      color: Theme.of(context).brightness == Brightness.light
        ? Color(0xFFF3F3F3)
        : Color(0xFF202020),
      child: Row(
        children: [
          SizedBox(width: 12),
          Text(
            title,
            style: TextStyle(fontSize: 12),
          ),
          Expanded(child: DragToMoveArea(child: Container())),
          _WindowButton(
            icon: Icons.minimize,
            onPressed: () => windowManager.minimize(),
          ),
          _WindowButton(
            icon: Icons.crop_square,
            onPressed: () async {
              if (await windowManager.isMaximized()) {
                windowManager.unmaximize();
              } else {
                windowManager.maximize();
              }
            },
          ),
          _WindowButton(
            icon: Icons.close,
            onPressed: () => windowManager.close(),
            isClose: true,
          ),
        ],
      ),
    );
  }
}

class _WindowButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final bool isClose;

  const _WindowButton({
    required this.icon,
    required this.onPressed,
    this.isClose = false,
  });

  @override
  State<_WindowButton> createState() => _WindowButtonState();
}

class _WindowButtonState extends State<_WindowButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onPressed,
        child: Container(
          width: 46,
          height: 32,
          color: _isHovered
            ? (widget.isClose ? Color(0xFFE81123) : Colors.white.withOpacity(0.1))
            : Colors.transparent,
          child: Icon(
            widget.icon,
            size: 16,
            color: _isHovered && widget.isClose ? Colors.white : null,
          ),
        ),
      ),
    );
  }
}
```

### **Keyboard Shortcuts**

```dart
// windows/desktop/keyboard_shortcuts.dart

class WindowsKeyboardShortcuts {
  static Widget withShortcuts({
    required Widget child,
    required Map<LogicalKeySet, VoidCallback> shortcuts,
  }) {
    // Common Windows shortcuts
    final windowsShortcuts = {
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyN):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyN)] ?? () {},
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyS):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyS)] ?? () {},
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyO):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyO)] ?? () {},
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyW):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyW)] ?? () {},
      LogicalKeySet(LogicalKeyboardKey.alt, LogicalKeyboardKey.f4):
        shortcuts[LogicalKeySet(LogicalKeyboardKey.alt, LogicalKeyboardKey.f4)] ?? () {},
    };

    return Shortcuts(
      shortcuts: windowsShortcuts.map(
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
// windows/widgets/windows_context_menu.dart

class WindowsContextMenu extends StatelessWidget {
  final Widget child;
  final List<ContextMenuItem> menuItems;

  const WindowsContextMenu({
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
            borderRadius: BorderRadius.circular(4),
            side: BorderSide(color: Theme.of(context).dividerColor),
          ),
          items: menuItems.map((item) {
            return PopupMenuItem(
              value: item.value,
              height: 32,
              child: Row(
                children: [
                  if (item.icon != null) ...[
                    Icon(item.icon, size: 16),
                    SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Text(
                      item.label,
                      style: TextStyle(fontSize: 14),
                    ),
                  ),
                  if (item.shortcut != null) ...[
                    SizedBox(width: 24),
                    Text(
                      item.shortcut!,
                      style: TextStyle(
                        fontSize: 12,
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

## 🎨 **FLUENT DESIGN PATTERNS**

### **Acrylic Background Effect**

```dart
// windows/effects/acrylic_background.dart

class AcrylicBackground extends StatelessWidget {
  final Widget child;
  final Color tintColor;
  final double tintOpacity;
  final double blurAmount;

  const AcrylicBackground({
    Key? key,
    required this.child,
    this.tintColor = Colors.white,
    this.tintOpacity = 0.8,
    this.blurAmount = 10.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Blurred background
        Positioned.fill(
          child: BackdropFilter(
            filter: ImageFilter.blur(
              sigmaX: blurAmount,
              sigmaY: blurAmount,
            ),
            child: Container(
              color: tintColor.withOpacity(tintOpacity),
            ),
          ),
        ),
        // Content
        child,
      ],
    );
  }
}
```

### **Reveal Effect on Hover**

```dart
// windows/effects/reveal_effect.dart

class RevealEffect extends StatefulWidget {
  final Widget child;
  final BorderRadius? borderRadius;

  const RevealEffect({
    Key? key,
    required this.child,
    this.borderRadius,
  }) : super(key: key);

  @override
  State<RevealEffect> createState() => _RevealEffectState();
}

class _RevealEffectState extends State<RevealEffect> {
  bool _isHovered = false;
  Offset _hoverPosition = Offset.zero;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      onHover: (event) => setState(() => _hoverPosition = event.localPosition),
      child: AnimatedContainer(
        duration: Duration(milliseconds: 200),
        decoration: BoxDecoration(
          borderRadius: widget.borderRadius ?? BorderRadius.circular(4),
          border: Border.all(
            color: _isHovered
              ? Theme.of(context).colorScheme.primary.withOpacity(0.3)
              : Colors.transparent,
            width: 1,
          ),
          boxShadow: _isHovered ? [
            BoxShadow(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              blurRadius: 8,
              spreadRadius: 2,
            ),
          ] : null,
        ),
        child: widget.child,
      ),
    );
  }
}
```

---

## ✅ **WINDOWS IMPLEMENTATION CHECKLIST**

### **Theme & Styling**
- [ ] Fluent-inspired theme configured
- [ ] Windows color scheme applied
- [ ] Subtle elevation and shadows
- [ ] Proper border radius (4px default)

### **Components**
- [ ] Navigation view with compact/expanded modes
- [ ] Windows-style buttons
- [ ] Title bar with window controls
- [ ] Context menus
- [ ] Command bar

### **Desktop Features**
- [ ] Window management
- [ ] Keyboard shortcuts (Ctrl-based)
- [ ] Right-click context menus
- [ ] Drag and drop support
- [ ] System tray integration

### **Performance**
- [ ] Hardware acceleration enabled
- [ ] Efficient rendering
- [ ] Memory management
- [ ] Startup optimization

### **Fluent Design**
- [ ] Acrylic material effects
- [ ] Reveal highlight on hover
- [ ] Connected animations
- [ ] Depth and layering

---

## 🚨 **WINDOWS-SPECIFIC PITFALLS**

### **Animation Speed**

```dart
// ❌ WRONG: Too fast for Windows UX
AnimatedContainer(
  duration: Duration(milliseconds: 100),
)

// ✅ CORRECT: Windows-appropriate timing
AnimatedContainer(
  duration: Duration(milliseconds: 200),
  curve: Curves.easeOut,
)
```

### **Title Bar Handling**

```dart
// ❌ WRONG: Not handling custom title bar
Scaffold(
  appBar: AppBar(title: Text('Title')),
)

// ✅ CORRECT: Custom Windows title bar
Scaffold(
  body: Column(
    children: [
      WindowsWindowManager.buildTitleBar(
        context: context,
        title: 'Title',
      ),
      Expanded(child: content),
    ],
  ),
)
```

---

**Document Status:** ✅ ACTIVE
**Platform Coverage:** Flutter Windows
**Review Cycle:** Quarterly with Windows SDK updates
**Last Updated:** 2025-12-19
