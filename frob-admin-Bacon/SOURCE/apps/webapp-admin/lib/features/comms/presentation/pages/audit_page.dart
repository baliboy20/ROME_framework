import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/presentation/list_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../domain/entities/audit_entry.dart';
import '../../domain/usecases/comms_usecases.dart';

/// A5 audit log (CNA03).
class AuditPage extends StatelessWidget {
  const AuditPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<ListBloc<AuditEntry>>(
      create: (_) => ListBloc<AuditEntry>(() => sl<GetAudit>()(const NoParams()))
        ..add(const LoadList()),
      child: const _AuditView(),
    );
  }
}

class _AuditView extends StatelessWidget {
  const _AuditView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ListBloc<AuditEntry>, ListState<AuditEntry>>(
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Audit log', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            if (state is ListFailure<AuditEntry>)
              Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body)))
            else
              Card(
                child: FobDataTable<AuditEntry>(
                  loading: state is ListLoading<AuditEntry> || state is ListInitial<AuditEntry>,
                  emptyText: 'No audit entries.',
                  rows: state is ListLoaded<AuditEntry> ? state.rows : const [],
                  columns: [
                    FobColumn(label: 'When', flex: 2, render: (m) => Text(m.occurredAt, style: FobText.body)),
                    FobColumn(label: 'Actor', render: (m) => Text(m.actorType, style: FobText.body)),
                    FobColumn(label: 'Action', flex: 2, render: (m) => Text(m.action, style: FobText.body)),
                    FobColumn(label: 'Subject', flex: 2, render: (m) => Text(m.subjectType, style: FobText.body)),
                  ],
                ),
              ),
          ],
        );
      },
    );
  }
}
