import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/usecases/usecase.dart';
import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/status_pill.dart';
import '../../../email/domain/entities/email_entities.dart';
import '../../../email/domain/usecases/email_usecases.dart';
import '../../domain/entities/booking_detail.dart';
import '../../domain/entities/booking_summary.dart';
import '../../domain/usecases/booking_usecases.dart';
import '../../domain/usecases/get_booking_detail.dart';
import '../bloc/bookings_bloc.dart';
import '../widgets/booking_record_view.dart';
import '../widgets/booking_send_email_dialog.dart';

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

/// CR-004 (CHG-012, UXD-22): the six sortable A19 columns.
enum BookingSortKey { customer, ref, tour, date, amount, status }

/// Header-toggle sort (UXD-22 §1) — pure so the ordering is unit-testable.
/// Search filters first (in the bloc), then this sorts; amount sorts
/// numerically, everything else case-insensitively.
List<BookingSummary> sortBookings(List<BookingSummary> rows, BookingSortKey key, bool asc) {
  final out = [...rows];
  int cmp(BookingSummary a, BookingSummary b) => switch (key) {
        BookingSortKey.customer => a.customerName.toLowerCase().compareTo(b.customerName.toLowerCase()),
        BookingSortKey.ref => a.id.toLowerCase().compareTo(b.id.toLowerCase()),
        BookingSortKey.tour => a.tourName.toLowerCase().compareTo(b.tourName.toLowerCase()),
        BookingSortKey.date => a.date.compareTo(b.date),
        BookingSortKey.amount => a.paidPence.compareTo(b.paidPence),
        BookingSortKey.status => a.status.toLowerCase().compareTo(b.status.toLowerCase()),
      };
  out.sort(cmp);
  return asc ? out : out.reversed.toList();
}

/// A19 — Bookings (REQ-BO05/BO06). CR-004 (CHG-012, UXD-22): ONE surface in
/// the A5d Emails-console idiom — search + six-column sortable table; a row
/// select opens the read-only record as a floating detail card over the list
/// (no route change, list state preserved; cards cascade). Edit still routes
/// to A23. The detail card carries the UXD-23 "Send email" action
/// (REQ-NOTIF11).
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
  BookingSortKey _sort = BookingSortKey.date;
  bool _asc = false;
  final List<String> _open = []; // floating detail cards (booking ids), page-scoped

  // UXD-23: booking-aware template availability decides the Send-email
  // enabled state; loaded once per page visit.
  late final Future<List<EmailTemplate>> _templatesF =
      sl<GetTemplates>()(const NoParams()).then((r) => r.fold((_) => <EmailTemplate>[], (t) => t));

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _tapHeader(BookingSortKey k) => setState(() {
        if (_sort == k) {
          _asc = !_asc;
        } else {
          _sort = k;
          _asc = false;
        }
      });

  void _openCard(String id) => setState(() {
        if (!_open.contains(id)) _open.add(id);
      });
  void _closeCard(String id) => setState(() => _open.remove(id));

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BookingsBloc, BookingsState>(
      listenWhen: (prev, curr) => curr.notice != null && curr.notice != prev.notice,
      listener: (context, state) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.notice!))),
      builder: (context, state) {
        // Routes are wrapped in a SingleChildScrollView (unbounded height), so
        // supply a bounded height before using Stack + floating cards (A5d idiom).
        final viewH = (MediaQuery.of(context).size.height - 190).clamp(420.0, 4000.0);
        return SizedBox(
          height: viewH,
          child: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('A19 · BOOKINGS & PAYMENTS', style: FobText.microLabel),
                  const SizedBox(height: 4),
                  const Text('Bookings', style: FobText.pageTitle),
                  const SizedBox(height: 6),
                  const Text(
                    'Sort any column or search, then select a row to open the read-only '
                    'record in place — editing routes to A23.',
                    style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5),
                  ),
                  const SizedBox(height: FobSpace.block),
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
                  Expanded(child: _resultsCard(context, state)),
                ],
              ),
              // ---- floating detail cards (cascading, page-scoped: UXD-22 §2) ----
              ..._open.asMap().entries.map((e) {
                final i = e.key;
                return Positioned(
                  top: 8.0 + i * 34,
                  right: 8.0 + i * 34,
                  child: _BookingDetailCard(
                    bookingId: e.value,
                    load: context.read<BookingsBloc>().getBookingDetail,
                    templatesF: _templatesF,
                    onClose: () => _closeCard(e.value),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }

  Widget _resultsCard(BuildContext context, BookingsState state) {
    if (state.loading) {
      return const FobCard(child: Center(child: CircularProgressIndicator()));
    }
    final rows = sortBookings(state.rows, _sort, _asc);
    if (rows.isEmpty) {
      return const FobCard(child: Padding(padding: EdgeInsets.all(8), child: Text('No bookings match.', style: FobText.body)));
    }
    Widget hdr(String label, BookingSortKey k, {int flex = 1, bool right = false}) => Expanded(
          flex: flex,
          child: InkWell(
            onTap: () => _tapHeader(k),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(mainAxisAlignment: right ? MainAxisAlignment.end : MainAxisAlignment.start, children: [
                Text(label.toUpperCase(), style: FobText.microLabel),
                if (_sort == k)
                  Icon(_asc ? Icons.arrow_upward : Icons.arrow_downward, size: 12, color: FobColors.pink),
              ]),
            ),
          ),
        );
    return FobCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            hdr('Customer', BookingSortKey.customer, flex: 3),
            hdr('Ref', BookingSortKey.ref, flex: 2),
            hdr('Tour', BookingSortKey.tour, flex: 3),
            hdr('Date', BookingSortKey.date, flex: 2),
            hdr('Amount', BookingSortKey.amount, flex: 2, right: true),
            const SizedBox(width: 16),
            hdr('Status', BookingSortKey.status, flex: 2),
          ]),
          const Divider(height: 12),
          Expanded(child: ListView(children: [for (final r in rows) _row(r)])),
        ],
      ),
    );
  }

  Widget _row(BookingSummary r) => InkWell(
        onTap: () => _openCard(r.id),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(children: [
            Expanded(
              flex: 3,
              child: Text(r.customerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontFamily: FobText.sans, fontWeight: FontWeight.w600, fontSize: 14, color: FobColors.textStrong)),
            ),
            Expanded(
              flex: 2,
              child: Text(_shortRef(r.id), style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
            ),
            Expanded(
              flex: 3,
              child: Text(r.tourName, maxLines: 1, overflow: TextOverflow.ellipsis, style: FobText.body),
            ),
            Expanded(
              flex: 2,
              child: Text(r.date, style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
            ),
            Expanded(
              flex: 2,
              child: Text(_money(r.paidPence),
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, color: FobColors.textPrice, fontFeatures: FobText.moneyFontFeatures)),
            ),
            const SizedBox(width: 16),
            Expanded(flex: 2, child: Align(alignment: Alignment.centerLeft, child: PillLabel.forStatus(r.status))),
          ]),
        ),
      );
}

