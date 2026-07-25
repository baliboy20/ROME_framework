import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/status_pill.dart';

/// A19 — Booking browser (BO05/BO06). Master-detail per the parchment mockup:
/// a compact results list on the left, a full booking-record card on the right.
class BookingBrowserScreen extends StatefulWidget {
  const BookingBrowserScreen({super.key});
  @override
  State<BookingBrowserScreen> createState() => _BookingBrowserScreenState();
}

class _BookingBrowserScreenState extends State<BookingBrowserScreen> {
  final _searchCtrl = TextEditingController();
  List<BookingSummaryRow> _all = [];
  String _query = '';
  bool _loading = true;
  String? _selectedId;
  Map<String, dynamic>? _detail;
  bool _detailLoading = false;

  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  /// Load every booking once; searching is then an in-memory filter across the
  /// visible fields (reference, name, tour, status) — the backend only filtered
  /// by exact id, so name/tour/status search never matched (FINDING).
  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final data = await _api.getBookings();
      final rows = data.map((j) => BookingSummaryRow.fromJson(j as Map<String, dynamic>)).toList();
      setState(() {
        _all = rows;
        _loading = false;
      });
      _applyFilter(_query);
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  List<BookingSummaryRow> get _rows {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return _all;
    return _all.where((r) {
      return r.customerName.toLowerCase().contains(q) ||
          r.tourName.toLowerCase().contains(q) ||
          r.status.toLowerCase().contains(q) ||
          r.date.toLowerCase().contains(q) ||
          r.id.toLowerCase().contains(q);
    }).toList();
  }

  void _applyFilter(String q) {
    setState(() => _query = q);
    final rows = _rows;
    if (rows.isEmpty) {
      // No match → blank the record panel.
      setState(() {
        _selectedId = null;
        _detail = null;
        _detailLoading = false;
      });
    } else if (_selectedId == null || !rows.any((r) => r.id == _selectedId)) {
      _select(rows.first.id);
    }
  }

  Future<void> _select(String id) async {
    setState(() {
      _selectedId = id;
      _detailLoading = true;
    });
    try {
      final d = await _api.getBooking(id);
      setState(() {
        _detail = d;
        _detailLoading = false;
      });
    } catch (_) {
      setState(() => _detailLoading = false);
    }
  }

  String _money(num pence) => '£${(pence / 100).toStringAsFixed(2)}';

  @override
  Widget build(BuildContext context) {
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
          final list = _resultsColumn();
          final detail = _recordColumn();
          if (!wide) {
            return Column(children: [list, const SizedBox(height: FobSpace.card), detail]);
          }
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
  }

