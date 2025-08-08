# Flutter UI Component Library & Pattern Guide

**Version:** 1.0  
**Created:** 2025-08-06  
**Purpose:** Comprehensive UI component patterns and implementation guide

---

## 🎨 **CORE UI COMPONENT LIBRARY**

### **1. Data Display Components**

#### **Adaptive Data Table**

```dart
// core/widgets/tables/adaptive_data_table.dart

class AdaptiveDataTable<T> extends StatelessWidget {
  final List<T> data;
  final List<DataColumn> columns;
  final DataRow Function(T item) rowBuilder;
  final bool showCheckboxColumn;
  final Function(T item)? onRowTap;
  final Function(List<T> items)? onSelectionChanged;
  
  const AdaptiveDataTable({
    Key? key,
    required this.data,
    required this.columns,
    required this.rowBuilder,
    this.showCheckboxColumn = false,
    this.onRowTap,
    this.onSelectionChanged,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return ResponsiveBuilder(
      mobile: (context, constraints) => _MobileDataList(
        data: data,
        onItemTap: onRowTap,
      ),
      tablet: (context, constraints) => _TabletDataTable(
        data: data,
        columns: columns.take(3).toList(), // Show only first 3 columns
        rowBuilder: rowBuilder,
        onRowTap: onRowTap,
      ),
      desktop: (context, constraints) => _DesktopDataTable(
        data: data,
        columns: columns,
        rowBuilder: rowBuilder,
        showCheckboxColumn: showCheckboxColumn,
        onRowTap: onRowTap,
        onSelectionChanged: onSelectionChanged,
      ),
    );
  }
}

class _DesktopDataTable<T> extends StatefulWidget {
  final List<T> data;
  final List<DataColumn> columns;
  final DataRow Function(T item) rowBuilder;
  final bool showCheckboxColumn;
  final Function(T item)? onRowTap;
  final Function(List<T> items)? onSelectionChanged;
  
  const _DesktopDataTable({
    required this.data,
    required this.columns,
    required this.rowBuilder,
    required this.showCheckboxColumn,
    this.onRowTap,
    this.onSelectionChanged,
  });
  
  @override
  State<_DesktopDataTable<T>> createState() => _DesktopDataTableState<T>();
}

class _DesktopDataTableState<T> extends State<_DesktopDataTable<T>> {
  final Set<int> _selectedRows = {};
  int? _sortColumnIndex;
  bool _sortAscending = true;
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final platform = PlatformDetector.current;
    
    // Platform-specific styling
    final headerStyle = TextStyle(
      fontWeight: FontWeight.w600,
      fontSize: platform == AppPlatform.macOS ? 12 : 14,
      color: theme.colorScheme.onSurface.withOpacity(0.7),
    );
    
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: theme.dividerColor,
          width: platform == AppPlatform.macOS ? 0.5 : 1,
        ),
        borderRadius: BorderRadius.circular(
          platform == AppPlatform.macOS ? 8 : 4,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(
          platform == AppPlatform.macOS ? 8 : 4,
        ),
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(
            theme.colorScheme.surface.withOpacity(0.5),
          ),
          columns: widget.columns,
          rows: widget.data.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final row = widget.rowBuilder(item);
            
            return DataRow(
              selected: _selectedRows.contains(index),
              onSelectChanged: widget.showCheckboxColumn
                ? (selected) {
                    setState(() {
                      if (selected ?? false) {
                        _selectedRows.add(index);
                      } else {
                        _selectedRows.remove(index);
                      }
                    });
                    widget.onSelectionChanged?.call(
                      _selectedRows.map((i) => widget.data[i]).toList(),
                    );
                  }
                : null,
              cells: row.cells,
            );
          }).toList(),
          showCheckboxColumn: widget.showCheckboxColumn,
          sortColumnIndex: _sortColumnIndex,
          sortAscending: _sortAscending,
        ),
      ),
    );
  }
}
```

#### **Card Grid System**

