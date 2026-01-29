# Flutter UI Component Library & Pattern Guide

**Version:** 1.0  
**Created:** 2025-08-06  
**Purpose:** Comprehensive UI component patterns and implementation guide

---

## 🎨 **CORE UI COMPONENT LIBRARY**



### **2. Form Components**

#### **Adaptive Form Field**


#### **Platform-Specific Date Picker**

```dart
// core/widgets/pickers/adaptive_date_picker.dart

class AdaptiveDatePicker extends StatelessWidget {
  final DateTime? selectedDate;
  final ValueChanged<DateTime> onDateSelected;
  final DateTime? firstDate;
  final DateTime? lastDate;
  final String? labelText;
  
  const AdaptiveDatePicker({
    Key? key,
    this.selectedDate,
    required this.onDateSelected,
    this.firstDate,
    this.lastDate,
    this.labelText,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    final platform = PlatformDetector.current;
    final theme = Theme.of(context);
    
    return InkWell(
      onTap: () => _selectDate(context),
      borderRadius: BorderRadius.circular(8),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: labelText ?? 'Select Date',
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(
              platform == AppPlatform.macOS ? 6 : 8,
            ),
          ),
          suffixIcon: Icon(
            platform == AppPlatform.macOS 
              ? Icons.calendar_today_outlined
              : Icons.calendar_month,
            size: 20,
          ),
        ),
        child: Text(
          selectedDate != null
            ? _formatDate(selectedDate!, platform)
            : 'Choose a date',
          style: TextStyle(
            fontSize: 14,
            color: selectedDate != null
              ? theme.colorScheme.onSurface
              : theme.colorScheme.onSurface.withOpacity(0.5),
          ),
        ),
      ),
    );
  }
  
  String _formatDate(DateTime date, AppPlatform platform) {
    // Platform-specific date formatting
    if (platform == AppPlatform.macOS) {
      // macOS prefers: Jan 15, 2025
      return DateFormat('MMM d, y').format(date);
    } else if (platform == AppPlatform.windows) {
      // Windows prefers: 1/15/2025
      return DateFormat('M/d/y').format(date);
    } else {
      // Web/Mobile: January 15, 2025
      return DateFormat('MMMM d, y').format(date);
    }
  }
  
  Future<void> _selectDate(BuildContext context) async {
    final platform = PlatformDetector.current;
    final now = DateTime.now();
    
    if (platform == AppPlatform.macOS) {
      // macOS-style date picker (custom implementation)
      await showDialog(
        context: context,
        builder: (context) => _MacOSDatePicker(
          initialDate: selectedDate ?? now,
          firstDate: firstDate ?? DateTime(1900),
          lastDate: lastDate ?? DateTime(2100),
          onDateSelected: (date) {
            onDateSelected(date);
            Navigator.of(context).pop();
          },
        ),
      );
    } else {
      // Standard Material date picker
      final picked = await showDatePicker(
        context: context,
        initialDate: selectedDate ?? now,
        firstDate: firstDate ?? DateTime(1900),
        lastDate: lastDate ?? DateTime(2100),
        builder: (context, child) {
          if (platform == AppPlatform.windows) {
            // Windows-style theming
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: Color(0xFF0078D4), // Windows blue
                ),
              ),
              child: child!,
            );
          }
          return child!;
        },
      );
      
      if (picked != null) {
        onDateSelected(picked);
      }
    }
  }
}
```

### **3. Feedback Components**

#### **Adaptive Loading Indicator**

```dart
// core/widgets/feedback/adaptive_loading.dart

class AdaptiveLoadingIndicator extends StatelessWidget {
  final double size;
  final Color? color;
  final String? message;
  
  const AdaptiveLoadingIndicator({
    Key? key,
    this.size = 40,
    this.color,
    this.message,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    final platform = PlatformDetector.current;
    final theme = Theme.of(context);
    final effectiveColor = color ?? theme.colorScheme.primary;
    
    Widget indicator;
    
    if (platform == AppPlatform.macOS) {
      // macOS-style spinner
      indicator = _MacOSSpinner(
        size: size,
        color: effectiveColor,
      );
    } else if (platform == AppPlatform.windows) {
      // Windows-style dots
      indicator = _WindowsProgressDots(
        size: size,
        color: effectiveColor,
      );
    } else {
      // Standard circular progress
      indicator = SizedBox(
        width: size,
        height: size,
        child: CircularProgressIndicator(
          strokeWidth: size / 10,
          valueColor: AlwaysStoppedAnimation<Color>(effectiveColor),
        ),
      );
    }
    
    if (message != null) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          indicator,
          SizedBox(height: 16),
          Text(
            message!,
            style: TextStyle(
              fontSize: 14,
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
        ],
      );
    }
    
    return indicator;
  }
}

class _MacOSSpinner extends StatefulWidget {
  final double size;
  final Color color;
  
  const _MacOSSpinner({
    required this.size,
    required this.color,
  });
  
  @override
  State<_MacOSSpinner> createState() => _MacOSSpinnerState();
}

class _MacOSSpinnerState extends State<_MacOSSpinner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: 1000),
      vsync: this,
    )..repeat();
  }
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _MacOSSpinnerPainter(
            progress: _controller.value,
            color: widget.color,
          ),
        );
      },
    );
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

#### **Toast/Snackbar System**

```dart
// core/widgets/feedback/adaptive_toast.dart

