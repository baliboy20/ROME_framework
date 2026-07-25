import 'package:flutter/material.dart';
import '../theme/tokens.dart';

/// Lightweight placeholder shown while a route's real page is deferred past the
/// entrance transition (see DeferredContent). Cheap to build and paint: a few
/// muted bars with a single gentle opacity pulse over a RepaintBoundary.
class SkeletonPage extends StatefulWidget {
  const SkeletonPage({super.key, this.rows = 6});
  final int rows;

  @override
  State<SkeletonPage> createState() => _SkeletonPageState();
}

class _SkeletonPageState extends State<SkeletonPage> with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduce) {
      _c.value = 0.7;
    } else if (!_c.isAnimating) {
      _c.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  Widget _bar({double? width, double height = 12}) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: FobColors.surfaceBgLo,
          borderRadius: BorderRadius.circular(6),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween<double>(begin: 0.45, end: 0.85).animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut)),
      child: RepaintBoundary(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _bar(width: 220, height: 26), // page title
            const SizedBox(height: FobSpace.card),
            Row(children: [
              _bar(width: 78, height: 28),
              const SizedBox(width: 8),
              _bar(width: 120, height: 28),
              const SizedBox(width: 8),
              _bar(width: 92, height: 28),
            ]),
            const SizedBox(height: FobSpace.card),
            Container(
              decoration: BoxDecoration(
                color: FobColors.surfaceCard,
                borderRadius: BorderRadius.circular(FobRadius.card),
                border: Border.all(color: FobColors.hairline),
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  for (var i = 0; i < widget.rows; i++)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 11),
                      child: Row(
                        children: [
                          Expanded(flex: 3, child: _bar(height: 14)),
                          const SizedBox(width: 16),
                          Expanded(flex: 2, child: _bar(height: 14)),
                          const SizedBox(width: 16),
                          Expanded(flex: 2, child: _bar(height: 14)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
