import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/fob_data_table.dart';

/// A10 / OPS12 — incident register with per-row insurer dispatch.
class IncidentsScreen extends StatefulWidget {
  const IncidentsScreen({super.key});
  @override
  State<IncidentsScreen> createState() => _IncidentsScreenState();
}

class _IncidentsScreenState extends State<IncidentsScreen> {
  late Future<List<dynamic>> _future;
  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _future = _api.getIncidents();
  }

  void _refresh() => setState(() {
        _future = _api.getIncidents();
      });

  Future<void> _dispatch(String id) async {
    try {
      await _api.dispatchIncident(id);
      _refresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Action failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: _future,
      builder: (context, snap) {
        final rows = (snap.data ?? const [])
            .map((j) => IncidentRow.fromJson(j as Map<String, dynamic>))
            .toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Incidents', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: FobDataTable<IncidentRow>(
                loading: snap.connectionState == ConnectionState.waiting,
                emptyText: 'No incidents reported.',
                rows: rows,
                columns: [
                  FobColumn(
                      label: 'Location',
                      flex: 2,
                      render: (r) => Text(r.location, style: FobText.body)),
                  FobColumn(
                      label: 'Type',
                      flex: 2,
                      render: (r) => Text(r.type, style: FobText.body)),
                  FobColumn(
                      label: 'Severity',
                      render: (r) => Text(r.severity, style: FobText.body)),
                  FobColumn(
                      label: 'Tour',
                      render: (r) => Text(r.tourId, style: FobText.body)),
                  FobColumn(
                      label: 'Status',
                      render: (r) => Text(r.status, style: FobText.body)),
                  FobColumn(
                      label: 'When',
                      flex: 2,
                      render: (r) => Text(r.occurredAt, style: FobText.body)),
                  FobColumn(
                    label: 'Action',
                    flex: 2,
                    render: (r) => (r.status == 'submitted' ||
                            r.status == 'reviewed')
                        ? TextButton(
                            onPressed: () => _dispatch(r.id),
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
