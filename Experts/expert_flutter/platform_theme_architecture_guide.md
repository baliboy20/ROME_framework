# Platform Theme Architecture Guide
## The Art Deco Bakery - Flutter Application

### Overview
This guide establishes a unified, centralized approach to theming across both Cupertino and Material design systems, eliminating **50+ instances of duplicate spacing constants** and **decorative styles** scattered across 8+ files.

---

## 1. Current State: Duplication Analysis

### 1.1 Spacing Magic Numbers
**Duplicated patterns found: 50+ occurrences**

| Value | Occurrences | Files |
|-------|------------|-------|
| `EdgeInsets.all(16)` | 12 | checkout, product_catalog, admin_scaffold |
| `EdgeInsets.all(12)` | 8 | checkout, product_detail |
| `EdgeInsets.all(24)` | 6 | admin_scaffold, dashboard |
| `EdgeInsets.symmetric(horizontal: 24)` | 4 | admin features |
| `BorderRadius.circular(12)` | 3 | payment_forms |
| `BoxShadow(color: 0x1A000000, blur: 8)` | 3 | admin_theme, metric_card |

### 1.2 Color Logic Duplication
**Status color mapping duplicated in 3+ locations**

```dart
// Found in multiple files
Color _getStatusColor(String status) {
  switch (status) {
    case 'pending': return Color(0xFFFFA726);      // Orange
    case 'processing': return Color(0xFF42A5F5);   // Blue
    case 'shipped': return Color(0xFF66BB6A);      // Green
    // ... repeated logic in different files
  }
}
```

### 1.3 Error State Styling Duplication
**Same pattern in 2+ payment form files**

```dart
// Found in both stripe_payment_form.dart and custom_payment_form.dart
Container(
  padding: const EdgeInsets.all(12),
  decoration: BoxDecoration(
    color: CupertinoColors.destructiveRed.withOpacity(0.1),
    border: Border.all(
      color: CupertinoColors.destructiveRed.withOpacity(0.3),
    ),
  ),
  child: Text(
    errorMessage,
    style: TextStyle(color: CupertinoColors.destructiveRed),
  ),
)
```

---

## 2. Unified Spacing Scale

### Location
**New file**: `/lib/core/theme/spacing.dart`

```dart
// 📁 lib/core/theme/spacing.dart

/// Unified spacing scale for consistent layout throughout the app
///
/// Usage: Use these constants instead of magic numbers
/// Example: padding: EdgeInsets.all(Spacing.md)
class Spacing {
  // Atomic spacing units
  static const double xs = 4.0;    // Extra small (4px)
  static const double sm = 8.0;    // Small (8px)
  static const double md = 16.0;   // Medium (16px) - MOST COMMON
  static const double lg = 24.0;   // Large (24px)
  static const double xl = 32.0;   // Extra large (32px)
  static const double xxl = 48.0;  // 2X extra large (48px)

  // Common composite values
  static const double horizontalPadding = md;      // 16.0
  static const double verticalPadding = md;        // 16.0
  static const double cardPadding = md;            // 16.0
  static const double dialogPadding = lg;          // 24.0
  static const double buttonPadding = md;          // 16.0

  // Page/Screen padding
  static const EdgeInsets pageHorizontal = EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets pageVertical = EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets pageAll = EdgeInsets.all(md);
  static const EdgeInsets pageCompact = EdgeInsets.all(sm);
  static const EdgeInsets pageSpacious = EdgeInsets.all(lg);

  // Card/Container padding
  static const EdgeInsets cardInset = EdgeInsets.all(md);
  static const EdgeInsets cardCompact = EdgeInsets.all(sm);
  static const EdgeInsets cardSpacious = EdgeInsets.all(lg);

  // Dialog padding
  static const EdgeInsets dialogInset = EdgeInsets.all(lg);

  // Input field padding (for TextFormField, TextField)
  static const EdgeInsets inputPadding = EdgeInsets.symmetric(
    horizontal: md,
    vertical: sm,
  );

  // Button padding
  static const EdgeInsets buttonInset = EdgeInsets.symmetric(
    horizontal: lg,
    vertical: md,
  );
  static const EdgeInsets buttonCompact = EdgeInsets.symmetric(
    horizontal: md,
    vertical: sm,
  );

  // List item spacing
  static const double listItemSpacing = sm;        // 8.0
  static const double listItemPadding = md;        // 16.0
  static const double listItemCompactPadding = sm; // 8.0

  // Gap sizing (for SizedBox, spacing widgets)
  static const double gapXs = xs;
  static const double gapSm = sm;
  static const double gapMd = md;
  static const double gapLg = lg;
  static const double gapXl = xl;
}
```

