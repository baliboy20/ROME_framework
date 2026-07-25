import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/fob_data_table.dart';

/// A11 / OPS14 — hazard log with per-row review approval.
class HazardsScreen extends StatefulWidget {
  const HazardsScreen({super.key});
  @override
  State<HazardsScreen> createState() => _HazardsScreenState();
}

class _HazardsScreenState extends State<HazardsScreen> {
  late Future<List<dynamic>> _future;
  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _future = _api.getHazards();
  }

  void _refresh() => setState(() {
        _future = _api.getHazards();
      });

  Future<void> _approve(String id) async {
    try {
      await _api.reviewHazard(id, 'approved');
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
            .map((j) => HazardRow.fromJson(j as Map<String, dynamic>))
            .toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Hazard log', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: FobDataTable<HazardRow>(
                loading: snap.connectionState == ConnectionState.waiting,
                emptyText: 'No hazards logged.',
                rows: rows,
                columns: [
                  FobColumn(
                      label: 'Street',
                      flex: 2,
                      render: (r) => Text(r.street, style: FobText.body)),
                  FobColumn(
                      label: 'Type',
                      flex: 2,
                      render: (r) => Text(r.hazardType, style: FobText.body)),
                  FobColumn(
                    label: 'Severity',
                    render: (r) => Text(
                      r.severity,
                      style: r.severity == 'high'
                          ? FobText.body.copyWith(
                              fontWeight: FontWeight.bold,
                              color: FobColors.orangeText)
                          : FobText.body,
                    ),
                  ),
                  FobColumn(
                      label: 'Status',
                      render: (r) => Text(r.status, style: FobText.body)),
                  FobColumn(
                      label: 'Observed',
                      flex: 2,
                      render: (r) => Text(r.observedAt, style: FobText.body)),
                  FobColumn(
                    label: 'Action',
                    render: (r) => r.status == 'pending_review'
                        ? TextButton(
                            onPressed: () => _approve(r.id),
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
