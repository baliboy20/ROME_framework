# Flutter Platform-Specific Patterns

**ID**: flutter-platform-specific
**Category**: Platform Adaptation

## Purpose

Implement platform-specific UI patterns for web, Windows, macOS, iOS, and Android.

## Inputs

- Target platforms
- Platform-specific design requirements

## Outputs

- Platform detection and adaptation
- Platform-specific navigation
- Platform-specific components
- Platform-specific gestures

## Platform Detection

```dart
import 'package:flutter/foundation.dart';

bool get isWeb => kIsWeb;
bool get isMobile => defaultTargetPlatform == TargetPlatform.iOS ||
                     defaultTargetPlatform == TargetPlatform.android;
bool get isDesktop => defaultTargetPlatform == TargetPlatform.windows ||
                      defaultTargetPlatform == TargetPlatform.macOS ||
                      defaultTargetPlatform == TargetPlatform.linux;
```

## Platform-Adaptive Widgets

```dart
Widget buildButton(BuildContext context) {
  if (defaultTargetPlatform == TargetPlatform.iOS) {
    return CupertinoButton(
      onPressed: onPressed,
      child: Text(label),
    );
  }
  return ElevatedButton(
    onPressed: onPressed,
    child: Text(label),
  );
}
```

## Responsive Layout

```dart
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget desktop;

  const ResponsiveLayout({
    required this.mobile,
    this.tablet,
    required this.desktop,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 1200) return desktop;
        if (constraints.maxWidth >= 600) return tablet ?? mobile;
        return mobile;
      },
    );
  }
}
```
