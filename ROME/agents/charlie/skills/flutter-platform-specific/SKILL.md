# Flutter Platform-Specific Patterns

**ID**: flutter-platform-specific
**Category**: Frontend & UI / Platform Adaptation
**Phase**: P5 (Generation)
**Robot**: Charlie

## Purpose

Implement platform-specific UI patterns for web, Windows, macOS, iOS, and Android

## Inputs

- tech-stack.md (target platforms)
- design-system.md (platform-specific requirements)

## Outputs

- Platform detection and adaptation
- Platform-specific navigation
- Platform-specific components
- Platform-specific gestures

## Platform Detection

```dart
bool get isWeb => kIsWeb;
bool get isMobile => defaultTargetPlatform == TargetPlatform.iOS ||
                     defaultTargetPlatform == TargetPlatform.android;
bool get isDesktop => defaultTargetPlatform == TargetPlatform.windows ||
                      defaultTargetPlatform == TargetPlatform.macOS ||
                      defaultTargetPlatform == TargetPlatform.linux;
```

## Expert References

**Primary Guides** (see Experts/expert_flutter/):
- `06_PLATFORM_SPECIFIC/web_ui_patterns.md` (753 lines)
- `06_PLATFORM_SPECIFIC/windows_ui_patterns.md` (849 lines)
- `06_PLATFORM_SPECIFIC/macos_ui_patterns.md` (877 lines)
- `06_PLATFORM_SPECIFIC/mobile_ui_patterns.md` (905 lines)

---

**Version**: 1.0
**Based on**: Experts/expert_flutter/06_PLATFORM_SPECIFIC/
**Last Updated**: 2026-01-29
