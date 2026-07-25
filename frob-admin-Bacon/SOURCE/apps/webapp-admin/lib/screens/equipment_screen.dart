import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/fob_data_table.dart';

/// A13 equipment register (FLEET02).
class EquipmentScreen extends StatefulWidget {
  const EquipmentScreen({super.key});
  @override
  State<EquipmentScreen> createState() => _EquipmentScreenState();
}

class _EquipmentScreenState extends State<EquipmentScreen> {
  static const _types = <String>[
    'helmet',
    'first_aid_kit',
    'hi_vis',
    'poncho',
    'gloves',
    'other',
  ];

  late Future<List<dynamic>> _future;
  final TextEditingController _descCtrl = TextEditingController();
  String _type = _types.first;

  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _future = _api.getEquipment();
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  void _refresh() => setState(() {
        _future = _api.getEquipment();
      });

  Future<void> _add() async {
    final desc = _descCtrl.text.trim();
    if (desc.isEmpty) return;
    try {
      await _api.addEquipment({
        'type': _type,
        'description': desc,
        // NOTE: worker zod schema expects snake_case `purchase_date`.
        'purchase_date': DateTime.now().toUtc().toIso8601String().substring(0, 10),
      });
      _descCtrl.clear();
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
            .map((j) => EquipmentRow.fromJson(j as Map<String, dynamic>))
            .toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Equipment register', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(FobSpace.card),
                child: Row(
                  children: [
                    DropdownButton<String>(
                      value: _type,
                      items: _types
                          .map((t) => DropdownMenuItem(value: t, child: Text(t, style: FobText.body)))
                          .toList(),
                      onChanged: (v) => setState(() => _type = v ?? _type),
                    ),
                    const SizedBox(width: FobSpace.row),
                    Expanded(
                      child: TextField(
                        controller: _descCtrl,
                        style: FobText.body,
                        decoration: const InputDecoration(hintText: 'Description'),
                      ),
                    ),
                    const SizedBox(width: FobSpace.row),
                    ElevatedButton(onPressed: _add, child: const Text('Add item')),
                  ],
                ),
              ),
            ),
            const SizedBox(height: FobSpace.card),
            Card(
              child: FobDataTable<EquipmentRow>(
                loading: snap.connectionState == ConnectionState.waiting,
                emptyText: 'No equipment recorded.',
                rows: rows,
                columns: [
                  FobColumn(label: 'Item', flex: 3, render: (r) => Text(r.description, style: FobText.body)),
                  FobColumn(label: 'Type', flex: 2, render: (r) => Text(r.type, style: FobText.body)),
                  FobColumn(label: 'Status', render: (r) => Text(r.status, style: FobText.body)),
                  FobColumn(label: 'Review due', render: (r) => Text(r.reviewDueAt ?? '—', style: FobText.body)),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
