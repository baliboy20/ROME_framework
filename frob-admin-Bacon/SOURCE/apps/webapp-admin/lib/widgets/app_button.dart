import 'package:flutter/material.dart';
import '../theme/tokens.dart';

enum AppButtonKind { primary, secondary, ghost, danger, row }

/// Core Button primitive — gradient primary, outline secondary, ghost, danger, row.
/// Press feedback is tint/brightness, never scale (UXC-CMP-1).
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonKind kind;
  final bool loading;

  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.kind = AppButtonKind.secondary,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    final child = loading
        ? const SizedBox(
            height: 14,
            width: 14,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        : Text(label);

    switch (kind) {
      case AppButtonKind.primary:
        return Opacity(
          opacity: disabled ? 0.6 : 1,
          child: Container(
            decoration: BoxDecoration(
              gradient: FobColors.gradientBrand,
              borderRadius: BorderRadius.circular(FobRadius.button),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(FobRadius.button),
                onTap: disabled ? null : onPressed,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: DefaultTextStyle(
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13.5),
                    child: child,
                  ),
                ),
              ),
            ),
          ),
        );
      case AppButtonKind.danger:
        return ElevatedButton(
          onPressed: disabled ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: FobColors.pink,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(FobRadius.button)),
          ),
          child: child,
        );
      case AppButtonKind.ghost:
        return TextButton(
          onPressed: disabled ? null : onPressed,
          child: child,
        );
      case AppButtonKind.row:
        return TextButton(
          onPressed: disabled ? null : onPressed,
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            minimumSize: const Size(0, 28),
          ),
          child: DefaultTextStyle(style: const TextStyle(fontSize: 12), child: child),
        );
      case AppButtonKind.secondary:
        return OutlinedButton(
          onPressed: disabled ? null : onPressed,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: FobColors.hairline),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(FobRadius.button)),
          ),
          child: child,
        );
    }
  }
}
