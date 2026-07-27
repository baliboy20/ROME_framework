import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/usecases/usecase.dart';
import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../domain/entities/booking_detail.dart';
import '../../domain/entities/booking_summary.dart';
import '../../domain/usecases/booking_usecases.dart';
import '../bloc/bookings_bloc.dart';

const List<String> _ageBands = ['under-12', '12-17', '18+', '60+'];
const List<String> _contactRoles = ['leader', 'co-leader', 'attendee'];

String _roleToString(AttendeeRole r) => switch (r) {
      AttendeeRole.leader => 'leader',
      AttendeeRole.coLeader => 'co-leader',
      AttendeeRole.attendee => 'attendee',
    };

String _shortRef(String id) => id.length <= 8 ? id.toUpperCase() : id.substring(0, 8).toUpperCase();

// ---- status transitions (relocated off A19 Detail, REQ-BOOK16) ----
const Map<String, List<String>> _validTransitions = {
  'draft': ['confirm', 'cancel', 'mark_abandoned'],
  'confirmed': ['cancel'],
  'provisionally-confirmed': ['confirm', 'cancel'],
};
const Map<String, String> _transitionLabels = {
  'confirm': 'Confirm',
  'cancel': 'Cancel',
  'mark_abandoned': 'Mark abandoned',
};

/// A23 — Edit booking. Hosts the owner-assisted edit form (REQ-BOOK15) and the
/// status-transition buttons (REQ-BOOK16), both relocated off A19 Detail.
/// Saving or transitioning returns to `/bookings/:id`.
class EditBookingPage extends StatelessWidget {
  const EditBookingPage({super.key, required this.bookingId});
  final String bookingId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<BookingsBloc>(
      create: (_) => sl<BookingsBloc>()..add(SelectBookingEvent(bookingId)),
      child: _EditView(bookingId: bookingId),
    );
  }
}

class _EditView extends StatelessWidget {
  const _EditView({required this.bookingId});
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
            Text('A23 · BOOKINGS & PAYMENTS', style: FobText.microLabel),
            const SizedBox(height: 4),
            const Text('Edit booking', style: FobText.pageTitle),
            const SizedBox(height: 6),
            const Text(
              'Change departure date and the attendee list/contact roles (REQ-BOOK15); '
              'apply a constrained status transition (REQ-BOOK16). Saving or transitioning '
              'returns to the booking record.',
              style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5),
            ),
            TextButton.icon(
              onPressed: () => context.go('/bookings/$bookingId'),
              icon: const Icon(Icons.arrow_back, size: 16),
              label: Text('Back to booking ${_shortRef(bookingId)}'),
              style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
            ),
            const SizedBox(height: FobSpace.block),
            if (state.detailLoading || d == null)
              FobCard(child: SizedBox(height: 260, child: Center(child: state.detailLoading ? const CircularProgressIndicator() : const Text('Booking not found.', style: FobText.body))))
            else
              _EditForm(key: ValueKey(d.id), booking: d),
          ],
        );
      },
    );
  }
}

class _EditForm extends StatefulWidget {
  const _EditForm({super.key, required this.booking});
  final BookingDetail booking;

  @override
  State<_EditForm> createState() => _EditFormState();
}

class _AttendeeRow {
  _AttendeeRow({
    required String name,
    required this.ageBand,
    required this.contactRole,
    this.notes,
    String? email,
    this.notifyOptedIn = true,
  })  : nameCtrl = TextEditingController(text: name),
        emailCtrl = TextEditingController(text: email ?? '');
  final TextEditingController nameCtrl;
  final TextEditingController emailCtrl;
  String ageBand;
  String contactRole;
  String? notes;
  bool notifyOptedIn;
}

class _EditFormState extends State<_EditForm> {
  late final Future<List<DepartureSlot>> _departuresFuture = _loadDepartures();
  String? _departureId;
  late List<_AttendeeRow> _rows;
  bool _saving = false;
  String? _error;

  Future<List<DepartureSlot>> _loadDepartures() async =>
      (await sl<GetBookingDepartures>()(const NoParams())).valueOrNull ?? const [];

  @override
  void initState() {
    super.initState();
    _departureId = widget.booking.departureId;
    _rows = widget.booking.attendees.isEmpty
        ? [_AttendeeRow(name: '', ageBand: '18+', contactRole: 'leader')]
        : widget.booking.attendees
            .map((a) => _AttendeeRow(
                  name: a.name,
                  ageBand: a.ageBand,
                  contactRole: _roleToString(a.role),
                  notes: a.notes,
                  email: a.email,
                  notifyOptedIn: a.notifyOptedIn,
                ))
            .toList();
  }

