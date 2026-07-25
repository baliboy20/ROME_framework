import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/guide_models.dart';
import '../state/tour_cubit.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/fob_button.dart';
import '../widgets/guide_scaffold.dart';

/// G11 — Post-ride review. REQ-OPS10 is a structured operational debrief
/// (hazards / incidents-or-near-misses / quality / an optional bike to flag
/// for service), NOT a customer star rating. UXD-G-08: "Save draft" returns
/// to the hub without committing (draft:true), surface stays re-enterable;
/// "Submit review" is the terminal commit (draft:false).
class G11PostRideReviewScreen extends StatefulWidget {
  const G11PostRideReviewScreen({super.key});

  @override
  State<G11PostRideReviewScreen> createState() => _G11PostRideReviewScreenState();
}

class _G11PostRideReviewScreenState extends State<G11PostRideReviewScreen> {
  late final TextEditingController _hazards;
  late final TextEditingController _incidents;
  late final TextEditingController _quality;
  late final TextEditingController _bikeFlag;
  bool _initialised = false;

  void _initFrom(PostRideDraft draft) {
    _hazards = TextEditingController(text: draft.hazardsOrRouteChanges);
    _incidents = TextEditingController(text: draft.incidentsOrNearMisses);
    _quality = TextEditingController(text: draft.qualityAssessment);
    _bikeFlag = TextEditingController(text: draft.bikeServiceFlagBikeId ?? '');
    _initialised = true;
  }

  @override
  void dispose() {
    if (_initialised) {
      _hazards.dispose();
      _incidents.dispose();
      _quality.dispose();
      _bikeFlag.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return BlocBuilder<TourCubit, TourSession>(
      builder: (context, session) {
        final draft = session.reviewDraft ?? PostRideDraft();
        if (!_initialised) _initFrom(draft);

        if (draft.submitted) {
          return GuideScaffold(
            eyebrow: 'G11 · SUBMITTED',
            title: 'Post-ride review',
            body: const Text('Review submitted. Thank you.',
                style: TextStyle(fontWeight: FontWeight.w600)),
          );
        }
        return GuideScaffold(
          eyebrow: 'G11 · POST-RIDE REVIEW',
          title: 'Post-ride review',
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Due within 24 hours of the tour ending.',
                  style: TextStyle(color: FobColors.textMuted, fontSize: 12)),
              const SizedBox(height: FobSpacing.block),
              Text('Hazards or route changes', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              TextField(
                controller: _hazards,
                decoration:
                    const InputDecoration(labelText: 'Anything on the route to record (optional)'),
                minLines: 2,
                maxLines: 5,
                onChanged: (v) => cubit.updateDraft(hazardsOrRouteChanges: v),
              ),
              const SizedBox(height: 16),
              Text('Incidents or near-misses', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              TextField(
                controller: _incidents,
                decoration:
                    const InputDecoration(labelText: 'Incidents or near-misses (optional)'),
                minLines: 2,
                maxLines: 5,
                onChanged: (v) => cubit.updateDraft(incidentsOrNearMisses: v),
              ),
              const SizedBox(height: 16),
              Text('Quality assessment', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              TextField(
                controller: _quality,
                decoration:
                    const InputDecoration(labelText: 'How the tour went overall (optional)'),
                minLines: 2,
                maxLines: 5,
                onChanged: (v) => cubit.updateDraft(qualityAssessment: v),
              ),
              const SizedBox(height: 16),
              Text('Bike to flag for service', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              TextField(
                controller: _bikeFlag,
                decoration: const InputDecoration(
                    labelText: 'Bike ID to pull from tomorrow’s pool (optional)'),
                onChanged: (v) => cubit.updateDraft(
                  bikeServiceFlagBikeId: v.trim().isEmpty ? null : v.trim(),
                  clearBikeFlag: v.trim().isEmpty,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        final navigator = Navigator.of(context);
                        final outcome = await cubit.saveDraft();
                        if (!outcome.synced) {
                          messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                        }
                        navigator.maybePop();
                      },
                      child: const Text('Save draft'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FobButton(
                      label: 'Submit review',
                      onPressed: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        final navigator = Navigator.of(context);
                        final outcome = await cubit.submitReview();
                        if (!outcome.synced) {
                          messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                        }
                        navigator.maybePop();
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
