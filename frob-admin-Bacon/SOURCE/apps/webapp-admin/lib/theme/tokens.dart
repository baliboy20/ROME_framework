import 'package:flutter/material.dart';

/// FOB Booking Admin — Parchment design tokens.
/// Ported from design-handoff/README.md §Design tokens (satisfies: TDR-15).
class FobColors {
  FobColors._();

  static const pink = Color(0xFFFF2D9B); // needs action / cost
  static const lime = Color(0xFFC6FF3F); // settled / money-back
  static const cyan = Color(0xFF22D3EE); // info / trust
  static const orange = Color(0xFFFF7A1A); // warning
  static const pillInk = Color(0xFF170A26);

  static const pinkText = Color(0xFFB83072);
  static const cyanText = Color(0xFF0E7490);
  static const limeText = Color(0xFF4E7A12);
  static const orangeText = Color(0xFFC2610A);

  static const surfaceBg = Color(0xFFF8F6EF);
  static const surfaceBgLo = Color(0xFFEEEBE1);
  static const surfaceCard = Color(0xFFFFFFFF);
  static const surfaceRaised = Color(0xFFFDFCF8);
  static const surfaceRail = Color(0xFFF7F4EC);

  static const textStrong = Color(0xFF33322A);
  static const textBody = Color(0xFF5B584C);
  static const textMuted = Color(0xFF8A8778);
  static const textFaint = Color(0xFFA5A294);
  static const textLabel = Color(0xFF9A9788);
  static const textPrice = Color(0xFFB83072);
  static const textLink = Color(0xFFB83072);
  static const textLinkHover = Color(0xFFFF2D9B);

  static const hairline = Color(0x1A33322A); // ~wb09

  static const gradientBrand = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [pink, orange],
  );
}

class FobSpace {
  FobSpace._();
  static const inline = 6.0;
  static const row = 10.0;
  static const field = 14.0;
  static const card = 20.0;
  static const block = 26.0;
  static const gutter = 48.0;
}

class FobRadius {
  FobRadius._();
  static const field = 9.0;
  static const button = 11.0;
  static const table = 12.0;
  static const card = 16.0;
  static const round = 20.0;
}

class FobText {
  FobText._();

  // Playfair Display — titles and money only.
  static const serif = 'Playfair Display';
  // Plus Jakarta Sans — functional text.
  static const sans = 'Plus Jakarta Sans';
  // monospace — ids, codes, micro-labels.
  static const mono = 'monospace';

  static const pageTitle = TextStyle(
    fontFamily: serif,
    fontSize: 27,
    fontWeight: FontWeight.w600,
    color: FobColors.textStrong,
  );

  static const cardTitle = TextStyle(
    fontFamily: sans,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: FobColors.textStrong,
  );

  static const body = TextStyle(
    fontFamily: sans,
    fontSize: 13.5,
    fontWeight: FontWeight.w500,
    color: FobColors.textBody,
  );

  static const microLabel = TextStyle(
    fontFamily: mono,
    fontSize: 10.5,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.1,
    color: FobColors.textLabel,
  );

  // Playfair Display's default figures are old-style/proportional (elegant
  // but hard to scan in a table of amounts) — request lining + tabular
  // figures (lnum/tnum) so digits align and read like plain numerals while
  // keeping the serif's editorial character. Silently no-ops if the loaded
  // font/browser doesn't support the feature.
  static const moneyFontFeatures = [
    FontFeature.enable('lnum'),
    FontFeature.enable('tnum'),
  ];

  static const money = TextStyle(
    fontFamily: serif,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: FobColors.textPrice,
    fontFeatures: moneyFontFeatures,
  );
}

ThemeData buildFobTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: FobColors.surfaceBg,
    fontFamily: FobText.sans,
    colorScheme: ColorScheme.fromSeed(
      seedColor: FobColors.pink,
      brightness: Brightness.light,
      surface: FobColors.surfaceBg,
    ),
    textTheme: const TextTheme(
      titleLarge: FobText.pageTitle,
      titleMedium: FobText.cardTitle,
      bodyMedium: FobText.body,
      labelSmall: FobText.microLabel,
    ),
    dividerColor: FobColors.hairline,
    cardTheme: CardThemeData(
      color: FobColors.surfaceCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(FobRadius.card),
        side: const BorderSide(color: FobColors.hairline),
      ),
    ),
  );
}
