import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/tokens.dart';

/// Solid pill for any status string (booking browser, notices, etc.),
/// following the parchment handoff (.status-pill): mono uppercase,
/// radius-round, solid accent fill. Text + hue, never colour alone.
class PillLabel extends StatelessWidget {
  final String text;
  final Color background;
  final Color foreground;
  const PillLabel({
    super.key,
    required this.text,
    required this.background,
    required this.foreground,
  });

  /// Map a raw booking/payment status string to the fixed parchment hue.
  static PillLabel forStatus(String status) {
    final s = status.toLowerCase();
    Color bg;
    Color fg;
    if (s.contains('confirm') && !s.contains('provision')) {
      bg = FobColors.lime;
      fg = FobColors.pillInk;
    } else if (s.contains('provision') || s.contains('draft')) {
      bg = FobColors.cyan;
      fg = FobColors.pillInk;
    } else if (s.contains('cancel') || s.contains('fail')) {
      bg = FobColors.pink;
      fg = Colors.white;
    } else if (s.contains('refund') || s.contains('abandon')) {
      bg = FobColors.orange;
      fg = Colors.white;
    } else {
      bg = FobColors.surfaceBgLo;
      fg = FobColors.textMuted;
    }
    return PillLabel(text: status, background: bg, foreground: fg);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(FobRadius.round),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontFamily: FobText.mono,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
          color: foreground,
        ),
      ),
    );
  }
}

/// StatusPill — payment states mapped to the fixed parchment hues.
class StatusPill extends StatelessWidget {
  final StatusPillState status;
  const StatusPill({super.key, required this.status});

  (Color, Color) get _tones {
    switch (status) {
      case StatusPillState.succeeded:
        return (FobColors.lime, FobColors.pillInk);
      case StatusPillState.refunded:
        return (FobColors.cyan, FobColors.pillInk);
      case StatusPillState.requiresPayment:
        return (FobColors.orange, Colors.white);
      case StatusPillState.failed:
        return (FobColors.pink, Colors.white);
      case StatusPillState.noShow:
        return (FobColors.surfaceBgLo, FobColors.textMuted);
      case StatusPillState.draft:
        return (const Color(0x1733322A), FobColors.textMuted);
    }
  }

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _tones;
    return PillLabel(text: statusLabel(status), background: bg, foreground: fg);
  }
}
