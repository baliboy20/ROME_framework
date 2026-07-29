import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/guide_models.dart';
import '../state/tour_cubit.dart';
import '../theme/fob_theme.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/guide_components.dart';
import '../widgets/guide_scaffold.dart';

/// G2 — Tour-day home / playbook overview (the hub, UXC-NAV-1).
/// UXD-G-11: progress is derived, never stored; steps enterable out of
/// order but progress reflects only true completions.
class G2HomeScreen extends StatefulWidget {
  const G2HomeScreen({super.key, required this.deviceId});

  final String deviceId;

  @override
  State<G2HomeScreen> createState() => _G2HomeScreenState();
}

class _G2HomeScreenState extends State<G2HomeScreen> {
  @override
  void initState() {
    super.initState();
    // REQ-OPS01: pull today's real departure + participants from api-worker,
    // replacing local seed riders. Failure (offline/404) is non-fatal — the
    // guide keeps working from local state, with a one-line notice.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final messenger = ScaffoldMessenger.of(context);
      final outcome = await context.read<TourCubit>().loadDeparture();
      if (!outcome.synced && mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text('Working offline: ${outcome.error!}')),
        );
      }
    });
  }

  static const _steps = [
    ('G3', 'Travel kit checklist', 'G3 · Typed confirm', '/kit'),
    ('G4', 'Bike inspection', 'G4 · Full signature', '/bike-inspection'),
    ('G5', 'Risk assessment', 'G5 · Typed confirm', '/risk'),
    ('G6', 'Rider check-in', 'G6 · Full signature', '/checkin'),
    ('G7', 'Safety briefing', 'G7 · Acknowledge', '/briefing'),
    ('G8', 'Final sign-off', 'G8 · Full signature', '/final-signoff'),
  ];

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TourCubit, TourSession>(
      builder: (context, session) {
        final completed = session.completedCount;
        return Scaffold(
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(kGuideGutter),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SIX STEPS BEFORE YOU ROLL',
                      style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 6),
                  Text('Tour-day playbook', style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 10),
                  DeviceIdentityRow(deviceId: widget.deviceId, guideName: 'Emma'),
                  const SizedBox(height: FobSpacing.block),
                  _HeroCard(session: session, completed: completed),
                  const SizedBox(height: FobSpacing.block),
                  Text('PRE-DEPARTURE PLAYBOOK', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 6),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Column(
                        children: [
                          for (int i = 0; i < _steps.length; i++) ...[
                            StepRow(
                              num: i + 1,
                              title: _steps[i].$2,
                              sub: _steps[i].$3,
                              status: session.stepStatus(_steps[i].$1),
                              onTap: () => Navigator.of(context).pushNamed(_steps[i].$4),
                            ),
                            if (i != _steps.length - 1)
                              Divider(color: FobColors.hairline(FobColors.wb09)),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: FobSpacing.block),
                  Text('DURING THE TOUR', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 6),
                  _NavCard(
                    title: 'Mid-tour event log',
                    sub: 'G9 · Mechanical / illness / early-leave',
                    onTap: () => Navigator.of(context).pushNamed('/mid-tour-event'),
                  ),
                  const SizedBox(height: 10),
                  _NavCard(
                    title: 'Emergency / incident logger',
                    sub: 'G10 · Alerts William immediately',
                    danger: true,
                    onTap: () => Navigator.of(context).pushNamed('/emergency'),
                  ),
                  const SizedBox(height: FobSpacing.block),
                  Text('AFTER THE TOUR', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 6),
                  _NavCard(
                    title: 'Post-ride review',
                    sub: 'G11 · Due within 24 hours',
                    onTap: () => Navigator.of(context).pushNamed('/post-ride-review'),
                  ),
                  const SizedBox(height: 10),
                  _NavCard(
                    title: 'Incident report',
                    sub: 'G12 · Formal narrative',
                    onTap: () => Navigator.of(context).pushNamed('/incident-report'),
                  ),
                  const SizedBox(height: 10),
                  _NavCard(
                    title: 'Hazard observation',
                    sub: 'G13 · Location + type',
                    onTap: () => Navigator.of(context).pushNamed('/hazard'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.session, required this.completed});
  final TourSession session;
  final int completed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(FobSpacing.card),
      decoration: BoxDecoration(
        gradient: FobColors.gradientBrand,
        borderRadius: BorderRadius.circular(FobRadius.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(session.tourName,
              style: const TextStyle(
                  fontFamily: 'PlayfairDisplay',
                  fontSize: 21,
                  fontWeight: FontWeight.w600,
                  color: Colors.white)),
          const SizedBox(height: 4),
          Text(session.tourMeta,
              style: const TextStyle(
                  fontFamily: 'monospace', fontSize: 11, color: Colors.white70, letterSpacing: 0.6)),
          const SizedBox(height: 16),
          GuideProgressBar(value: completed, max: 6, onDark: true),
          const SizedBox(height: 6),
          Text('$completed/6', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _NavCard extends StatelessWidget {
  const _NavCard({required this.title, required this.sub, required this.onTap, this.danger = false});
  final String title;
  final String sub;
  final VoidCallback onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(FobRadius.card),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    Text(sub, style: Theme.of(context).textTheme.labelSmall),
                  ],
                ),
              ),
              Icon(Icons.chevron_right,
                  color: danger ? FobColors.accentPink : FobColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
