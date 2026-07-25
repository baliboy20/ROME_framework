import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../bloc/payments_cubit.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/app_button.dart';
import '../widgets/app_field.dart';
import '../widgets/app_modal.dart';
import '../widgets/filter_chip_row.dart';
import '../widgets/fob_data_table.dart';
import '../widgets/status_pill.dart';
import '../widgets/fob_primitives.dart';

String formatMoney(int pence) => '£${(pence / 100).toStringAsFixed(2)}';

/// A8 — Payments & refunds (REQ-BOOK13, UXD-01).
class PaymentsScreen extends StatelessWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) => PaymentsCubit(context.read())..load(),
      child: const _PaymentsView(),
    );
  }
}

class _PaymentsView extends StatelessWidget {
  const _PaymentsView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PaymentsCubit, PaymentsState>(
      builder: (context, state) {
        final cubit = context.read<PaymentsCubit>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Payments & refunds', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Wrap(
              spacing: 8,
              children: [
                _chip(context, 'All', PayFilter.all, state.filter),
                _chip(context, 'Requires payment', PayFilter.requiresPayment, state.filter),
                _chip(context, 'Succeeded', PayFilter.succeeded, state.filter),
                _chip(context, 'Refunded', PayFilter.refunded, state.filter),
                _chip(context, 'Failed', PayFilter.failed, state.filter),
                _chip(context, 'No-show', PayFilter.noShow, state.filter),
              ],
            ),
            const SizedBox(height: FobSpace.card),
            Card(
              child: FobDataTable<PaymentRow>(
                loading: state.loading,
                emptyText: 'No payments to show.',
                rows: state.filtered,
                columns: [
                  FobColumn(label: 'Booking', flex: 2, render: (r) => Text('${r.bookingRef} · ${r.customerName}', style: FobText.body)),
                  FobColumn(label: 'Paid', render: (r) => Text(formatMoney(r.paidPence), style: FobText.money)),
                  FobColumn(label: 'Refunded', render: (r) => Text(formatMoney(r.refundedPence), style: FobText.money)),
                  FobColumn(label: 'Status', render: (r) => StatusPill(status: r.status)),
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
                        // FINDING-005: refund is only ever reachable for a
                        // payment that actually succeeded (or was already
                        // partially refunded) — never for
                        // failed/no-show/requires-payment rows.
                        if (r.status == StatusPillState.succeeded) ...[
                          const SizedBox(width: 4),
                          AppButton(
                            kind: AppButtonKind.row,
                            label: 'Refund',
                            onPressed: () => _openRefundModal(context, cubit, r),
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
    return FobFilterChip(label: label, active: f == active, onTap: () => context.read<PaymentsCubit>().setFilter(f));
  }

  void _openRefundModal(BuildContext context, PaymentsCubit cubit, PaymentRow row) {
    showFobModal(
      context: context,
      blocking: true, // UXD-01: money movement, explicit-choice dismissal only
      builder: (ctx) => _RefundModal(cubit: cubit, row: row),
    );
  }

  // FINDING-005: real read-only drill-down — fetches the actual per-payment
  // array (GET /admin/bookings/:id, same endpoint A19 uses) instead of the
  // pre-aggregated list-row totals.
  void _openDetailModal(BuildContext context, PaymentRow row) {
    showFobModal(
      context: context,
      blocking: false,
      builder: (ctx) => _PaymentDetailModal(
        row: row,
        // Close the payment detail, then open the source booking as its own
        // modal — deliberately a dialog, not a route change, so the Payments
        // & refunds screen (filters, scroll) stays exactly as it was.
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
  final PaymentRow row;
  final VoidCallback onViewBooking;

  @override
  State<_PaymentDetailModal> createState() => _PaymentDetailModalState();
}

class _PaymentDetailModalState extends State<_PaymentDetailModal> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<ApiClient>().getBooking(widget.row.bookingId);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Payment detail — ${widget.row.bookingRef}', style: FobText.cardTitle),
        const SizedBox(height: FobSpace.card),
        FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (snap.hasError) {
              return const Text('Could not load payment history.', style: FobText.body);
            }
            final payments = (snap.data?['payments'] as List?) ?? const [];
            if (payments.isEmpty) {
              return const Text('No payment attempts recorded for this booking.', style: FobText.body);
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final p in payments) _paymentRow((p as Map).cast<String, dynamic>()),
              ],
            );
          },
        ),
        const SizedBox(height: FobSpace.block),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            AppButton(
              label: 'View booking',
              kind: AppButtonKind.ghost,
              onPressed: widget.onViewBooking,
            ),
            const SizedBox(width: 8),
            AppButton(
              label: 'Close',
              kind: AppButtonKind.ghost,
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _paymentRow(Map<String, dynamic> p) {
    final amount = formatMoney((p['amount_pence'] as num?)?.toInt() ?? 0);
    final refunded = formatMoney((p['refund_amount_pence'] as num?)?.toInt() ?? 0);
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
                Text('${p['status'] ?? '—'}', style: FobText.body),
                const SizedBox(height: 2),
                Text('ref: ${p['provider_reference'] ?? '—'}',
                    style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
              ],
            ),
          ),
          Expanded(flex: 2, child: Text('Paid $amount', style: FobText.money)),
          Expanded(flex: 2, child: Text('Refunded $refunded', style: FobText.money)),
        ],
      ),
    );
  }
}

