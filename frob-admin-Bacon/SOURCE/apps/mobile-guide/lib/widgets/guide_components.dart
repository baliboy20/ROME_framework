import 'package:flutter/material.dart';

import '../models/guide_models.dart';
import '../theme/parchment_tokens.dart';
import 'status_pill.dart';

/// `StepRow` (design-system.md §8.5b) — playbook step: number/tick, title,
/// status chip. UXC-STA-1: three-value machine todo/current/done.
class StepRow extends StatelessWidget {
  const StepRow({
    super.key,
    required this.num,
    required this.title,
    required this.sub,
    required this.status,
    this.onTap,
  });

  final int num;
  final String title;
  final String sub;
  final StepStatus status;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final done = status == StepStatus.done;
    final circleColor = done ? FobColors.accentLime : FobColors.accentPink;
    return Semantics(
      button: true,
      label: '$title, $sub, ${status.name}',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(FobRadius.card),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: circleColor, shape: BoxShape.circle),
                  child: done
                      ? const Icon(Icons.check, size: 18, color: FobColors.pillInk)
                      : Text('$num',
                          style: const TextStyle(
                              color: FobColors.pillInk, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: Theme.of(context).textTheme.titleMedium),
                      Text(sub, style: Theme.of(context).textTheme.labelSmall),
                    ],
                  ),
                ),
                StatusPill(
                  label: done ? 'DONE' : 'START',
                  tone: done ? PillTone.lime : PillTone.pink,
                  solid: done,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// `ProgressBar` — n/max fill, `onDark` variant for the gradient hero card.
class GuideProgressBar extends StatelessWidget {
  const GuideProgressBar({
    super.key,
    required this.value,
    required this.max,
    this.label,
    this.onDark = false,
  });

  final int value;
  final int max;
  final String? label;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final fraction = max == 0 ? 0.0 : value / max;
    final trackColor = onDark ? Colors.white.withValues(alpha: 0.28) : FobColors.hairline(FobColors.wb12);
    final fillColor = onDark ? Colors.white : FobColors.accentPink;
    final textColor = onDark ? Colors.white : FobColors.textBody;
    return Semantics(
      label: label ?? 'Progress $value of $max',
      liveRegion: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: fraction),
              duration: FobMotion.slow,
              curve: FobMotion.easeStandard,
              builder: (context, v, _) => LinearProgressIndicator(
                value: v,
                minHeight: 8,
                backgroundColor: trackColor,
                valueColor: AlwaysStoppedAnimation(fillColor),
              ),
            ),
          ),
          if (label != null) ...[
            const SizedBox(height: 6),
            Text(label!, style: TextStyle(fontSize: 12, color: textColor)),
          ],
        ],
      ),
    );
  }
}

/// `ChecklistRow` — tap-to-tick row, optional sub + chip.
class ChecklistRow extends StatelessWidget {
  const ChecklistRow({
    super.key,
    required this.label,
    this.sub,
    this.chip,
    required this.checked,
    required this.onChanged,
  });

  final String label;
  final String? sub;
  final String? chip;
  final bool checked;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      toggled: checked,
      child: InkWell(
        onTap: () => onChanged(!checked),
        borderRadius: BorderRadius.circular(FobRadius.field),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
            child: Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: checked ? FobColors.accentLime : Colors.transparent,
                    border: Border.all(
                      color: checked ? FobColors.accentLime : FobColors.hairline(FobColors.wb16),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: checked ? const Icon(Icons.check, size: 16, color: FobColors.pillInk) : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label, style: Theme.of(context).textTheme.bodyLarge),
                      if (sub != null)
                        Text(sub!, style: Theme.of(context).textTheme.labelSmall),
                    ],
                  ),
                ),
                if (chip != null) StatusPill(label: chip!, tone: PillTone.cyan, solid: false),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Shared typed-confirm affordance for G3/G5 (UXD-G-01): enables its
/// confirm only when a full name is typed. Distinct from `SignatureField`
/// — the two sign-off modes are not interchangeable.
class TypedConfirm extends StatefulWidget {
  const TypedConfirm({
    super.key,
    required this.signed,
    required this.signatory,
    required this.onSign,
    this.confirmLabel = 'Confirm',
    this.blocked = false,
    this.blockedReason,
  });

  final bool signed;
  final String? signatory;
  final ValueChanged<String> onSign;
  final String confirmLabel;

  /// UXD-G-03: an unresolved high-risk item blocks the confirm even with a
  /// typed name.
  final bool blocked;
  final String? blockedReason;

  @override
  State<TypedConfirm> createState() => _TypedConfirmState();
}

