import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../domain/entities/compliance_item.dart';
import '../bloc/compliance_bloc.dart';

/// A16 compliance review & renewal (FLEET07/08).
class CompliancePage extends StatelessWidget {
  const CompliancePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<ComplianceBloc>(
      create: (_) => sl<ComplianceBloc>()..add(const LoadComplianceEvent()),
      child: const _ComplianceView(),
    );
  }
}

class _ComplianceView extends StatelessWidget {
  const _ComplianceView();

  Future<void> _renew(BuildContext context, ComplianceItem row) async {
    final ctrl = TextEditingController(
      text: DateTime.now().add(const Duration(days: 365)).toIso8601String().substring(0, 10),
    );
    final bloc = context.read<ComplianceBloc>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Renew compliance'),
        content: TextField(
          controller: ctrl,
          style: FobText.body,
          decoration: const InputDecoration(labelText: 'New expiry / due date'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirm')),
        ],
      ),
    );
    if (confirmed == true) bloc.add(RenewComplianceEvent(row.id, ctrl.text.trim()));
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ComplianceBloc, ComplianceState>(
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Compliance review & renewal', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            if (state is ComplianceLoadFailure)
              Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body)))
            else
              Card(
                child: FobDataTable<ComplianceItem>(
                  loading: state is ComplianceLoading || state is ComplianceInitial,
                  emptyText: 'No compliance items.',
                  rows: state is ComplianceLoaded ? state.rows : const [],
                  columns: [
                    FobColumn(label: 'Type', flex: 2, render: (r) => Text(r.type, style: FobText.body)),
                    FobColumn(label: 'Item', flex: 2, render: (r) => Text(r.equipmentDescription ?? '—', style: FobText.body)),
                    FobColumn(label: 'Expiry/Due', flex: 2, render: (r) => Text(r.expiry, style: FobText.body)),
                    FobColumn(
                      label: 'Status',
                      render: (r) => Text(
                        r.status,
                        style: r.isCritical
                            ? FobText.body.copyWith(color: FobColors.orangeText, fontWeight: FontWeight.bold)
                            : FobText.body,
                      ),
                    ),
                    FobColumn(
                      label: 'Action',
                      render: (r) => TextButton(onPressed: () => _renew(context, r), child: const Text('Renew')),
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
