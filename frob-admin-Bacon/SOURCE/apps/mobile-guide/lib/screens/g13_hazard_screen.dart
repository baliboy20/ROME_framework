import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../state/tour_cubit.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/fob_button.dart';
import '../widgets/guide_components.dart';
import '../widgets/guide_scaffold.dart';

const _hazardTypes = ['Pothole', 'Debris', 'Obstruction', 'Poor visibility', 'Other'];

/// G13 — Hazard observation (UXD-G-10). Location + type + notes; submit
/// gated on location + type. No photo capture. Feeds the A11 hazard log
/// dedupe (not surfaced here — the guide app only submits).
class G13HazardScreen extends StatefulWidget {
  const G13HazardScreen({super.key});

  @override
  State<G13HazardScreen> createState() => _G13HazardScreenState();
}

class _G13HazardScreenState extends State<G13HazardScreen> {
  final _streetController = TextEditingController();
  final _notesController = TextEditingController();
  String? _hazardType;
  bool _submitted = false;

  bool get _valid => _streetController.text.trim().isNotEmpty && _hazardType != null;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return GuideScaffold(
      eyebrow: 'G13 · HAZARD OBSERVATION',
      title: 'Hazard observation',
      body: _submitted
          ? const Text('Submitted.', style: TextStyle(fontWeight: FontWeight.w600))
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _streetController,
                  decoration: const InputDecoration(labelText: 'Street'),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: FobSpacing.field),
                const Text('Hazard type'),
                const SizedBox(height: 8),
                CategoryChips(
                  options: _hazardTypes,
                  value: _hazardType,
                  onChanged: (v) => setState(() => _hazardType = v),
                ),
                const SizedBox(height: FobSpacing.field),
                TextField(
                  controller: _notesController,
                  decoration: const InputDecoration(labelText: 'Notes (optional)'),
                  minLines: 2,
                  maxLines: 5,
                ),
                const SizedBox(height: 20),
                FobButton(
                  label: 'Submit hazard',
                  onPressed: _valid
                      ? () async {
                          final messenger = ScaffoldMessenger.of(context);
                          final outcome = await cubit.submitHazard(
                            street: _streetController.text.trim(),
                            hazardType: _hazardType!,
                            notes: _notesController.text.trim(),
                          );
                          if (!mounted) return;
                          if (outcome.synced) {
                            setState(() => _submitted = true);
                          } else {
                            messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                          }
                        }
                      : null,
                  disabledReason: _valid ? null : 'Enter a street and hazard type',
                ),
              ],
            ),
    );
  }
}
