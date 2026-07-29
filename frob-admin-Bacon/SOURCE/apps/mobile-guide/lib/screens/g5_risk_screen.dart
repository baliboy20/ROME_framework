import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/guide_models.dart';
import '../state/tour_cubit.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/guide_components.dart';
import '../widgets/guide_scaffold.dart';
import '../widgets/status_pill.dart';

/// G5 — Risk assessment + decisions log. Typed-confirm sign-off, but
/// UXD-G-03: an unresolved high-risk item blocks sign-off outright, even
/// with a typed name. "Log mitigation & resolve" downgrades to `mitigated`
/// and the note flows to G7's briefing script.
class G5RiskScreen extends StatelessWidget {
  const G5RiskScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return BlocBuilder<TourCubit, TourSession>(
      builder: (context, session) {
        final signed = session.riskSignatory != null;
        final blocked = session.hasUnresolvedHighRisk;
        return GuideScaffold(
          eyebrow: 'G5 · TYPED CONFIRM',
          title: 'Risk assessment',
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Review today's risk log. Unresolved high-risk items block sign-off."),
              const SizedBox(height: 16),
              for (final risk in session.riskItems) ...[
                _RiskCard(
                  risk: risk,
                  locked: signed,
                  onMitigate: (note) => cubit.mitigateRisk(risk.id, note),
                ),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 8),
              TypedConfirm(
                signed: signed,
                signatory: session.riskSignatory,
                confirmLabel: 'Confirm risk assessment complete',
                blocked: blocked,
                blockedReason: 'Resolve all high-risk items first',
                onSign: (name) async {
                  final messenger = ScaffoldMessenger.of(context);
                  final navigator = Navigator.of(context);
                  final outcome = await cubit.signRiskAssessment(name);
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

class _RiskCard extends StatefulWidget {
  const _RiskCard({required this.risk, required this.locked, required this.onMitigate});
  final RiskItem risk;
  final bool locked;
  final ValueChanged<String> onMitigate;

  @override
  State<_RiskCard> createState() => _RiskCardState();
}

class _RiskCardState extends State<_RiskCard> {
  bool _expanded = false;
  final _noteController = TextEditingController();

  PillTone _tone(RiskLevel level) => switch (level) {
        RiskLevel.high => PillTone.pink,
        RiskLevel.medium => PillTone.orange,
        RiskLevel.low => PillTone.cyan,
      };

  @override
  Widget build(BuildContext context) {
    final risk = widget.risk;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(FobSpacing.card),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(risk.label, style: Theme.of(context).textTheme.bodyLarge)),
                if (risk.mitigated)
                  const StatusPill(label: 'MITIGATED', tone: PillTone.lime, solid: false)
                else
                  StatusPill(label: risk.level.name.toUpperCase(), tone: _tone(risk.level)),
              ],
            ),
            if (risk.mitigated && risk.mitigationNote != null) ...[
              const SizedBox(height: 8),
              Text('Mitigation: ${risk.mitigationNote}',
                  style: const TextStyle(color: FobColors.textMuted, fontSize: 12)),
            ],
            if (risk.blocksSignOff && !widget.locked) ...[
              const SizedBox(height: 10),
              if (!_expanded)
                OutlinedButton(
                  onPressed: () => setState(() => _expanded = true),
                  child: const Text('Log mitigation & resolve'),
                )
              else ...[
                TextField(
                  controller: _noteController,
                  decoration: const InputDecoration(hintText: 'Mitigation note'),
                  minLines: 2,
                  maxLines: 3,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: _noteController.text.trim().isEmpty
                      ? null
                      : () => widget.onMitigate(_noteController.text.trim()),
                  child: const Text('Resolve'),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
