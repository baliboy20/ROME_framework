import 'package:flutter/material.dart';
import '../theme/tokens.dart';

/// Modal — centred dialog, dimmed scrim, with a soft scale-and-fade open/close.
/// [blocking]=true: destructive/money confirms, dismissed only by explicit
/// choice (UXC-MOD-1) — no barrierDismissible, no Escape.
/// [blocking]=false: informational overlays dismiss freely (UXC-MOD-3).
Future<T?> showFobModal<T>({
  required BuildContext context,
  required Widget Function(BuildContext) builder,
  bool blocking = true,
}) {
  return showGeneralDialog<T>(
    context: context,
    barrierDismissible: !blocking,
    barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
    barrierColor: Colors.black.withValues(alpha: 0.35),
    transitionDuration: const Duration(milliseconds: 200),
    pageBuilder: (ctx, _, __) {
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
      // Suppress Escape-to-dismiss for blocking modals.
      return blocking ? PopScope(canPop: false, child: content) : content;
    },
    transitionBuilder: (ctx, animation, _, child) {
      if (MediaQuery.maybeDisableAnimationsOf(ctx) ?? false) return child;
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return FadeTransition(
        opacity: curved,
        child: AnimatedBuilder(
          animation: curved,
          builder: (_, inner) => Transform.scale(scale: 0.96 + 0.04 * curved.value, child: inner),
          child: child,
        ),
      );
    },
  );
}
