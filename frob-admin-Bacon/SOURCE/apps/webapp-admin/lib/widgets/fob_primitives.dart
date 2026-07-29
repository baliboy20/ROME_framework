import 'package:flutter/material.dart';
import '../theme/tokens.dart';

/// Small shared layout primitives, extracted from per-screen private
/// `_card`/`_divider`/`_sectionLabel`/`_kv` builder methods so they are
/// immutable `const`-constructible StatelessWidgets with a single source of
/// truth (Flutter expert guide: reusable widgets under widgets/, StatelessWidget,
/// const constructors — not builder methods that rebuild with the parent).

/// White parchment surface card with a hairline border.
class FobCard extends StatelessWidget {
  const FobCard({super.key, required this.child, this.padding = const EdgeInsets.all(24)});

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: FobColors.surfaceCard,
        borderRadius: BorderRadius.circular(FobRadius.card),
        border: Border.all(color: FobColors.hairline),
      ),
      child: child,
    );
  }
}

/// Warm parchment hairline divider with standard vertical rhythm.
class FobDivider extends StatelessWidget {
  const FobDivider({super.key, this.gap = 16});

  final double gap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: gap),
      child: const Divider(height: 1, color: FobColors.hairlineWarm),
    );
  }
}

/// Uppercase mono micro-label used to head a record section.
class FobSectionLabel extends StatelessWidget {
  const FobSectionLabel(this.text, {super.key, this.bottomGap = 8});

  final String text;
  final double bottomGap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: bottomGap),
      child: Text(text, style: FobText.microLabel),
    );
  }
}

/// A labelled value pair (mono micro-label over body value), with an optional
/// faint sub-line. Replaces the duplicated `_kv` builders.
class FobKeyValue extends StatelessWidget {
  const FobKeyValue(this.label, this.value, {super.key, this.sub, this.bottomGap = 0});

  final String label;
  final String value;
  final String? sub;
  final double bottomGap;

  @override
  Widget build(BuildContext context) {
    final column = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: FobText.microLabel),
        const SizedBox(height: 5),
        Text(value, style: FobText.body),
        if (sub != null) ...[
          const SizedBox(height: 2),
          Text(sub!, style: const TextStyle(fontSize: 11, color: FobColors.textFaint)),
        ],
      ],
    );
    if (bottomGap == 0) return column;
    return Padding(padding: EdgeInsets.only(bottom: bottomGap), child: column);
  }
}
