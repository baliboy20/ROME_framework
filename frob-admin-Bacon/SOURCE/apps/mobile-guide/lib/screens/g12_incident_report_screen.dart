import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../state/tour_cubit.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/fob_button.dart';
import '../widgets/guide_scaffold.dart';

const _minNarrativeLength = 20;

/// G12 — Incident report (UXD-G-09): formal free-text narrative submitted
/// to William; submit disabled until a minimum narrative is present. No
/// photo capture. Distinct from the G10 in-the-moment emergency log.
class G12IncidentReportScreen extends StatefulWidget {
  const G12IncidentReportScreen({super.key});

  @override
  State<G12IncidentReportScreen> createState() => _G12IncidentReportScreenState();
}

class _G12IncidentReportScreenState extends State<G12IncidentReportScreen> {
  final _narrativeController = TextEditingController();
  bool _submitted = false;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    final valid = _narrativeController.text.trim().length >= _minNarrativeLength;
    return GuideScaffold(
      eyebrow: 'G12 · INCIDENT REPORT',
      title: 'Incident report',
      body: _submitted
          ? const Text('Submitted to William. A copy is retained on-device.',
              style: TextStyle(fontWeight: FontWeight.w600))
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Give a formal account of what happened, for William and insurer review.'),
                const SizedBox(height: FobSpacing.field),
                TextField(
                  controller: _narrativeController,
                  decoration: const InputDecoration(labelText: 'Narrative'),
                  minLines: 6,
                  maxLines: 12,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 20),
                FobButton(
                  label: 'Submit report',
                  onPressed: valid
                      ? () async {
                          final messenger = ScaffoldMessenger.of(context);
                          final outcome = await cubit
                              .submitIncidentReport(_narrativeController.text.trim());
                          if (!mounted) return;
                          if (outcome.synced) {
                            setState(() => _submitted = true);
                          } else {
                            messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                          }
                        }
                      : null,
                  disabledReason: valid
                      ? null
                      : 'Narrative must be at least $_minNarrativeLength characters',
                ),
              ],
            ),
    );
  }
}
