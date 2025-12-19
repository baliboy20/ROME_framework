# Flutter Mobile UI Patterns & Optimizations

**Version:** 1.0
**Created:** 2025-12-19
**Scope:** iOS and Android-specific UI patterns, mobile optimizations, and platform-native experiences for Flutter mobile applications

**Related Documents:**
- Core Design System: `/04_UI_UX/cross_platform_ui_core.md`
- Platform-Specific Guides: `web_ui_patterns.md`, `windows_ui_patterns.md`, `macos_ui_patterns.md`

---

## Overview

This document covers mobile-specific UI patterns for both iOS and Android platforms, including Material Design 3 for Android and Cupertino widgets for iOS. It focuses on creating platform-native mobile experiences while maintaining code efficiency.

---

## 📱 **MOBILE PLATFORM DETECTION**

### **Mobile-Specific Detection**

```dart
// mobile/platform/mobile_detector.dart

class MobileDetector {
  static bool get isIOS => Platform.isIOS;
  static bool get isAndroid => Platform.isAndroid;
  static bool get isMobile => isIOS || isAndroid;

  // Device characteristics
  static bool get hasNotch {
    final window = WidgetsBinding.instance.window;
    return window.viewPadding.top > 20;
  }

  static bool get isTablet {
    final data = MediaQueryData.fromWindow(WidgetsBinding.instance.window);
    return data.size.shortestSide >= 600;
  }

  static bool get isPhone {
    return !isTablet;
  }
}
```

---

## 🎨 **PLATFORM-SPECIFIC THEMES**

### **iOS Cupertino Theme**

```dart
// mobile/theme/ios_theme.dart

class IOSTheme {
  static CupertinoThemeData getCupertinoTheme(Brightness brightness) {
    return CupertinoThemeData(
      brightness: brightness,
      primaryColor: CupertinoColors.systemBlue,
      primaryContrastingColor: CupertinoColors.white,
      barBackgroundColor: brightness == Brightness.light
        ? CupertinoColors.systemBackground
        : CupertinoColors.darkBackgroundGray,
      scaffoldBackgroundColor: brightness == Brightness.light
        ? CupertinoColors.systemGroupedBackground
        : CupertinoColors.black,
      textTheme: CupertinoTextThemeData(
        primaryColor: brightness == Brightness.light
          ? CupertinoColors.black
          : CupertinoColors.white,
        textStyle: TextStyle(
          fontSize: 17,
          fontFamily: '.SF Pro Text',
          letterSpacing: -0.41,
        ),
      ),
    );
  }
}
```

### **Android Material Theme**

```dart
// mobile/theme/android_theme.dart

class AndroidTheme {
  static ThemeData getMaterialTheme(Brightness brightness) {
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: ColorScheme.fromSeed(
        seedColor: DesignTokens.colorScheme.primary,
        brightness: brightness,
      ),

      // Material 3 styling
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 3,
      ),

      // Material buttons
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),

      // Material cards
      cardTheme: CardTheme(
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),

      // Material inputs
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}
```

---

## 🎯 **ADAPTIVE MOBILE COMPONENTS**

### **Adaptive Navigation Bar**

```dart
// mobile/widgets/adaptive_navigation_bar.dart

class AdaptiveNavigationBar extends StatelessWidget {
  final List<NavigationItem> items;
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;

  const AdaptiveNavigationBar({
    Key? key,
    required this.items,
    required this.selectedIndex,
    required this.onItemSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (MobileDetector.isIOS) {
      return CupertinoTabBar(
        currentIndex: selectedIndex,
        onTap: onItemSelected,
        items: items.map((item) => BottomNavigationBarItem(
          icon: Icon(item.icon),
          label: item.label,
        )).toList(),
      );
    }

    return NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: onItemSelected,
      destinations: items.map((item) => NavigationDestination(
        icon: Icon(item.icon),
        label: item.label,
      )).toList(),
    );
  }
}
```

### **Adaptive Button**

