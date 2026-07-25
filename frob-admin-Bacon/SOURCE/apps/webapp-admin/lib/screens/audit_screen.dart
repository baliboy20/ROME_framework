import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../theme/tokens.dart';
import '../widgets/fob_data_table.dart';

/// A5 audit log (CNA03).
class AuditScreen extends StatelessWidget {
  const AuditScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return FutureBuilder<List<dynamic>>(
      future: api.getAudit(),
      builder: (context, snap) {
        final rows = (snap.data ?? const [])
            .map((m) => (m as Map<String, dynamic>))
            .toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Audit log', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: FobDataTable<Map<String, dynamic>>(
                loading: snap.connectionState == ConnectionState.waiting,
                emptyText: 'No audit entries.',
                rows: rows,
                columns: [
                  FobColumn(label: 'When', flex: 2, render: (m) => Text(m['occurred_at']?.toString() ?? '', style: FobText.body)),
                  FobColumn(label: 'Actor', render: (m) => Text(m['actor_type']?.toString() ?? '', style: FobText.body)),
                  FobColumn(label: 'Action', flex: 2, render: (m) => Text(m['action']?.toString() ?? '', style: FobText.body)),
                  FobColumn(label: 'Subject', flex: 2, render: (m) => Text(m['subject_type']?.toString() ?? '', style: FobText.body)),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
