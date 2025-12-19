# Flutter Web UI Patterns & Optimizations

**Version:** 1.0
**Created:** 2025-12-19
**Scope:** Web-specific UI patterns, components, and performance optimizations for Flutter web applications

**Related Documents:**
- Core Design System: `/04_UI_UX/cross_platform_ui_core.md`
- Platform-Specific Guides: `windows_ui_patterns.md`, `macos_ui_patterns.md`, `mobile_ui_patterns.md`

---

## Overview

This document covers web-specific UI patterns, components, and optimizations for Flutter web. It focuses on creating web-native experiences while maintaining Flutter's cross-platform advantages.

---

## 🌐 **WEB THEME CONFIGURATION**

### **Web-Specific Theme**

```dart
// core/theme/web_theme.dart

class WebTheme {
  static ThemeData getWebTheme(Brightness brightness) {
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: DesignTokens.colorScheme,

      // Web-specific styling (Material Design 3)
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: false,
        toolbarHeight: 64,
        backgroundColor: brightness == Brightness.light
          ? Colors.white
          : Color(0xFF1F1F1F),
      ),

      // Web button styling (larger touch targets)
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 2,
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),

      // Web card styling
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),

      // Web input decoration
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
```

---

## 🎯 **WEB-SPECIFIC COMPONENTS**

### **Web Navigation Drawer**

```dart
// web/widgets/web_navigation_drawer.dart

class WebNavigationDrawer extends StatelessWidget {
  final List<NavigationItem> items;
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;

  const WebNavigationDrawer({
    Key? key,
    required this.items,
    required this.selectedIndex,
    required this.onItemSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return NavigationDrawer(
      selectedIndex: selectedIndex,
      onDestinationSelected: onItemSelected,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Text(
            'Navigation',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        ...items.map((item) => NavigationDrawerDestination(
          icon: Icon(item.icon),
          label: Text(item.label),
        )),
      ],
    );
  }
}
```

### **Web Button with Hover Effects**

```dart
// web/widgets/web_button.dart

class WebButton extends StatefulWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isPrimary;

  const WebButton({
    Key? key,
    required this.onPressed,
    required this.child,
    this.isPrimary = false,
  }) : super(key: key);

  @override
  State<WebButton> createState() => _WebButtonState();
}

class _WebButtonState extends State<WebButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: SystemMouseCursors.click,
      child: AnimatedContainer(
        duration: Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: widget.isPrimary
            ? theme.colorScheme.primary
            : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(8),
          boxShadow: _isHovered ? [
            BoxShadow(
              color: widget.isPrimary
                ? theme.colorScheme.primary.withOpacity(0.4)
                : Colors.black.withOpacity(0.2),
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ] : [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: InkWell(
          onTap: widget.onPressed,
          borderRadius: BorderRadius.circular(8),
          child: DefaultTextStyle(
            style: TextStyle(
              color: widget.isPrimary
                ? theme.colorScheme.onPrimary
                : theme.colorScheme.onSurface,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
            child: widget.child,
          ),
        ),
      ),
    );
  }
}
```

### **Web Dialog**

```dart
// web/dialogs/web_dialog.dart

class WebDialog {
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required Widget content,
    List<AdaptiveDialogAction> actions = const [],
  }) {
    return showDialog<T>(
      context: context,
      barrierColor: Colors.black.withOpacity(0.5),
      builder: (context) => Center(
        child: Container(
          width: 500,
          margin: EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 24,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Title bar
              Container(
                padding: EdgeInsets.all(24),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: Theme.of(context).dividerColor,
                      width: 1,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              // Content
              Padding(
                padding: EdgeInsets.all(24),
                child: content,
              ),
              // Actions
              if (actions.isNotEmpty)
                Container(
                  padding: EdgeInsets.all(24),
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
                      padding: EdgeInsets.only(left: 12),
                      child: WebButton(
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

## 🚀 **WEB-SPECIFIC PERFORMANCE OPTIMIZATIONS**

### **Image Loading Optimization**

```dart
// core/performance/web_optimizations.dart

