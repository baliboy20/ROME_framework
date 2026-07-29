import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/guide_models.dart';
import '../state/tour_cubit.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/guide_components.dart';
import '../widgets/guide_scaffold.dart';

/// G4 — Bike inspection grid. Full-signature sign-off (UXD-G-01) with
/// UXD-G-02: no same-day shortcut — every bike, every tour, grid always
/// resets and must be re-completed in full before the signature enables.
class G4BikeInspectionScreen extends StatelessWidget {
  const G4BikeInspectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return BlocBuilder<TourCubit, TourSession>(
      builder: (context, session) {
        final signed = session.bikeSignatory != null;
        final allChecked = session.bikes.every((b) => b.allChecked);
        return GuideScaffold(
          eyebrow: 'G4 · FULL SIGNATURE',
          title: 'Bike inspection',
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Every bike, every tour — no shortcut for a same-day repeat fleet. '
                'Check each point, then sign the declaration.',
              ),
              const SizedBox(height: 16),
              for (final bike in session.bikes) ...[
                _BikeCard(
                  bike: bike,
                  locked: signed,
                  onTogglePoint: (pointIndex) => cubit.toggleBikePoint(
                    session.bikes.indexOf(bike),
                    pointIndex,
                  ),
                ),
                const SizedBox(height: 12),
              ],
              const SizedBox(height: 8),
              IgnorePointer(
                ignoring: !signed && !allChecked,
                child: Opacity(
                  opacity: (!signed && !allChecked) ? 0.5 : 1,
                  child: SignatureField(
                    label: 'Sign to confirm bike inspection complete',
                    signatory: session.bikeSignatory,
                    onSign: (name) async {
                      final messenger = ScaffoldMessenger.of(context);
                      final navigator = Navigator.of(context);
                      final outcome = await cubit.signBikeInspection(name);
                      if (!outcome.synced) {
                        messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                      }
                      navigator.maybePop();
                    },
                  ),
                ),
              ),
              if (!signed && !allChecked)
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    'Check every point on every bike before signing.',
                    style: TextStyle(color: FobColors.textMuted, fontSize: 12),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _BikeCard extends StatelessWidget {
  const _BikeCard({required this.bike, required this.locked, required this.onTogglePoint});
  final BikeInspection bike;
  final bool locked;
  final ValueChanged<int> onTogglePoint;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(FobSpacing.card),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(bike.bikeId,
                style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (int i = 0; i < bike.points.length; i++)
                  _CheckChip(
                    point: bike.points[i],
                    onTap: locked ? null : () => onTogglePoint(i),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CheckChip extends StatelessWidget {
  const _CheckChip({required this.point, this.onTap});
  final BikePoint point;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final checked = point.checked;
    return Semantics(
      button: true,
      toggled: checked,
      label: point.label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(FobRadius.round),
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: checked ? FobColors.accentLime.withValues(alpha: 0.9) : FobColors.surfaceBgLo,
            borderRadius: BorderRadius.circular(FobRadius.round),
          ),
          child: Text(
            checked ? '✓ ${point.label}' : point.label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: checked ? FobColors.pillInk : FobColors.textBody,
            ),
          ),
        ),
      ),
    );
  }
}
