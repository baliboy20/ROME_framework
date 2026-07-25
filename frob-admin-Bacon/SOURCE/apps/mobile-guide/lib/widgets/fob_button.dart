import 'package:flutter/material.dart';

import '../theme/parchment_tokens.dart';

enum FobButtonVariant { primary, secondary, ghost, danger }

/// `Button` core component (design-system.md §8.5a). Press feedback is a
/// brightness/tint shift, never a scale transform (UXC-CMP-1, hard rule).
class FobButton extends StatefulWidget {
  const FobButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = FobButtonVariant.primary,
    this.disabledReason,
  });

  final String label;
  final VoidCallback? onPressed;
  final FobButtonVariant variant;

  /// UXC-FRM-1: disabled state must state the reason adjacent.
  final String? disabledReason;

  @override
  State<FobButton> createState() => _FobButtonState();
}

class _FobButtonState extends State<FobButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final disabled = widget.onPressed == null;
    final child = GestureDetector(
      onTapDown: disabled ? null : (_) => setState(() => _pressed = true),
      onTapCancel: disabled ? null : () => setState(() => _pressed = false),
      onTapUp: disabled ? null : (_) => setState(() => _pressed = false),
      onTap: widget.onPressed,
      child: Semantics(
        button: true,
        enabled: !disabled,
        label: widget.label,
        child: AnimatedContainer(
          duration: FobMotion.fast,
          constraints: const BoxConstraints(minHeight: 48),
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: _decoration(disabled),
          alignment: Alignment.center,
          child: Text(
            widget.label,
            style: TextStyle(
              fontFamily: 'PlusJakartaSans',
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: _textColor(disabled),
            ),
          ),
        ),
      ),
    );

    if (disabled && widget.disabledReason != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          child,
          const SizedBox(height: 6),
          Text(
            widget.disabledReason!,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: FobColors.textMuted),
          ),
        ],
      );
    }
    return child;
  }

  BoxDecoration _decoration(bool disabled) {
    final radius = BorderRadius.circular(FobRadius.button);
    if (disabled) {
      return BoxDecoration(
        color: FobColors.hairline(FobColors.wb09),
        borderRadius: radius,
      );
    }
    final brightness = _pressed ? 0.92 : 1.0;
    switch (widget.variant) {
      case FobButtonVariant.primary:
        return BoxDecoration(
          gradient: FobColors.gradientBrand,
          borderRadius: radius,
          border: Border.all(color: Colors.black.withValues(alpha: _pressed ? 0.08 : 0)),
        );
      case FobButtonVariant.secondary:
        return BoxDecoration(
          color: FobColors.surfaceCard.withValues(alpha: brightness),
          borderRadius: radius,
          border: Border.all(color: FobColors.hairline(FobColors.wb16)),
        );
      case FobButtonVariant.ghost:
        return BoxDecoration(
          color: _pressed ? FobColors.hairline(FobColors.wb05) : Colors.transparent,
          borderRadius: radius,
        );
      case FobButtonVariant.danger:
        return BoxDecoration(
          color: FobColors.accentPink.withValues(alpha: brightness),
          borderRadius: radius,
        );
    }
  }

  Color _textColor(bool disabled) {
    if (disabled) return FobColors.textFaint;
    switch (widget.variant) {
      case FobButtonVariant.primary:
      case FobButtonVariant.danger:
        return FobColors.pillInk;
      case FobButtonVariant.secondary:
      case FobButtonVariant.ghost:
        return FobColors.textStrong;
    }
  }
}
