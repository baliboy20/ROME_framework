import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../domain/entities/enquiry.dart';
import '../bloc/enquiries_bloc.dart';

/// A9 — Enquiries. Open/Overdue/Spam tabs (UXD-12).
class EnquiriesPage extends StatelessWidget {
  const EnquiriesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<EnquiriesBloc>(
      create: (_) => sl<EnquiriesBloc>()..add(const LoadEnquiriesEvent()),
      child: const _EnquiriesView(),
    );
  }
}

class _EnquiriesView extends StatelessWidget {
  const _EnquiriesView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<EnquiriesBloc, EnquiriesState>(
      builder: (context, state) {
        final tab = state is EnquiriesLoaded ? state.tab : EnquiryTab.open;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enquiries', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Row(
              children: [
                _tab(context, 'Open', EnquiryTab.open, tab),
                _tab(context, 'Overdue', EnquiryTab.overdue, tab),
                _tab(context, 'Spam', EnquiryTab.spam, tab),
              ],
            ),
            const SizedBox(height: FobSpace.card),
            if (state is EnquiriesLoadFailure)
              Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body)))
            else
              Card(
                child: FobDataTable<Enquiry>(
                  loading: state is EnquiriesLoading || state is EnquiriesInitial,
                  emptyText: 'No enquiries to show.',
                  rows: state is EnquiriesLoaded ? state.filtered : const [],
                  columns: [
                    FobColumn(label: 'Prospect', flex: 2, render: (e) => Text(e.prospectName, style: FobText.body)),
                    FobColumn(label: 'Tour', flex: 2, render: (e) => Text(e.tourName, style: FobText.body)),
                    FobColumn(
                      label: 'Status',
                      render: (e) => Text(
                        e.overdue ? 'Overdue' : (e.spam ? 'Spam' : 'Open'),
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: e.overdue ? FobColors.orangeText : FobColors.textMuted,
                        ),
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

  Widget _tab(BuildContext context, String label, EnquiryTab t, EnquiryTab active) {
    final isActive = t == active;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: TextButton(
        onPressed: () => context.read<EnquiriesBloc>().add(SetEnquiryTabEvent(t)),
        style: TextButton.styleFrom(
          backgroundColor: isActive ? FobColors.surfaceCard : null,
          foregroundColor: isActive ? FobColors.textStrong : FobColors.textMuted,
        ),
        child: Text(label, style: TextStyle(fontWeight: isActive ? FontWeight.w700 : FontWeight.w500)),
      ),
    );
  }
}
