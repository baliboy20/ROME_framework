import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/fob_data_table.dart';

/// A16 compliance review & renewal (FLEET07/08).
class ComplianceScreen extends StatefulWidget {
  const ComplianceScreen({super.key});
  @override
  State<ComplianceScreen> createState() => _ComplianceScreenState();
}

class _ComplianceScreenState extends State<ComplianceScreen> {
  late Future<List<dynamic>> _future;
  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _future = _api.getCompliance();
  }

  void _refresh() => setState(() {
        _future = _api.getCompliance();
      });

  Future<void> _renew(ComplianceRow row) async {
    final ctrl = TextEditingController(
      text: DateTime.now().add(const Duration(days: 365)).toIso8601String().substring(0, 10),
    );
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
    if (confirmed != true) return;
    try {
      await _api.renewCompliance(row.id, ctrl.text.trim());
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
            .map((j) => ComplianceRow.fromJson(j as Map<String, dynamic>))
            .toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Compliance review & renewal', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: FobDataTable<ComplianceRow>(
                loading: snap.connectionState == ConnectionState.waiting,
                emptyText: 'No compliance items.',
                rows: rows,
                columns: [
                  FobColumn(label: 'Type', flex: 2, render: (r) => Text(r.type, style: FobText.body)),
                  FobColumn(label: 'Item', flex: 2, render: (r) => Text(r.equipmentDescription ?? '—', style: FobText.body)),
                  FobColumn(label: 'Expiry/Due', flex: 2, render: (r) => Text(r.expiry, style: FobText.body)),
                  FobColumn(
                    label: 'Status',
                    render: (r) => Text(
                      r.status,
                      style: r.status == 'critical'
                          ? FobText.body.copyWith(
                              color: FobColors.orangeText, fontWeight: FontWeight.bold)
                          : FobText.body,
                    ),
                  ),
                  FobColumn(
                    label: 'Action',
                    render: (r) => TextButton(
                      onPressed: () => _renew(r),
                      child: const Text('Renew'),
                    ),
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