class _RefundModal extends StatefulWidget {
  final PaymentsCubit cubit;
  final PaymentRow row;
  const _RefundModal({required this.cubit, required this.row});

  @override
  State<_RefundModal> createState() => _RefundModalState();
}

class _RefundModalState extends State<_RefundModal> {
  final amountCtrl = TextEditingController();
  int entryPence = 0;
  bool confirming = false;

  @override
  Widget build(BuildContext context) {
    final row = widget.row;
    final cumulative = widget.cubit.cumulativeAfter(row, entryPence);
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
            AppButton(
              label: 'Cancel',
              kind: AppButtonKind.ghost,
              onPressed: () => Navigator.of(context).pop(),
            ),
            const SizedBox(width: 8),
            AppButton(
              key: const Key('refund-confirm-button'),
              label: 'Refund ${formatMoney(entryPence)}',
              kind: AppButtonKind.danger,
              loading: confirming,
              onPressed: entryPence <= 0
                  ? null
                  : () async {
                      setState(() => confirming = true);
                      await widget.cubit.confirmRefund(row, entryPence);
                      if (context.mounted) Navigator.of(context).pop();
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
/// route change so the Payments & refunds screen state is untouched. Fetches
/// the same GET /admin/bookings/:id the A19 browser uses.
class _BookingDetailModal extends StatefulWidget {
  const _BookingDetailModal({required this.bookingId});
  final String bookingId;

  @override
  State<_BookingDetailModal> createState() => _BookingDetailModalState();
}

class _BookingDetailModalState extends State<_BookingDetailModal> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<ApiClient>().getBooking(widget.bookingId);
  }

  String _shortRef(String id) => id.length <= 8 ? id.toUpperCase() : id.substring(0, 8).toUpperCase();

  String _leadName(List attendees) {
    for (final a in attendees) {
      final m = (a as Map);
      if (m['contact_role'] == 'leader' || m['is_lead_booker'] == 1) return '${m['name']}';
    }
    return attendees.isNotEmpty ? '${(attendees.first as Map)['name']}' : '—';
  }

  String _roleLabel(String role) => switch (role) {
        'leader' => 'Leader',
        'co-leader' => 'Co-leader',
        _ => 'Attendee',
      };

  String _ts(dynamic iso) {
    if (iso == null) return '—';
    final dt = DateTime.tryParse('$iso');
    if (dt == null) return '$iso';
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
        FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (snap.hasError || snap.data == null) {
              return const Text('Could not load the booking.', style: FobText.body);
            }
            final d = snap.data!;
            final booking = (d['booking'] as Map?)?.cast<String, dynamic>() ?? {};
            final attendees = (d['attendees'] as List?) ?? const [];
            final ec = (d['emergency_contact'] as Map?)?.cast<String, dynamic>() ?? {};
            final consent = (d['consent'] as Map?)?.cast<String, dynamic>() ?? {};
            final hist = (d['status_history'] as Map?)?.cast<String, dynamic>() ?? {};

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
                          Text(_leadName(attendees), style: FobText.cardTitle),
                          const SizedBox(height: 2),
                          Text('${_shortRef('${booking['id']}')} · ${booking['status'] ?? ''} · party ${booking['party_size'] ?? '—'}',
                              style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
                        ],
                      ),
                    ),
                    Text(formatMoney((booking['price_total_pence'] as num?)?.toInt() ?? 0), style: FobText.money),
                  ],
                ),
                const Divider(height: 24),
                const Text('ATTENDEES', style: FobText.microLabel),
                const SizedBox(height: 4),
                ...attendees.map((a) {
                  final m = (a as Map).cast<String, dynamic>();
                  final role = '${m['contact_role'] ?? (m['is_lead_booker'] == 1 ? 'leader' : 'attendee')}';
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: Row(
                      children: [
                        Expanded(flex: 3, child: Text('${m['name'] ?? ''}', style: FobText.body)),
                        Expanded(flex: 2, child: Text(_roleLabel(role), style: const TextStyle(fontSize: 12.5, color: FobColors.textMuted))),
                      ],
                    ),
                  );
                }),
                const Divider(height: 24),
                Text('EMERGENCY CONTACT', style: FobText.microLabel),
                const SizedBox(height: 4),
                Text('${ec['name'] ?? '—'} · ${ec['phone'] ?? ''} ${ec['relationship'] != null ? '(${ec['relationship']})' : ''}',
                    style: FobText.body),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: FobKeyValue('WAIVER', _ts(consent['waiver_accepted_at']))),
                    Expanded(child: FobKeyValue('TERMS', _ts(consent['terms_accepted_at']))),
                  ],
                ),
                const SizedBox(height: 12),
                Text('STATUS HISTORY', style: FobText.microLabel),
                const SizedBox(height: 4),
                _hist('Created', hist['created_at']),
                _hist('Confirmed', hist['confirmed_at']),
                _hist('Cancelled', hist['cancelled_at']),
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

  Widget _hist(String label, dynamic ts) {
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
