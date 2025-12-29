---
name: flutter-best-practices
description: Apply Flutter development best practices and architectural patterns. Use when generating Flutter code, designing UI components, implementing state management, or setting up project structure. Validates against documented standards and prevents common mistakes.
allowed-tools: Read, Grep, Glob
---

# Flutter Best Practices Skill

## Purpose

This skill ensures all Flutter code generation follows documented best practices from the ROME expert knowledge base. It provides progressive access to expert guides and validates outputs against established patterns.

## When to Use

Invoke this skill when:
- Generating Flutter widgets, screens, or components
- Implementing state management (BLoC, Provider, Riverpod)
- Designing cross-platform UI
- Setting up Flutter project structure
- Creating navigation flows
- Integrating with backend APIs

## Quick Reference

**Always load these critical guides first:**

### Common Mistakes to Avoid
See [00_MASTER_INDEX.md - Common Robot Mistakes](../../../Experts/expert_flutter/00_MASTER_INDEX.md#common-robot-mistakes)

Key mistakes to avoid:
- Don't mix state management patterns (BLoC + Provider + setState)
- Don't ignore platform-specific UI differences
- Don't skip input validation
- Don't hardcode strings (use i18n)
- Don't ignore memory management (dispose controllers)

### Best Practices Consolidated
See [best_practices_consolidated_guide.md](../../../Experts/expert_flutter/05_REFERENCE/best_practices_consolidated_guide.md)

Core principles:
- Follow layered architecture (Presentation → Domain → Data)
- Use dependency injection
- Implement proper error handling
- Apply input validation patterns
- Follow naming conventions

---

## Progressive Disclosure

Load additional guides based on specific task context:

### For State Management Tasks

**When**: Implementing BLoC, Provider, Riverpod, or managing application state

**Load**: [state_management_guide.md](../../../Experts/expert_flutter/02_PATTERNS/state_management_guide.md)

**Key points**:
- BLoC pattern for complex state
- Provider for simple state
- Event-driven architecture
- State immutability

### For UI Component Generation

**When**: Creating widgets, screens, or UI components

**Load**: [flutter_ui_component_library.md](../../../Experts/expert_flutter/04_UI_UX/flutter_ui_component_library.md)

**Key points**:
- Reusable component patterns
- Widget composition strategies
- Performance optimization (const constructors)
- Theming integration

### For Cross-Platform UI

**When**: Building UI that runs on iOS, Android, Web, Desktop

**Load**: [cross_platform_ui_core.md](../../../Experts/expert_flutter/04_UI_UX/cross_platform_ui_core.md)

**Key points**:
- Platform detection and adaptation
- Responsive layouts
- Platform-specific widgets
- Accessibility compliance

### For Platform Theming

**When**: Implementing themes, dark mode, or platform-specific styling

**Load**: [platform_theme_architecture_guide.md](../../../Experts/expert_flutter/04_UI_UX/platform_theme_architecture_guide.md)

**Key points**:
- Theme system architecture
- Dark mode support
- Platform-specific themes
- Dynamic theme switching

### For Authentication Integration

**When**: Implementing login, registration, session management

**Load**: [authentication_integration_guide.md](../../../Experts/expert_flutter/03_INTEGRATIONS/authentication_integration_guide.md)

**Key points**:
- JWT token management
- Secure storage
- Session persistence
- Logout and token refresh

### For API Integration

**When**: Connecting to REST APIs, handling HTTP requests

**Load**: [api_client_integration_guide.md](../../../Experts/expert_flutter/03_INTEGRATIONS/api_client_integration_guide.md)

**Key points**:
- HTTP client setup
- Error handling patterns
- Request/response models
- Retry logic

### For Input Validation

**When**: Creating forms, validating user input

**Load**: [input_validators_consolidation_guide.md](../../../Experts/expert_flutter/05_REFERENCE/input_validators_consolidation_guide.md)

**Key points**:
- Validation patterns
- Error message display
- Real-time vs submit validation
- Custom validators

### For Navigation

**When**: Implementing routing, deep linking, navigation flows

**Load**: [navigation_patterns_guide.md](../../../Experts/expert_flutter/02_PATTERNS/navigation_patterns_guide.md)

**Key points**:
- Named routes vs generated routes
- Deep linking setup
- Navigation state preservation
- Passing data between screens

### For Error Handling

**When**: Implementing error handling, retry logic, user feedback

**Load**: [error_handling_patterns_guide.md](../../../Experts/expert_flutter/02_PATTERNS/error_handling_patterns_guide.md)

**Key points**:
- Error boundary patterns
- User-friendly error messages
- Retry mechanisms
- Logging and monitoring

### For Mobile-Specific UI

**When**: Building mobile apps with platform-specific patterns

**Load**: [mobile_ui_patterns.md](../../../Experts/expert_flutter/06_PLATFORM_SPECIFIC/mobile_ui_patterns.md)

**Key points**:
- iOS Human Interface Guidelines
- Material Design principles
- Touch gestures
- Mobile navigation patterns

---

## Validation Checklist

Before completing any Flutter code generation, verify the following:

### ✅ Architecture & Structure

- [ ] **Layered Architecture**: Code follows Presentation → Domain → Data separation
- [ ] **Dependency Injection**: Services and repositories injected, not instantiated directly
- [ ] **File Organization**: Files in correct directories (screens/, widgets/, services/, etc.)
- [ ] **Naming Conventions**: PascalCase for classes, camelCase for variables, snake_case for files

### ✅ State Management

- [ ] **Pattern Consistency**: Single state management approach (BLoC or Provider, not mixed)
- [ ] **BLoC Implementation**: If using BLoC, follows event → state pattern correctly
- [ ] **State Immutability**: State objects are immutable (using copyWith or similar)
- [ ] **Proper Disposal**: Controllers, streams, and subscriptions disposed in dispose()

### ✅ UI/UX Quality

- [ ] **Cross-Platform**: UI adapts to iOS, Android, Web, Desktop as needed
- [ ] **Theme Integration**: Uses ThemeData, no hardcoded colors or styles
- [ ] **Platform-Specific**: Platform.isIOS / Platform.isAndroid checks where needed
- [ ] **Responsive Design**: Layouts adapt to different screen sizes
- [ ] **Accessibility**: Semantic labels, sufficient contrast, touch targets ≥48dp

### ✅ Code Quality

- [ ] **No Common Mistakes**: Zero violations from expert guides
- [ ] **Input Validation**: All user input validated using documented patterns
- [ ] **Error Handling**: Try-catch blocks with user-friendly error messages
- [ ] **Null Safety**: Proper null checking, no null assertion operators (!)
- [ ] **Comments**: Complex logic documented, no redundant comments

### ✅ Performance

- [ ] **Const Constructors**: Widgets marked const where possible
- [ ] **Lazy Loading**: Lists use ListView.builder, not ListView
- [ ] **Efficient Rebuilds**: setState() scope minimized, unnecessary rebuilds avoided
- [ ] **Memory Management**: Large objects disposed, no memory leaks

### ✅ Integration

- [ ] **API Calls**: Using proper HTTP client, error handling, retry logic
- [ ] **Authentication**: Token management follows documented patterns
- [ ] **Backend Sync**: Models match backend DTOs, serialization correct

### ✅ Testing Readiness

- [ ] **Testable Design**: Business logic separated from UI
- [ ] **Mockable Dependencies**: Services can be mocked for testing
- [ ] **Clear Responsibilities**: Each class has single, well-defined purpose

---

## Output Traceability

When this skill is applied, add the following comment block to generated files:

**For Dart files**:
```dart
// ROME Framework - Generated Code
// Applied Skill: flutter-best-practices
// Expert References:
//   - best_practices_consolidated_guide.md
//   - [specific guide loaded, e.g., state_management_guide.md]
// Generated: [ISO 8601 timestamp]
// Robot: [robot name, e.g., Charlie]
```

**For documentation/markdown files**:
```markdown
---
Generated by: ROME Framework
Skill Applied: flutter-best-practices
Expert References:
  - best_practices_consolidated_guide.md
  - [specific guides]
Generated: [ISO 8601 timestamp]
Robot: [robot name]
---
```

---

## Example Usage

### Scenario 1: Generate BLoC for User Authentication

**Robot (Charlie)**: "I need to generate a BLoC for user authentication."

**Skill Actions**:
1. Load `state_management_guide.md` (BLoC patterns)
2. Load `authentication_integration_guide.md` (auth specifics)
3. Validate against checklist:
   - ✅ BLoC pattern correctly implemented
   - ✅ Events: LoginRequested, LogoutRequested, TokenRefreshed
   - ✅ States: AuthInitial, AuthLoading, Authenticated, Unauthenticated
   - ✅ Proper token management
   - ✅ Secure storage integration
4. Generate code with traceability comments

### Scenario 2: Create Cross-Platform UI Screen

**Robot (Charlie)**: "Generate a product list screen that works on iOS, Android, and Web."

**Skill Actions**:
1. Load `cross_platform_ui_core.md`
2. Load `flutter_ui_component_library.md`
3. Load `mobile_ui_patterns.md`
4. Validate:
   - ✅ Responsive layout (GridView with crossAxisCount based on width)
   - ✅ Platform-specific navigation (Cupertino vs Material)
   - ✅ Touch targets ≥48dp
   - ✅ Accessibility labels
5. Generate with platform checks and theme integration

---

## Skill Maintenance

**Update Trigger**: When expert documentation is updated, review this skill

**Versioning**: This skill should track which version of expert docs it references

**Feedback Loop**: Robots should report which expert guides were most helpful for quality improvements

---

## Related Skills

- `ui-design-patterns` - For UI/UX design decisions
- `parse-server-config` - For backend integration specifics

---

**Skill Version**: 1.0
**Last Updated**: 2025-12-29
**Expert Docs Version**: Current as of 2025-12-27
