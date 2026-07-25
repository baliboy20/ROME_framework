import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../../../widgets/app_field.dart';
import '../../../../widgets/app_modal.dart';
import '../../../../widgets/filter_chip_row.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../../../widgets/status_pill.dart';
import '../../../bookings/domain/entities/booking_detail.dart';
import '../../../bookings/domain/usecases/get_booking_detail.dart';
import '../../domain/entities/payment.dart';
import '../bloc/payments_bloc.dart';
import '../mappers/payment_status_pill.dart';

String formatMoney(int pence) => '£${(pence / 100).toStringAsFixed(2)}';

/// A8 — Payments & refunds (REQ-BOOK13, UXD-01).
class PaymentsPage extends StatelessWidget {
  const PaymentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<PaymentsBloc>(
      create: (_) => sl<PaymentsBloc>()..add(const LoadPaymentsEvent()),
      child: const _PaymentsView(),
    );
  }
}

class _PaymentsView extends StatelessWidget {
  const _PaymentsView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PaymentsBloc, PaymentsState>(
      builder: (context, state) {
        final filter = state is PaymentsLoaded ? state.filter : PayFilter.all;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Payments & refunds', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Wrap(
              spacing: 8,
              children: [
                _chip(context, 'All', PayFilter.all, filter),
                _chip(context, 'Requires payment', PayFilter.requiresPayment, filter),
                _chip(context, 'Succeeded', PayFilter.succeeded, filter),
                _chip(context, 'Refunded', PayFilter.refunded, filter),
                _chip(context, 'Failed', PayFilter.failed, filter),
                _chip(context, 'No-show', PayFilter.noShow, filter),
              ],
            ),
            const SizedBox(height: FobSpace.card),
            if (state is PaymentsLoaded && state.actionError != null) ...[
              Text(state.actionError!, style: const TextStyle(color: FobColors.error, fontSize: 13)),
              const SizedBox(height: FobSpace.card),
            ],
            if (state is PaymentsLoadFailure)
              Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body)))
            else
              Card(
                child: FobDataTable<Payment>(
                  loading: state is PaymentsLoading || state is PaymentsInitial,
                  emptyText: 'No payments to show.',
                  rows: state is PaymentsLoaded ? state.filtered : const [],
                  columns: [
                    FobColumn(label: 'Booking', flex: 2, render: (r) => Text('${r.bookingRef} · ${r.customerName}', style: FobText.body)),
                    FobColumn(label: 'Paid', render: (r) => Text(formatMoney(r.paidPence), style: FobText.money)),
                    FobColumn(label: 'Refunded', render: (r) => Text(formatMoney(r.refundedPence), style: FobText.money)),
                    FobColumn(label: 'Status', render: (r) => StatusPill(status: r.status.pill)),
                    FobColumn(
                      label: '',
                      render: (r) => Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          AppButton(
                            kind: AppButtonKind.row,
                            label: 'View',
                            onPressed: () => _openDetailModal(context, r),
                          ),
                          // FINDING-005: refund only for a payment that actually
                          // succeeded (or was already partially refunded).
                          if (r.status == PaymentStatus.succeeded) ...[
                            const SizedBox(width: 4),
                            AppButton(
                              kind: AppButtonKind.row,
                              label: 'Refund',
                              onPressed: () => _openRefundModal(context, r),
                            ),
                          ],
                        ],
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

  Widget _chip(BuildContext context, String label, PayFilter f, PayFilter active) {
    return FobFilterChip(
      label: label,
      active: f == active,
      onTap: () => context.read<PaymentsBloc>().add(FilterPaymentsEvent(f)),
    );
  }

  void _openRefundModal(BuildContext context, Payment row) {
    final bloc = context.read<PaymentsBloc>();
    showFobModal(
      context: context,
      blocking: true, // UXD-01: money movement, explicit-choice dismissal only
      builder: (ctx) => _RefundModal(bloc: bloc, row: row),
    );
  }

  void _openDetailModal(BuildContext context, Payment row) {
    showFobModal(
      context: context,
      blocking: false,
      builder: (ctx) => _PaymentDetailModal(
        row: row,
        onViewBooking: () {
          Navigator.of(ctx).pop();
          _openBookingModal(context, row.bookingId);
        },
      ),
    );
  }

  void _openBookingModal(BuildContext context, String bookingId) {
    showFobModal(
      context: context,
      blocking: false,
      builder: (ctx) => _BookingDetailModal(bookingId: bookingId),
    );
  }
}

class _PaymentDetailModal extends StatefulWidget {
  const _PaymentDetailModal({required this.row, required this.onViewBooking});
  final Payment row;
  final VoidCallback onViewBooking;

  @override
  State<_PaymentDetailModal> createState() => _PaymentDetailModalState();
}

class _PaymentDetailModalState extends State<_PaymentDetailModal> {
  late final Future<BookingDetail?> _future = _load();

  Future<BookingDetail?> _load() async =>
      (await sl<GetBookingDetail>()(widget.row.bookingId)).valueOrNull;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Payment detail — ${widget.row.bookingRef}', style: FobText.cardTitle),
        const SizedBox(height: FobSpace.card),
        FutureBuilder<BookingDetail?>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final detail = snap.data;
            if (detail == null) {
              return const Text('Could not load payment history.', style: FobText.body);
            }
            if (detail.paymentAttempts.isEmpty) {
              return const Text('No payment attempts recorded for this booking.', style: FobText.body);
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [for (final p in detail.paymentAttempts) _paymentRow(p)],
            );
          },
        ),
        const SizedBox(height: FobSpace.block),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            AppButton(label: 'View booking', kind: AppButtonKind.ghost, onPressed: widget.onViewBooking),
            const SizedBox(width: 8),
            AppButton(label: 'Close', kind: AppButtonKind.ghost, onPressed: () => Navigator.of(context).pop()),
          ],
        ),
      ],
    );
  }

  Widget _paymentRow(PaymentAttempt p) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.status, style: FobText.body),
                const SizedBox(height: 2),
                Text('ref: ${p.providerReference}',
                    style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
              ],
            ),
          ),
          Expanded(flex: 2, child: Text('Paid ${formatMoney(p.amountPence)}', style: FobText.money)),
          Expanded(flex: 2, child: Text('Refunded ${formatMoney(p.refundAmountPence)}', style: FobText.money)),
        ],
      ),
    );
  }
}

