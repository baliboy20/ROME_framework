# Flutter UI/UX Design System & Cross-Platform Architecture Guide

**Version:** 1.0  
**Created:** 2025-08-06  
**Scope:** Comprehensive UI/UX standards for Flutter web, Windows, and macOS platforms

---

## 🎨 **DESIGN SYSTEM ARCHITECTURE**

### **Core Design Principles**

```yaml
Design Philosophy:
  Primary: Platform-Adaptive Design
  Secondary: Brand Consistency
  Approach: Progressive Enhancement
  
Key Principles:
  1. Respect Platform Conventions
  2. Maintain Brand Identity
  3. Optimize for Each Platform
  4. Ensure Accessibility
  5. Performance First
```

### **Design Token System (MANDATORY)**

```dart
// core/design_system/tokens/design_tokens.dart

abstract class DesignTokens {
  // Color Tokens
  static const ColorScheme colorScheme = ColorScheme(
    // Brand Colors (Consistent across platforms)
    primary: Color(0xFF1976D2),
    primaryContainer: Color(0xFF42A5F5),
    secondary: Color(0xFFFF6B35),
    secondaryContainer: Color(0xFFFF8A65),
    
    // Semantic Colors
    error: Color(0xFFD32F2F),
    errorContainer: Color(0xFFFFCDD2),
    success: Color(0xFF388E3C),
    successContainer: Color(0xFFC8E6C9),
    warning: Color(0xFFF57C00),
    warningContainer: Color(0xFFFFE0B2),
    
    // Surface Colors (Platform-adaptive)
    surface: Color(0xFFFAFAFA),
    surfaceVariant: Color(0xFFF5F5F5),
    background: Color(0xFFFFFFFF),
    
    // Content Colors
    onPrimary: Color(0xFFFFFFFF),
    onSecondary: Color(0xFFFFFFFF),
    onSurface: Color(0xFF212121),
    onBackground: Color(0xFF212121),
    
    brightness: Brightness.light,
  );
  
  // Typography Tokens
  static const typography = Typography(
    displayLarge: TextStyle(
      fontSize: 57,
      fontWeight: FontWeight.w400,
      letterSpacing: -0.25,
      height: 1.12,
    ),
    displayMedium: TextStyle(
      fontSize: 45,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      height: 1.16,
    ),
    displaySmall: TextStyle(
      fontSize: 36,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      height: 1.22,
    ),
    headlineLarge: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.w500,
      letterSpacing: 0,
      height: 1.25,
    ),
    headlineMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w500,
      letterSpacing: 0,
      height: 1.29,
    ),
    headlineSmall: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w500,
      letterSpacing: 0,
      height: 1.33,
    ),
    titleLarge: TextStyle(
      fontSize: 22,
      fontWeight: FontWeight.w500,
      letterSpacing: 0,
      height: 1.27,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.15,
      height: 1.50,
    ),
    titleSmall: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
      height: 1.43,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.5,
      height: 1.50,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      height: 1.43,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
      height: 1.33,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
      height: 1.43,
    ),
    labelMedium: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.5,
      height: 1.33,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.5,
      height: 1.45,
    ),
  );
  
  // Spacing Tokens (8-point grid system)
  static const spacing = Spacing(
    xs: 4.0,   // 0.5x
    sm: 8.0,   // 1x
    md: 16.0,  // 2x
    lg: 24.0,  // 3x
    xl: 32.0,  // 4x
    xxl: 48.0, // 6x
    xxxl: 64.0, // 8x
  );
  
  // Radius Tokens
  static const radius = BorderRadius(
    none: 0.0,
    sm: 4.0,
    md: 8.0,
    lg: 12.0,
    xl: 16.0,
    xxl: 24.0,
    round: 999.0,
  );
  
  // Elevation Tokens
  static const elevation = Elevation(
    level0: 0.0,
    level1: 1.0,
    level2: 3.0,
    level3: 6.0,
    level4: 8.0,
    level5: 12.0,
  );
  
  // Animation Tokens
  static const animation = Animation(
    durationFast: Duration(milliseconds: 150),
    durationMedium: Duration(milliseconds: 300),
    durationSlow: Duration(milliseconds: 500),
    curveDefault: Curves.easeInOut,
    curveEmphasized: Curves.easeOutCubic,
    curveDecelerated: Curves.decelerate,
  );
}
```