### Usage Examples

```dart
// ❌ OLD: Magic numbers
Padding(
  padding: const EdgeInsets.all(16),
  child: child,
)

// ✅ NEW: Using Spacing constants
Padding(
  padding: const EdgeInsets.all(Spacing.md),
  child: child,
)

// ❌ OLD: Inconsistent spacing
Container(
  padding: const EdgeInsets.all(16),
  child: Text('Text'),
)

// ✅ NEW: Semantic naming
Container(
  padding: Spacing.cardInset,
  child: Text('Text'),
)

// ❌ OLD: Complex calculation
SizedBox(
  height: 16 + 12 + 24,  // What's this total?
)

// ✅ NEW: Clear intent
SizedBox(
  height: Spacing.md + Spacing.sm + Spacing.lg,
)

// Or better, use pre-composed constants
SizedBox(height: Spacing.gapMd)
```

---

## 3. Unified Decorations Library

### Location
**New file**: `/lib/core/theme/decorations.dart`

```dart
// 📁 lib/core/theme/decorations.dart

import 'package:flutter/cupertino.dart';
import 'spacing.dart';

/// Unified decoration styles for consistent UI across the app
///
/// Includes: Cards, containers, inputs, buttons, errors, etc.
class AppDecorations {
  // ==============================================================================
  // CARD & CONTAINER DECORATIONS
  // ==============================================================================

  /// Light card decoration (elevated surface)
  static BoxDecoration cardLight({double? borderRadius}) {
    return BoxDecoration(
      color: CupertinoColors.white,
      borderRadius: BorderRadius.circular(borderRadius ?? 12),
      boxShadow: [
        BoxShadow(
          color: CupertinoColors.black.withOpacity(0.1),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }

  /// Dark card decoration (admin/dark theme)
  static BoxDecoration cardDark({double? borderRadius}) {
    return BoxDecoration(
      color: const Color(0xFF2A2A2A),
      borderRadius: BorderRadius.circular(borderRadius ?? 12),
      boxShadow: [
        BoxShadow(
          color: CupertinoColors.black.withOpacity(0.3),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }

  /// Flat container (no shadow)
  static BoxDecoration containerFlat({
    Color? color,
    double? borderRadius,
    Color? borderColor,
  }) {
    return BoxDecoration(
      color: color ?? CupertinoColors.white,
      borderRadius: BorderRadius.circular(borderRadius ?? 12),
      border: borderColor != null
          ? Border.all(color: borderColor, width: 1)
          : null,
    );
  }

  /// Input field decoration
  static BoxDecoration inputField({
    Color? backgroundColor,
    Color? borderColor,
    double? borderRadius,
    bool isFocused = false,
  }) {
    return BoxDecoration(
      color: backgroundColor ?? CupertinoColors.systemGrey6,
      borderRadius: BorderRadius.circular(borderRadius ?? 8),
      border: Border.all(
        color: isFocused
            ? CupertinoColors.systemBlue
            : (borderColor ?? CupertinoColors.systemGrey5),
        width: isFocused ? 2 : 1,
      ),
    );
  }

  // ==============================================================================
  // ERROR & STATUS STATE DECORATIONS
  // ==============================================================================

  /// Error state container (red background, red border)
  static BoxDecoration errorContainer({double? borderRadius}) {
    return BoxDecoration(
      color: CupertinoColors.destructiveRed.withOpacity(0.1),
      borderRadius: BorderRadius.circular(borderRadius ?? 8),
      border: Border.all(
        color: CupertinoColors.destructiveRed.withOpacity(0.3),
        width: 1,
      ),
    );
  }

  /// Success state container (green background, green border)
  static BoxDecoration successContainer({double? borderRadius}) {
    return BoxDecoration(
      color: const Color(0xFF34C759).withOpacity(0.1),
      borderRadius: BorderRadius.circular(borderRadius ?? 8),
      border: Border.all(
        color: const Color(0xFF34C759).withOpacity(0.3),
        width: 1,
      ),
    );
  }

  /// Warning state container (yellow background, yellow border)
  static BoxDecoration warningContainer({double? borderRadius}) {
    return BoxDecoration(
      color: const Color(0xFFFFCC00).withOpacity(0.1),
      borderRadius: BorderRadius.circular(borderRadius ?? 8),
      border: Border.all(
        color: const Color(0xFFFFCC00).withOpacity(0.3),
        width: 1,
      ),
    );
  }

  /// Info state container (blue background, blue border)
  static BoxDecoration infoContainer({double? borderRadius}) {
    return BoxDecoration(
      color: CupertinoColors.systemBlue.withOpacity(0.1),
      borderRadius: BorderRadius.circular(borderRadius ?? 8),
      border: Border.all(
        color: CupertinoColors.systemBlue.withOpacity(0.3),
        width: 1,
      ),
    );
  }

  // ==============================================================================
  // DIVIDER & BORDER DECORATIONS
  // ==============================================================================

  /// Horizontal divider decoration
  static BoxDecoration dividerHorizontal({Color? color, double? thickness}) {
    return BoxDecoration(
      border: Border(
        bottom: BorderSide(
          color: color ?? CupertinoColors.systemGrey5,
          width: thickness ?? 1,
        ),
      ),
    );
  }

  /// Vertical divider decoration
  static BoxDecoration dividerVertical({Color? color, double? thickness}) {
    return BoxDecoration(
      border: Border(
        right: BorderSide(
          color: color ?? CupertinoColors.systemGrey5,
          width: thickness ?? 1,
        ),
      ),
    );
  }

  /// Standard border (no background)
  static BoxDecoration border({
    Color? borderColor,
    double? borderRadius,
    double? borderWidth,
  }) {
    return BoxDecoration(
      borderRadius: BorderRadius.circular(borderRadius ?? 8),
      border: Border.all(
        color: borderColor ?? CupertinoColors.systemGrey5,
        width: borderWidth ?? 1,
      ),
    );
  }

  // ==============================================================================
  // GRADIENT DECORATIONS (Advanced)
  // ==============================================================================

  /// Gradient container (light to dark)
  static BoxDecoration gradientContainer({
    required Color startColor,
    required Color endColor,
    double? borderRadius,
  }) {
    return BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [startColor, endColor],
      ),
      borderRadius: BorderRadius.circular(borderRadius ?? 12),
    );
  }
}
```