class _RefundModal extends StatefulWidget {
  final PaymentsBloc bloc;
  final Payment row;
  const _RefundModal({required this.bloc, required this.row});

  @override
  State<_RefundModal> createState() => _RefundModalState();
}

class _RefundModalState extends State<_RefundModal> {
  final amountCtrl = TextEditingController();
  int entryPence = 0;

  @override
  void dispose() {
    amountCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final row = widget.row;
    final cumulative = PaymentsBloc.cumulativeAfter(row, entryPence);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Refund — ${row.bookingRef}', style: FobText.cardTitle),
        const SizedBox(height: FobSpace.card),
        Row(
          children: [
            Expanded(child: _readOnly('Paid', formatMoney(row.paidPence))),
            const SizedBox(width: 12),
            Expanded(child: _readOnly('Refunded so far', formatMoney(row.refundedPence))),
          ],
        ),
        const SizedBox(height: FobSpace.field),
        AppField(
          label: 'Refund amount (£)',
          money: true,
          controller: amountCtrl,
          key: const Key('refund-amount-field'),
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          onChanged: (v) {
            final parsed = double.tryParse(v) ?? 0;
            setState(() => entryPence = (parsed * 100).round());
          },
        ),
        const SizedBox(height: FobSpace.field),
        Text(
          'Cumulative refunded after this: ${formatMoney(cumulative)}',
          key: const Key('cumulative-refund-preview'),
          style: FobText.money,
        ),
        const SizedBox(height: FobSpace.block),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            AppButton(label: 'Cancel', kind: AppButtonKind.ghost, onPressed: () => Navigator.of(context).pop()),
            const SizedBox(width: 8),
            AppButton(
              key: const Key('refund-confirm-button'),
              label: 'Refund ${formatMoney(entryPence)}',
              kind: AppButtonKind.danger,
              onPressed: entryPence <= 0
                  ? null
                  : () {
                      widget.bloc.add(ConfirmRefundEvent(row, entryPence));
                      Navigator.of(context).pop();
                    },
            ),
          ],
        ),
      ],
    );
  }

  Widget _readOnly(String label, String value) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: FobText.microLabel),
          const SizedBox(height: 4),
          Text(value, style: FobText.money),
        ],
      );
}