  @override
  void dispose() {
    for (final r in _rows) {
      r.nameCtrl.dispose();
      r.emailCtrl.dispose();
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
    final body = <String, dynamic>{};
    if (_departureId != null && _departureId != widget.booking.departureId) {
      body['newDepartureId'] = _departureId;
    }
    body['participants'] = [
      for (final r in _rows)
        {
          'name': r.nameCtrl.text.trim(),
          'age_band': r.ageBand,
          'contact_role': r.contactRole,
          'notes': r.notes,
          if (r.emailCtrl.text.trim().isNotEmpty) 'email': r.emailCtrl.text.trim(),
          // Notify opt-in only meaningful for co-leaders (a leader is always notified).
          'notify_opted_in': r.contactRole == 'co-leader' ? r.notifyOptedIn : true,
        },
    ];
    final result = await sl<UpdateBooking>()(UpdateBookingParams(widget.booking.id, body));
    result.fold(
      (f) => setState(() {
        _saving = false;
        _error = 'Could not save: ${f.message}';
      }),
      (_) {
        if (mounted) context.go('/bookings/${widget.booking.id}');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return FobCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_shortRef(widget.booking.id), style: FobText.microLabel),
          const SizedBox(height: 6),
          FobSectionLabel('DEPARTURE'),
          FutureBuilder<List<DepartureSlot>>(
            future: _departuresFuture,
            builder: (context, snap) {
              final items = snap.data ?? const <DepartureSlot>[];
              return DropdownButtonFormField<String>(
                initialValue: _departureId,
                isExpanded: true,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: items.map((d) => DropdownMenuItem<String>(value: d.id, child: Text(d.label))).toList(),
                onChanged: (v) => setState(() => _departureId = v),
              );
            },
          ),
          const FobDivider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('ATTENDEES & CONTACT ROLES', style: FobText.microLabel),
              TextButton.icon(onPressed: _addRow, icon: const Icon(Icons.add, size: 16), label: const Text('Add attendee')),
            ],
          ),
          for (var i = 0; i < _rows.length; i++) _attendeeEditRow(i),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: FobColors.error, fontSize: 12.5)),
          ],
          const FobDivider(),
          FobSectionLabel('STATUS TRANSITION'),
          Row(children: _statusTransitionButtons(context, widget.booking.status, widget.booking.id)),
          const SizedBox(height: FobSpace.card),
          Row(
            children: [
              FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving…' : 'Save')),
              const SizedBox(width: 8),
              OutlinedButton(onPressed: _saving ? null : () => context.go('/bookings/${widget.booking.id}'), child: const Text('Cancel')),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _statusTransitionButtons(BuildContext context, String status, String bookingId) {
    final transitions = _validTransitions[status] ?? const [];
    return [
      for (final t in transitions) ...[
        OutlinedButton(
          onPressed: () async {
            final bloc = context.read<BookingsBloc>();
            bloc.add(TransitionBookingEvent(bookingId, t));
            await bloc.stream.firstWhere((s) => s.notice != null).timeout(
                  const Duration(seconds: 5),
                  onTimeout: () => bloc.state,
                );
            if (context.mounted) context.go('/bookings/$bookingId');
          },
          style: OutlinedButton.styleFrom(foregroundColor: t == 'cancel' || t == 'mark_abandoned' ? FobColors.textMuted : null),
          child: Text(_transitionLabels[t] ?? t),
        ),
        const SizedBox(width: 8),
      ],
    ];
  }

  Widget _attendeeEditRow(int i) {
    final r = _rows[i];
    final isCoLeader = r.contactRole == 'co-leader';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 3,
                child: TextField(controller: r.nameCtrl, decoration: const InputDecoration(labelText: 'Name', isDense: true, border: OutlineInputBorder())),
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
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: TextField(
                  controller: r.emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email (for notifications)', isDense: true, border: OutlineInputBorder()),
                ),
              ),
              const SizedBox(width: 8),
              // A leader is always notified; only a co-leader carries the opt-in (F-18/DR-19).
              Expanded(
                flex: 4,
                child: isCoLeader
                    ? SwitchListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        value: r.notifyOptedIn,
                        title: const Text('Notify this co-leader', style: TextStyle(fontSize: 12.5)),
                        onChanged: (v) => setState(() => r.notifyOptedIn = v),
                      )
                    : const Padding(
                        padding: EdgeInsets.only(top: 12),
                        child: Text('Always notified', style: TextStyle(fontSize: 12, color: FobColors.textMuted)),
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
