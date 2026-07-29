import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../domain/entities/hazard.dart';
import '../bloc/hazards_bloc.dart';

/// A11 / OPS14 — hazard log with per-row review approval.
class HazardsPage extends StatelessWidget {
  const HazardsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<HazardsBloc>(
      create: (_) => sl<HazardsBloc>()..add(const LoadHazardsEvent()),
      child: const _HazardsView(),
    );
  }
}

class _HazardsView extends StatelessWidget {
  const _HazardsView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HazardsBloc, HazardsState>(
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Hazard log', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            if (state is HazardsLoadFailure)
              Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body)))
            else
              Card(
                child: FobDataTable<Hazard>(
                  loading: state is HazardsLoading || state is HazardsInitial,
                  emptyText: 'No hazards logged.',
                  rows: state is HazardsLoaded ? state.rows : const [],
                  columns: [
                    FobColumn(label: 'Street', flex: 2, render: (r) => Text(r.street, style: FobText.body)),
                    FobColumn(label: 'Type', flex: 2, render: (r) => Text(r.hazardType, style: FobText.body)),
                    FobColumn(
                      label: 'Severity',
                      render: (r) => Text(
                        r.severity,
                        style: r.isHigh
                            ? FobText.body.copyWith(fontWeight: FontWeight.bold, color: FobColors.orangeText)
                            : FobText.body,
                      ),
                    ),
                    FobColumn(label: 'Status', render: (r) => Text(r.status, style: FobText.body)),
                    FobColumn(label: 'Observed', flex: 2, render: (r) => Text(r.observedAt, style: FobText.body)),
                    FobColumn(
                      label: 'Action',
                      render: (r) => r.canApprove
                          ? TextButton(
                              onPressed: () => context.read<HazardsBloc>().add(ApproveHazardEvent(r.id)),
                              child: const Text('Approve'),
                            )
                          : const Text('—', style: FobText.body),
                    ),
                  ],
                ),
              ),
          ],
        );
      },
    );
  }
}