### Usage Examples

```dart
// ❌ OLD: Duplicated decoration logic
Container(
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: CupertinoColors.destructiveRed.withOpacity(0.1),
    border: Border.all(
      color: CupertinoColors.destructiveRed.withOpacity(0.3),
    ),
  ),
  child: Text('Error: $errorMessage'),
)

// ✅ NEW: Using AppDecorations
Container(
  padding: const EdgeInsets.all(Spacing.md),
  decoration: AppDecorations.errorContainer(),
  child: Text('Error: $errorMessage'),
)

// ❌ OLD: Inline card decoration
Card(
  child: Container(
    decoration: BoxDecoration(
      color: CupertinoColors.white,
      borderRadius: BorderRadius.circular(12),
      boxShadow: [
        BoxShadow(
          color: CupertinoColors.black.withOpacity(0.1),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ],
    ),
    child: child,
  ),
)

// ✅ NEW: Using AppDecorations
Container(
  decoration: AppDecorations.cardLight(),
  child: child,
)

// ❌ OLD: Input field with inline styles
TextField(
  decoration: InputDecoration(
    filled: true,
    fillColor: CupertinoColors.systemGrey6,
    border: OutlineInputBorder(
      borderSide: BorderSide(color: CupertinoColors.systemGrey5),
    ),
  ),
)

// ✅ NEW: Using AppDecorations
Container(
  decoration: AppDecorations.inputField(),
  child: CupertinoTextField(),
)
```

---

## 4. Unified Status Color System

### Location
**New file**: `/lib/core/theme/status_colors.dart`

