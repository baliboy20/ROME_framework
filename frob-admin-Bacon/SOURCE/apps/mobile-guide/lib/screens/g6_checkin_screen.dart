import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/guide_models.dart';
import '../state/tour_cubit.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/guide_components.dart';
import '../widgets/guide_scaffold.dart';
import '../widgets/status_pill.dart';

const _refusalReasons = ['Medical', 'Intoxication', 'Unaccompanied minor', 'Waiver refused'];

/// G6 — Rider check-in card. Full-signature sign-off (UXD-G-01).
/// UXD-G-04: per-rider on-day waiver re-confirmation; refusal flags for a
/// William-processed refund — UXC-CMP-3: the guide never sees or handles
/// money. Completion requires no rider left `pending`.
class G6CheckinScreen extends StatelessWidget {
  const G6CheckinScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return BlocBuilder<TourCubit, TourSession>(
      builder: (context, session) {
        final signed = session.checkinSignatory != null;
        final allResolved = session.riders.every((r) => r.status != RiderStatus.pending);
        return GuideScaffold(
          eyebrow: 'G6 · FULL SIGNATURE',
          title: 'Rider check-in',
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Re-confirm each rider's on-day waiver. Refused riders are flagged "
                  'for William to process — you never handle money here.'),
              const SizedBox(height: 16),
              for (final rider in session.riders) ...[
                _RiderCard(
                  rider: rider,
                  locked: signed,
                  onCheck: () => cubit.checkInRider(rider.id),
                  onRefuse: (reason) => cubit.refuseRider(rider.id, reason),
                ),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 8),
              IgnorePointer(
                ignoring: !signed && !allResolved,
                child: Opacity(
                  opacity: (!signed && !allResolved) ? 0.5 : 1,
                  child: SignatureField(
                    label: 'Sign to confirm rider check-in complete',
                    signatory: session.checkinSignatory,
                    onSign: (name) async {
                      final messenger = ScaffoldMessenger.of(context);
                      final navigator = Navigator.of(context);
                      final outcome = await cubit.signCheckin(name);
                      if (!outcome.synced) {
                        messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                      }
                      navigator.maybePop();
                    },
                  ),
                ),
              ),
              if (!signed && !allResolved)
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text('Every rider must be checked or refused before signing.',
                      style: TextStyle(color: FobColors.textMuted, fontSize: 12)),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _RiderCard extends StatefulWidget {
  const _RiderCard({
    required this.rider,
    required this.locked,
    required this.onCheck,
    required this.onRefuse,
  });
  final RiderCheckin rider;
  final bool locked;
  final VoidCallback onCheck;
  final ValueChanged<String> onRefuse;

  @override
  State<_RiderCard> createState() => _RiderCardState();
}

class _RiderCardState extends State<_RiderCard> {
  bool _refusing = false;

  @override
  Widget build(BuildContext context) {
    final rider = widget.rider;
    final refused = rider.status == RiderStatus.refused;
    return Card(
      color: refused ? FobColors.accentPink.withValues(alpha: 0.06) : null,
      child: Padding(
        padding: const EdgeInsets.all(FobSpacing.card),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(rider.name, style: Theme.of(context).textTheme.bodyLarge)),
                switch (rider.status) {
                  RiderStatus.pending => const StatusPill(label: 'PENDING', tone: PillTone.neutral, solid: false),
                  RiderStatus.checked => const StatusPill(label: 'CHECKED', tone: PillTone.lime),
                  RiderStatus.refused => const StatusPill(label: 'REFUSED', tone: PillTone.pink),
                },
              ],
            ),
            if (refused && rider.refusalReason != null) ...[
              const SizedBox(height: 6),
              Text('Reason: ${rider.refusalReason} — flagged for William',
                  style: const TextStyle(color: FobColors.pinkTextLight, fontSize: 12)),
            ],
            if (rider.status == RiderStatus.pending && !widget.locked) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: widget.onCheck,
                      child: const Text('Check in'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _refusing = true),
                      child: const Text('Refuse'),
                    ),
                  ),
                ],
              ),
              if (_refusing) ...[
                const SizedBox(height: 10),
                CategoryChips(
                  options: _refusalReasons,
                  onChanged: widget.onRefuse,
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
