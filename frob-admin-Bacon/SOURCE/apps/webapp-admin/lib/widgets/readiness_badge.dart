import 'package:flutter/material.dart';
import 'status_types.dart';
import '../theme/tokens.dart';

/// ReadinessBadge — ✓/~/✗ sub-state pill (UXD-07). Text label always present,
/// never colour alone (UXC-A11Y-3).
class ReadinessBadge extends StatelessWidget {
  final String label;
  final ReadinessSub state;
  const ReadinessBadge({super.key, required this.label, required this.state});

  @override
  Widget build(BuildContext context) {
    final String glyph;
    final Color color;
    switch (state) {
      case ReadinessSub.yes:
        glyph = '✓';
        color = FobColors.limeText;
        break;
      case ReadinessSub.partial:
        glyph = '~';
        color = FobColors.cyanText;
        break;
      case ReadinessSub.no:
        glyph = '✗';
        color = FobColors.orangeText;
        break;
    }
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(FobRadius.round),
      ),
      child: Text('$label $glyph', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
    );
  }
}

/// Composite readiness dot (UXD-07): lime all-clear, orange hard-miss, cyan partial.
class ReadinessDot extends StatelessWidget {
  final String tone; // 'lime' | 'orange' | 'cyan'
  const ReadinessDot({super.key, required this.tone});

  @override
  Widget build(BuildContext context) {
    final color = switch (tone) {
      'lime' => FobColors.lime,
      'orange' => FobColors.orange,
      _ => FobColors.cyan,
    };
    return Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle));
  }
}
