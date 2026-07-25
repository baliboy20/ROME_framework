import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/fob_data_table.dart';

/// A3 deliverability status (NOTIF02).
class DeliverabilityScreen extends StatelessWidget {
  const DeliverabilityScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return FutureBuilder<List<dynamic>>(
      future: api.getDeliverability(),
      builder: (context, snap) {
        final rows = (snap.data ?? const [])
            .map((j) => MessageRow.fromJson(j as Map<String, dynamic>))
            .toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Deliverability status', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: FobDataTable<MessageRow>(
                loading: snap.connectionState == ConnectionState.waiting,
                emptyText: 'No messages yet.',
                rows: rows,
                columns: [
                  FobColumn(label: 'Recipient', flex: 2, render: (r) => Text(r.recipient, style: FobText.body)),
                  FobColumn(label: 'Event', flex: 2, render: (r) => Text(r.event, style: FobText.body)),
                  FobColumn(label: 'Provider', render: (r) => Text(r.provider, style: FobText.body)),
                  FobColumn(
                    label: 'Status',
                    render: (r) {
                      final bad = r.status == 'bounced' || r.status == 'failed_complaint';
                      return Text(
                        r.status,
                        style: bad
                            ? FobText.body.copyWith(
                                color: FobColors.orangeText,
                                fontWeight: FontWeight.bold,
                              )
                            : FobText.body,
                      );
                    },
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
