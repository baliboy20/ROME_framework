import 'package:flutter/material.dart';

/// London Bike Tours ("LBT") design system — the editorial / cream look used
/// by the public tours catalogue island. Deliberately distinct from
/// [ForestTokens] (the booking-flow brand): warm cream backgrounds, near-black
/// ink, a serif display face ('Newsreader') for the masthead / tour names /
/// prices, and 'Instrument Sans' for body + UI chrome.
class LbtColors {
  LbtColors._();

  // Cream surfaces (page → card → sunken).
  static const Color cream = Color(0xFFF4F1E8);
  static const Color creamRaised = Color(0xFFFAF8F2);
  static const Color creamSunken = Color(0xFFEFECE3);

  // Ink.
  static const Color ink = Color(0xFF14130F);
  static const Color inkSoft = Color(0xFF1A1916);

  // Accents.
  static const Color forest = Color(0xFF3F6B3F);
  static const Color rust = Color(0xFFA8582F);
  static const Color blue = Color(0xFF2F5D8A);

  // Neutrals.
  static const Color muted = Color(0xFF8A8778);
  static const Color hairline = Color(0xFFDCD7C9);
}

/// Spacing scale (4pt base) for the catalogue.
class LbtSpace {
  LbtSpace._();

  static const double x1 = 4;
  static const double x2 = 8;
  static const double x3 = 12;
  static const double x4 = 16;
  static const double x5 = 20;
  static const double x6 = 24;
  static const double x8 = 32;
  static const double x10 = 40;
  static const double x12 = 48;
}

/// Named text styles. Serif ('Newsreader') is reserved for display / tour
/// names / prices; everything else is 'Instrument Sans'.
class LbtText {
  LbtText._();

  static const String serif = 'Newsreader';
  static const String sans = 'Instrument Sans';

  /// Large serif page masthead.
  static const TextStyle pageTitle = TextStyle(
    fontFamily: serif,
    fontSize: 40,
    height: 1.05,
    fontWeight: FontWeight.w600,
    color: LbtColors.ink,
  );

  /// Serif tour-card title.
  static const TextStyle cardTitle = TextStyle(
    fontFamily: serif,
    fontSize: 24,
    height: 1.12,
    fontWeight: FontWeight.w500,
    color: LbtColors.ink,
  );

  /// Serif price.
  static const TextStyle price = TextStyle(
    fontFamily: serif,
    fontSize: 22,
    fontWeight: FontWeight.w600,
    color: LbtColors.ink,
  );

  /// Default body copy.
  static const TextStyle body = TextStyle(
    fontFamily: sans,
    fontSize: 15,
    height: 1.5,
    color: LbtColors.inkSoft,
  );

  /// Muted / secondary body copy (taglines, descriptions).
  static const TextStyle bodyMuted = TextStyle(
    fontFamily: sans,
    fontSize: 15,
    height: 1.5,
    color: LbtColors.muted,
  );

  /// Small letter-spaced caps for meta rows and section labels.
  static const TextStyle metaLabel = TextStyle(
    fontFamily: sans,
    fontSize: 11.5,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.1,
    color: LbtColors.muted,
  );
}

/// Builds the catalogue [ThemeData]. Base family is 'Instrument Sans';
/// serif styling is applied per-widget via [LbtText].
ThemeData buildLbtTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: LbtColors.cream,
    fontFamily: LbtText.sans,
    colorScheme: ColorScheme.fromSeed(
      seedColor: LbtColors.forest,
      primary: LbtColors.forest,
      onPrimary: Colors.white,
      surface: LbtColors.creamRaised,
      onSurface: LbtColors.ink,
    ),
    textTheme: const TextTheme(
      displayLarge: LbtText.pageTitle,
      titleLarge: LbtText.cardTitle,
      bodyMedium: LbtText.body,
      bodySmall: LbtText.bodyMuted,
      labelSmall: LbtText.metaLabel,
    ),
    dividerTheme: const DividerThemeData(
      color: LbtColors.hairline,
      thickness: 1,
      space: 1,
    ),
  );
}
