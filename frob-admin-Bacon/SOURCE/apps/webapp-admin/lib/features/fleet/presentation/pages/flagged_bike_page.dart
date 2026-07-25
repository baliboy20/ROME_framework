import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../../../widgets/app_field.dart';
import '../bloc/flagged_bike_bloc.dart';

/// A15 — Flagged-bike clear-to-service gate (UXD-11).
class FlaggedBikePage extends StatelessWidget {
  const FlaggedBikePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<FlaggedBikeBloc>(
      create: (_) => sl<FlaggedBikeBloc>()..add(const LoadFlaggedBikesEvent()),
      child: const _FlaggedBikeView(),
    );
  }
}

class _FlaggedBikeView extends StatefulWidget {
  const _FlaggedBikeView();
  @override
  State<_FlaggedBikeView> createState() => _FlaggedBikeViewState();
}

class _FlaggedBikeViewState extends State<_FlaggedBikeView> {
  final noteCtrl = TextEditingController();

  @override
  void dispose() {
    noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FlaggedBikeBloc, FlaggedBikeState>(
      builder: (context, state) {
        final bloc = context.read<FlaggedBikeBloc>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Flagged-bike maintenance', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(FobSpace.card),
                child: Row(
                  children: [
                    const Text('Bike: ', style: FobText.body),
                    const SizedBox(width: 8),
                    DropdownButton<String?>(
                      value: state.bikeId,
                      hint: const Text('Select a flagged bike'),
                      items: state.flagged
                          .map((b) => DropdownMenuItem<String?>(
                                value: b.id,
                                child: Text('${b.id} — ${b.make} ${b.model} (${b.status})'),
                              ))
                          .toList(),
                      onChanged: (v) => v == null ? null : bloc.add(OpenFlaggedBikeEvent(v)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: FobSpace.card),
            if (state.bikeId == null)
              const Text('Select a flagged bike to log maintenance.', style: FobText.body)
            else
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(FobSpace.card),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Bike ${state.bikeId} — maintenance events logged: ${state.maintenanceEventCount}', style: FobText.body),
                      const SizedBox(height: FobSpace.field),
                      AppField(label: 'Maintenance note', controller: noteCtrl, key: const Key('maintenance-note-field')),
                      const SizedBox(height: FobSpace.row),
                      AppButton(
                        key: const Key('log-maintenance-button'),
                        label: 'Log maintenance event',
                        kind: AppButtonKind.secondary,
                        loading: state.saving,
                        onPressed: () {
                          bloc.add(LogMaintenanceEvent(noteCtrl.text));
                          noteCtrl.clear();
                        },
                      ),
                      const SizedBox(height: FobSpace.block),
                      if (!state.canClear && !state.cleared)
                        const Padding(
                          padding: EdgeInsets.only(bottom: 8),
                          child: Text('Log at least one maintenance event before clearing to service.',
                              key: Key('clear-blocked-reason'), style: TextStyle(color: FobColors.orangeText, fontSize: 12)),
                        ),
                      AppButton(
                        key: const Key('clear-to-service-button'),
                        label: 'Clear to service',
                        kind: AppButtonKind.primary,
                        loading: state.saving,
                        onPressed: state.canClear ? () => bloc.add(const ClearToServiceEvent()) : null,
                      ),
                      if (state.cleared)
                        const Padding(
                          padding: EdgeInsets.only(top: 12),
                          child: Text('Cleared to service.', style: TextStyle(color: FobColors.limeText)),
                        ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