/// UXD-22 §2 — floating, dismissible read-only booking record (the unchanged
/// REQ-BO06 content) with Edit → A23 and the UXD-23 Send-email action.
class _BookingDetailCard extends StatefulWidget {
  const _BookingDetailCard({
    required this.bookingId,
    required this.load,
    required this.templatesF,
    required this.onClose,
  });

  final String bookingId;
  final GetBookingDetail load;
  final Future<List<EmailTemplate>> templatesF;
  final VoidCallback onClose;

  @override
  State<_BookingDetailCard> createState() => _BookingDetailCardState();
}

class _BookingDetailCardState extends State<_BookingDetailCard> {
  late final Future<BookingDetail?> _detailF =
      widget.load(widget.bookingId).then((r) => r.fold((_) => null, (d) => d));

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 10,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 560,
        constraints: const BoxConstraints(maxHeight: 520),
        decoration: BoxDecoration(
          color: FobColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: FobColors.hairline),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 12, 10, 0),
              child: Row(children: [
                Expanded(child: Text('Booking ${_shortRef(widget.bookingId)}', style: FobText.cardTitle)),
                IconButton(icon: const Icon(Icons.close, size: 18), onPressed: widget.onClose, tooltip: 'Close'),
              ]),
            ),
            Flexible(
              child: FutureBuilder<BookingDetail?>(
                future: _detailF,
                builder: (context, snap) {
                  if (snap.connectionState != ConnectionState.done) {
                    return const SizedBox(height: 180, child: Center(child: CircularProgressIndicator()));
                  }
                  final d = snap.data;
                  if (d == null) {
                    return const Padding(padding: EdgeInsets.all(18), child: Text('Booking not found.', style: FobText.body));
                  }
                  return SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(18, 4, 18, 16),
                    child: FutureBuilder<List<EmailTemplate>>(
                      future: widget.templatesF,
                      builder: (context, tsnap) {
                        final templates = tsnap.data ?? const <EmailTemplate>[];
                        final canSend = bookingAwareActiveTemplates(templates).isNotEmpty;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            BookingRecordView(
                              detail: d,
                              onEdit: () => context.go('/bookings/${d.id}/edit'),
                              headerActions: [
                                OutlinedButton.icon(
                                  icon: const Icon(Icons.mail_outline, size: 16),
                                  label: const Text('Send email'),
                                  onPressed: canSend ? () => _sendEmail(context, d, templates) : null,
                                ),
                              ],
                            ),
                            // UXC-FRM-3: disabled action carries its reason
                            // adjacent, verbatim from the REQ error pair.
                            if (!canSend)
                              const Padding(
                                padding: EdgeInsets.only(top: 8),
                                child: Text(
                                  'No booking-aware templates are active. Publish one before sending.',
                                  style: TextStyle(fontSize: 12, color: FobColors.textMuted),
                                ),
                              ),
                          ],
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendEmail(BuildContext context, BookingDetail d, List<EmailTemplate> templates) async {
    final sentTo = await showDialog<String>(
      context: context,
      builder: (_) => BookingSendEmailDialog(
        detail: d,
        templates: templates,
        onSend: (p) => sl<SendBookingEmail>()(p),
      ),
    );
    if (sentTo == null || !context.mounted) return;
    // UXC-FBK-1: the owner-observable outcome confirmation.
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Sent to $sentTo')));
  }
}
