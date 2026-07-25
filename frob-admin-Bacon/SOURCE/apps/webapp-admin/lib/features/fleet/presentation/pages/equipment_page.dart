import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../domain/entities/equipment.dart';
import '../bloc/equipment_bloc.dart';

/// A13 equipment register (FLEET02).
class EquipmentPage extends StatelessWidget {
  const EquipmentPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<EquipmentBloc>(
      create: (_) => sl<EquipmentBloc>()..add(const LoadEquipmentEvent()),
      child: const _EquipmentView(),
    );
  }
}

class _EquipmentView extends StatefulWidget {
  const _EquipmentView();
  @override
  State<_EquipmentView> createState() => _EquipmentViewState();
}

class _EquipmentViewState extends State<_EquipmentView> {
  static const _types = <String>['helmet', 'first_aid_kit', 'hi_vis', 'poncho', 'gloves', 'other'];
  final _descCtrl = TextEditingController();
  String _type = _types.first;

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<EquipmentBloc, EquipmentState>(
      builder: (context, state) {
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
                      items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t, style: FobText.body))).toList(),
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
                    ElevatedButton(
                      onPressed: () {
                        context.read<EquipmentBloc>().add(AddEquipmentEvent(_type, _descCtrl.text));
                        _descCtrl.clear();
                      },
                      child: const Text('Add item'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: FobSpace.card),
            if (state is EquipmentLoadFailure)
              Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body)))
            else
              Card(
                child: FobDataTable<Equipment>(
                  loading: state is EquipmentLoading || state is EquipmentInitial,
                  emptyText: 'No equipment recorded.',
                  rows: state is EquipmentLoaded ? state.rows : const [],
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
