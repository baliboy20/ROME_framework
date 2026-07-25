import 'package:flutter/material.dart';
import '../theme/tokens.dart';

/// Modal — centred dialog, blurred scrim.
/// [blocking]=true: destructive/money confirms, dismissed only by explicit
/// choice (UXC-MOD-1) — no barrierDismissible, no Escape.
/// [blocking]=false: informational overlays dismiss freely (UXC-MOD-3).
Future<T?> showFobModal<T>({
  required BuildContext context,
  required Widget Function(BuildContext) builder,
  bool blocking = true,
}) {
  return showDialog<T>(
    context: context,
    barrierDismissible: !blocking,
    barrierColor: Colors.black.withValues(alpha: 0.35),
    builder: (ctx) {
      final content = Dialog(
        backgroundColor: FobColors.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(FobRadius.card)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Padding(
            padding: const EdgeInsets.all(FobSpace.card),
            child: builder(ctx),
          ),
        ),
      );
      if (!blocking) return content;
      // Suppress Escape-to-dismiss for blocking modals.
      return PopScope(canPop: false, child: content);
    },
  );
}