class WebOptimizations {
  // Lazy loading for web
  static Widget lazyLoadImage({
    required String url,
    double? width,
    double? height,
    BoxFit? fit,
  }) {
    if (!PlatformDetector.isWeb) {
      return Image.network(url, width: width, height: height, fit: fit);
    }

    return FadeInImage.memoryNetwork(
      placeholder: kTransparentImage, // 1x1 transparent image
      image: url,
      width: width,
      height: height,
      fit: fit,
      fadeInDuration: Duration(milliseconds: 300),
      imageErrorBuilder: (context, error, stackTrace) {
        return Container(
          width: width,
          height: height,
          color: Colors.grey.shade200,
          child: Icon(Icons.broken_image, color: Colors.grey),
        );
      },
    );
  }

  // Virtual scrolling for large lists
  static Widget virtualScroll({
    required int itemCount,
    required Widget Function(BuildContext, int) itemBuilder,
    double itemExtent = 60,
  }) {
    if (!PlatformDetector.isWeb) {
      return ListView.builder(
        itemCount: itemCount,
        itemBuilder: itemBuilder,
        itemExtent: itemExtent,
      );
    }

    return ListView.builder(
      itemCount: itemCount,
      itemBuilder: itemBuilder,
      itemExtent: itemExtent,
      cacheExtent: 200, // Smaller cache for web
      addAutomaticKeepAlives: false, // Disable keep alives for web
      addRepaintBoundaries: false, // Reduce paint complexity
    );
  }

  // Optimize text rendering for web
  static TextStyle optimizeTextForWeb(TextStyle style) {
    return style.copyWith(
      // Force anti-aliasing for web
      fontFamilyFallback: ['system-ui', 'sans-serif'],
      // Optimize rendering
      letterSpacing: style.letterSpacing ?? 0.0,
    );
  }
}
```

### **Code Splitting & Lazy Loading**

```dart
// web/utils/lazy_loading.dart

class LazyLoading {
  // Lazy load heavy widgets
  static Widget lazyWidget(Future<Widget> Function() loader) {
    return FutureBuilder<Widget>(
      future: loader(),
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return snapshot.data!;
        }
        return Center(
          child: CircularProgressIndicator(),
        );
      },
    );
  }

  // Preload routes for faster navigation
  static void preloadRoute(BuildContext context, Widget Function() builder) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      precacheImage(
        AssetImage('assets/images/route_preview.png'),
        context,
      );
    });
  }
}
```

### **Web-Specific Caching**

```dart
// web/cache/web_cache.dart

class WebCache {
  static final _cache = <String, dynamic>{};

  // Cache API responses
  static void cacheResponse(String key, dynamic data) {
    _cache[key] = data;
  }

  static dynamic getCachedResponse(String key) {
    return _cache[key];
  }

  // Cache images with service worker
  static Future<void> cacheImages(List<String> imageUrls) async {
    for (final url in imageUrls) {
      await precacheImage(NetworkImage(url), navigatorKey.currentContext!);
    }
  }
}
```

---

## 🎨 **WEB-SPECIFIC LAYOUT PATTERNS**

### **Responsive Web Layout**

```dart
// web/layout/responsive_web_layout.dart

class ResponsiveWebLayout extends StatelessWidget {
  final Widget body;
  final Widget? sidebar;
  final Widget? header;
  final Widget? footer;

  const ResponsiveWebLayout({
    Key? key,
    required this.body,
    this.sidebar,
    this.header,
    this.footer,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          if (header != null) header!,
          Expanded(
            child: Center(
              child: Container(
                constraints: BoxConstraints(
                  maxWidth: Breakpoints.webMaxContentWidth,
                ),
                child: Row(
                  children: [
                    if (sidebar != null) ...[
                      Container(
                        width: 280,
                        decoration: BoxDecoration(
                          border: Border(
                            right: BorderSide(
                              color: Theme.of(context).dividerColor,
                            ),
                          ),
                        ),
                        child: sidebar!,
                      ),
                    ],
                    Expanded(
                      child: body,
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (footer != null) footer!,
        ],
      ),
    );
  }
}
```

### **Web Grid System**

```dart
// web/layout/web_grid.dart

class WebGrid extends StatelessWidget {
  final List<Widget> children;
  final int columns;
  final double spacing;
  final double runSpacing;

  const WebGrid({
    Key? key,
    required this.children,
    this.columns = 3,
    this.spacing = 16,
    this.runSpacing = 16,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Responsive column count
        int responsiveColumns = columns;
        if (constraints.maxWidth < Breakpoints.tablet) {
          responsiveColumns = 1;
        } else if (constraints.maxWidth < Breakpoints.desktop) {
          responsiveColumns = 2;
        }

        return Wrap(
          spacing: spacing,
          runSpacing: runSpacing,
          children: children.map((child) {
            final itemWidth = (constraints.maxWidth -
              (spacing * (responsiveColumns - 1))) / responsiveColumns;

            return SizedBox(
              width: itemWidth,
              child: child,
            );
          }).toList(),
        );
      },
    );
  }
}
```

---

## 🖱️ **WEB INTERACTION PATTERNS**

### **Hover Effects**

```dart
// web/widgets/hover_card.dart

class HoverCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;

  const HoverCard({
    Key? key,
    required this.child,
    this.onTap,
  }) : super(key: key);

  @override
  State<HoverCard> createState() => _HoverCardState();
}

class _HoverCardState extends State<HoverCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: widget.onTap != null
        ? SystemMouseCursors.click
        : SystemMouseCursors.basic,
      child: AnimatedContainer(
        duration: Duration(milliseconds: 200),
        transform: Matrix4.identity()
          ..scale(_isHovered ? 1.02 : 1.0),
        child: Card(
          elevation: _isHovered ? 8 : 2,
          child: InkWell(
            onTap: widget.onTap,
            child: widget.child,
          ),
        ),
      ),
    );
  }
}
```

### **Context Menu**

```dart
// web/widgets/web_context_menu.dart