  Widget _resultsColumn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('SEARCH BOOKINGS', style: FobText.microLabel),
        const SizedBox(height: 6),
        TextField(
          controller: _searchCtrl,
          onChanged: _applyFilter,
          decoration: InputDecoration(
            hintText: 'Reference, name, tour or status',
            prefixIcon: const Icon(Icons.search, size: 18),
            isDense: true,
            filled: true,
            fillColor: FobColors.surfaceBgLo,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(FobRadius.field),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: FobSpace.card),
        _card(
          padding: EdgeInsets.zero,
          child: _loading
              ? const Padding(padding: EdgeInsets.all(28), child: Center(child: CircularProgressIndicator()))
              : _rows.isEmpty
                  ? const Padding(padding: EdgeInsets.all(24), child: Text('No bookings match.', style: FobText.body))
                  : Column(
                      children: [
                        for (var i = 0; i < _rows.length; i++) _resultRow(_rows[i], i == _rows.length - 1),
                      ],
                    ),
        ),
      ],
    );
  }

  Widget _resultRow(BookingSummaryRow r, bool last) {
    final active = r.id == _selectedId;
    return InkWell(
      onTap: () => _select(r.id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: active ? FobColors.surfaceBgLo : null,
          border: last ? null : const Border(bottom: BorderSide(color: Color(0xFFF2EDDF))),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r.customerName,
                      style: const TextStyle(
                          fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 15, color: FobColors.textStrong)),
                  const SizedBox(height: 2),
                  Text('${_shortRef(r.id)} · ${r.tourName}  ${r.date}',
                      style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_money(r.paidPence),
                    style: const TextStyle(
                        fontFamily: FobText.serif,
                        fontWeight: FontWeight.w600,
                        color: FobColors.textPrice,
                        fontFeatures: FobText.moneyFontFeatures)),
                const SizedBox(height: 4),
                PillLabel.forStatus(r.status),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _recordColumn() {
    if (_detailLoading || _detail == null) {
      return _card(
        child: SizedBox(
          height: 260,
          child: Center(
            child: _detailLoading
                ? const CircularProgressIndicator()
                : const Text('Select a booking to view its record.', style: FobText.body),
          ),
        ),
      );
    }
    final d = _detail!;
    final booking = (d['booking'] as Map?)?.cast<String, dynamic>() ?? {};
    final attendees = (d['attendees'] as List?) ?? const [];
    final ec = (d['emergency_contact'] as Map?)?.cast<String, dynamic>() ?? {};
    final payments = (d['payments'] as List?) ?? const [];
    final consent = (d['consent'] as Map?)?.cast<String, dynamic>() ?? {};
    final hist = (d['status_history'] as Map?)?.cast<String, dynamic>() ?? {};
    final pay = payments.isNotEmpty ? (payments.first as Map).cast<String, dynamic>() : null;

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('BOOKING RECORD', style: FobText.microLabel),
              Row(
                children: [
                  ..._statusTransitionButtons('${booking['status'] ?? ''}', '${booking['id']}'),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: '${booking['status']}' == 'cancelled'
                        ? null
                        : () => _openEditDialog(booking, attendees),
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
                    Text(_leadName(attendees, booking),
                        style: const TextStyle(
                            fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 22, color: FobColors.textStrong)),
                    const SizedBox(height: 3),
                    Text('${_shortRef('${booking['id']}')} · ${booking['tour_id'] ?? ''}  ${booking['date'] ?? ''}',
                        style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(_money((booking['price_total_pence'] as num?) ?? 0),
                      style: const TextStyle(
                          fontFamily: FobText.serif,
                          fontWeight: FontWeight.w700,
                          fontSize: 22,
                          color: FobColors.textPrice,
                          fontFeatures: FobText.moneyFontFeatures)),
                  const SizedBox(height: 4),
                  PillLabel.forStatus('${booking['status'] ?? ''}'),
                ],
              ),
            ],
          ),
          _divider(),
          _sectionLabel('ATTENDEES'),
          ...attendees.map((a) {
            final m = (a as Map).cast<String, dynamic>();
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 7),
              child: Row(
                children: [
                  Expanded(flex: 3, child: Text('${m['name'] ?? ''}', style: FobText.body)),
                  Expanded(flex: 2, child: Text(_ageBand('${m['age_band'] ?? ''}'), style: const TextStyle(fontSize: 12.5, color: FobColors.textMuted))),
                  Expanded(flex: 2, child: _contactRoleChip('${m['contact_role'] ?? (m['is_lead_booker'] == 1 ? 'leader' : 'attendee')}')),
                  Expanded(flex: 3, child: Text(m['notes'] == null ? '—' : '${m['notes']}', style: const TextStyle(fontSize: 12.5, color: FobColors.textBody))),
                ],
              ),
            );
          }),
          _divider(),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _kv('EMERGENCY CONTACT', '${ec['name'] ?? '—'} · ${ec['phone'] ?? ''}')),
              Expanded(
                child: _kv(
                  'PAYMENT',
                  pay == null
                      ? '—'
                      : 'stripe · ${_shortRef('${pay['provider_reference'] ?? ''}')} · ${_money((pay['amount_pence'] as num?) ?? 0)} ${pay['status']}',
                  sub: 'Card number never stored.',
                ),
              ),
            ],
          ),
          const SizedBox(height: FobSpace.card),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _kv('WAIVER', _ts(consent['waiver_accepted_at']))),
              Expanded(child: _kv('T&C · MARKETING', _ts(consent['terms_accepted_at']))),
            ],
          ),
          _divider(),
          _sectionLabel('STATUS HISTORY'),
          _histRow(hist['created_at'], 'Created from booking flow'),
          _histRow(hist['confirmed_at'], 'Booking confirmed'),
          _histRow(hist['cancelled_at'], 'Booking cancelled'),
        ],
      ),
    );
  }

  // ---- edit / status transition (REQ-BOOK15/16, DR-B12b/c) ---------------

  /// Valid transitions per current status, mirroring the worker's
  /// VALID_TRANSITIONS table (client-side just for which buttons to show —
  /// the server is the source of truth and re-validates).
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

  List<Widget> _statusTransitionButtons(String status, String bookingId) {
    final transitions = _validTransitions[status] ?? const [];
    return [
      for (final t in transitions) ...[
        OutlinedButton(
          onPressed: () => _runTransition(bookingId, t),
          style: OutlinedButton.styleFrom(
            foregroundColor: t == 'cancel' || t == 'mark_abandoned' ? FobColors.textMuted : null,
          ),
          child: Text(_transitionLabels[t] ?? t),
        ),
        const SizedBox(width: 8),
      ],
    ];
  }

  Future<void> _runTransition(String bookingId, String transition) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await _api.transitionBooking(bookingId, transition);
      await _select(bookingId);
      await _loadAll();
      messenger.showSnackBar(SnackBar(content: Text('Booking ${_transitionLabels[transition]?.toLowerCase() ?? transition}.')));
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Could not update status: $e')));
    }
  }

  Widget _contactRoleChip(String role) {
    final label = switch (role) {
      'leader' => 'Leader',
      'co-leader' => 'Co-leader',
      _ => 'Attendee',
    };
    final strong = role == 'leader' || role == 'co-leader';
    return Text(label,
        style: TextStyle(
          fontSize: 12.5,
          fontWeight: strong ? FontWeight.w600 : FontWeight.w400,
          color: strong ? FobColors.textStrong : FobColors.textMuted,
        ));
  }

  Future<void> _openEditDialog(Map<String, dynamic> booking, List attendees) async {
    final changed = await showDialog<bool>(
      context: context,
      builder: (ctx) => _EditBookingDialog(
        booking: booking,
        attendees: attendees.map((a) => (a as Map).cast<String, dynamic>()).toList(),
      ),
    );
    if (changed == true) {
      await _select('${booking['id']}');
      await _loadAll();
    }
  }

  // ---- helpers -----------------------------------------------------------

  Widget _card({required Widget child, EdgeInsets padding = const EdgeInsets.all(24)}) => Container(
        width: double.infinity,
        padding: padding,
        decoration: BoxDecoration(
          color: FobColors.surfaceCard,
          borderRadius: BorderRadius.circular(FobRadius.card),
          border: Border.all(color: FobColors.hairline),
        ),
        child: child,
      );

  Widget _divider() => const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Divider(height: 1, color: Color(0xFFF2EDDF)),
      );

  Widget _sectionLabel(String s) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(s, style: FobText.microLabel),
      );

  Widget _kv(String label, String value, {String? sub}) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: FobText.microLabel),
          const SizedBox(height: 5),
          Text(value, style: FobText.body),
          if (sub != null) ...[
            const SizedBox(height: 2),
            Text(sub, style: const TextStyle(fontSize: 11, color: FobColors.textFaint)),
          ],
        ],
      );

  Widget _histRow(dynamic ts, String label) {
    if (ts == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 150,
            child: Text(_ts(ts), style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
          ),
          Expanded(child: Text(label, style: FobText.body)),
        ],
      ),
    );
  }

  String _leadName(List attendees, Map booking) {
    for (final a in attendees) {
      final m = (a as Map);
      if (m['is_lead_booker'] == 1) return '${m['name']}';
    }
    if (attendees.isNotEmpty) return '${(attendees.first as Map)['name']}';
    return 'Booking ${_shortRef('${booking['id']}')}';
  }

  String _shortRef(String id) {
    if (id.length <= 8) return id.toUpperCase();
    return id.substring(0, 8).toUpperCase();
  }

  String _ageBand(String b) {
    switch (b) {
      case '18+':
        return 'Adult';
      case '60+':
        return 'Adult 60+';
      case '12-17':
        return '12–17';
      case 'under-12':
        return 'Under 12';
      default:
        return b.isEmpty ? '—' : b;
    }
  }

  String _ts(dynamic iso) {
    if (iso == null) return '—';
    final dt = DateTime.tryParse('$iso');
    if (dt == null) return '$iso';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}, $hh:$mm';
  }
}