```dart
// 📁 lib/core/theme/status_colors.dart

import 'package:flutter/cupertino.dart';

/// Unified status-to-color mapping for consistent status visualization
///
/// Replaces duplicate switch statements across multiple files
class StatusColors {
  // ==============================================================================
  // PAYMENT STATUS COLORS
  // ==============================================================================

  static Color paymentStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'processing':
        return const Color(0xFFFFA726); // Orange
      case 'paid':
      case 'completed':
        return const Color(0xFF66BB6A); // Green
      case 'failed':
      case 'declined':
      case 'refunded':
        return CupertinoColors.destructiveRed;
      default:
        return CupertinoColors.systemGrey;
    }
  }

  // ==============================================================================
  // ORDER STATUS COLORS
  // ==============================================================================

  static Color orderStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return const Color(0xFFFFCC00); // Yellow
      case 'processing':
      case 'preparing':
        return const Color(0xFF42A5F5); // Blue
      case 'dispatched':
      case 'shipped':
      case 'out for delivery':
        return const Color(0xFF9C27B0); // Purple
      case 'delivered':
      case 'completed':
        return const Color(0xFF4CAF50); // Green
      case 'cancelled':
      case 'returned':
        return const Color(0xFF757575); // Gray
      case 'refunded':
        return CupertinoColors.destructiveRed;
      default:
        return CupertinoColors.systemGrey;
    }
  }

  // ==============================================================================
  // DELIVERY STATUS COLORS
  // ==============================================================================

  static Color deliveryStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return const Color(0xFFFFCC00); // Yellow
      case 'processing':
        return const Color(0xFF42A5F5); // Blue
      case 'dispatched':
        return const Color(0xFF9C27B0); // Purple
      case 'out for delivery':
        return const Color(0xFF2196F3); // Light blue
      case 'delivered':
        return const Color(0xFF4CAF50); // Green
      case 'failed':
      case 'cancelled':
        return CupertinoColors.destructiveRed;
      default:
        return CupertinoColors.systemGrey;
    }
  }

  // ==============================================================================
  // TICKET/SUPPORT STATUS COLORS
  // ==============================================================================

  static Color ticketStatus(String status) {
    switch (status.toLowerCase()) {
      case 'open':
      case 'new':
        return const Color(0xFF42A5F5); // Blue
      case 'in progress':
      case 'assigned':
        return const Color(0xFFFFA726); // Orange
      case 'resolved':
      case 'closed':
        return const Color(0xFF4CAF50); // Green
      case 'on hold':
        return const Color(0xFFFFCC00); // Yellow
      case 'reopened':
        return const Color(0xFFEF5350); // Red
      default:
        return CupertinoColors.systemGrey;
    }
  }

  // ==============================================================================
  // PRODUCT STATUS COLORS
  // ==============================================================================

  static Color productStatus(String status) {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in stock':
        return const Color(0xFF4CAF50); // Green
      case 'inactive':
      case 'out of stock':
        return const Color(0xFF757575); // Gray
      case 'discontinued':
        return CupertinoColors.destructiveRed;
      case 'low stock':
      case 'limited':
        return const Color(0xFFFFCC00); // Yellow
      default:
        return CupertinoColors.systemGrey;
    }
  }

  // ==============================================================================
  // SEVERITY/PRIORITY COLORS
  // ==============================================================================

  static Color severity(String level) {
    switch (level.toLowerCase()) {
      case 'critical':
      case 'high':
        return CupertinoColors.destructiveRed;
      case 'medium':
      case 'normal':
        return const Color(0xFFFFA726); // Orange
      case 'low':
        return const Color(0xFF4CAF50); // Green
      default:
        return CupertinoColors.systemGrey;
    }
  }

  // ==============================================================================
  // HELPER METHODS
  // ==============================================================================

  /// Get status color with transparency
  static Color statusWithOpacity(
    String status, {
    required double opacity,
    String type = 'order',
  }) {
    final baseColor = _getStatusColor(status, type);
    return baseColor.withOpacity(opacity);
  }

  static Color _getStatusColor(String status, String type) {
    switch (type.toLowerCase()) {
      case 'payment':
        return paymentStatus(status);
      case 'order':
        return orderStatus(status);
      case 'delivery':
        return deliveryStatus(status);
      case 'ticket':
      case 'support':
        return ticketStatus(status);
      case 'product':
        return productStatus(status);
      case 'severity':
      case 'priority':
        return severity(status);
      default:
        return CupertinoColors.systemGrey;
    }
  }
}
```

### Usage Examples