/// FINDING-005 follow-up — read-only booking record shown as a modal from the
/// Payments drill-down ("View booking"), deliberately a dialog rather than a
/// route change so the Payments & refunds screen state is untouched.
class _BookingDetailModal extends StatefulWidget {
  const _BookingDetailModal({required this.bookingId});
  final String bookingId;

  @override
  State<_BookingDetailModal> createState() => _BookingDetailModalState();
}

class _BookingDetailModalState extends State<_BookingDetailModal> {
  late final Future<BookingDetail?> _future = _load();

  Future<BookingDetail?> _load() async =>
      (await sl<GetBookingDetail>()(widget.bookingId)).valueOrNull;

  String _shortRef(String id) => id.length <= 8 ? id.toUpperCase() : id.substring(0, 8).toUpperCase();

  String _roleLabel(AttendeeRole role) => switch (role) {
        AttendeeRole.leader => 'Leader',
        AttendeeRole.coLeader => 'Co-leader',
        AttendeeRole.attendee => 'Attendee',
      };

  String _ts(DateTime? dt) {
    if (dt == null) return '—';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}, $hh:$mm';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FutureBuilder<BookingDetail?>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final d = snap.data;
            if (d == null) {
              return const Text('Could not load the booking.', style: FobText.body);
            }
            final ec = d.emergencyContact;
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(d.leadName, style: FobText.cardTitle),
                          const SizedBox(height: 2),
                          Text('${_shortRef(d.id)} · ${d.status} · party ${d.partySize}',
                              style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
                        ],
                      ),
                    ),
                    Text(formatMoney(d.priceTotalPence), style: FobText.money),
                  ],
                ),
                const Divider(height: 24),
                const Text('ATTENDEES', style: FobText.microLabel),
                const SizedBox(height: 4),
                ...d.attendees.map((a) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 5),
                      child: Row(
                        children: [
                          Expanded(flex: 3, child: Text(a.name, style: FobText.body)),
                          Expanded(flex: 2, child: Text(_roleLabel(a.role), style: const TextStyle(fontSize: 12.5, color: FobColors.textMuted))),
                        ],
                      ),
                    )),
                const Divider(height: 24),
                const Text('EMERGENCY CONTACT', style: FobText.microLabel),
                const SizedBox(height: 4),
                Text(
                  ec == null
                      ? '—'
                      : '${ec.name} · ${ec.phone} ${ec.relationship != null ? '(${ec.relationship})' : ''}',
                  style: FobText.body,
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: FobKeyValueFromDetail('WAIVER', _ts(d.consent.waiverAcceptedAt))),
                    Expanded(child: FobKeyValueFromDetail('TERMS', _ts(d.consent.termsAcceptedAt))),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('STATUS HISTORY', style: FobText.microLabel),
                const SizedBox(height: 4),
                _hist('Created', d.statusHistory.createdAt),
                _hist('Confirmed', d.statusHistory.confirmedAt),
                _hist('Cancelled', d.statusHistory.cancelledAt),
              ],
            );
          },
        ),
        const SizedBox(height: FobSpace.block),
        Align(
          alignment: Alignment.centerRight,
          child: AppButton(label: 'Close', kind: AppButtonKind.ghost, onPressed: () => Navigator.of(context).pop()),
        ),
      ],
    );
  }

  Widget _hist(String label, DateTime? ts) {
    if (ts == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(width: 90, child: Text(label, style: FobText.body)),
          Expanded(child: Text(_ts(ts), style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted))),
        ],
      ),
    );
  }
}

/// Small key/value used by the booking modal (label over value).
class FobKeyValueFromDetail extends StatelessWidget {
  final String label;
  final String value;
  const FobKeyValueFromDetail(this.label, this.value, {super.key});

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: FobText.microLabel),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
        ],
      );
}
