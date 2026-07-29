import 'package:flutter/material.dart';

import '../theme/parchment_tokens.dart';

enum PillTone { pink, lime, cyan, orange, neutral }

/// `StatusPill` core component (design-system.md §8.5a) — always a text
/// label + hue, never colour alone (UXC-A11Y-3).
class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, required this.tone, this.solid = true});

  final String label;
  final PillTone tone;
  final bool solid;

  Color get _hue => switch (tone) {
        PillTone.pink => FobColors.accentPink,
        PillTone.lime => FobColors.accentLime,
        PillTone.cyan => FobColors.accentCyan,
        PillTone.orange => FobColors.accentOrange,
        PillTone.neutral => FobColors.textMuted,
      };

  Color get _textOnLight => switch (tone) {
        PillTone.pink => FobColors.pinkTextLight,
        PillTone.lime => FobColors.limeTextLight,
        PillTone.cyan => FobColors.cyanTextLight,
        PillTone.orange => FobColors.orangeTextLight,
        PillTone.neutral => FobColors.textMuted,
      };

  @override
  Widget build(BuildContext context) {
    final bg = solid ? _hue : _hue.withValues(alpha: 0.14);
    final fg = solid ? FobColors.pillInk : _textOnLight;
    return Semantics(
      label: label,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(FobRadius.round),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.6,
            color: fg,
          ),
        ),
      ),
    );
  }
}
