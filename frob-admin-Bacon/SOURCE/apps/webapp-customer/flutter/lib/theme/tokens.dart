import 'package:flutter/material.dart';

/// Track A — Forest brand tokens (design-system.md §1-§4, TDR-15).
/// Ported 1:1 from the sponsor-ratified `--forest`/`--charcoal` primitives
/// and Clara's derived extended scale. Shared conceptually with the static
/// CSS in `en/styles.css` — this is the Flutter-side rendering of the same
/// token set (DR-11: shared tokens, per-app component layer).
class ForestTokens {
  ForestTokens._();

  static const Color forest = Color(0xFF5A9962);
  static const Color forest50 = Color(0xFFF0F7F1);
  static const Color forest100 = Color(0xFFDBEADD);
  static const Color forest300 = Color(0xFF8FC498);
  static const Color forest700 = Color(0xFF3F7347);
  static const Color forest900 = Color(0xFF243320);
  static const Color charcoal = Color(0xFF243320);
  static const Color sand = Color(0xFFF7F5EF);
  static const Color paper = Color(0xFFFFFFFF);
  static const Color inkMuted = Color(0xFF5A6B57);
  static const Color border = Color(0xFFDDE3DA);

  static const Color success = Color(0xFF2F8F4E);
  static const Color warning = Color(0xFFC98A1C);
  static const Color error = Color(0xFFC0392B);
  static const Color info = Color(0xFF2F6FA8);
  static const Color focusRing = Color(0x665A9962); // forest @ 40%

  static const double radiusSm = 4;
  static const double radiusMd = 8;
  static const double radiusLg = 16;
  static const double radiusFull = 999;

  static const double space1 = 4;
  static const double space2 = 8;
  static const double space3 = 12;
  static const double space4 = 16;
  static const double space6 = 24;
  static const double space8 = 32;

  /// Hard floor per §3: minimum interactive touch target on the customer
  /// webapp.
  static const double minTouchTarget = 44;
}

ThemeData buildForestTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: ForestTokens.sand,
    colorScheme: ColorScheme.fromSeed(
      seedColor: ForestTokens.forest,
      primary: ForestTokens.forest700,
      onPrimary: Colors.white,
      error: ForestTokens.error,
      surface: ForestTokens.paper,
    ),
    fontFamily: 'DM Sans',
    textTheme: const TextTheme(
      headlineLarge: TextStyle(
        fontFamily: 'Syne',
        fontWeight: FontWeight.w700,
        fontSize: 36,
        color: ForestTokens.charcoal,
      ),
      headlineMedium: TextStyle(
        fontFamily: 'Syne',
        fontWeight: FontWeight.w700,
        fontSize: 28,
        color: ForestTokens.charcoal,
      ),
      titleLarge: TextStyle(
        fontFamily: 'Syne',
        fontWeight: FontWeight.w600,
        fontSize: 22,
        color: ForestTokens.charcoal,
      ),
      bodyLarge: TextStyle(fontSize: 18, color: ForestTokens.charcoal),
      bodyMedium: TextStyle(fontSize: 16, color: ForestTokens.charcoal),
      bodySmall: TextStyle(fontSize: 14, color: ForestTokens.inkMuted),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: ForestTokens.forest700,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, ForestTokens.minTouchTarget),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
        ),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: ForestTokens.forest700,
        side: const BorderSide(color: ForestTokens.forest700, width: 1.5),
        minimumSize: const Size(double.infinity, ForestTokens.minTouchTarget),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: ForestTokens.paper,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
        borderSide: const BorderSide(color: ForestTokens.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
        borderSide: const BorderSide(color: ForestTokens.forest700, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
        borderSide: const BorderSide(color: ForestTokens.error),
      ),
    ),
    checkboxTheme: CheckboxThemeData(
      // Consent checkboxes must render unticked by default everywhere
      // (design-system.md §5.2) — enforced at the widget call-site
      // (ConsentSection), not here; this only sets the checked-fill colour.
      fillColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.selected)
            ? ForestTokens.forest
            : ForestTokens.paper,
      ),
    ),
  );
}