class _TypedConfirmState extends State<TypedConfirm> {
  final _controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    if (widget.signed) {
      return Text('Confirmed by ${widget.signatory}',
          style: const TextStyle(fontWeight: FontWeight.w600, color: FobColors.limeTextLight));
    }
    final nameEmpty = _controller.text.trim().isEmpty;
    final disabled = nameEmpty || widget.blocked;
    String? reason;
    if (widget.blocked) {
      reason = widget.blockedReason ?? 'Resolve all high-risk items first';
    } else if (nameEmpty) {
      reason = 'Type your full name to enable confirm';
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          textField: true,
          label: 'Type your full name to confirm',
          child: TextField(
            controller: _controller,
            enabled: !widget.blocked,
            decoration: const InputDecoration(labelText: 'Type your full name to confirm'),
            onChanged: (_) => setState(() {}),
          ),
        ),
        const SizedBox(height: 12),
        _ConfirmButton(
          label: widget.confirmLabel,
          disabled: disabled,
          reason: reason,
          onPressed: disabled ? null : () => widget.onSign(_controller.text.trim()),
        ),
      ],
    );
  }
}

class _ConfirmButton extends StatelessWidget {
  const _ConfirmButton({required this.label, required this.disabled, this.reason, this.onPressed});
  final String label;
  final bool disabled;
  final String? reason;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton(onPressed: onPressed, child: Text(label)),
        if (disabled && reason != null) ...[
          const SizedBox(height: 6),
          Text(reason!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: FobColors.textMuted)),
        ],
      ],
    );
  }
}

/// `SignatureField` — tap-to-attest declaration pad (deliberate
/// tap-to-attest placeholder per handoff §Fidelity, not true signature
/// capture — flagged as an open UXIS question, see FOB-Guide-App-UXIS.md
/// "Open questions to route" §2).
class SignatureField extends StatefulWidget {
  const SignatureField({
    super.key,
    required this.label,
    this.placeholder = 'Type your full name to sign',
    this.signatory,
    required this.onSign,
  });

  final String label;
  final String placeholder;
  final String? signatory;
  final ValueChanged<String> onSign;

  bool get signed => signatory != null;

  @override
  State<SignatureField> createState() => _SignatureFieldState();
}

class _SignatureFieldState extends State<SignatureField> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.signatory ?? '');

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(FobSpacing.card),
      decoration: BoxDecoration(
        color: widget.signed
            ? FobColors.accentLime.withValues(alpha: 0.12)
            : FobColors.surfaceCard,
        borderRadius: BorderRadius.circular(FobRadius.card),
        border: Border.all(color: FobColors.hairline(FobColors.wb12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SIGNATURE DECLARATION',
            style: Theme.of(context).textTheme.labelSmall,
          ),
          const SizedBox(height: 4),
          Semantics(
            textField: true,
            label: widget.label,
            child: TextField(
              controller: _controller,
              enabled: !widget.signed,
              decoration: InputDecoration(hintText: widget.placeholder),
              style: const TextStyle(
                fontFamily: 'PlayfairDisplay',
                fontStyle: FontStyle.italic,
                fontSize: 20,
                color: FobColors.textStrong,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          const SizedBox(height: 10),
          if (!widget.signed)
            FilledButton(
              onPressed: _controller.text.trim().isEmpty
                  ? null
                  : () => widget.onSign(_controller.text.trim()),
              child: const Text('Sign'),
            )
          else
            Text('Signed by ${widget.signatory}',
                style: const TextStyle(color: FobColors.limeTextLight, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

/// `CategoryChips` — single-select chip row (UXC-CMP-2: exactly one active
/// member).
class CategoryChips extends StatelessWidget {
  const CategoryChips({super.key, required this.options, this.value, required this.onChanged});

  final List<String> options;
  final String? value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: FobSpacing.row,
      runSpacing: FobSpacing.row,
      children: options.map((o) {
        final active = o == value;
        return Semantics(
          button: true,
          selected: active,
          label: o,
          child: InkWell(
            onTap: () => onChanged(o),
            borderRadius: BorderRadius.circular(FobRadius.round),
            child: Container(
              constraints: const BoxConstraints(minHeight: 44),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: active ? FobColors.accentCyan : FobColors.surfaceCard,
                borderRadius: BorderRadius.circular(FobRadius.round),
                border: Border.all(
                  color: active ? FobColors.accentCyan : FobColors.hairline(FobColors.wb16),
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                o,
                style: TextStyle(
                  color: active ? FobColors.pillInk : FobColors.textStrong,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

/// `StarRating` — 1-5 star input.
class StarRating extends StatelessWidget {
  const StarRating({super.key, required this.value, this.count = 5, required this.onChanged});

  final int value;
  final int count;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Rating, $value of $count stars',
      child: Row(
        children: List.generate(count, (i) {
          final filled = i < value;
          return Padding(
            padding: const EdgeInsets.only(right: 4),
            child: InkWell(
              onTap: () => onChanged(i + 1),
              child: SizedBox(
                width: 44,
                height: 44,
                child: Icon(
                  filled ? Icons.star : Icons.star_border,
                  color: filled ? FobColors.accentOrange : FobColors.textFaint,
                  size: 28,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
