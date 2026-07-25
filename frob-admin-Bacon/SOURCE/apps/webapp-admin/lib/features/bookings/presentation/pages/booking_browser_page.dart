import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/status_pill.dart';
import '../../domain/entities/booking_detail.dart';
import '../../domain/entities/booking_summary.dart';
import '../bloc/bookings_bloc.dart';
import '../widgets/edit_booking_dialog.dart';

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

/// A19 — Booking browser (BO05/BO06). Master-detail.
class BookingBrowserPage extends StatelessWidget {
  const BookingBrowserPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<BookingsBloc>(
      create: (_) => sl<BookingsBloc>()..add(const LoadBookingsEvent()),
      child: const _BrowserView(),
    );
  }
}

class _BrowserView extends StatefulWidget {
  const _BrowserView();
  @override
  State<_BrowserView> createState() => _BrowserViewState();
}

class _BrowserViewState extends State<_BrowserView> {
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
            Text('A19 · SCHEDULING', style: FobText.microLabel),
            const SizedBox(height: 4),
            const Text('Booking browser', style: FobText.pageTitle),
            const SizedBox(height: 6),
            const Text(
              'Find any booking and read or edit its record — date, attendees, contact roles, '
              'and status. Payment amounts are still handled via payments/refunds, not here. '
              'Card numbers are never stored or shown.',
              style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5),
            ),
            const SizedBox(height: FobSpace.block),
            LayoutBuilder(builder: (context, c) {
              final wide = c.maxWidth > 820;
              final list = _resultsColumn(context, state);
              final detail = _recordColumn(context, state);
              if (!wide) return Column(children: [list, const SizedBox(height: FobSpace.card), detail]);
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(width: 340, child: list),
                  const SizedBox(width: 24),
                  Expanded(child: detail),
                ],
              );
            }),
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
                  : Column(children: [for (var i = 0; i < rows.length; i++) _resultRow(context, rows[i], state.selectedId, i == rows.length - 1)]),
        ),
      ],
    );
  }

  Widget _resultRow(BuildContext context, BookingSummary r, String? selectedId, bool last) {
    final active = r.id == selectedId;
    return InkWell(
      onTap: () => context.read<BookingsBloc>().add(SelectBookingEvent(r.id)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: active ? FobColors.surfaceBgLo : null,
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

  // ---- record ----
  static const Map<String, List<String>> _validTransitions = {
    'draft': ['confirm', 'cancel', 'mark_abandoned'],
    'confirmed': ['cancel'],
    'provisionally-confirmed': ['confirm', 'cancel'],
  };
  static const Map<String, String> _transitionLabels = {
    'confirm': 'Confirm',
    'cancel': 'Cancel',
    'mark_abandoned': 'Mark abandoned',
  };

  Widget _recordColumn(BuildContext context, BookingsState state) {
    final d = state.detail;
    if (state.detailLoading || d == null) {
      return FobCard(
        child: SizedBox(
          height: 260,
          child: Center(child: state.detailLoading ? const CircularProgressIndicator() : const Text('Select a booking to view its record.', style: FobText.body)),
        ),
      );
    }
    final pay = d.paymentAttempts.isNotEmpty ? d.paymentAttempts.first : null;
    final ec = d.emergencyContact;
    return FobCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('BOOKING RECORD', style: FobText.microLabel),
              Row(
                children: [
                  ..._statusTransitionButtons(context, d.status, d.id),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: d.status == 'cancelled' ? null : () => _openEditDialog(context, d),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Edit'),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(d.leadName, style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 22, color: FobColors.textStrong)),
                    const SizedBox(height: 3),
                    Text('${_shortRef(d.id)} · ${d.tourId ?? ''}  ${d.date ?? ''}', style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(_money(d.priceTotalPence),
                      style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w700, fontSize: 22, color: FobColors.textPrice, fontFeatures: FobText.moneyFontFeatures)),
                  const SizedBox(height: 4),
                  PillLabel.forStatus(d.status),
                ],
              ),
            ],
          ),
          const FobDivider(),
          FobSectionLabel('ATTENDEES'),
          ...d.attendees.map((a) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 7),
                child: Row(
                  children: [
                    Expanded(flex: 3, child: Text(a.name, style: FobText.body)),
                    Expanded(flex: 2, child: Text(ageBandLabel(a.ageBand), style: const TextStyle(fontSize: 12.5, color: FobColors.textMuted))),
                    Expanded(flex: 2, child: _contactRoleChip(a.role)),
                    Expanded(flex: 3, child: Text(a.notes == null || a.notes!.isEmpty ? '—' : a.notes!, style: const TextStyle(fontSize: 12.5, color: FobColors.textBody))),
                  ],
                ),
              )),
          const FobDivider(),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: FobKeyValue('EMERGENCY CONTACT', ec == null ? '—' : '${ec.name} · ${ec.phone}')),
              Expanded(
                child: FobKeyValue(
                  'PAYMENT',
                  pay == null ? '—' : 'stripe · ${_shortRef(pay.providerReference)} · ${_money(pay.amountPence)} ${pay.status}',
                  sub: 'Card number never stored.',
                ),
              ),
            ],
          ),
          const SizedBox(height: FobSpace.card),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: FobKeyValue('WAIVER', tsLabel(d.consent.waiverAcceptedAt))),
              Expanded(child: FobKeyValue('T&C · MARKETING', tsLabel(d.consent.termsAcceptedAt))),
            ],
          ),
          const FobDivider(),
          FobSectionLabel('STATUS HISTORY'),
          _histRow(d.statusHistory.createdAt, 'Created from booking flow'),
          _histRow(d.statusHistory.confirmedAt, 'Booking confirmed'),
          _histRow(d.statusHistory.cancelledAt, 'Booking cancelled'),
        ],
      ),
    );
  }

  List<Widget> _statusTransitionButtons(BuildContext context, String status, String bookingId) {
    final transitions = _validTransitions[status] ?? const [];
    return [
      for (final t in transitions) ...[
        OutlinedButton(
          onPressed: () => context.read<BookingsBloc>().add(TransitionBookingEvent(bookingId, t)),
          style: OutlinedButton.styleFrom(foregroundColor: t == 'cancel' || t == 'mark_abandoned' ? FobColors.textMuted : null),
          child: Text(_transitionLabels[t] ?? t),
        ),
        const SizedBox(width: 8),
      ],
    ];
  }

  Future<void> _openEditDialog(BuildContext context, BookingDetail d) async {
    final bloc = context.read<BookingsBloc>();
    final changed = await showDialog<bool>(context: context, builder: (ctx) => EditBookingDialog(booking: d));
    if (changed == true) bloc.add(RefreshBookingEvent(d.id));
  }

  Widget _contactRoleChip(AttendeeRole role) {
    final label = switch (role) {
      AttendeeRole.leader => 'Leader',
      AttendeeRole.coLeader => 'Co-leader',
      AttendeeRole.attendee => 'Attendee',
    };
    final strong = role != AttendeeRole.attendee;
    return Text(label, style: TextStyle(fontSize: 12.5, fontWeight: strong ? FontWeight.w600 : FontWeight.w400, color: strong ? FobColors.textStrong : FobColors.textMuted));
  }

  Widget _histRow(DateTime? ts, String label) {
    if (ts == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 150, child: Text(tsLabel(ts), style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted))),
          Expanded(child: Text(label, style: FobText.body)),
        ],
      ),
    );
  }
}
