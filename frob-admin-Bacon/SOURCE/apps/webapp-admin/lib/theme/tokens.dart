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
  static const hairlineWarm = Color(0xFFF2EDDF); // warm parchment divider line
  static const error = Color(0xFFC2334D); // destructive / error text (parchment-tuned red)

  static const gradientBrand = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [pink, orange],
  );

  // Chip / status-pill hues — low-alpha accent tint + readable `-text-light`
  // accent colour (mockup `hues` map). NOT solid saturated fills.
  static const wb09 = Color(0x1733322A); // ~9% ink on parchment
}

/// A chip/pill hue: pale accent-tinted background + readable accent text.
class FobHue {
  final Color background;
  final Color foreground;
  const FobHue(this.background, this.foreground);

  static const pink = FobHue(Color(0x1FFF2D9B), FobColors.pinkText); // ~12%
  static const lime = FobHue(Color(0x33C6FF3F), FobColors.limeText); // ~20%
  static const cyan = FobHue(Color(0x2422D3EE), FobColors.cyanText); // ~14%
  static const orange = FobHue(Color(0x24FF7A1A), FobColors.orangeText); // ~14%
  static const neutral = FobHue(FobColors.wb09, FobColors.textMuted);
}

/// Single source of truth mapping a status (booking / tour / payment) to its
/// pill hue — replaces the per-screen switch statements (theme-guide §4).
class FobStatusHue {
  FobStatusHue._();

  /// Booking + generic status strings (confirmed/draft/cancelled/refunded…).
  static FobHue forStatus(String status) {
    final s = status.toLowerCase();
    if (s.contains('confirm') && !s.contains('provision')) return FobHue.lime; // settled
    if (s.contains('provision') || s.contains('draft')) return FobHue.cyan; // info
    if (s.contains('cancel') || s.contains('fail')) return FobHue.pink; // needs action
    if (s.contains('refund') || s.contains('abandon')) return FobHue.orange; // warning
    return FobHue.neutral;
  }

  /// Tour catalogue status (published/draft/archived).
  static FobHue forTour(String status) => switch (status) {
        'published' => FobHue.lime,
        'archived' => FobHue.neutral,
        _ => FobHue.orange, // draft
      };
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
  // Cupertino-softened from DS defaults (TDR-15 update).
  static const field = 10.0;
  static const button = 12.0;
  static const table = 16.0;
  static const card = 18.0;
  static const round = 20.0; // status pills
  static const pill = 8.0;
}

class FobText {
  FobText._();

  // Source Serif 4 — titles and money only (TDR-15 update; upright lining
  // figures, replaces Playfair Display).
  static const serif = 'Source Serif 4';
  // Plus Jakarta Sans — functional text.
  static const sans = 'Plus Jakarta Sans';
  // monospace — ids, codes, micro-labels.
  static const mono = 'monospace';

  // Lining + tabular figures — applied to every serif style (titles + money)
  // so currency reads with upright, column-aligned digits (the design-system
  // reason Source Serif 4 replaced Playfair). Sans figures are already lining.
  static const liningFigures = [
    FontFeature.enable('lnum'),
    FontFeature.enable('tnum'),
  ];

  static const pageTitle = TextStyle(
    fontFamily: serif,
    fontSize: 30,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.63, // -0.021em at 30px
    height: 1.14,
    color: FobColors.textStrong,
    fontFeatures: liningFigures,
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

  // Retained alias (Source Serif 4 has native lining figures; the feature
  // request keeps tabular alignment in money columns). Kept so existing
  // call sites (`FobText.moneyFontFeatures`) compile unchanged.
  static const moneyFontFeatures = liningFigures;

  static const money = TextStyle(
    fontFamily: serif,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: FobColors.textPrice,
    fontFeatures: liningFigures,
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
    // Parchment dialog surface app-wide — every AlertDialog inherits the card
    // shape/colour + serif title, keeping raw dialogs on-brand without
    // restructuring each one.
    dialogTheme: DialogThemeData(
      backgroundColor: FobColors.surfaceCard,
      surfaceTintColor: Colors.transparent,
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(FobRadius.card)),
      // CHG-014: dialog titles moved serif → sans (serif is reserved for page
      // titles + money); firmer w600 keeps the heading hierarchy.
      titleTextStyle: const TextStyle(
        fontFamily: FobText.sans,
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
        color: FobColors.textStrong,
      ),
      contentTextStyle: FobText.body,
    ),
  );
}