```dart
// ❌ OLD: Duplicated switch statements in multiple files
Color _getStatusColor(String status) {
  switch (status.toLowerCase()) {
    case 'pending':
      return Color(0xFFFFA726);
    case 'processing':
      return Color(0xFF42A5F5);
    case 'shipped':
      return Color(0xFF66BB6A);
    // ... duplicated in customer_support_page.dart, message_detail_page.dart, etc.
    default:
      return Color(0xFF9E9E9E);
  }
}

// ✅ NEW: Single source of truth
import 'package:art_deco_bakery/core/theme/status_colors.dart';

Color statusColor = StatusColors.orderStatus(status);

// Or with transparency
Color statusColorTransparent = StatusColors.statusWithOpacity(
  status,
  opacity: 0.1,
  type: 'order',
);
```

---

## 5. Border Radius Standardization

### Location
**Add to existing** `/lib/core/theme/app_theme.dart`

```dart
class AppTheme {
  // ... existing code ...

  /// Standard border radius values
  static class BorderRadii {
    static const double xs = 4.0;   // Extra small inputs
    static const double sm = 8.0;   // Small buttons
    static const double md = 12.0;  // Default (cards, containers)
    static const double lg = 16.0;  // Large elements
    static const double xl = 24.0;  // Extra large (dialogs)
  }

  /// Pre-created BorderRadius objects
  static class BorderRadiusObjects {
    static const BorderRadius xs = BorderRadius.all(Radius.circular(4.0));
    static const BorderRadius sm = BorderRadius.all(Radius.circular(8.0));
    static const BorderRadius md = BorderRadius.all(Radius.circular(12.0));
    static const BorderRadius lg = BorderRadius.all(Radius.circular(16.0));
    static const BorderRadius xl = BorderRadius.all(Radius.circular(24.0));

    // Partial borders
    static const BorderRadius topMd = BorderRadius.only(
      topLeft: Radius.circular(12.0),
      topRight: Radius.circular(12.0),
    );

    static const BorderRadius bottomMd = BorderRadius.only(
      bottomLeft: Radius.circular(12.0),
      bottomRight: Radius.circular(12.0),
    );
  }
}
```

### Usage

```dart
// ❌ OLD: Magic numbers
ClipRRect(
  borderRadius: BorderRadius.circular(12),
  child: child,
)

// ✅ NEW: Using constants
ClipRRect(
  borderRadius: AppTheme.BorderRadiusObjects.md,
  child: child,
)
```

---

## 6. Shadow Standardization

### Location
**Add to** `/lib/core/theme/decorations.dart`

```dart
/// Standard shadow definitions
class AppShadows {
  /// Subtle shadow (default for most cards)
  static const BoxShadow subtle = BoxShadow(
    color: Color(0x0D000000),  // 5% opacity
    blurRadius: 4,
    offset: Offset(0, 1),
  );

  /// Medium shadow (for elevated containers)
  static const BoxShadow medium = BoxShadow(
    color: Color(0x1A000000),  // 10% opacity
    blurRadius: 8,
    offset: Offset(0, 2),
  );

  /// Strong shadow (for prominent elements)
  static const BoxShadow strong = BoxShadow(
    color: Color(0x26000000),  // 15% opacity
    blurRadius: 12,
    offset: Offset(0, 4),
  );

  /// Very strong shadow (for modals, overlays)
  static const BoxShadow veryStrong = BoxShadow(
    color: Color(0x33000000),  // 20% opacity
    blurRadius: 16,
    offset: Offset(0, 8),
  );

  // Shadow lists for BoxDecoration
  static const List<BoxShadow> cardShadows = [medium];
  static const List<BoxShadow> buttonShadows = [subtle];
  static const List<BoxShadow> modalShadows = [veryStrong];
}
```

### Usage

```dart
// ❌ OLD: Inline shadow definition (repeated 3+ times)
BoxDecoration(
  boxShadow: [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ],
)

// ✅ NEW: Using predefined shadows
BoxDecoration(
  boxShadow: AppShadows.cardShadows,
)
```

---

## 7. Complete Theme Architecture

### File Structure

```
lib/
├── core/
│   └── theme/
│       ├── app_theme.dart          # Main theme (Cupertino & Material)
│       ├── spacing.dart            # Spacing scale (NEW)
│       ├── decorations.dart        # Decorations library (NEW)
│       ├── status_colors.dart      # Status color mapping (NEW)
│       └── theme.dart              # Re-export all themes
│
└── features/
    └── admin/
        └── core/
            └── theme/
                └── admin_theme.dart # Admin-specific theme overrides
```

### Central Theme Export

