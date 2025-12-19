# Flutter Expert Documentation - Master Index

**Version**: 2.0
**Last Updated**: 2024-12-19
**Total Guides**: 19
**Target Audience**: AI Agents, Flutter Developers

---

## 📖 How to Use This Documentation

### For AI Agents (Robots):
1. **Start with Quick Start** section below
2. Read the **Architecture Overview** first to understand the system
3. Refer to **Core Patterns** for implementation details
4. Use **Integration Guides** when implementing specific features
5. Check **Reference** section for quick lookups

### For Developers:
- Use this index to find the right guide for your task
- Each guide is self-contained but cross-referenced
- Follow the **Priority** indicators for learning path

---

## 🚀 Quick Start (Read These First)

**Priority: CRITICAL - Read in this order**

1. **[Frontend DDD Architecture](01_CORE/frontend_ddd_architecture_expert.md)** (27KB)
   - Start here - explains the entire system architecture
   - Covers: Domain layer, Data layer, Presentation layer
   - When to use: Beginning new project or onboarding

2. **[Anti-Patterns & Approved Libraries](01_CORE/antipatterns_and_approved_libraries_expert.md)** (39KB)
   - What NOT to do (31 anti-patterns)
   - Approved library list
   - When to use: Before writing any code

3. **[Best Practices Quick Reference](05_REFERENCE/best_practices_consolidated_guide.md)** (25KB)
   - Condensed checklist of all patterns
   - Quick reference for common tasks
   - When to use: Daily development reference

---

## 📚 Core Patterns (Essential Reading)

**Priority: HIGH - Required for all features**

### State Management
- **[BLoC Event Naming Convention](01_CORE/bloc_event_naming_convention_guide.md)** (19KB)
  - How to name BLoC events: `[Verb][Noun]Event`
  - When to use: Creating any new BLoC event
  - Related: Frontend DDD Architecture (Section 5.1)

### Error Handling
- **[Error Handling Patterns](01_CORE/error_handling_patterns_expert.md)** (27KB)
  - Exception → Result → Failure flow
  - Pattern matching with sealed classes
  - When to use: All data layer and repository code
  - Related: Frontend DDD Architecture (Section 4)

### Navigation & Routing
- **[Routing Patterns (GoRouter)](02_PATTERNS/routing_patterns_expert.md)** (17KB)
  - GoRouter setup and configuration
  - Authentication guards, deep linking
  - When to use: Adding new routes or navigation
  - Related: Frontend DDD Architecture (Section 5.4)

### Data & Entities
- **[Core Artifacts & Entities](02_PATTERNS/core_artifacts_expert.md)** (18KB)
  - Shared enums, domain entities, validation rules
  - Storage strategy decision matrix
  - When to use: Creating new domain entities or enums
  - Related: Sealed Classes vs Enums (decision tree)

---

## 🎯 Design Decisions (When You Need to Choose)

**Priority: MEDIUM - Refer to when making architectural choices**

### Type Systems
- **[Sealed Classes vs Enums](02_PATTERNS/sealed_classes_vs_enums_guide.md)** (23KB)
  - Decision tree: When to use sealed class vs enum
  - Real-world examples from codebase
  - When to use: Creating new state types, status values, or variants
  - Related: Core Artifacts (Section 1), Error Handling (Section 2)

### Error Boundaries
- **[Error Boundary Placement Strategy](02_PATTERNS/error_boundary_placement_strategy.md)** (17KB)
  - Where to place error boundaries (app-level vs feature-level)
  - Recovery strategies
  - When to use: Adding error handling to features
  - Related: Error Handling Patterns (Section 7)

---

## 🔌 Integration Guides (Feature-Specific)

**Priority: AS-NEEDED - Read when implementing specific integrations**

### Backend Integration
- **[Parse Server Integration](03_INTEGRATIONS/parse_flutter_integration_patterns.md)** (24KB)
  - Native Parse SDK usage (NOT custom wrapper)
  - Query patterns, authentication flows
  - **CRITICAL**: JSON validation mandatory for all Parse responses
  - When to use: All backend data access
  - Related: Anti-Patterns (Section 1.8), Error Handling

### Payment Processing
- **[Stripe Flutter Integration](03_INTEGRATIONS/stripe_flutter_integration_patterns.md)** (23KB)
  - Payment intent flow, webhook handling
  - Timeout strategies for payments
  - When to use: Implementing checkout or payment features
  - Related: Timeout Strategy, Error Handling

### Communication
- **[Email Integration Patterns](03_INTEGRATIONS/email_flutter_integration_patterns.md)** (11KB)
  - Email sending patterns via backend
  - When to use: Implementing email notifications
  - Related: Parse Server Integration

### Media & Storage
- **[Image Storage Integration](03_INTEGRATIONS/image_storage_integration_patterns.md)** (5KB)
  - Image upload, caching, optimization
  - When to use: Implementing image upload features
  - Related: Timeout Strategy (uploads)

---

## 📖 Reference Guides (Quick Lookups)

**Priority: LOW - Reference when needed**

