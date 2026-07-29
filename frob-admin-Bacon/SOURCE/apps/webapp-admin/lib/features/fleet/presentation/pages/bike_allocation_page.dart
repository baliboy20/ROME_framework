import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../bloc/bike_allocation_bloc.dart';
import '../widgets/transfer_list.dart';

/// A20 — Bike allocation (UXD-09, REQ-BOOK14).
class BikeAllocationPage extends StatelessWidget {
  const BikeAllocationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<BikeAllocationBloc>(
      create: (_) => sl<BikeAllocationBloc>()..add(const LoadDeparturesEvent()),
      child: const _BikeAllocationView(),
    );
  }
}

class _BikeAllocationView extends StatelessWidget {
  const _BikeAllocationView();

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BikeAllocationBloc, BikeAllocationState>(
      listenWhen: (prev, curr) => curr.saved && !prev.saved,
      listener: (context, state) => ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Allocation saved.'))),
      builder: (context, state) {
        final bloc = context.read<BikeAllocationBloc>();
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
                      value: state.selectedDepartureId,
                      hint: const Text('Select a departure'),
                      items: state.departures
                          .map((d) => DropdownMenuItem<String?>(
                                value: d.id,
                                child: Text('${d.tourId} · ${d.date} ${d.time} (${d.confirmedCount} riders)'),
                              ))
                          .toList(),
                      onChanged: (v) => v == null ? null : bloc.add(SelectDepartureEvent(v)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: FobSpace.card),
            if (state.selectedDepartureId == null)
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
                          onAssign: (b) => bloc.add(AssignBikeEvent(b)),
                          onUnassign: (b) => bloc.add(UnassignBikeEvent(b)),
                        ),
                ),
              ),
            const SizedBox(height: FobSpace.card),
            if (state.selectedDepartureId != null)
              AppButton(
                label: 'Save allocation',
                kind: AppButtonKind.primary,
                onPressed: () => bloc.add(const SaveAllocationEvent()),
              ),
          ],
        );
      },
    );
  }
}