---

## 🖥️ **PLATFORM-SPECIFIC DESIGN PATTERNS**

### **Platform Detection & Adaptation**

```dart
// core/platform/platform_detector.dart

import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

enum AppPlatform {
  web,
  windows,
  macOS,
  iOS,
  android,
  linux,
}

class PlatformDetector {
  static AppPlatform get current {
    if (kIsWeb) return AppPlatform.web;
    if (Platform.isWindows) return AppPlatform.windows;
    if (Platform.isMacOS) return AppPlatform.macOS;
    if (Platform.isIOS) return AppPlatform.iOS;
    if (Platform.isAndroid) return AppPlatform.android;
    if (Platform.isLinux) return AppPlatform.linux;
    throw UnsupportedError('Platform not supported');
  }
  
  static bool get isDesktop {
    return Platform.isWindows || Platform.isMacOS || Platform.isLinux;
  }
  
  static bool get isMobile {
    return Platform.isIOS || Platform.isAndroid;
  }
  
  static bool get isWeb => kIsWeb;
  
  static bool get isApple {
    return Platform.isMacOS || Platform.isIOS;
  }
  
  static bool get isMicrosoft {
    return Platform.isWindows;
  }
  
  // Platform-specific capabilities
  static bool get supportsHover => isDesktop || isWeb;
  static bool get supportsTouchGestures => isMobile || isWeb;
  static bool get supportsKeyboardShortcuts => isDesktop || isWeb;
  static bool get supportsContextMenu => isDesktop;
  static bool get supportsWindowManagement => isDesktop;
}
```

### **Adaptive Theme System**

```dart
// core/theme/adaptive_theme.dart

class AdaptiveTheme {
  static ThemeData getTheme(BuildContext context) {
    final platform = PlatformDetector.current;
    final brightness = MediaQuery.of(context).platformBrightness;
    
    return switch (platform) {
      AppPlatform.macOS => _getMacOSTheme(brightness),
      AppPlatform.windows => _getWindowsTheme(brightness),
      AppPlatform.web => _getWebTheme(brightness),
      AppPlatform.iOS => _getCupertinoTheme(brightness),
      AppPlatform.android => _getMaterialTheme(brightness),
      _ => _getDefaultTheme(brightness),
    };
  }
  
  static ThemeData _getMacOSTheme(Brightness brightness) {
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
  
  static ThemeData _getWindowsTheme(Brightness brightness) {
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
  
  static ThemeData _getWebTheme(Brightness brightness) {
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

## 📐 **RESPONSIVE DESIGN SYSTEM**

### **Breakpoint System**

```dart
// core/responsive/breakpoints.dart

class Breakpoints {
  // Standard breakpoints
  static const double mobile = 0;      // 0-599
  static const double tablet = 600;    // 600-1023
  static const double desktop = 1024;  // 1024-1439
  static const double wide = 1440;     // 1440+
  
  // Platform-specific adjustments
  static const double macOSMinWidth = 800;
  static const double windowsMinWidth = 768;
  static const double webMaxContentWidth = 1200;
}

class ResponsiveBuilder extends StatelessWidget {
  final Widget Function(BuildContext, BoxConstraints) mobile;
  final Widget Function(BuildContext, BoxConstraints)? tablet;
  final Widget Function(BuildContext, BoxConstraints)? desktop;
  final Widget Function(BuildContext, BoxConstraints)? wide;
  
  const ResponsiveBuilder({
    Key? key,
    required this.mobile,
    this.tablet,
    this.desktop,
    this.wide,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= Breakpoints.wide && wide != null) {
          return wide!(context, constraints);
        }
        if (constraints.maxWidth >= Breakpoints.desktop && desktop != null) {
          return desktop!(context, constraints);
        }
        if (constraints.maxWidth >= Breakpoints.tablet && tablet != null) {
          return tablet!(context, constraints);
        }
        return mobile(context, constraints);
      },
    );
  }
}
```

### **Adaptive Layout System**

```dart
// core/layout/adaptive_layout.dart

class AdaptiveLayout extends StatelessWidget {
  final Widget? navigationRail;
  final Widget? sidebar;
  final Widget body;
  final Widget? bottomNavigation;
  