```dart
// core/widgets/grids/adaptive_card_grid.dart

class AdaptiveCardGrid<T> extends StatelessWidget {
  final List<T> items;
  final Widget Function(T item) itemBuilder;
  final double minItemWidth;
  final double spacing;
  final double aspectRatio;
  
  const AdaptiveCardGrid({
    Key? key,
    required this.items,
    required this.itemBuilder,
    this.minItemWidth = 250,
    this.spacing = 16,
    this.aspectRatio = 1.5,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = (constraints.maxWidth / minItemWidth).floor();
        final effectiveCount = crossAxisCount > 0 ? crossAxisCount : 1;
        
        if (PlatformDetector.isMobile) {
          // Mobile: Vertical scrolling list
          return ListView.builder(
            padding: EdgeInsets.all(spacing),
            itemCount: items.length,
            itemBuilder: (context, index) => Padding(
              padding: EdgeInsets.only(bottom: spacing),
              child: itemBuilder(items[index]),
            ),
          );
        }
        
        // Desktop/Tablet: Grid layout
        return GridView.builder(
          padding: EdgeInsets.all(spacing),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: effectiveCount,
            crossAxisSpacing: spacing,
            mainAxisSpacing: spacing,
            childAspectRatio: aspectRatio,
          ),
          itemCount: items.length,
          itemBuilder: (context, index) => itemBuilder(items[index]),
        );
      },
    );
  }
}
```

### **2. Form Components**

#### **Adaptive Form Field**

```dart
// core/widgets/forms/adaptive_form_field.dart

class AdaptiveFormField extends StatefulWidget {
  final String label;
  final String? hint;
  final String? errorText;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;
  final int? maxLines;
  final Widget? prefix;
  final Widget? suffix;
  final bool readOnly;
  
  const AdaptiveFormField({
    Key? key,
    required this.label,
    this.hint,
    this.errorText,
    this.controller,
    this.obscureText = false,
    this.keyboardType,
    this.inputFormatters,
    this.onChanged,
    this.validator,
    this.maxLines = 1,
    this.prefix,
    this.suffix,
    this.readOnly = false,
  }) : super(key: key);
  
  @override
  State<AdaptiveFormField> createState() => _AdaptiveFormFieldState();
}

class _AdaptiveFormFieldState extends State<AdaptiveFormField> {
  late FocusNode _focusNode;
  bool _isFocused = false;
  bool _hasError = false;
  
  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);
  }
  
  void _onFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final platform = PlatformDetector.current;
    
    // Platform-specific styling
    final borderRadius = BorderRadius.circular(
      platform == AppPlatform.macOS ? 6 : 
      platform == AppPlatform.windows ? 4 : 8,
    );
    
    final fillColor = platform == AppPlatform.macOS
      ? theme.colorScheme.surface.withOpacity(0.5)
      : platform == AppPlatform.windows
        ? theme.colorScheme.surface
        : null;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        if (platform != AppPlatform.web) ...[
          Text(
            widget.label,
            style: TextStyle(
              fontSize: platform == AppPlatform.macOS ? 13 : 14,
              fontWeight: FontWeight.w500,
              color: theme.colorScheme.onSurface,
            ),
          ),
          SizedBox(height: 6),
        ],
        
        // Input Field
        TextFormField(
          controller: widget.controller,
          focusNode: _focusNode,
          obscureText: widget.obscureText,
          keyboardType: widget.keyboardType,
          inputFormatters: widget.inputFormatters,
          onChanged: widget.onChanged,
          validator: (value) {
            final error = widget.validator?.call(value);
            setState(() {
              _hasError = error != null;
            });
            return error;
          },
          maxLines: widget.maxLines,
          readOnly: widget.readOnly,
          style: TextStyle(
            fontSize: platform == AppPlatform.macOS ? 13 : 14,
          ),
          decoration: InputDecoration(
            labelText: platform == AppPlatform.web ? widget.label : null,
            hintText: widget.hint,
            errorText: widget.errorText,
            prefixIcon: widget.prefix,
            suffixIcon: widget.suffix,
            filled: platform != AppPlatform.web,
            fillColor: fillColor,
            border: OutlineInputBorder(
              borderRadius: borderRadius,
              borderSide: BorderSide(
                color: _hasError 
                  ? theme.colorScheme.error
                  : theme.dividerColor,
                width: platform == AppPlatform.macOS ? 0.5 : 1,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: borderRadius,
              borderSide: BorderSide(
                color: theme.dividerColor,
                width: platform == AppPlatform.macOS ? 0.5 : 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: borderRadius,
              borderSide: BorderSide(
                color: theme.colorScheme.primary,
                width: platform == AppPlatform.macOS ? 1 : 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: borderRadius,
              borderSide: BorderSide(
                color: theme.colorScheme.error,
                width: 1,
              ),
            ),
            contentPadding: EdgeInsets.symmetric(
              horizontal: platform == AppPlatform.macOS ? 12 : 16,
              vertical: platform == AppPlatform.macOS ? 8 : 12,
            ),
          ),
        ),
      ],
    );
  }
  
  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    super.dispose();
  }
}
```

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

