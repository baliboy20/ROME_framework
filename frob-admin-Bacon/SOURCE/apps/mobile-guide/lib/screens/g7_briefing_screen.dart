import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/guide_models.dart';
import '../state/tour_cubit.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/fob_button.dart';
import '../widgets/guide_scaffold.dart';

/// G7 — Safety briefing script. UXD-G-03: today's mitigations from G5
/// appear inline under "Today's mitigations (from G5)".
class G7BriefingScreen extends StatelessWidget {
  const G7BriefingScreen({super.key});

  static const _script = [
    'Welcome and introductions — confirm everyone can hear you.',
    'Route overview: distance, terrain, stops, expected finish time.',
    'Hand signals and group riding etiquette.',
    'Emergency procedure: what to do if separated or injured.',
    'Weather and hydration reminders for today.',
  ];

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return BlocBuilder<TourCubit, TourSession>(
      builder: (context, session) {
        final done = session.briefingAcknowledged;
        final mitigations = session.riskItems.where((r) => r.mitigated).toList();
        return GuideScaffold(
          eyebrow: 'G7 · ACKNOWLEDGE',
          title: 'Safety briefing',
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final line in _script)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text('• $line'),
                ),
              if (mitigations.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text("TODAY'S MITIGATIONS (FROM G5)", style: Theme.of(context).textTheme.labelSmall),
                const SizedBox(height: 8),
                Card(
                  color: FobColors.accentOrange.withValues(alpha: 0.08),
                  child: Padding(
                    padding: const EdgeInsets.all(FobSpacing.card),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        for (final m in mitigations)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Text('${m.label}: ${m.mitigationNote}'),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 20),
              if (done)
                const Text('Briefing acknowledged.',
                    style: TextStyle(fontWeight: FontWeight.w600, color: FobColors.limeTextLight))
              else
                FobButton(
                  label: 'Acknowledge briefing given',
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    final navigator = Navigator.of(context);
                    final outcome = await cubit.acknowledgeBriefing();
                    if (!outcome.synced) {
                      messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                    }
                    navigator.maybePop();
                  },
                ),
            ],
          ),
        );
      },
    );
  }
}