class AdaptiveToast {
  static void show({
    required BuildContext context,
    required String message,
    ToastType type = ToastType.info,
    Duration duration = const Duration(seconds: 3),
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    final platform = PlatformDetector.current;
    
    if (platform == AppPlatform.macOS) {
      _showMacOSNotification(
        context: context,
        message: message,
        type: type,
        duration: duration,
      );
    } else if (platform == AppPlatform.windows) {
      _showWindowsToast(
        context: context,
        message: message,
        type: type,
        duration: duration,
      );
    } else {
      _showMaterialSnackbar(
        context: context,
        message: message,
        type: type,
        duration: duration,
        onAction: onAction,
        actionLabel: actionLabel,
      );
    }
  }
  
  static void _showMacOSNotification({
    required BuildContext context,
    required String message,
    required ToastType type,
    required Duration duration,
  }) {
    final overlay = Overlay.of(context);
    final theme = Theme.of(context);
    
    final overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: 24,
        right: 24,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _getIconForType(type),
                  color: _getColorForType(type, theme),
                  size: 20,
                ),
                SizedBox(width: 12),
                Text(
                  message,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    
    overlay.insert(overlayEntry);
    
    Future.delayed(duration, () {
      overlayEntry.remove();
    });
  }
  
  static IconData _getIconForType(ToastType type) {
    return switch (type) {
      ToastType.success => Icons.check_circle_outline,
      ToastType.error => Icons.error_outline,
      ToastType.warning => Icons.warning_amber_outlined,
      ToastType.info => Icons.info_outline,
    };
  }
  
  static Color _getColorForType(ToastType type, ThemeData theme) {
    return switch (type) {
      ToastType.success => theme.colorScheme.success,
      ToastType.error => theme.colorScheme.error,
      ToastType.warning => theme.colorScheme.warning,
      ToastType.info => theme.colorScheme.primary,
    };
  }
}

enum ToastType { success, error, warning, info }
```

---

## 🎮 **INTERACTION PATTERNS**

### **Gesture Handling by Platform**

```dart
// core/interaction/adaptive_gestures.dart

class AdaptiveGestureDetector extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onDoubleTap;
  final VoidCallback? onLongPress;
  final VoidCallback? onRightClick;
  final ValueChanged<DragUpdateDetails>? onPanUpdate;
  
  const AdaptiveGestureDetector({
    Key? key,
    required this.child,
    this.onTap,
    this.onDoubleTap,
    this.onLongPress,
    this.onRightClick,
    this.onPanUpdate,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    final platform = PlatformDetector.current;
    
    // Desktop: Support right-click
    if (PlatformDetector.isDesktop && onRightClick != null) {
      return GestureDetector(
        onTap: onTap,
        onDoubleTap: onDoubleTap,
        onLongPress: onLongPress,
        onPanUpdate: onPanUpdate,
        onSecondaryTap: onRightClick,
        child: child,
      );
    }
    
    // Mobile: Long press instead of right-click
    if (PlatformDetector.isMobile && onRightClick != null) {
      return GestureDetector(
        onTap: onTap,
        onDoubleTap: onDoubleTap,
        onLongPress: onRightClick, // Map right-click to long press
        onPanUpdate: onPanUpdate,
        child: child,
      );
    }
    
    // Default gesture detection
    return GestureDetector(
      onTap: onTap,
      onDoubleTap: onDoubleTap,
      onLongPress: onLongPress,
      onPanUpdate: onPanUpdate,
      child: child,
    );
  }
}
```

### **Keyboard Shortcuts**

```dart
// core/interaction/keyboard_shortcuts.dart

class KeyboardShortcutManager extends StatelessWidget {
  final Widget child;
  final Map<LogicalKeySet, VoidCallback> shortcuts;
  
