import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/fob_data_table.dart';

/// A4 owner alerts (NOTIF04).
class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return FutureBuilder<List<dynamic>>(
      future: api.getAlerts(),
      builder: (context, snap) {
        final rows = (snap.data ?? const [])
            .map((j) => MessageRow.fromJson(j as Map<String, dynamic>))
            .toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Owner alerts', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: FobDataTable<MessageRow>(
                loading: snap.connectionState == ConnectionState.waiting,
                emptyText: 'No pending alerts.',
                rows: rows,
                columns: [
                  FobColumn(label: 'Event', flex: 2, render: (r) => Text(r.event, style: FobText.body)),
                  FobColumn(label: 'Recipient', flex: 2, render: (r) => Text(r.recipient, style: FobText.body)),
                  FobColumn(label: 'Status', render: (r) => Text(r.status, style: FobText.body)),
                  FobColumn(label: 'Received', flex: 2, render: (r) => Text(r.createdAt, style: FobText.body)),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