class WebContextMenu extends StatelessWidget {
  final Widget child;
  final List<ContextMenuItem> menuItems;

  const WebContextMenu({
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
          items: menuItems.map((item) => PopupMenuItem(
            value: item.value,
            child: Row(
              children: [
                if (item.icon != null) ...[
                  Icon(item.icon, size: 18),
                  SizedBox(width: 12),
                ],
                Text(item.label),
              ],
            ),
          )).toList(),
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

## 📊 **WEB ANALYTICS & MONITORING**

### **Performance Monitoring**

```dart
// web/monitoring/web_performance.dart

class WebPerformanceMonitor {
  static void trackPageLoad(String routeName) {
    final loadTime = DateTime.now().millisecondsSinceEpoch;
    print('Page loaded: $routeName in ${loadTime}ms');

    // Send to analytics service
    // analytics.logEvent('page_load', {'route': routeName, 'time': loadTime});
  }

  static void trackInteraction(String action) {
    print('User interaction: $action');

    // Send to analytics service
    // analytics.logEvent('user_interaction', {'action': action});
  }
}
```

---

## ✅ **WEB IMPLEMENTATION CHECKLIST**

### **Theme & Styling**
- [ ] Web-specific theme configured
- [ ] Hover states implemented
- [ ] Focus indicators added
- [ ] Web-safe fonts selected

### **Components**
- [ ] Navigation drawer/menu
- [ ] Button variants with hover
- [ ] Modal dialogs
- [ ] Context menus
- [ ] Form inputs

### **Performance**
- [ ] Image lazy loading
- [ ] List virtualization
- [ ] Code splitting
- [ ] Asset optimization
- [ ] Caching strategy

### **Layout**
- [ ] Responsive grid system
- [ ] Max content width
- [ ] Sticky headers/footers
- [ ] Flexible sidebar

### **Interactions**
- [ ] Mouse hover effects
- [ ] Keyboard shortcuts
- [ ] Right-click menus
- [ ] Drag and drop

---

## 🚨 **WEB-SPECIFIC PITFALLS**

### **Performance Issues**

```dart
// ❌ WRONG: Heavy renders on every hover
MouseRegion(
  onHover: (_) => setState(() {}), // Rebuilds entire widget tree
)

// ✅ CORRECT: Scoped rebuilds
MouseRegion(
  onEnter: (_) => _hoverNotifier.value = true,
  child: ValueListenableBuilder(
    valueListenable: _hoverNotifier,
    builder: (context, isHovered, child) => _buildContent(isHovered),
  ),
)
```

### **Layout Issues**

```dart
// ❌ WRONG: No max width constraint
Container(
  width: double.infinity,
  child: Text('Very long text...'),
)

// ✅ CORRECT: Max width for readability
Container(
  constraints: BoxConstraints(maxWidth: 1200),
  child: Text('Very long text...'),
)
```

---

**Document Status:** ✅ ACTIVE
**Platform Coverage:** Flutter Web
**Review Cycle:** Quarterly with web framework updates
**Last Updated:** 2025-12-19
