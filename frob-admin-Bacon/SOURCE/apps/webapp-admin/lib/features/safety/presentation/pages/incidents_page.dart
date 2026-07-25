import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../domain/entities/incident.dart';
import '../bloc/incidents_bloc.dart';

/// A10 / OPS12 — incident register with per-row insurer dispatch.
class IncidentsPage extends StatelessWidget {
  const IncidentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<IncidentsBloc>(
      create: (_) => sl<IncidentsBloc>()..add(const LoadIncidentsEvent()),
      child: const _IncidentsView(),
    );
  }
}

class _IncidentsView extends StatelessWidget {
  const _IncidentsView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<IncidentsBloc, IncidentsState>(
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Incidents', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            if (state is IncidentsLoadFailure)
              Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body)))
            else
              Card(
                child: FobDataTable<Incident>(
                  loading: state is IncidentsLoading || state is IncidentsInitial,
                  emptyText: 'No incidents reported.',
                  rows: state is IncidentsLoaded ? state.rows : const [],
                  columns: [
                    FobColumn(label: 'Location', flex: 2, render: (r) => Text(r.location, style: FobText.body)),
                    FobColumn(label: 'Type', flex: 2, render: (r) => Text(r.type, style: FobText.body)),
                    FobColumn(label: 'Severity', render: (r) => Text(r.severity, style: FobText.body)),
                    FobColumn(label: 'Tour', render: (r) => Text(r.tourId, style: FobText.body)),
                    FobColumn(label: 'Status', render: (r) => Text(r.status, style: FobText.body)),
                    FobColumn(label: 'When', flex: 2, render: (r) => Text(r.occurredAt, style: FobText.body)),
                    FobColumn(
                      label: 'Action',
                      flex: 2,
                      render: (r) => r.canDispatch
                          ? TextButton(
                              onPressed: () => context.read<IncidentsBloc>().add(DispatchIncidentEvent(r.id)),
                              child: const Text('Dispatch to insurer'),
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
