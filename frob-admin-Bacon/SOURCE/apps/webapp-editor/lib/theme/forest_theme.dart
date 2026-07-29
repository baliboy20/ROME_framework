import 'package:flutter/material.dart';

/// Track A — Forest brand tokens (design-system.md §1-§7).
/// webapp-editor is a customer/content-facing surface (DEV-1: stays forest,
/// NOT parchment).
class ForestTokens {
  ForestTokens._();

  static const forest = Color(0xFF5A9962);
  static const charcoal = Color(0xFF243320);

  static const forest50 = Color(0xFFF0F7F1);
  static const forest100 = Color(0xFFDBEADD);
  static const forest300 = Color(0xFF8FC498);
  static const forest500 = forest;
  static const forest700 = Color(0xFF3F7347);
  static const forest900 = charcoal;

  static const sand = Color(0xFFF7F5EF);
  static const paper = Color(0xFFFFFFFF);
  static const inkMuted = Color(0xFF5A6B57);
  static const border = Color(0xFFDDE3DA);

  static const success = Color(0xFF2F8F4E);
  static const warning = Color(0xFFC98A1C);
  static const error = Color(0xFFC0392B);
  static const info = Color(0xFF2F6FA8);
  static const focusRing = Color(0x665A9962); // forest @ 40%

  // Spacing (base unit 4px)
  static const space1 = 4.0;
  static const space2 = 8.0;
  static const space3 = 12.0;
  static const space4 = 16.0;
  static const space6 = 24.0;
  static const space8 = 32.0;
  static const space12 = 48.0;
  static const space16 = 64.0;

  static const radiusSm = 4.0;
  static const radiusMd = 8.0;
  static const radiusLg = 16.0;
}

/// Display: Syne / Body: DM Sans (design-system.md §2). Fonts are not
/// bundled in this scaffold; Flutter falls back to the platform default
/// while preserving the documented type scale (weights/sizes/line-heights).
class ForestTheme {
  ForestTheme._();

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: ForestTokens.forest,
      primary: ForestTokens.forest700,
      onPrimary: Colors.white,
      secondary: ForestTokens.forest,
      surface: ForestTokens.paper,
      error: ForestTokens.error,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: ForestTokens.sand,
      fontFamily: 'DM Sans',
      textTheme: const TextTheme(
        displayLarge: TextStyle(
            fontFamily: 'Syne',
            fontSize: 48,
            height: 1.1,
            fontWeight: FontWeight.w700,
            color: ForestTokens.charcoal),
        headlineLarge: TextStyle(
            fontFamily: 'Syne',
            fontSize: 36,
            height: 1.2,
            fontWeight: FontWeight.w700,
            color: ForestTokens.charcoal),
        headlineMedium: TextStyle(
            fontFamily: 'Syne',
            fontSize: 28,
            height: 1.25,
            fontWeight: FontWeight.w600,
            color: ForestTokens.charcoal),
        titleLarge: TextStyle(
            fontFamily: 'Syne',
            fontSize: 22,
            height: 1.3,
            fontWeight: FontWeight.w600,
            color: ForestTokens.charcoal),
        titleMedium: TextStyle(
            fontFamily: 'Syne',
            fontSize: 18,
            height: 1.35,
            fontWeight: FontWeight.w600,
            color: ForestTokens.charcoal),
        bodyLarge: TextStyle(
            fontFamily: 'DM Sans',
            fontSize: 18,
            height: 1.5,
            color: ForestTokens.charcoal),
        bodyMedium: TextStyle(
            fontFamily: 'DM Sans',
            fontSize: 16,
            height: 1.5,
            color: ForestTokens.charcoal),
        bodySmall: TextStyle(
            fontFamily: 'DM Sans',
            fontSize: 14,
            height: 1.45,
            color: ForestTokens.inkMuted),
        labelSmall: TextStyle(
            fontFamily: 'DM Sans',
            fontSize: 12,
            height: 1.4,
            fontWeight: FontWeight.w500,
            color: ForestTokens.inkMuted),
        labelLarge: TextStyle(
            fontFamily: 'DM Sans',
            fontSize: 16,
            height: 1.0,
            fontWeight: FontWeight.w600,
            color: Colors.white),
      ),
      cardTheme: CardThemeData(
        color: ForestTokens.paper,
        elevation: 1,
        shadowColor: ForestTokens.charcoal.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ForestTokens.radiusMd),
          side: const BorderSide(color: ForestTokens.border),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ForestTokens.forest700,
          foregroundColor: Colors.white,
          disabledBackgroundColor: ForestTokens.forest300,
          disabledForegroundColor: ForestTokens.inkMuted,
          minimumSize: const Size(44, 44),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
          ),
          textStyle: const TextStyle(
              fontFamily: 'DM Sans',
              fontSize: 16,
              fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: ForestTokens.forest700,
          side: const BorderSide(color: ForestTokens.forest700, width: 1.5),
          minimumSize: const Size(44, 44),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ForestTokens.paper,
        contentPadding: const EdgeInsets.all(ForestTokens.space3),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
          borderSide: const BorderSide(color: ForestTokens.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
          borderSide: const BorderSide(color: ForestTokens.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
          borderSide: const BorderSide(color: ForestTokens.forest700, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ForestTokens.radiusSm),
          borderSide: const BorderSide(color: ForestTokens.error, width: 1.5),
        ),
      ),
      focusColor: ForestTokens.focusRing,
    );
  }
}