### **Dynamic Theme Provider**

```dart
// core/theme/theme_provider.dart

class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  Color _accentColor = Color(0xFF1976D2);
  bool _useMaterial3 = true;
  
  ThemeMode get themeMode => _themeMode;
  Color get accentColor => _accentColor;
  bool get useMaterial3 => _useMaterial3;
  
  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
    _savePreferences();
  }
  
  void setAccentColor(Color color) {
    _accentColor = color;
    notifyListeners();
    _savePreferences();
  }
  
  void toggleMaterial3() {
    _useMaterial3 = !_useMaterial3;
    notifyListeners();
    _savePreferences();
  }
  
  ThemeData getLightTheme(BuildContext context) {
    final platform = PlatformDetector.current;
    
    return ThemeData(
      useMaterial3: _useMaterial3,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _accentColor,
        brightness: Brightness.light,
      ).copyWith(
        // Platform-specific surface colors
        surface: platform == AppPlatform.macOS
          ? Color(0xFFF5F5F7)
          : platform == AppPlatform.windows
            ? Color(0xFFF3F3F3)
            : Colors.white,
      ),
      // Platform-specific component themes
      appBarTheme: _getAppBarTheme(platform, Brightness.light),
      cardTheme: _getCardTheme(platform, Brightness.light),
      elevatedButtonTheme: _getButtonTheme(platform, Brightness.light),
      inputDecorationTheme: _getInputTheme(platform, Brightness.light),
    );
  }
  
  ThemeData getDarkTheme(BuildContext context) {
    final platform = PlatformDetector.current;
    
    return ThemeData(
      useMaterial3: _useMaterial3,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _accentColor,
        brightness: Brightness.dark,
      ).copyWith(
        // Platform-specific dark surface colors
        surface: platform == AppPlatform.macOS
          ? Color(0xFF1C1C1E)
          : platform == AppPlatform.windows
            ? Color(0xFF202020)
            : Color(0xFF121212),
      ),
      // Platform-specific component themes
      appBarTheme: _getAppBarTheme(platform, Brightness.dark),
      cardTheme: _getCardTheme(platform, Brightness.dark),
      elevatedButtonTheme: _getButtonTheme(platform, Brightness.dark),
      inputDecorationTheme: _getInputTheme(platform, Brightness.dark),
    );
  }
  
  AppBarTheme _getAppBarTheme(AppPlatform platform, Brightness brightness) {
    return AppBarTheme(
      elevation: 0,
      centerTitle: platform == AppPlatform.macOS ? false : null,
      toolbarHeight: platform == AppPlatform.macOS ? 52 :
                    platform == AppPlatform.windows ? 48 : 56,
      backgroundColor: Colors.transparent,
    );
  }
  
  CardTheme _getCardTheme(AppPlatform platform, Brightness brightness) {
    return CardTheme(
      elevation: platform == AppPlatform.macOS ? 0 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(
          platform == AppPlatform.macOS ? 8 :
          platform == AppPlatform.windows ? 4 : 12,
        ),
        side: platform == AppPlatform.macOS
          ? BorderSide(
              color: brightness == Brightness.light
                ? Colors.grey.shade300
                : Colors.grey.shade700,
              width: 0.5,
            )
          : BorderSide.none,
      ),
    );
  }
  
  Future<void> _savePreferences() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('themeMode', _themeMode.index);
    await prefs.setInt('accentColor', _accentColor.value);
    await prefs.setBool('useMaterial3', _useMaterial3);
  }
  
  Future<void> loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    _themeMode = ThemeMode.values[prefs.getInt('themeMode') ?? 0];
    _accentColor = Color(prefs.getInt('accentColor') ?? 0xFF1976D2);
    _useMaterial3 = prefs.getBool('useMaterial3') ?? true;
    notifyListeners();
  }
}
```

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