```dart
// mobile/widgets/adaptive_button.dart

class AdaptiveMobileButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isPrimary;

  const AdaptiveMobileButton({
    Key? key,
    required this.onPressed,
    required this.child,
    this.isPrimary = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (MobileDetector.isIOS) {
      return CupertinoButton(
        onPressed: onPressed,
        color: isPrimary ? CupertinoColors.systemBlue : null,
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        borderRadius: BorderRadius.circular(10),
        child: child,
      );
    }

    return FilledButton(
      onPressed: onPressed,
      style: isPrimary ? null : FilledButton.styleFrom(
        backgroundColor: Theme.of(context).colorScheme.surface,
        foregroundColor: Theme.of(context).colorScheme.onSurface,
      ),
      child: child,
    );
  }
}
```

### **Adaptive App Bar**

```dart
// mobile/widgets/adaptive_app_bar.dart

class AdaptiveAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;

  const AdaptiveAppBar({
    Key? key,
    required this.title,
    this.actions,
    this.leading,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (MobileDetector.isIOS) {
      return CupertinoNavigationBar(
        middle: Text(title),
        trailing: actions != null
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: actions!,
            )
          : null,
        leading: leading,
      );
    }

    return AppBar(
      title: Text(title),
      actions: actions,
      leading: leading,
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(
    MobileDetector.isIOS ? 44 : 56,
  );
}
```

### **Adaptive Dialog**

```dart
// mobile/dialogs/adaptive_mobile_dialog.dart

class AdaptiveMobileDialog {
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required Widget content,
    List<AdaptiveDialogAction> actions = const [],
  }) {
    if (MobileDetector.isIOS) {
      return showCupertinoDialog<T>(
        context: context,
        builder: (context) => CupertinoAlertDialog(
          title: Text(title),
          content: content,
          actions: actions.map((action) => CupertinoDialogAction(
            onPressed: () => action.onPressed(context),
            isDefaultAction: action.isPrimary,
            child: Text(action.label),
          )).toList(),
        ),
      );
    }

    return showDialog<T>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: content,
        actions: actions.map((action) => TextButton(
          onPressed: () => action.onPressed(context),
          child: Text(action.label),
        )).toList(),
      ),
    );
  }
}
```

### **Adaptive Bottom Sheet**

```dart
// mobile/widgets/adaptive_bottom_sheet.dart

class AdaptiveBottomSheet {
  static Future<T?> show<T>({
    required BuildContext context,
    required Widget child,
    bool isDismissible = true,
  }) {
    if (MobileDetector.isIOS) {
      return showCupertinoModalPopup<T>(
        context: context,
        builder: (context) => Container(
          decoration: BoxDecoration(
            color: CupertinoTheme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
          ),
          child: SafeArea(
            child: child,
          ),
        ),
      );
    }

    return showModalBottomSheet<T>(
      context: context,
      isDismissible: isDismissible,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(child: child),
    );
  }
}
```

---

## 📱 **IOS-SPECIFIC PATTERNS**

### **iOS Sliver Navigation**

```dart
// mobile/ios/ios_sliver_nav.dart

class IOSSliverNavigation extends StatelessWidget {
  final String title;
  final Widget body;

  const IOSSliverNavigation({
    Key? key,
    required this.title,
    required this.body,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      child: CustomScrollView(
        slivers: [
          CupertinoSliverNavigationBar(
            largeTitle: Text(title),
            stretch: true,
          ),
          SliverToBoxAdapter(
            child: body,
          ),
        ],
      ),
    );
  }
}
```

### **iOS Segmented Control**

```dart
// mobile/ios/ios_segmented_control.dart

class IOSSegmentedControl<T> extends StatelessWidget {
  final Map<T, String> segments;
  final T selectedValue;
  final ValueChanged<T> onValueChanged;

  const IOSSegmentedControl({
    Key? key,
    required this.segments,
    required this.selectedValue,
    required this.onValueChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CupertinoSegmentedControl<T>(
      children: segments.map((key, value) => MapEntry(
        key,
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(value),
        ),
      )),
      groupValue: selectedValue,
      onValueChanged: onValueChanged,
    );
  }
}
```

### **iOS List Tile**

```dart
// mobile/ios/ios_list_tile.dart

class IOSListTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  const IOSListTile({
    Key? key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CupertinoListTile(
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      leading: leading,
      trailing: trailing ?? CupertinoListTileChevron(),
      onTap: onTap,
    );
  }
}
```

---

## 🤖 **ANDROID-SPECIFIC PATTERNS**

### **Material 3 FAB with Extended State**