### Validation & Formatting
- **[Input Validators Consolidation](05_REFERENCE/input_validators_consolidation_guide.md)** (27KB)
  - Master validator library: email, password, phone, postcode
  - Consolidates 12 duplicated validators
  - Location: `/lib/core/utils/validators.dart`
  - When to use: Adding form validation
  - Related: Best Practices (Section 5)

### Theming & UI
- **[Platform Theme Architecture](04_UI_UX/platform_theme_architecture_guide.md)** (26KB)
  - Unified spacing scale, decorations library
  - Status color mapping
  - Location: `/lib/core/theme/`
  - When to use: Styling components consistently
  - Related: Flutter UI Component Library

- **[Flutter UI Component Library](04_UI_UX/flutter_ui_component_library.md)** (18KB)
  - Reusable UI components and patterns
  - Platform-specific adaptations
  - When to use: Building UI components
  - Related: Platform Theme Architecture

- **[Flutter UI/UX Platform Guide](04_UI_UX/flutter_ui_ux_platform_guide.md)** (35KB)
  - Multi-platform considerations (iOS, Android, Web, Desktop)
  - When to use: Cross-platform UI development
  - Related: Flutter UI Component Library

### Performance & Monitoring
- **[Timeout Strategy Guide](02_PATTERNS/timeout_strategy_guide.md)** (17KB)
  - Standard timeout values: 5s (fast), 30s (normal), 60s (slow)
  - Retry with exponential backoff
  - When to use: All network operations
  - Related: Error Handling, Parse Integration

- **[Monitoring & Diagnostics](05_REFERENCE/monitoring_diagnostics_expert.md)** (37KB)
  - Logging, error tracking, performance monitoring
  - When to use: Debugging and production monitoring
  - Related: Error Handling

---

## 📱 Platform-Specific Guides

**Priority: AS-NEEDED - Reference when implementing platform-specific features**

### Core Cross-Platform Patterns
- **[Cross-Platform UI Core](04_UI_UX/cross_platform_ui_core.md)** (667 lines)
  - Design System Architecture & Design Tokens
  - Platform Detection & Adaptation system
  - Responsive Design System with breakpoints
  - Platform-Aware Animations
  - When to use: Foundation for all platform-specific UI work
  - Related: All platform-specific UI guides below

### Web Platform
- **[Web UI Patterns](06_PLATFORM_SPECIFIC/web_ui_patterns.md)** (753 lines)
  - Material Design 3 for web
  - Web navigation, buttons, dialogs with hover effects
  - Image lazy loading, virtual scrolling, code splitting
  - Web-specific optimizations and caching
  - When to use: Building Flutter web applications
  - Related: Cross-Platform UI Core

### Windows Platform
- **[Windows UI Patterns](06_PLATFORM_SPECIFIC/windows_ui_patterns.md)** (849 lines)
  - Fluent Design-inspired theme
  - Windows Navigation View, acrylic effects, reveal hover
  - Window management (minimize, maximize, close)
  - Command-based keyboard shortcuts
  - When to use: Building Flutter Windows desktop apps
  - Related: Cross-Platform UI Core

### macOS Platform
- **[macOS UI Patterns](06_PLATFORM_SPECIFIC/macos_ui_patterns.md)** (877 lines)
  - Native macOS-inspired theme
  - macOS Sidebar, traffic lights, vibrancy effects
  - Command-based keyboard shortcuts
  - macOS Toolbar patterns
  - When to use: Building Flutter macOS desktop apps
  - Related: Cross-Platform UI Core

### Mobile Platforms (iOS/Android)
- **[Mobile UI Patterns](06_PLATFORM_SPECIFIC/mobile_ui_patterns.md)** (905 lines)
  - iOS Cupertino and Android Material 3 themes
  - Adaptive navigation, buttons, app bars, dialogs
  - Platform-specific gestures and scroll physics
  - Safe area handling and memory management
  - When to use: Building Flutter mobile apps
  - Related: Cross-Platform UI Core

---

## 🚀 Deployment & Release Guides

**Priority: HIGH - Essential for production releases**

### Deployment Folder
- **[07_DEPLOYMENT/](07_DEPLOYMENT/)** (New)
  - Build configurations (debug, profile, release)
  - Environment management (flavors, .env files)
  - CI/CD pipeline setup (GitHub Actions, Fastlane)
  - App store submission (App Store, Play Store)
  - When to use: Preparing production releases
  - Related: Monitoring & Diagnostics

**Note**: Documentation to be added based on deployment needs:
- `build_flavors_guide.md` - Environment configuration
- `github_actions_flutter_guide.md` - CI/CD automation
- `ios_app_store_submission_guide.md` - App Store deployment
- `android_play_store_submission_guide.md` - Play Store deployment

---

## 🗺️ Documentation Map by Feature

### Implementing Authentication
1. Start: [Parse Server Integration](03_INTEGRATIONS/parse_flutter_integration_patterns.md) - Auth section
2. Architecture: [Frontend DDD Architecture](01_CORE/frontend_ddd_architecture_expert.md) - Section 7
3. Error handling: [Error Handling Patterns](01_CORE/error_handling_patterns_expert.md)
4. Routing: [Routing Patterns](02_PATTERNS/routing_patterns_expert.md) - Auth guards
5. Validation: [Input Validators](05_REFERENCE/input_validators_consolidation_guide.md) - Email/password