  const AdaptiveLayout({
    Key? key,
    this.navigationRail,
    this.sidebar,
    required this.body,
    this.bottomNavigation,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return ResponsiveBuilder(
      mobile: (context, constraints) => _MobileLayout(
        body: body,
        bottomNavigation: bottomNavigation,
      ),
      tablet: (context, constraints) => _TabletLayout(
        navigationRail: navigationRail,
        body: body,
      ),
      desktop: (context, constraints) => _DesktopLayout(
        sidebar: sidebar,
        body: body,
      ),
    );
  }
}

class _MobileLayout extends StatelessWidget {
  final Widget body;
  final Widget? bottomNavigation;
  
  const _MobileLayout({
    required this.body,
    this.bottomNavigation,
  });
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: body,
      bottomNavigationBar: bottomNavigation,
    );
  }
}

class _TabletLayout extends StatelessWidget {
  final Widget? navigationRail;
  final Widget body;
  
  const _TabletLayout({
    this.navigationRail,
    required this.body,
  });
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          if (navigationRail != null) navigationRail!,
          Expanded(child: body),
        ],
      ),
    );
  }
}

class _DesktopLayout extends StatelessWidget {
  final Widget? sidebar;
  final Widget body;
  
  const _DesktopLayout({
    this.sidebar,
    required this.body,
  });
  
  @override
  Widget build(BuildContext context) {
    final platform = PlatformDetector.current;
    
    return Scaffold(
      body: Row(
        children: [
          if (sidebar != null) ...[
            Container(
              width: platform == AppPlatform.macOS ? 250 : 280,
              decoration: BoxDecoration(
                border: Border(
                  right: BorderSide(
                    color: Theme.of(context).dividerColor,
                    width: 1,
                  ),
                ),
              ),
              child: sidebar!,
            ),
          ],
          Expanded(
            child: platform == AppPlatform.web
              ? Center(
                  child: Container(
                    constraints: BoxConstraints(
                      maxWidth: Breakpoints.webMaxContentWidth,
                    ),
                    child: body,
                  ),
                )
              : body,
          ),
        ],
      ),
    );
  }
}
```

---

## 🎯 **PLATFORM-SPECIFIC UI COMPONENTS**

### **1. Navigation Patterns**

```dart
// core/navigation/adaptive_navigation.dart

class AdaptiveNavigation extends StatelessWidget {
  final List<NavigationItem> items;
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;
  
  const AdaptiveNavigation({
    Key? key,
    required this.items,
    required this.selectedIndex,
    required this.onItemSelected,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    final platform = PlatformDetector.current;
    
    return switch (platform) {
      AppPlatform.macOS => _MacOSSidebar(
        items: items,
        selectedIndex: selectedIndex,
        onItemSelected: onItemSelected,
      ),
      AppPlatform.windows => _WindowsNavigationView(
        items: items,
        selectedIndex: selectedIndex,
        onItemSelected: onItemSelected,
      ),
      AppPlatform.web => _WebNavigationDrawer(
        items: items,
        selectedIndex: selectedIndex,
        onItemSelected: onItemSelected,
      ),
      _ => _DefaultNavigationRail(
        items: items,
        selectedIndex: selectedIndex,
        onItemSelected: onItemSelected,
      ),
    };
  }
}

// macOS-style sidebar
class _MacOSSidebar extends StatelessWidget {
  final List<NavigationItem> items;
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;
  
