import 'package:flutter/material.dart';
import '../theme/tokens.dart';

/// StatCard — big-number metric tile (.stat-card): serif 2rem value, then a
/// label row with a status dot.
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color dotColor;

  const StatCard({super.key, required this.label, required this.value, this.dotColor = FobColors.lime});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: FobColors.surfaceCard,
        borderRadius: BorderRadius.circular(FobRadius.card),
        border: Border.all(color: FobColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value,
              style: const TextStyle(
                  fontFamily: FobText.serif,
                  fontSize: 32,
                  height: 1,
                  fontWeight: FontWeight.w700,
                  color: FobColors.textStrong)),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
              ),
              const SizedBox(width: 7),
              Flexible(
                child: Text(label,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: FobColors.textMuted)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
