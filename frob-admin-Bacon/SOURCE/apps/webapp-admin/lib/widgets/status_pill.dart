import 'package:flutter/material.dart';
import 'status_types.dart';
import '../theme/tokens.dart';

/// Status pill for any status string (booking browser, notices, etc.),
/// following the parchment handoff (.status-pill): mono uppercase,
/// radius-round, pale accent-tint fill. Text + hue, never colour alone.
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

  /// Build from a pale-tint accent hue (mockup `hues` map).
  factory PillLabel.hue(FobHue hue, String text) =>
      PillLabel(text: text, background: hue.background, foreground: hue.foreground);

  /// Map a raw booking/payment status string to the fixed parchment hue
  /// (single source: [FobStatusHue.forStatus]).
  static PillLabel forStatus(String status) => PillLabel.hue(FobStatusHue.forStatus(status), status);

  @override
  Widget build(BuildContext context) {
    // mockup pill: 3px 10px, radius-round, mono 10px/600, .05em, uppercase.
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(FobRadius.round),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontFamily: FobText.mono,
          fontSize: 10,
          fontWeight: FontWeight.w600,
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

  FobHue get _hue {
    switch (status) {
      case StatusPillState.succeeded:
        return FobHue.lime; // settled
      case StatusPillState.refunded:
        return FobHue.cyan; // money-back / info
      case StatusPillState.requiresPayment:
        return FobHue.orange; // warning
      case StatusPillState.failed:
        return FobHue.pink; // needs action
      case StatusPillState.noShow:
      case StatusPillState.draft:
        return FobHue.neutral;
    }
  }

  @override
  Widget build(BuildContext context) {
    return PillLabel.hue(_hue, statusLabel(status));
  }
}
