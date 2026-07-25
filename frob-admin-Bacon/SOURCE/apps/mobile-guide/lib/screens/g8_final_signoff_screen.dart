import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/guide_models.dart';
import '../state/tour_cubit.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/guide_components.dart';
import '../widgets/guide_scaffold.dart';

const _stepTitles = {
  'G3': 'Travel kit checklist',
  'G4': 'Bike inspection',
  'G5': 'Risk assessment',
  'G6': 'Rider check-in',
  'G7': 'Safety briefing',
};

const _stepRoutes = {
  'G3': '/kit',
  'G4': '/bike-inspection',
  'G5': '/risk',
  'G6': '/checkin',
  'G7': '/briefing',
};

/// G8 — Pre-departure sign-off gate. UXD-G-05: any outstanding upstream
/// step (G3-G7 not done) blocks the final sign-off; the outstanding count
/// is stated and each item links back to its step.
class G8FinalSignoffScreen extends StatelessWidget {
  const G8FinalSignoffScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return BlocBuilder<TourCubit, TourSession>(
      builder: (context, session) {
        final outstanding = session.outstandingBeforeFinal;
        final ready = outstanding.isEmpty;
        final signedOff = session.finalSignedOff;
        return GuideScaffold(
          eyebrow: 'G8 · FULL SIGNATURE',
          title: 'Pre-departure sign-off',
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (signedOff)
                Card(
                  color: FobColors.accentLime.withValues(alpha: 0.12),
                  child: Padding(
                    padding: const EdgeInsets.all(FobSpacing.card),
                    child: Text('Signed off by ${session.finalSignatory} — tour ready to run.',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                  ),
                )
              else if (!ready) ...[
                Card(
                  color: FobColors.accentPink.withValues(alpha: 0.08),
                  child: Padding(
                    padding: const EdgeInsets.all(FobSpacing.card),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${outstanding.length} step${outstanding.length == 1 ? '' : 's'} outstanding',
                            style: const TextStyle(fontWeight: FontWeight.w700, color: FobColors.pinkTextLight)),
                        const SizedBox(height: 10),
                        for (final step in outstanding)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: InkWell(
                              onTap: () => Navigator.of(context).pushNamed(_stepRoutes[step]!),
                              child: Text('$step · ${_stepTitles[step]} — go to step',
                                  style: const TextStyle(
                                      color: FobColors.textLinkHover, fontWeight: FontWeight.w600)),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ] else
                const Padding(
                  padding: EdgeInsets.only(bottom: 20),
                  child: Text('All upstream steps are done. Sign to confirm the tour is ready to run.'),
                ),
              if (!signedOff)
                IgnorePointer(
                  ignoring: !ready,
                  child: Opacity(
                    opacity: ready ? 1 : 0.5,
                    child: SignatureField(
                      label: 'Sign off — tour ready to run',
                      signatory: session.finalSignatory,
                      onSign: (name) async {
                        final messenger = ScaffoldMessenger.of(context);
                        final navigator = Navigator.of(context);
                        final outcome = await cubit.signFinalOff(name);
                        if (!outcome.synced) {
                          messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                        }
                        navigator.maybePop();
                      },
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
