# Flutter Cross-Platform UI Core Design System

**Version:** 1.0
**Created:** 2025-12-19
**Scope:** Core design system, tokens, and responsive patterns for all Flutter platforms

**Related Documents:**
- Platform-Specific Guides: `/06_PLATFORM_SPECIFIC/web_ui_patterns.md`, `windows_ui_patterns.md`, `macos_ui_patterns.md`, `mobile_ui_patterns.md`
- Original Guide: `flutter_ui_ux_platform_guide.md` (deprecated - split into platform-specific guides)

---

## Overview

This document defines the foundational design system that should be used across all Flutter platforms. It includes design tokens, typography, spacing, responsive breakpoints, and core architectural patterns that ensure consistency while allowing platform-specific adaptations.

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

## 🖥️ **PLATFORM DETECTION & ADAPTATION**

### **Platform Detection System**

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

## 🎨 **PLATFORM-AWARE ANIMATIONS**

### **Adaptive Animation System**

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

enum AnimationSpeed {
  fast,
  medium,
  slow,
}

enum AnimationType {
  entrance,
  exit,
  transition,
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

### **Responsive Design**
- [ ] Breakpoints defined
- [ ] Responsive builders created
- [ ] Adaptive layouts implemented
- [ ] Content width constraints

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
**Platform Coverage:** Cross-platform core
**Review Cycle:** Quarterly with platform updates
**Last Updated:** 2025-12-19
