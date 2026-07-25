import 'dart:async';

import 'package:flutter/material.dart';

/// Defers mounting a heavy page until [delay] has elapsed — long enough for the
/// route's entrance transition to finish — showing [placeholder] in the
/// meantime, then cross-fading to the real content.
///
/// Because the real page (and therefore its Bloc's data load) is not built
/// until after the animation, neither the widget build nor the data-driven
/// rebuild competes with the transition — the slide animates a cheap skeleton.
class DeferredContent extends StatefulWidget {
  const DeferredContent({
    super.key,
    required this.builder,
    required this.placeholder,
    this.delay = const Duration(milliseconds: 300),
  });

  final WidgetBuilder builder;
  final Widget placeholder;
  final Duration delay;

  @override
  State<DeferredContent> createState() => _DeferredContentState();
}

class _DeferredContentState extends State<DeferredContent> {
  bool _ready = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(widget.delay, () {
      if (mounted) setState(() => _ready = true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Reduce-motion: skip the deferral entirely, show the real page at once.
    if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) {
      return widget.builder(context);
    }
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      switchInCurve: Curves.easeOut,
      child: _ready
          ? KeyedSubtree(key: const ValueKey('content'), child: widget.builder(context))
          : KeyedSubtree(key: const ValueKey('skeleton'), child: widget.placeholder),
    );
  }
}
