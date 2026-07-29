import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/guide_models.dart';
import '../state/tour_cubit.dart';
import '../widgets/guide_components.dart';
import '../widgets/guide_scaffold.dart';

/// G3 — Travel kit checklist. Typed-confirm sign-off (UXD-G-01): checklist
/// completeness never gates sign-off (UXC-FRM-3) — the typed name is the
/// gating act.
class G3KitScreen extends StatelessWidget {
  const G3KitScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return BlocBuilder<TourCubit, TourSession>(
      builder: (context, session) {
        final signed = session.kitSignatory != null;
        return GuideScaffold(
          eyebrow: 'G3 · TYPED CONFIRM',
          title: 'Travel kit checklist',
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Confirm the kit bag is packed before you roll.'),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  child: Column(
                    children: [
                      for (int i = 0; i < session.kitItems.length; i++)
                        ChecklistRow(
                          label: session.kitItems[i].label,
                          checked: session.kitItems[i].checked,
                          onChanged: signed ? (_) {} : (_) => cubit.toggleKit(i),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              TypedConfirm(
                signed: signed,
                signatory: session.kitSignatory,
                confirmLabel: 'Confirm kit check complete',
                onSign: (name) async {
                  final messenger = ScaffoldMessenger.of(context);
                  final navigator = Navigator.of(context);
                  final outcome = await cubit.signKit(name);
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