### Implementing Order Management
1. Start: [Frontend DDD Architecture](01_CORE/frontend_ddd_architecture_expert.md) - Example flow
2. State: [BLoC Event Naming](01_CORE/bloc_event_naming_convention_guide.md)
3. Data: [Parse Server Integration](03_INTEGRATIONS/parse_flutter_integration_patterns.md)
4. Errors: [Error Handling Patterns](01_CORE/error_handling_patterns_expert.md)
5. Types: [Sealed Classes vs Enums](02_PATTERNS/sealed_classes_vs_enums_guide.md) - OrderStatus

### Implementing Payment Flow
1. Start: [Stripe Integration](03_INTEGRATIONS/stripe_flutter_integration_patterns.md)
2. Timeout: [Timeout Strategy](02_PATTERNS/timeout_strategy_guide.md) - Payment section
3. Errors: [Error Handling Patterns](01_CORE/error_handling_patterns_expert.md) - Payment recovery
4. Validation: [Input Validators](05_REFERENCE/input_validators_consolidation_guide.md) - Card validators
5. State: [BLoC Event Naming](01_CORE/bloc_event_naming_convention_guide.md)

### Implementing Product Catalog
1. Start: [Frontend DDD Architecture](01_CORE/frontend_ddd_architecture_expert.md) - Product example
2. Data: [Parse Server Integration](03_INTEGRATIONS/parse_flutter_integration_patterns.md) - Query patterns
3. State: [BLoC Event Naming](01_CORE/bloc_event_naming_convention_guide.md)
4. UI: [Flutter UI Component Library](04_UI_UX/flutter_ui_component_library.md)
5. Theme: [Platform Theme Architecture](04_UI_UX/platform_theme_architecture_guide.md)

---

## 📊 Documentation Statistics

| Category | Files | Total Size | Coverage |
|----------|-------|------------|----------|
| **01_CORE** | 4 | 109KB | Complete |
| **02_PATTERNS** | 5 | 101KB | Complete |
| **03_INTEGRATIONS** | 4 | 62KB | Complete |
| **04_UI_UX** | 3 | 79KB | Complete |
| **05_REFERENCE** | 3 | 91KB | Complete |
| **06_PLATFORM_SPECIFIC** | 0 | - | To be added |
| **07_DEPLOYMENT** | 0 | - | To be added |
| **Total** | 19 | 442KB | - |

---

## ⚠️ Common Robot Mistakes (AI Agents: Read This!)

### 1. DON'T Create Custom ParseApiClient
- ❌ **Wrong**: Creating HTTP wrapper for Parse Server
- ✅ **Right**: Use native `parse_server_sdk_flutter` package
- **See**: [Anti-Patterns](01_CORE/antipatterns_and_approved_libraries_expert.md) Section 1.8

### 2. DON'T Use dartz for Error Handling
- ❌ **Wrong**: Using `Either<L, R>` from dartz package
- ✅ **Right**: Use native Dart sealed classes `Result<T>`
- **See**: [Anti-Patterns](01_CORE/antipatterns_and_approved_libraries_expert.md) Section 1.9

### 3. DON'T Put Business Logic in Widgets
- ❌ **Wrong**: API calls in StatefulWidget
- ✅ **Right**: Use BLoC + Repository pattern
- **See**: [Frontend DDD Architecture](01_CORE/frontend_ddd_architecture_expert.md) Section 3

### 4. DON'T Skip JSON Validation
- ❌ **Wrong**: Directly deserializing Parse responses
- ✅ **Right**: Validate with `json_validation` library first
- **See**: [Parse Server Integration](03_INTEGRATIONS/parse_flutter_integration_patterns.md) Section 1.3

### 5. DON'T Mix Navigation Patterns
- ❌ **Wrong**: Using Navigator or GetX for routing
- ✅ **Right**: Use GoRouter exclusively
- **See**: [Routing Patterns](02_PATTERNS/routing_patterns_expert.md) Section 1

---

## 🔄 Version History

### Version 2.0 (2024-12-19)
- Created master index
- Added cross-references between all guides
- Simplified best practices guide
- Merged duplicate content

### Version 1.0 (2024-11-06)
- Initial documentation created
- 19 individual expert guides

---

## 📝 Contributing to Documentation

When updating documentation:
1. Update version number and date in affected file
2. Update this master index if adding/removing guides
3. Update cross-references in related documents
4. Keep "Related Docs" section current
5. Follow the naming convention: `[topic]_[type].md`

---

## 🆘 Need Help?

### Can't Find What You Need?
1. Use Ctrl+F to search this index
2. Check the **Documentation Map by Feature** section
3. Review **Common Robot Mistakes** section

### Documentation Issues?
- Report unclear guidance
- Suggest improvements
- Report conflicts between guides

---

**Last Updated**: 2024-12-19
**Maintained By**: Architecture Team
**Review Cycle**: Monthly
