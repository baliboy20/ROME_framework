import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/status_pill.dart';
import '../../domain/entities/booking_summary.dart';
import '../bloc/bookings_bloc.dart';

String _money(num pence) => '£${(pence / 100).toStringAsFixed(2)}';
String _shortRef(String id) => id.length <= 8 ? id.toUpperCase() : id.substring(0, 8).toUpperCase();

String ageBandLabel(String b) => switch (b) {
      '18+' => 'Adult',
      '60+' => 'Adult 60+',
      '12-17' => '12–17',
      'under-12' => 'Under 12',
      _ => b.isEmpty ? '—' : b,
    };

String tsLabel(DateTime? dt) {
  if (dt == null) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final hh = dt.hour.toString().padLeft(2, '0');
  final mm = dt.minute.toString().padLeft(2, '0');
  return '${dt.day} ${months[dt.month - 1]} ${dt.year}, $hh:$mm';
}

/// A19 — Bookings, Master (REQ-BO05). Search + results list only; selecting a
/// row navigates to the read-only Detail screen at `/bookings/:id`.
class BookingsMasterPage extends StatelessWidget {
  const BookingsMasterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<BookingsBloc>(
      create: (_) => sl<BookingsBloc>()..add(const LoadBookingsEvent()),
      child: const _MasterView(),
    );
  }
}

class _MasterView extends StatefulWidget {
  const _MasterView();
  @override
  State<_MasterView> createState() => _MasterViewState();
}

class _MasterViewState extends State<_MasterView> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BookingsBloc, BookingsState>(
      listenWhen: (prev, curr) => curr.notice != null && curr.notice != prev.notice,
      listener: (context, state) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.notice!))),
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('A19 · BOOKINGS & PAYMENTS', style: FobText.microLabel),
            const SizedBox(height: 4),
            const Text('Bookings', style: FobText.pageTitle),
            const SizedBox(height: 6),
            const Text(
              'Find any booking by reference, customer, tour, date or status. '
              'Select a row to open the read-only record — editing routes to A23.',
              style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5),
            ),
            const SizedBox(height: FobSpace.block),
            _resultsColumn(context, state),
          ],
        );
      },
    );
  }

  Widget _resultsColumn(BuildContext context, BookingsState state) {
    final rows = state.rows;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('SEARCH BOOKINGS', style: FobText.microLabel),
        const SizedBox(height: 6),
        TextField(
          controller: _searchCtrl,
          onChanged: (v) => context.read<BookingsBloc>().add(SearchBookingsEvent(v)),
          decoration: InputDecoration(
            hintText: 'Reference, name, tour or status',
            prefixIcon: const Icon(Icons.search, size: 18),
            isDense: true,
            filled: true,
            fillColor: FobColors.surfaceBgLo,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(FobRadius.field), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: FobSpace.card),
        FobCard(
          padding: EdgeInsets.zero,
          child: state.loading
              ? const Padding(padding: EdgeInsets.all(28), child: Center(child: CircularProgressIndicator()))
              : rows.isEmpty
                  ? const Padding(padding: EdgeInsets.all(24), child: Text('No bookings match.', style: FobText.body))
                  : Column(children: [for (var i = 0; i < rows.length; i++) _resultRow(context, rows[i], i == rows.length - 1)]),
        ),
      ],
    );
  }

  Widget _resultRow(BuildContext context, BookingSummary r, bool last) {
    return InkWell(
      onTap: () => context.go('/bookings/${r.id}'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: last ? null : const Border(bottom: BorderSide(color: FobColors.hairlineWarm)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r.customerName, style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 15, color: FobColors.textStrong)),
                  const SizedBox(height: 2),
                  Text('${_shortRef(r.id)} · ${r.tourName}  ${r.date}', style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_money(r.paidPence),
                    style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, color: FobColors.textPrice, fontFeatures: FobText.moneyFontFeatures)),
                const SizedBox(height: 4),
                PillLabel.forStatus(r.status),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
