import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../bloc/bike_allocation_cubit.dart';
import '../theme/tokens.dart';
import '../widgets/app_button.dart';
import '../widgets/transfer_list.dart';

/// A20 — Bike allocation (UXD-09, REQ-BOOK14). FINDING-001: real departure
/// picker (was hard-coded 'demo-departure' with an empty fleet).
class BikeAllocationScreen extends StatelessWidget {
  const BikeAllocationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) => BikeAllocationCubit(context.read()),
      child: const _BikeAllocationView(),
    );
  }
}

class _BikeAllocationView extends StatefulWidget {
  const _BikeAllocationView();
  @override
  State<_BikeAllocationView> createState() => _BikeAllocationViewState();
}

class _BikeAllocationViewState extends State<_BikeAllocationView> {
  List<Map<String, dynamic>> _departures = [];
  String? _departureId;

  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await _api.getDepartures();
      if (!mounted) return;
      setState(() => _departures = d.cast<Map<String, dynamic>>());
    } catch (_) {}
  }

  void _select(String? id) {
    setState(() => _departureId = id);
    if (id == null) return;
    final dep = _departures.firstWhere((d) => d['id'].toString() == id, orElse: () => {});
    final riders = (dep['confirmed_count'] as num?)?.toInt() ?? 0;
    context.read<BikeAllocationCubit>().load(id, ridersNeeded: riders);
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<BikeAllocationCubit, BikeAllocationState>(
      builder: (context, state) {
        final cubit = context.read<BikeAllocationCubit>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bike allocation', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(FobSpace.card),
                child: Row(
                  children: [
                    const Text('Departure: ', style: FobText.body),
                    const SizedBox(width: 8),
                    DropdownButton<String?>(
                      value: _departureId,
                      hint: const Text('Select a departure'),
                      items: _departures
                          .map((d) => DropdownMenuItem<String?>(
                                value: d['id'].toString(),
                                child: Text('${d['tour_id']} · ${d['date']} ${d['time']}'
                                    ' (${d['confirmed_count'] ?? 0} riders)'),
                              ))
                          .toList(),
                      onChanged: _select,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: FobSpace.card),
            if (_departureId == null)
              const Text('Select a departure to allocate bikes.', style: FobText.body)
            else
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(FobSpace.card),
                  child: state.loading
                      ? const Center(child: CircularProgressIndicator())
                      : TransferList(
                          available: state.available,
                          assigned: state.assigned,
                          ridersNeeded: state.ridersNeeded,
                          onAssign: cubit.assign,
                          onUnassign: cubit.unassign,
                        ),
                ),
              ),
            const SizedBox(height: FobSpace.card),
            if (_departureId != null)
              AppButton(
                label: 'Save allocation',
                kind: AppButtonKind.primary,
                onPressed: () async {
                  await cubit.save(_departureId!);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Allocation saved.')),
                    );
                  }
                },
              ),
          ],
        );
      },
    );
  }
}