```dart
// mobile/android/material_fab.dart

class MaterialExtendedFAB extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  final bool isExtended;

  const MaterialExtendedFAB({
    Key? key,
    required this.label,
    required this.icon,
    required this.onPressed,
    this.isExtended = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (isExtended) {
      return FloatingActionButton.extended(
        onPressed: onPressed,
        icon: Icon(icon),
        label: Text(label),
      );
    }

    return FloatingActionButton(
      onPressed: onPressed,
      child: Icon(icon),
    );
  }
}
```

### **Material Navigation Rail**

```dart
// mobile/android/material_navigation_rail.dart

class MaterialNavigationRail extends StatelessWidget {
  final List<NavigationItem> items;
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;
  final bool extended;

  const MaterialNavigationRail({
    Key? key,
    required this.items,
    required this.selectedIndex,
    required this.onItemSelected,
    this.extended = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return NavigationRail(
      extended: extended,
      selectedIndex: selectedIndex,
      onDestinationSelected: onItemSelected,
      destinations: items.map((item) => NavigationRailDestination(
        icon: Icon(item.icon),
        label: Text(item.label),
      )).toList(),
    );
  }
}
```

### **Material Bottom App Bar**

```dart
// mobile/android/material_bottom_app_bar.dart

class MaterialBottomAppBar extends StatelessWidget {
  final List<Widget> actions;
  final Widget? floatingActionButton;

  const MaterialBottomAppBar({
    Key? key,
    required this.actions,
    this.floatingActionButton,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: FloatingActionButtonLocation.endContained,
      bottomNavigationBar: BottomAppBar(
        child: Row(
          children: [
            ...actions,
          ],
        ),
      ),
    );
  }
}
```

---

## 🚀 **MOBILE PERFORMANCE OPTIMIZATIONS**

### **Image Loading for Mobile**

```dart
// mobile/performance/mobile_image_loading.dart

class MobileImageLoading {
  static Widget optimizedImage({
    required String imageUrl,
    double? width,
    double? height,
    BoxFit fit = BoxFit.cover,
  }) {
    return Image.network(
      imageUrl,
      width: width,
      height: height,
      fit: fit,
      // Mobile-optimized caching
      cacheWidth: width?.toInt(),
      cacheHeight: height?.toInt(),
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;

        return Container(
          width: width,
          height: height,
          color: Colors.grey.shade200,
          child: Center(
            child: MobileDetector.isIOS
              ? CupertinoActivityIndicator()
              : CircularProgressIndicator(
                  value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded /
                      loadingProgress.expectedTotalBytes!
                    : null,
                ),
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) {
        return Container(
          width: width,
          height: height,
          color: Colors.grey.shade300,
          child: Icon(Icons.error, color: Colors.grey),
        );
      },
    );
  }
}
```

### **Efficient List Rendering**

```dart
// mobile/performance/mobile_list_optimization.dart

class MobileListOptimization {
  static Widget buildOptimizedList({
    required int itemCount,
    required Widget Function(BuildContext, int) itemBuilder,
    double? itemExtent,
  }) {
    return ListView.builder(
      itemCount: itemCount,
      itemBuilder: itemBuilder,
      itemExtent: itemExtent,
      // Mobile-optimized settings
      cacheExtent: 100, // Smaller cache for mobile
      addAutomaticKeepAlives: false,
      addRepaintBoundaries: true,
      physics: MobileDetector.isIOS
        ? BouncingScrollPhysics()
        : ClampingScrollPhysics(),
    );
  }
}
```

### **Memory Management**

```dart
// mobile/performance/memory_management.dart

class MobileMemoryManagement {
  static void disposeUnusedImages() {
    imageCache.clear();
    imageCache.clearLiveImages();
  }

  static void optimizeImageCache() {
    // Reduce cache size for mobile
    imageCache.maximumSize = 50; // Number of images
    imageCache.maximumSizeBytes = 50 << 20; // 50 MB
  }

  // Call on app initialization
  static void setupMobileOptimizations() {
    optimizeImageCache();
  }
}
```

---

## 🎨 **MOBILE GESTURE PATTERNS**

### **Swipe to Dismiss**