  @override
  Widget build(BuildContext context) {
    return Container(
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

### **2. Platform-Specific Buttons**

```dart
// core/widgets/adaptive_button.dart

class AdaptiveButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final ButtonStyle? style;
  final bool isPrimary;
  
  const AdaptiveButton({
    Key? key,
    required this.onPressed,
    required this.child,
    this.style,
    this.isPrimary = false,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    final platform = PlatformDetector.current;
    
    return switch (platform) {
      AppPlatform.macOS => _MacOSButton(
        onPressed: onPressed,
        isPrimary: isPrimary,
        child: child,
      ),
      AppPlatform.windows => _WindowsButton(
        onPressed: onPressed,
        isPrimary: isPrimary,
        child: child,
      ),
      AppPlatform.web => _WebButton(
        onPressed: onPressed,
        isPrimary: isPrimary,
        child: child,
      ),
      _ => ElevatedButton(
        onPressed: onPressed,
        style: style,
        child: child,
      ),
    };
  }
}

class _MacOSButton extends StatefulWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isPrimary;
  
  const _MacOSButton({
    required this.onPressed,
    required this.child,
    required this.isPrimary,
  });
  
  @override
  State<_MacOSButton> createState() => _MacOSButtonState();
}

class _MacOSButtonState extends State<_MacOSButton> {
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

### **3. Platform-Specific Dialogs**

```dart
// core/dialogs/adaptive_dialog.dart

class AdaptiveDialog {
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required Widget content,
    List<AdaptiveDialogAction> actions = const [],
  }) {
    final platform = PlatformDetector.current;
    
    return switch (platform) {
      AppPlatform.macOS => _showMacOSDialog<T>(
        context: context,
        title: title,
        content: content,
        actions: actions,
      ),
      AppPlatform.windows => _showWindowsDialog<T>(
        context: context,
        title: title,
        content: content,
        actions: actions,
      ),
      AppPlatform.web => _showWebDialog<T>(
        context: context,
        title: title,
        content: content,
        actions: actions,
      ),
      _ => _showDefaultDialog<T>(
        context: context,
        title: title,
        content: content,
        actions: actions,
      ),
    };
  }
  
  static Future<T?> _showMacOSDialog<T>({
    required BuildContext context,
    required String title,
    required Widget content,
    required List<AdaptiveDialogAction> actions,
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
                    child: AdaptiveButton(
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

## 🚀 **PERFORMANCE OPTIMIZATION BY PLATFORM**

### **Web-Specific Optimizations**

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
}
```

### **Desktop-Specific Optimizations**

```dart
// core/performance/desktop_optimizations.dart

class DesktopOptimizations {
  // Window management for desktop
  static Future<void> setupWindow() async {
    if (!PlatformDetector.isDesktop) return;
    
    await windowManager.ensureInitialized();
    
    WindowOptions windowOptions = WindowOptions(
      size: Size(1280, 720),
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
  
  // Keyboard shortcuts for desktop
  static Widget withKeyboardShortcuts({
    required Widget child,
    required Map<LogicalKeySet, VoidCallback> shortcuts,
  }) {
    if (!PlatformDetector.supportsKeyboardShortcuts) {
      return child;
    }
    
    return Shortcuts(
      shortcuts: shortcuts.map(
        (key, value) => MapEntry(key, VoidCallbackIntent(value)),
      ),
      child: Actions(
        actions: shortcuts.map(
          (key, value) => MapEntry(
            VoidCallbackIntent,
            CallbackAction<VoidCallbackIntent>(
              onInvoke: (intent) => value(),
            ),
          ),
        ),
        child: child,
      ),
    );
  }
}
```

---

## 🎨 **CUSTOM PAINT & ANIMATIONS**

### **Platform-Aware Animations**

```dart
// core/animations/adaptive_animations.dart

class AdaptiveAnimations {
  static Duration getDuration(AnimationSpeed speed) {
    final platform = PlatformDetector.current;
    
    // Slower animations on Windows
    if (platform == AppPlatform.windows) {
      return switch (speed) {
        AnimationSpeed.fast => Duration(milliseconds: 200),
        AnimationSpeed.medium => Duration(milliseconds: 350),
        AnimationSpeed.slow => Duration(milliseconds: 600),
      };
    }
    
    // Faster animations on macOS
    if (platform == AppPlatform.macOS) {
      return switch (speed) {
        AnimationSpeed.fast => Duration(milliseconds: 100),
        AnimationSpeed.medium => Duration(milliseconds: 250),
        AnimationSpeed.slow => Duration(milliseconds: 400),
      };
    }
    
    // Standard for web
    return switch (speed) {
      AnimationSpeed.fast => Duration(milliseconds: 150),
      AnimationSpeed.medium => Duration(milliseconds: 300),
      AnimationSpeed.slow => Duration(milliseconds: 500),
    };
  }
  
  static Curve getCurve(AnimationType type) {
    final platform = PlatformDetector.current;
    
    if (platform == AppPlatform.macOS) {
      // macOS prefers spring animations
      return switch (type) {
        AnimationType.entrance => Curves.elasticOut,
        AnimationType.exit => Curves.elasticIn,
        AnimationType.transition => Curves.easeInOutCubic,
      };
    }
    
    if (platform == AppPlatform.windows) {
      // Windows prefers subtle animations
      return switch (type) {
        AnimationType.entrance => Curves.easeOut,
        AnimationType.exit => Curves.easeIn,
        AnimationType.transition => Curves.linear,
      };
    }
    
    // Web standard Material curves
    return switch (type) {
      AnimationType.entrance => Curves.easeOutCubic,
      AnimationType.exit => Curves.easeInCubic,
      AnimationType.transition => Curves.easeInOut,
    };
  }
}
```

---

## 📱 **ACCESSIBILITY & INTERNATIONALIZATION**

### **Platform-Specific Accessibility**

```dart
// core/accessibility/adaptive_accessibility.dart

class AdaptiveAccessibility {
  static Widget withSemantics({
    required Widget child,
    required String label,
    String? hint,
    bool? isButton,
  }) {
    final platform = PlatformDetector.current;
    
    // Platform-specific screen reader announcements
    String platformLabel = switch (platform) {
      AppPlatform.macOS => label, // VoiceOver format
      AppPlatform.windows => '$label. ${hint ?? ""}', // Narrator format
      AppPlatform.web => label, // Various screen readers
      _ => label,
    };
    
    return Semantics(
      label: platformLabel,
      hint: hint,
      button: isButton,
      child: ExcludeSemantics(child: child),
    );
  }
  
  static TextStyle getAccessibleTextStyle(BuildContext context, TextStyle base) {
    final platform = PlatformDetector.current;
    final mediaQuery = MediaQuery.of(context);
    
    // Respect system text scaling
    double textScaleFactor = mediaQuery.textScaleFactor;
    
    // Platform-specific minimum sizes
    double minSize = switch (platform) {
      AppPlatform.macOS => 11,
      AppPlatform.windows => 12,
      AppPlatform.web => 14,
      _ => 12,
    };
    
    return base.copyWith(
      fontSize: math.max(base.fontSize! * textScaleFactor, minSize),
    );
  }
}
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Design System Setup**
- [ ] Design tokens defined
- [ ] Color scheme implemented
- [ ] Typography scale configured
- [ ] Spacing system applied
- [ ] Animation tokens set

### **Platform Detection**
- [ ] Platform detector implemented
- [ ] Capability checks added
- [ ] Platform-specific configs

### **Theme System**
- [ ] Adaptive theme created
- [ ] Platform themes defined
- [ ] Dark mode support
- [ ] Theme switching logic

### **Responsive Design**
- [ ] Breakpoints defined
- [ ] Responsive builders created
- [ ] Adaptive layouts implemented
- [ ] Content width constraints

### **Platform Components**
- [ ] Navigation patterns
- [ ] Button variants
- [ ] Dialog styles
- [ ] Input decorations
- [ ] Card designs

### **Performance**
- [ ] Web optimizations
- [ ] Desktop optimizations
- [ ] Image loading strategies
- [ ] List virtualization

### **Accessibility**
- [ ] Semantic labels
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] High contrast modes
- [ ] Text scaling

---

## 🚨 **COMMON MISTAKES TO AVOID**

### **Design Mistakes**

```dart
// ❌ WRONG: Same UI for all platforms
Widget build(BuildContext context) {
  return MaterialApp(
    theme: ThemeData.light(), // Generic theme
    home: MyHomePage(),
  );
}

// ✅ CORRECT: Platform-aware theming
Widget build(BuildContext context) {
  return MaterialApp(
    theme: AdaptiveTheme.getTheme(context),
    home: AdaptiveLayout(
      body: MyHomePage(),
    ),
  );
}
```

### **Performance Mistakes**

```dart
// ❌ WRONG: Heavy animations on all platforms
AnimatedContainer(
  duration: Duration(milliseconds: 1000), // Too slow
  curve: Curves.bounceInOut, // Too playful for desktop
)

// ✅ CORRECT: Platform-aware animations
AnimatedContainer(
  duration: AdaptiveAnimations.getDuration(AnimationSpeed.medium),
  curve: AdaptiveAnimations.getCurve(AnimationType.transition),
)
```

---

**Document Status:** ✅ ACTIVE  
**Platform Coverage:** Web, Windows, macOS  
**Review Cycle:** Quarterly with platform updates