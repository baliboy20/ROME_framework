import 'package:flutter/material.dart';

import 'parchment_tokens.dart';

/// Single-column, thumb-reachable page gutter for the guide app (narrower
/// than the admin app's 48px desktop --space-gutter — design-system.md
/// §8.6: "layout composition ... differs per app").
const double kGuideGutter = 18;

/// Track-B "Internal Apps Parchment" ThemeData, ported per design-system.md
/// §8.1-8.3 + §8.6 porting notes. Font families are named for
/// `--font-serif` (Playfair Display, titles/money only) and `--font-sans`
/// (Plus Jakarta Sans, functional text) — bundle the variable font assets
/// under `fonts/` per §8.6 (self-hosted, no Google Fonts CDN at runtime);
/// until assets are added the named families fall back to the platform
/// default, which is a safe no-crash degradation.
ThemeData buildFobGuideTheme() {
  const serif = 'PlayfairDisplay';
  const sans = 'PlusJakartaSans';

  final colorScheme = ColorScheme.fromSeed(
    seedColor: FobColors.accentPink,
    brightness: Brightness.light,
    surface: FobColors.surfaceBg,
    primary: FobColors.accentPink,
    secondary: FobColors.accentCyan,
    error: FobColors.accentPink,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: FobColors.surfaceBg,
    fontFamily: sans,
    textTheme: const TextTheme(
      // Page title — 27px/600/serif (design-system.md §8.2).
      headlineMedium: TextStyle(
        fontFamily: serif,
        fontSize: 27,
        fontWeight: FontWeight.w600,
        color: FobColors.textStrong,
        height: 1.15,
      ),
      // Card / section titles.
      titleLarge: TextStyle(
        fontFamily: serif,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: FobColors.textStrong,
      ),
      titleMedium: TextStyle(
        fontFamily: sans,
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: FobColors.textStrong,
      ),
      // Body text — 13-14px/500/sans.
      bodyLarge: TextStyle(
        fontFamily: sans,
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: FobColors.textBody,
      ),
      bodyMedium: TextStyle(
        fontFamily: sans,
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: FobColors.textBody,
      ),
      // Mono micro-labels — 9.5-11px/600/mono, uppercase, letter-spaced.
      labelSmall: TextStyle(
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: FobColors.textLabel,
        letterSpacing: 1.1,
      ),
      labelLarge: TextStyle(
        fontFamily: sans,
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: FobColors.textStrong,
      ),
    ),
    cardTheme: CardThemeData(
      color: FobColors.surfaceCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(FobRadius.card),
        side: BorderSide(color: FobColors.hairline(FobColors.wb12)),
      ),
      margin: EdgeInsets.zero,
    ),
    dividerTheme: DividerThemeData(
      color: FobColors.hairline(FobColors.wb09),
      thickness: 1,
      space: 1,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: FobColors.surfaceBg,
      foregroundColor: FobColors.textStrong,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(FobRadius.button),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, 48),
        side: BorderSide(color: FobColors.hairline(FobColors.wb16)),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(FobRadius.button),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: FobColors.surfaceCard,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(FobRadius.field),
        borderSide: BorderSide(color: FobColors.hairline(FobColors.wb16)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(FobRadius.field),
        borderSide: BorderSide(color: FobColors.hairline(FobColors.wb16)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(FobRadius.field),
        borderSide: const BorderSide(color: FobColors.accentCyan, width: 2),
      ),
    ),
    visualDensity: VisualDensity.standard,
  );
}
