import 'package:flutter/material.dart';

import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/status_pill.dart';
import '../../domain/entities/booking_detail.dart';
import '../pages/bookings_master_page.dart' show ageBandLabel, tsLabel;

String _money(num pence) => '£${(pence / 100).toStringAsFixed(2)}';
String _shortRef(String id) => id.length <= 8 ? id.toUpperCase() : id.substring(0, 8).toUpperCase();

/// The unchanged read-only booking record (REQ-BO06) — extracted from the A19
/// detail page so the CR-004 (CHG-012) floating detail card (UXD-22) and the
/// route-level detail page render the exact same content. Payment appears as
/// provider references only; editing lives on A23.
class BookingRecordView extends StatelessWidget {
  const BookingRecordView({
    super.key,
    required this.detail,
    required this.onEdit,
    this.headerActions = const [],
  });

  final BookingDetail detail;
  final VoidCallback onEdit;

  /// Extra actions beside "Edit" in the record header (UXD-23 "Send email").
  final List<Widget> headerActions;

  @override
  Widget build(BuildContext context) {
    final d = detail;
    final pay = d.paymentAttempts.isNotEmpty ? d.paymentAttempts.first : null;
    final ec = d.emergencyContact;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('BOOKING RECORD', style: FobText.microLabel),
            Row(mainAxisSize: MainAxisSize.min, children: [
              ...headerActions.map((w) => Padding(padding: const EdgeInsets.only(right: 8), child: w)),
              OutlinedButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 16),
                label: const Text('Edit'),
              ),
            ]),
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
