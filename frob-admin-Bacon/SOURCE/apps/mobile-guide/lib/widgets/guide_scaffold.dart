import 'package:flutter/material.dart';

import '../theme/fob_theme.dart';
import '../theme/parchment_tokens.dart';

/// Screen header pattern (design-system.md §8.4 "Guide app"): back chevron
/// + mono eyebrow (surface ID + interaction mode) above a Playfair title,
/// single-column, thumb-reachable, one primary action anchored at the
/// bottom (UXC-SCR-3). UXC-NAV-1: persistent back affordance to the hub.
class GuideScaffold extends StatelessWidget {
  const GuideScaffold({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.body,
    this.bottomAction,
    this.showBack = true,
  });

  final String eyebrow; // e.g. "G4 · FULL SIGNATURE"
  final String title;
  final Widget body;
  final Widget? bottomAction;
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(kGuideGutter, 12, kGuideGutter, 0),
              child: Row(
                children: [
                  if (showBack)
                    Semantics(
                      button: true,
                      label: 'Back',
                      child: InkWell(
                        onTap: () => Navigator.of(context).maybePop(),
                        borderRadius: BorderRadius.circular(22),
                        child: const SizedBox(
                          width: 44,
                          height: 44,
                          child: Icon(Icons.chevron_left, color: FobColors.textStrong),
                        ),
                      ),
                    )
                  else
                    const SizedBox(width: 44, height: 44),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(kGuideGutter, 0, kGuideGutter, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(eyebrow, style: Theme.of(context).textTheme.labelSmall),
                    const SizedBox(height: 6),
                    Text(title, style: Theme.of(context).textTheme.headlineMedium),
                    const SizedBox(height: FobSpacing.block),
                    body,
                  ],
                ),
              ),
            ),
            if (bottomAction != null)
              Container(
                padding: EdgeInsets.fromLTRB(
                  kGuideGutter,
                  12,
                  kGuideGutter,
                  12 + MediaQuery.of(context).padding.bottom,
                ),
                decoration: BoxDecoration(
                  color: FobColors.surfaceBg,
                  border: Border(top: BorderSide(color: FobColors.hairline(FobColors.wb09))),
                ),
                child: bottomAction,
              ),
          ],
        ),
      ),
    );
  }
}

/// Device/guide identity pill row shown under the header on every surface
/// (design-system.md §8.4: "pill row showing device/guide identity").
class DeviceIdentityRow extends StatelessWidget {
  const DeviceIdentityRow({super.key, required this.deviceId, required this.guideName});

  final String deviceId;
  final String guideName;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: FobColors.surfaceRail,
            borderRadius: BorderRadius.circular(FobRadius.round),
            border: Border.all(color: FobColors.hairline(FobColors.wb12)),
          ),
          child: Text(deviceId,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: FobColors.textLabel)),
        ),
        Text('$guideName · guide',
            style: const TextStyle(fontSize: 12, color: FobColors.textMuted)),
      ],
    );
  }
}
