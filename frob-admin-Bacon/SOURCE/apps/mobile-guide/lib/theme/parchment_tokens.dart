import 'package:flutter/material.dart';

/// Internal Apps Parchment token set (Track B), ported verbatim from
/// design-system.md §8.1-8.3 (source of truth: design-handoff/README.md).
/// Shared by mobile-guide and webapp-admin — this file is the mobile-guide
/// copy of the token values, kept numerically identical to the admin app's.
class FobColors {
  FobColors._();

  // Parchment neutrals & semantic aliases (light theme, default and only
  // theme in scope — .fob-console stays OFF per DEV-1).
  static const Color surfaceBg = Color(0xFFF8F6EF);
  static const Color surfaceBgLo = Color(0xFFEEEBE1);
  static const Color surfaceCard = Color(0xFFFFFFFF);
  static const Color surfaceRaised = Color(0xFFFDFCF8);
  static const Color surfaceRail = Color(0xFFF7F4EC);
  static const Color textStrong = Color(0xFF33322A);
  static const Color textBody = Color(0xFF5B584C);
  static const Color textMuted = Color(0xFF8A8778);
  static const Color textFaint = Color(0xFFA5A294);
  static const Color textLabel = Color(0xFF9A9788);
  static const Color textPriceLink = Color(0xFFB83072);
  static const Color textLinkHover = Color(0xFFFF2D9B);

  // Status accent system — "accent = status, never decorative".
  static const Color accentPink = Color(0xFFFF2D9B); // needs action / cost
  static const Color accentLime = Color(0xFFC6FF3F); // settled / done
  static const Color accentCyan = Color(0xFF22D3EE); // info / trust
  static const Color accentOrange = Color(0xFFFF7A1A); // warning
  static const Color pillInk = Color(0xFF170A26);

  static const Color pinkTextLight = Color(0xFFB83072);
  static const Color cyanTextLight = Color(0xFF0E7490);
  static const Color limeTextLight = Color(0xFF4E7A12);
  static const Color orangeTextLight = Color(0xFFC2610A);

  static const LinearGradient gradientBrand = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accentPink, accentOrange],
  );

  /// Hairline/fill alpha ladder over white/black-on-parchment, in place of
  /// invented greys (design-system.md §8.1 "Alpha ladders").
  static Color hairline(double alpha) => textStrong.withValues(alpha: alpha);
  static const double wb03 = 0.03;
  static const double wb05 = 0.05;
  static const double wb09 = 0.09;
  static const double wb12 = 0.12;
  static const double wb16 = 0.16;

  /// Text-ink alpha ladder derived from --text-strong.
  static Color textAlpha(double alpha) => textStrong.withValues(alpha: alpha);
  static const double tx32 = 0.32;
  static const double tx48 = 0.48;
  static const double tx60 = 0.60;
  static const double tx75 = 0.75;
}

class FobSpacing {
  FobSpacing._();
  static const double inline = 6;
  static const double row = 10;
  static const double field = 14;
  static const double card = 20;
  static const double block = 26;
  static const double gutter = 48; // desktop only; guide app uses a
  // narrower single-column gutter (see kGuideGutter in fob_theme.dart)
}

class FobRadius {
  FobRadius._();
  static const double field = 9;
  static const double button = 11;
  static const double table = 12;
  static const double card = 16;
  static const double round = 20;
}

class FobShadows {
  FobShadows._();
  static const BoxShadow modal = BoxShadow(
    color: Color(0x59281E14), // rgba(40,30,20,.35)
    blurRadius: 100,
    offset: Offset(0, 40),
  );
  static const Color overlayScrim = Color(0x6B2E2C24); // rgba(46,44,36,.42)
}

/// Motion tokens — PROPOSED (design-system.md §8.8), not sponsor-final.
/// Honour prefers-reduced-motion by dropping to Duration.zero at call sites.
class FobMotion {
  FobMotion._();
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration base = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 320);
  static const Curve easeStandard = Cubic(0.4, 0, 0.2, 1);
  static const Curve easeOut = Cubic(0, 0, 0.2, 1);
}