const List<String> _ageBands = ['under-12', '12-17', '18+', '60+'];
const List<String> _contactRoles = ['leader', 'co-leader', 'attendee'];

/// A19 edit dialog — REQ-BOOK15 (DR-B12b). Owner directly edits date and
/// attendees/contact roles; no customer round-trip (not consent-bearing,
/// unlike DR-B11's completion link).
class _EditBookingDialog extends StatefulWidget {
  const _EditBookingDialog({required this.booking, required this.attendees});

  final Map<String, dynamic> booking;
  final List<Map<String, dynamic>> attendees;

  @override
  State<_EditBookingDialog> createState() => _EditBookingDialogState();
}

class _AttendeeRow {
  _AttendeeRow({required String name, required this.ageBand, required this.contactRole, this.notes})
      : nameCtrl = TextEditingController(text: name);
  final TextEditingController nameCtrl;
  String ageBand;
  String contactRole;
  String? notes;
}

class _EditBookingDialogState extends State<_EditBookingDialog> {
  late Future<List<dynamic>> _departuresFuture;
  String? _departureId;
  late List<_AttendeeRow> _rows;
  bool _saving = false;
  String? _error;

  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _departuresFuture = _api.getDepartures();
    _departureId = widget.booking['departure_id'] as String?;
    _rows = widget.attendees.isEmpty
        ? [_AttendeeRow(name: '', ageBand: '18+', contactRole: 'leader')]
        : widget.attendees
            .map((a) => _AttendeeRow(
                  name: '${a['name'] ?? ''}',
                  ageBand: '${a['age_band'] ?? '18+'}',
                  contactRole: '${a['contact_role'] ?? (a['is_lead_booker'] == 1 ? 'leader' : 'attendee')}',
                  notes: a['notes'] as String?,
                ))
            .toList();
  }

  @override
  void dispose() {
    for (final r in _rows) {
      r.nameCtrl.dispose();
    }
    super.dispose();
  }

  void _addRow() => setState(() => _rows.add(_AttendeeRow(name: '', ageBand: '18+', contactRole: 'attendee')));

  void _removeRow(int i) => setState(() => _rows.removeAt(i));

  Future<void> _save() async {
    final leaders = _rows.where((r) => r.contactRole == 'leader').length;
    if (leaders != 1) {
      setState(() => _error = 'Exactly one attendee must be the leader.');
      return;
    }
    if (_rows.any((r) => r.nameCtrl.text.trim().isEmpty)) {
      setState(() => _error = 'Every attendee needs a name.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final body = <String, dynamic>{};
      if (_departureId != null && _departureId != widget.booking['departure_id']) {
        body['newDepartureId'] = _departureId;
      }
      body['participants'] = [
        for (final r in _rows)
          {
            'name': r.nameCtrl.text.trim(),
            'age_band': r.ageBand,
            'contact_role': r.contactRole,
            'notes': r.notes,
          },
      ];
      await _api.updateBooking('${widget.booking['id']}', body);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() {
        _saving = false;
        _error = 'Could not save: $e';
      });
    }
  }

  String _departureLabel(Map<String, dynamic> j) {
    final tour = j['tour_id']?.toString() ?? 'Tour';
    return '$tour — ${j['date'] ?? ''} ${j['time'] ?? ''}'.trim();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit booking'),
      content: SizedBox(
        width: 520,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('DEPARTURE', style: FobText.microLabel),
              const SizedBox(height: 6),
              FutureBuilder<List<dynamic>>(
                future: _departuresFuture,
                builder: (context, snap) {
                  final items = (snap.data ?? const [])
                      .map((j) => j as Map<String, dynamic>)
                      .toList();
                  return DropdownButtonFormField<String>(
                    initialValue: _departureId,
                    isExpanded: true,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    items: items
                        .map((j) => DropdownMenuItem<String>(
                              value: j['id']?.toString(),
                              child: Text(_departureLabel(j)),
                            ))
                        .toList(),
                    onChanged: (v) => setState(() => _departureId = v),
                  );
                },
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('ATTENDEES', style: FobText.microLabel),
                  TextButton.icon(
                    onPressed: _addRow,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add attendee'),
                  ),
                ],
              ),
              for (var i = 0; i < _rows.length; i++) _attendeeEditRow(i),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12.5)),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: _saving ? null : () => Navigator.of(context).pop(false), child: const Text('Cancel')),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: Text(_saving ? 'Saving…' : 'Save'),
        ),
      ],
    );
  }

  Widget _attendeeEditRow(int i) {
    final r = _rows[i];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: TextField(
              controller: r.nameCtrl,
              decoration: const InputDecoration(labelText: 'Name', isDense: true, border: OutlineInputBorder()),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: DropdownButtonFormField<String>(
              initialValue: r.ageBand,
              decoration: const InputDecoration(labelText: 'Age band', isDense: true, border: OutlineInputBorder()),
              items: [for (final b in _ageBands) DropdownMenuItem(value: b, child: Text(b))],
              onChanged: (v) => setState(() => r.ageBand = v ?? '18+'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: DropdownButtonFormField<String>(
              initialValue: r.contactRole,
              decoration: const InputDecoration(labelText: 'Role', isDense: true, border: OutlineInputBorder()),
              items: [for (final role in _contactRoles) DropdownMenuItem(value: role, child: Text(role))],
              onChanged: (v) => setState(() => r.contactRole = v ?? 'attendee'),
            ),
          ),
          IconButton(
            onPressed: _rows.length > 1 ? () => _removeRow(i) : null,
            icon: const Icon(Icons.close, size: 18),
            tooltip: 'Remove attendee',
          ),
        ],
      ),
    );
  }
}