  const KeyboardShortcutManager({
    Key? key,
    required this.child,
    required this.shortcuts,
  }) : super(key: key);
  
  static Map<LogicalKeySet, VoidCallback> get defaultShortcuts {
    final platform = PlatformDetector.current;
    final metaKey = platform == AppPlatform.macOS 
      ? LogicalKeyboardKey.meta 
      : LogicalKeyboardKey.control;
    
    return {
      LogicalKeySet(metaKey, LogicalKeyboardKey.keyS): () => print('Save'),
      LogicalKeySet(metaKey, LogicalKeyboardKey.keyO): () => print('Open'),
      LogicalKeySet(metaKey, LogicalKeyboardKey.keyN): () => print('New'),
      LogicalKeySet(metaKey, LogicalKeyboardKey.keyZ): () => print('Undo'),
      LogicalKeySet(metaKey, LogicalKeyboardKey.shift, LogicalKeyboardKey.keyZ): () => print('Redo'),
      LogicalKeySet(metaKey, LogicalKeyboardKey.keyC): () => print('Copy'),
      LogicalKeySet(metaKey, LogicalKeyboardKey.keyV): () => print('Paste'),
      LogicalKeySet(metaKey, LogicalKeyboardKey.keyX): () => print('Cut'),
      LogicalKeySet(metaKey, LogicalKeyboardKey.keyA): () => print('Select All'),
      LogicalKeySet(metaKey, LogicalKeyboardKey.keyF): () => print('Find'),
      LogicalKeySet(LogicalKeyboardKey.escape): () => print('Cancel'),
    };
  }
  
  @override
  Widget build(BuildContext context) {
    if (!PlatformDetector.supportsKeyboardShortcuts) {
      return child;
    }
    
    return Shortcuts(
      shortcuts: shortcuts.map(
        (key, value) => MapEntry(
          key,
          VoidCallbackIntent(value),
        ),
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

class VoidCallbackIntent extends Intent {
  final VoidCallback callback;
  const VoidCallbackIntent(this.callback);
}
```

---

## 🌈 **THEMING & STYLING**

For comprehensive theme architecture including ThemeProvider, unified spacing, decorations library, and status colors, see the [Platform Theme Architecture Guide](platform_theme_architecture_guide.md).

The theme architecture guide provides the complete theming system including:

**Core Theme Components**:
- **Unified Spacing Scale** - Consistent 4px base unit system
- **Decorations Library** - Standardized border radius, shadows, elevation
- **Status Color Mapping** - Semantic colors for order/payment/booking statuses
- **ThemeProvider** - Dynamic theme switching with platform adaptations

**Component-Level Theming** (for UI components in this library):

When building reusable UI components, apply theme values from the context:

```dart
class ThemedCard extends StatelessWidget {
  final Widget child;

  const ThemedCard({required this.child});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      color: theme.colorScheme.surface,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12), // From decorations library
      ),
      child: child,
    );
  }
}
```

**Quick Reference**:
- **Theme System**: See [Platform Theme Architecture](platform_theme_architecture_guide.md)
- **Spacing Values**: Use `AppSpacing` constants (8, 12, 16, 20, 24, 32, 48)
- **Status Colors**: Use `StatusColorMapper.forOrderStatus()`, `forPaymentStatus()`, etc.
- **Location**: `/lib/core/theme/`

---

## ✅ **UI IMPLEMENTATION CHECKLIST**

### **Component Library**
- [ ] Data tables with platform variants
- [ ] Card grid system
- [ ] Form fields with validation
- [ ] Date/time pickers
- [ ] Loading indicators
- [ ] Toast/notification system
- [ ] Modal/dialog variants
- [ ] Navigation components

### **Interaction Patterns**
- [ ] Platform-specific gestures
- [ ] Keyboard shortcuts
- [ ] Hover effects (desktop)
- [ ] Touch feedback (mobile)
- [ ] Context menus (desktop)
- [ ] Drag and drop

### **Theme System**
- [ ] Light/dark mode
- [ ] Platform-specific themes
- [ ] Custom color schemes
- [ ] Typography scale
- [ ] Spacing system
- [ ] Animation timing

### **Responsive Design**
- [ ] Breakpoint system
- [ ] Adaptive layouts
- [ ] Flexible grids
- [ ] Content containers
- [ ] Navigation patterns

### **Accessibility**
- [ ] Semantic labels
- [ ] Focus management
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] High contrast support
- [ ] Text scaling

---

**Document Status:** ✅ COMPLETE  
**Component Coverage:** Core UI patterns for all platforms  
**Next Steps:** Implement specific business components based on these patterns
