import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/enquiries_cubit.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/fob_data_table.dart';

/// A9 — Enquiries. Open/Overdue/Spam tabs (UXD-12).
class EnquiriesScreen extends StatelessWidget {
  const EnquiriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) => EnquiriesCubit(context.read())..load(),
      child: const _EnquiriesView(),
    );
  }
}

class _EnquiriesView extends StatelessWidget {
  const _EnquiriesView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<EnquiriesCubit, EnquiriesState>(
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enquiries', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Row(
              children: [
                _tab(context, 'Open', EnquiryTab.open, state.tab),
                _tab(context, 'Overdue', EnquiryTab.overdue, state.tab),
                _tab(context, 'Spam', EnquiryTab.spam, state.tab),
              ],
            ),
            const SizedBox(height: FobSpace.card),
            Card(
              child: FobDataTable<EnquiryRow>(
                loading: state.loading,
                emptyText: 'No enquiries to show.',
                rows: state.filtered,
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
        onPressed: () => context.read<EnquiriesCubit>().setTab(t),
        style: TextButton.styleFrom(
          backgroundColor: isActive ? FobColors.surfaceCard : null,
          foregroundColor: isActive ? FobColors.textStrong : FobColors.textMuted,
        ),
        child: Text(label, style: TextStyle(fontWeight: isActive ? FontWeight.w700 : FontWeight.w500)),
      ),
    );
  }
}
