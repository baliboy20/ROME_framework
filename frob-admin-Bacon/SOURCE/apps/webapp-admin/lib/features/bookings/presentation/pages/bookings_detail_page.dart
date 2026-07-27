import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/status_pill.dart';
import '../../domain/entities/booking_detail.dart';
import '../bloc/bookings_bloc.dart';
import 'bookings_master_page.dart' show ageBandLabel, tsLabel;

String _money(num pence) => '£${(pence / 100).toStringAsFixed(2)}';
String _shortRef(String id) => id.length <= 8 ? id.toUpperCase() : id.substring(0, 8).toUpperCase();

/// A19 — Bookings, Detail (REQ-BO06). Strictly read-only full record for one
/// booking; editing and status transitions live on the A23 Edit booking page.
class BookingsDetailPage extends StatelessWidget {
  const BookingsDetailPage({super.key, required this.bookingId});
  final String bookingId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<BookingsBloc>(
      create: (_) => sl<BookingsBloc>()..add(SelectBookingEvent(bookingId)),
      child: _DetailView(bookingId: bookingId),
    );
  }
}

class _DetailView extends StatelessWidget {
  const _DetailView({required this.bookingId});
  final String bookingId;

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BookingsBloc, BookingsState>(
      listenWhen: (prev, curr) => curr.notice != null && curr.notice != prev.notice,
      listener: (context, state) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.notice!))),
      builder: (context, state) {
        final d = state.detail;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('A19 · BOOKINGS & PAYMENTS', style: FobText.microLabel),
            const SizedBox(height: 4),
            Text(d == null ? 'Booking' : 'Booking ${_shortRef(d.id)}', style: FobText.pageTitle),
            const SizedBox(height: 6),
            const Text(
              'Full read-only booking record. Payment shown as provider reference only — '
              'amounts remain on A8. Editing moved to A23.',
              style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5),
            ),
            TextButton.icon(
              onPressed: () => context.go('/bookings'),
              icon: const Icon(Icons.arrow_back, size: 16),
              label: const Text('Back to bookings'),
              style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
            ),
            const SizedBox(height: FobSpace.block),
            _recordColumn(context, state),
          ],
        );
      },
    );
  }

  Widget _recordColumn(BuildContext context, BookingsState state) {
    final d = state.detail;
    if (state.detailLoading || d == null) {
      return FobCard(
        child: SizedBox(
          height: 260,
          child: Center(child: state.detailLoading ? const CircularProgressIndicator() : const Text('Booking not found.', style: FobText.body)),
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
              OutlinedButton.icon(
                onPressed: () => context.go('/bookings/${d.id}/edit'),
                icon: const Icon(Icons.edit_outlined, size: 16),
                label: const Text('Edit'),
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
