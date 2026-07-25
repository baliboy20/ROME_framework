import 'package:flutter/material.dart';
import '../theme/tokens.dart';

/// FilterChip — toolbar filter; active = solid hue.
/// One active member per group at a time (UXC-CMP-3).
class FobFilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const FobFilterChip({super.key, required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? FobColors.pink : FobColors.surfaceCard,
      borderRadius: BorderRadius.circular(FobRadius.round),
      child: InkWell(
        borderRadius: BorderRadius.circular(FobRadius.round),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(FobRadius.round),
            border: Border.all(color: active ? Colors.transparent : FobColors.hairline),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: active ? FobColors.pillInk : FobColors.textBody,
            ),
          ),
        ),
      ),
    );
  }
}