```dart
// 📁 lib/core/theme/theme.dart
export 'app_theme.dart';
export 'spacing.dart';
export 'decorations.dart';
export 'status_colors.dart';
```

### Usage in Widgets

```dart
// Single import for all theme utilities
import 'package:art_deco_bakery/core/theme/theme.dart';

// Now available:
// - AppTheme.lightTheme
// - Spacing.md, Spacing.cardInset
// - AppDecorations.cardLight(), AppDecorations.errorContainer()
// - StatusColors.orderStatus(), StatusColors.paymentStatus()
```

---

## 8. Migration Checklist

### Phase 1: Create New Theme Files (High Priority)
- [ ] Create `/lib/core/theme/spacing.dart`
- [ ] Create `/lib/core/theme/decorations.dart`
- [ ] Create `/lib/core/theme/status_colors.dart`
- [ ] Create `/lib/core/theme/theme.dart` (exports)
- [ ] Update `/lib/core/theme/app_theme.dart` with BorderRadii and BorderRadiusObjects

### Phase 2: Update Core Files (Medium Priority)
- [ ] Update `/lib/features/checkout/presentation/widgets/stripe_payment_form.dart`
  - Replace `EdgeInsets.all(16)` with `Spacing.md`
  - Replace error decoration with `AppDecorations.errorContainer()`

- [ ] Update `/lib/features/checkout/presentation/widgets/custom_payment_form.dart`
  - Same changes as stripe_payment_form.dart

- [ ] Update `/lib/features/product_catalog/presentation/pages/product_catalog_page.dart`
  - Replace spacing magic numbers with Spacing constants

- [ ] Update `/lib/core/presentation/widgets/admin_scaffold.dart`
  - Replace padding/margin magic numbers
  - Replace inline shadows with AppShadows

### Phase 3: Extract Status Color Logic (Medium Priority)
- [ ] Update `/lib/core/presentation/widgets/status_badge.dart`
  - Replace `_getStatusColor` switch with `StatusColors.orderStatus()`

- [ ] Update `/lib/features/customer_support/presentation/pages/message_history_page.dart`
  - Replace duplicate status color logic with `StatusColors.ticketStatus()`

- [ ] Update `/lib/features/customer_support/presentation/pages/message_detail_page.dart`
  - Same as above

### Phase 4: Consolidate Admin Theme (Low Priority)
- [ ] Move admin spacing constants to central `Spacing` class
- [ ] Move admin border radius to central `BorderRadii` class
- [ ] Remove duplicate constants from `/lib/features/admin/core/utils/constants.dart`

### Phase 5: Code Review & Testing
- [ ] Visual regression testing (theme should look identical)
- [ ] Code review for consistency
- [ ] Update documentation with new theme imports
- [ ] Delete old inline style patterns

---

## 9. Best Practices

✅ **DO:**
- Use `Spacing.*` constants instead of magic numbers
- Use `AppDecorations.*` factory methods instead of inline decorations
- Use `StatusColors.*` methods instead of switch statements
- Use `AppTheme.BorderRadiusObjects.*` instead of `BorderRadius.circular(12)`
- Use `AppShadows.*` instead of inline shadow definitions
- Create a consistent visual hierarchy through unified sizing

❌ **DON'T:**
- Use magic numbers (4, 8, 12, 16, 24, etc.)
- Duplicate BoxDecoration logic across files
- Duplicate status color switch statements
- Inline shadow definitions
- Hardcode border radius values
- Mix spacing conventions (sometimes 16, sometimes 15)

---

## 10. Benefits of Consolidation

✅ **Maintainability**: Change spacing once, updates everywhere
✅ **Consistency**: Same decorations across all features
✅ **DRY**: No duplicated color mappings or styling logic
✅ **Scalability**: Easy to add new decorations or status colors
✅ **Theming**: Can swap entire decoration set for dark mode
✅ **Performance**: Pre-defined BoxDecorations avoid runtime creation
✅ **Accessibility**: Centralized values easier to audit for contrast/size
✅ **Documentation**: Constants are self-documenting (e.g., `Spacing.cardPadding`)

---

## 11. References

- **Spacing Guide**: `/lib/core/theme/spacing.dart`
- **Decorations Library**: `/lib/core/theme/decorations.dart`
- **Status Colors**: `/lib/core/theme/status_colors.dart`
- **App Theme**: `/lib/core/theme/app_theme.dart`