```dart
// mobile/gestures/swipe_to_dismiss.dart

class SwipeToDismiss extends StatelessWidget {
  final Widget child;
  final VoidCallback onDismissed;
  final String itemKey;

  const SwipeToDismiss({
    Key? key,
    required this.child,
    required this.onDismissed,
    required this.itemKey,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(itemKey),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismissed(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: EdgeInsets.only(right: 20),
        color: Colors.red,
        child: Icon(Icons.delete, color: Colors.white),
      ),
      child: child,
    );
  }
}
```

### **Pull to Refresh**

```dart
// mobile/gestures/pull_to_refresh.dart

class AdaptivePullToRefresh extends StatelessWidget {
  final Widget child;
  final Future<void> Function() onRefresh;

  const AdaptivePullToRefresh({
    Key? key,
    required this.child,
    required this.onRefresh,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (MobileDetector.isIOS) {
      return CustomScrollView(
        slivers: [
          CupertinoSliverRefreshControl(
            onRefresh: onRefresh,
          ),
          SliverToBoxAdapter(child: child),
        ],
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: child,
    );
  }
}
```

---

## 📱 **MOBILE LAYOUT PATTERNS**

### **Safe Area Handling**

```dart
// mobile/layout/safe_area_handling.dart

class MobileSafeArea extends StatelessWidget {
  final Widget child;
  final bool top;
  final bool bottom;

  const MobileSafeArea({
    Key? key,
    required this.child,
    this.top = true,
    this.bottom = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: top,
      bottom: bottom,
      child: child,
    );
  }
}
```

### **Responsive Mobile Layout**

```dart
// mobile/layout/responsive_mobile_layout.dart

class ResponsiveMobileLayout extends StatelessWidget {
  final Widget phone;
  final Widget? tablet;

  const ResponsiveMobileLayout({
    Key? key,
    required this.phone,
    this.tablet,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 600 && tablet != null) {
          return tablet!;
        }
        return phone;
      },
    );
  }
}
```

---

## ✅ **MOBILE IMPLEMENTATION CHECKLIST**

### **iOS-Specific**
- [ ] CupertinoNavigationBar
- [ ] CupertinoTabBar
- [ ] CupertinoButton
- [ ] CupertinoAlertDialog
- [ ] CupertinoSegmentedControl
- [ ] Bouncing scroll physics
- [ ] SF Pro Text font

### **Android-Specific**
- [ ] Material 3 AppBar
- [ ] NavigationBar/NavigationRail
- [ ] FilledButton
- [ ] AlertDialog
- [ ] FloatingActionButton
- [ ] Clamping scroll physics
- [ ] Roboto font

### **Cross-Platform Mobile**
- [ ] Adaptive navigation
- [ ] Adaptive buttons
- [ ] Adaptive dialogs
- [ ] Safe area handling
- [ ] Pull to refresh
- [ ] Swipe gestures

### **Performance**
- [ ] Image caching optimized
- [ ] List virtualization
- [ ] Memory management
- [ ] Lazy loading
- [ ] Widget recycling

---

## 🚨 **MOBILE-SPECIFIC PITFALLS**

### **Ignoring Safe Areas**

```dart
// ❌ WRONG: Content hidden by notch/home indicator
Container(
  child: Column(
    children: [
      Text('Title'),
      // Content may be hidden
    ],
  ),
)

// ✅ CORRECT: Respecting safe areas
SafeArea(
  child: Column(
    children: [
      Text('Title'),
      // Content visible
    ],
  ),
)
```

### **Wrong Scroll Physics**

```dart
// ❌ WRONG: Android physics on iOS
ListView(
  physics: ClampingScrollPhysics(),
)

// ✅ CORRECT: Platform-appropriate physics
ListView(
  physics: MobileDetector.isIOS
    ? BouncingScrollPhysics()
    : ClampingScrollPhysics(),
)
```

### **Large Image Loading**

```dart
// ❌ WRONG: Loading full-size images
Image.network('url_to_large_image.jpg')

// ✅ CORRECT: Optimized loading with cache dimensions
Image.network(
  'url_to_large_image.jpg',
  cacheWidth: 400,
  cacheHeight: 300,
)
```

---

**Document Status:** ✅ ACTIVE
**Platform Coverage:** iOS & Android
**Review Cycle:** Quarterly with mobile OS updates
**Last Updated:** 2025-12-19
