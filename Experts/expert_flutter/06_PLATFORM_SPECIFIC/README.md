# 06_PLATFORM_SPECIFIC

**Purpose**: Platform-specific implementation guides and patterns for iOS, Android, Web, macOS, Windows, and Linux.

---

## What Belongs Here

### ✅ Include:
- Platform-specific UI adaptations (iOS vs Android patterns)
- Native bridge implementations (MethodChannel, Platform Views)
- Platform-specific APIs and integrations
- OS-level permissions and capabilities
- Platform-specific build configurations
- Native dependency management

### ❌ Don't Include:
- Cross-platform UI components (see 04_UI_UX)
- General Flutter patterns (see 02_PATTERNS)
- Third-party service integrations (see 03_INTEGRATIONS)

---

## Suggested Documentation

### iOS-Specific
- `ios_integration_patterns.md` - iOS-specific features, permissions, app lifecycle
- `ios_native_bridge_guide.md` - Swift/Objective-C bridge patterns

### Android-Specific
- `android_integration_patterns.md` - Android-specific features, permissions, lifecycle
- `android_native_bridge_guide.md` - Kotlin/Java bridge patterns

### Web-Specific
- `web_integration_patterns.md` - Web-specific APIs, browser compatibility
- `web_deployment_guide.md` - Web hosting, PWA setup

### Desktop-Specific
- `macos_integration_patterns.md` - macOS-specific features
- `windows_integration_patterns.md` - Windows-specific features
- `linux_integration_patterns.md` - Linux-specific features

### Cross-Platform
- `platform_detection_guide.md` - How to detect and adapt to different platforms
- `conditional_imports_guide.md` - Platform-specific imports and code

---

## Related Folders

- **04_UI_UX**: Platform-adaptive UI components
- **02_PATTERNS**: General implementation patterns
- **07_DEPLOYMENT**: Build and deployment configurations

---

**Created**: 2024-12-19
**Category**: Platform-Specific Patterns
**Priority**: AS-NEEDED - Reference when implementing platform-specific features
