import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/presentation/list_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../domain/entities/message.dart';
import '../../domain/usecases/comms_usecases.dart';

/// A3 deliverability status (NOTIF02).
class DeliverabilityPage extends StatelessWidget {
  const DeliverabilityPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<ListBloc<Message>>(
      create: (_) => ListBloc<Message>(() => sl<GetDeliverability>()(const NoParams()))
        ..add(const LoadList()),
      child: const _DeliverabilityView(),
    );
  }
}

class _DeliverabilityView extends StatelessWidget {
  const _DeliverabilityView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ListBloc<Message>, ListState<Message>>(
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Deliverability status', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            if (state is ListFailure<Message>)
              Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body)))
            else
              Card(
                child: FobDataTable<Message>(
                  loading: state is ListLoading<Message> || state is ListInitial<Message>,
                  emptyText: 'No messages yet.',
                  rows: state is ListLoaded<Message> ? state.rows : const [],
                  columns: [
                    FobColumn(label: 'Recipient', flex: 2, render: (r) => Text(r.recipient, style: FobText.body)),
                    FobColumn(label: 'Event', flex: 2, render: (r) => Text(r.event, style: FobText.body)),
                    FobColumn(label: 'Provider', render: (r) => Text(r.provider, style: FobText.body)),
                    FobColumn(
                      label: 'Status',
                      render: (r) => Text(
                        r.status,
                        style: r.isBad
                            ? FobText.body.copyWith(color: FobColors.orangeText, fontWeight: FontWeight.bold)
                            : FobText.body,
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
