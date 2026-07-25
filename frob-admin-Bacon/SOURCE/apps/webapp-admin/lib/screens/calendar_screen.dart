import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:table_calendar/table_calendar.dart';
import '../api/api_client.dart';
import '../bloc/calendar_cubit.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/app_modal.dart';
import '../widgets/status_pill.dart';
import '../widgets/fob_primitives.dart';
import '../widgets/filter_chip_row.dart';
import '../widgets/fob_data_table.dart';
import '../widgets/readiness_badge.dart';

/// A17 — Departure calendar. Dual view + drill-down (UXD-08), readiness (UXD-07).
class CalendarScreen extends StatelessWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) => CalendarCubit(context.read())..load(),
      child: const _CalendarView(),
    );
  }
}

class _CalendarView extends StatelessWidget {
  const _CalendarView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CalendarCubit, CalendarState>(
      builder: (context, state) {
        final cubit = context.read<CalendarCubit>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Departure calendar', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Row(
              children: [
                FobFilterChip(label: 'List', active: state.view == CalendarView.list, onTap: () => cubit.setView(CalendarView.list)),
                const SizedBox(width: 8),
                FobFilterChip(label: 'Calendar', active: state.view == CalendarView.calendar, onTap: () => cubit.setView(CalendarView.calendar)),
              ],
            ),
            const SizedBox(height: FobSpace.card),
            if (state.view == CalendarView.list)
              Card(
                child: FobDataTable<DepartureRow>(
                  loading: state.loading,
                  emptyText: 'No departures scheduled in this range.',
                  rows: state.departures,
                  onRowTap: (d) => _openDeparture(context, cubit, d),
                  columns: [
                    FobColumn(label: 'Tour', flex: 2, render: (d) => Text(d.tourName, style: FobText.body)),
                    FobColumn(label: 'Date', render: (d) => Text('${d.dateTime.day}/${d.dateTime.month}/${d.dateTime.year}', style: FobText.body)),
                    FobColumn(
                      label: 'Readiness',
                      flex: 2,
                      render: (d) => Row(
                        children: [
                          ReadinessDot(tone: d.readinessDot),
                          const SizedBox(width: 6),
                          ReadinessBadge(label: 'Guide', state: d.hasGuide ? ReadinessSub.yes : ReadinessSub.no),
                          ReadinessBadge(label: 'Bikes', state: d.bikesReadiness),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else
              _MonthCalendar(
                departures: state.departures,
                onDepartureTap: (d) => _openDeparture(context, cubit, d),
              ),
          ],
        );
      },
    );
  }

  void _openDeparture(BuildContext context, CalendarCubit cubit, DepartureRow d) {
    // UXD-08 / UXC-MOD-3: informational overlay, dismisses freely.
    showFobModal(
      context: context,
      blocking: false,
      builder: (ctx) => _DepartureOverlay(departure: d),
    );
  }
}

class _DepartureOverlay extends StatefulWidget {
  final DepartureRow departure;
  const _DepartureOverlay({required this.departure});

  @override
  State<_DepartureOverlay> createState() => _DepartureOverlayState();
}

class _DepartureOverlayState extends State<_DepartureOverlay> {
  Map<String, dynamic>? _detail;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await context.read<ApiClient>().getDeparture(widget.departure.id);
      if (mounted) setState(() { _detail = d; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _ageBand(String b) => switch (b) {
        '18+' => 'Adult',
        '60+' => 'Adult 60+',
        '12-17' => '12–17',
        'under-12' => 'Under 12',
        _ => b.isEmpty ? '' : b,
      };

  static String _monthName(int m) => const [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ][(m - 1).clamp(0, 11)];

  // UXD-08: second overlay — participant detail (age band, requirements,
  // emergency contact, consent). Emergency contact + consent are per-booking.
  void _openParticipant(Map<String, dynamic> booking, Map<String, dynamic> participant) {
    showFobModal(
      context: context,
      blocking: false,
      builder: (ctx) => _ParticipantOverlay(bookingId: '${booking['id']}', participant: participant),
    );
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.departure;
    final dep = (_detail?['departure'] as Map?)?.cast<String, dynamic>() ?? {};
    final bookings = (_detail?['bookings'] as List?) ?? const [];
    final participants = (_detail?['participants'] as List?) ?? const [];

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 460, maxHeight: 560),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('DEPARTURE', style: FobText.microLabel),
          const SizedBox(height: 4),
          Text(d.tourName, style: const TextStyle(fontFamily: FobText.serif, fontSize: 22, fontWeight: FontWeight.w600, color: FobColors.textStrong)),
          const SizedBox(height: 3),
          Text('${d.dateTime.day} ${_monthName(d.dateTime.month)} ${d.dateTime.year}'
              '${dep['time'] != null ? ' · ${dep['time']}' : ''}',
              style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text('${d.bookedCount}/${d.capacity} booked', style: FobText.body),
              const SizedBox(width: 12),
              Text(dep['guide_name'] != null ? 'Guide: ${dep['guide_name']}' : 'No guide assigned',
                  style: TextStyle(fontSize: 12.5, color: dep['guide_name'] != null ? FobColors.textMuted : FobColors.orangeText)),
            ],
          ),
          const Padding(padding: EdgeInsets.symmetric(vertical: 14), child: Divider(height: 1, color: FobColors.hairlineWarm)),
          Text('BOOKINGS', style: FobText.microLabel),
          const SizedBox(height: 8),
          if (_loading)
            const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator()))
          else if (bookings.isEmpty)
            const Text('No bookings on this departure yet.', style: FobText.body)
          else
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: bookings.map((b) {
                    final m = (b as Map).cast<String, dynamic>();
                    final ppl = participants
                        .map((p) => (p as Map).cast<String, dynamic>())
                        .where((p) => p['booking_id'] == m['id'])
                        .toList();
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: FobColors.surfaceRaised,
                        borderRadius: BorderRadius.circular(FobRadius.field),
                        border: Border.all(color: FobColors.hairlineWarm),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text('${m['lead_name'] ?? 'Booking ${m['id']}'}',
                                    style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 15, color: FobColors.textStrong)),
                              ),
                              PillLabel.forStatus('${m['status'] ?? ''}'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          // Tappable participant rows → participant detail overlay.
                          ...ppl.map((p) => InkWell(
                                borderRadius: BorderRadius.circular(FobRadius.field),
                                onTap: () => _openParticipant(m, p),
                                child: Container(
                                  margin: const EdgeInsets.only(top: 4),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: FobColors.surfaceCard,
                                    borderRadius: BorderRadius.circular(FobRadius.field),
                                    border: Border.all(color: FobColors.hairlineWarm),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text('${p['name']}',
                                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: FobColors.textStrong)),
                                      ),
                                      Text(_ageBand('${p['age_band'] ?? ''}'),
                                          style: const TextStyle(fontSize: 12, color: FobColors.textMuted)),
                                      const SizedBox(width: 6),
                                      const Icon(Icons.chevron_right, size: 16, color: FobColors.textFaint),
                                    ],
                                  ),
                                ),
                              )),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// UXD-08 second overlay — read-only participant detail. Age band +
/// requirements come from the participant row; emergency contact + consent are
/// per-booking, fetched via GET /admin/bookings/:id.
class _ParticipantOverlay extends StatefulWidget {
  final String bookingId;
  final Map<String, dynamic> participant;
  const _ParticipantOverlay({required this.bookingId, required this.participant});

  @override
  State<_ParticipantOverlay> createState() => _ParticipantOverlayState();
}

class _ParticipantOverlayState extends State<_ParticipantOverlay> {
  Map<String, dynamic>? _booking;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await context.read<ApiClient>().getBooking(widget.bookingId);
      if (mounted) setState(() { _booking = d; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _ageBand(String b) => switch (b) {
        '18+' => 'Adult',
        '60+' => 'Adult 60+',
        '12-17' => '12–17',
        'under-12' => 'Under 12',
        _ => b.isEmpty ? '—' : b,
      };

  String _ts(dynamic iso) {
    if (iso == null) return 'Not recorded';
    final dt = DateTime.tryParse('$iso');
    if (dt == null) return '$iso';
    return '${dt.day} ${_DepartureOverlayState._monthName(dt.month)} ${dt.year}';
  }

  Widget _kv(String label, String value) => FobKeyValue(label, value, bottomGap: 12);

  @override
  Widget build(BuildContext context) {
    final p = widget.participant;
    final ec = (_booking?['emergency_contact'] as Map?)?.cast<String, dynamic>() ?? {};
    final consent = (_booking?['consent'] as Map?)?.cast<String, dynamic>() ?? {};
    final role = '${p['contact_role'] ?? (p['is_lead_booker'] == 1 ? 'leader' : 'attendee')}';

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 420, maxHeight: 520),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('PARTICIPANT', style: FobText.microLabel),
          const SizedBox(height: 4),
          Text('${p['name'] ?? ''}',
              style: const TextStyle(fontFamily: FobText.serif, fontSize: 20, fontWeight: FontWeight.w600, color: FobColors.textStrong)),
          const SizedBox(height: 3),
          Text(role == 'leader' ? 'Leader (main contact)' : role == 'co-leader' ? 'Co-leader' : 'Attendee',
              style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
          const Padding(padding: EdgeInsets.symmetric(vertical: 14), child: Divider(height: 1, color: FobColors.hairlineWarm)),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _kv('AGE BAND', _ageBand('${p['age_band'] ?? ''}'))),
              Expanded(child: _kv('REQUIREMENTS', p['notes'] == null || '${p['notes']}'.isEmpty ? 'None noted' : '${p['notes']}')),
            ],
          ),
          if (_loading)
            const Padding(padding: EdgeInsets.all(12), child: Center(child: CircularProgressIndicator()))
          else ...[
            _kv('EMERGENCY CONTACT (booking)',
                (ec['name'] == null) ? 'Not recorded' : '${ec['name']} · ${ec['phone'] ?? ''}${ec['relationship'] != null ? ' (${ec['relationship']})' : ''}'),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _kv('WAIVER', _ts(consent['waiver_accepted_at']))),
                Expanded(child: _kv('TERMS', _ts(consent['terms_accepted_at']))),
              ],
            ),
          ],
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Close')),
          ),
        ],
      ),
    );
  }
}

/// Month calendar with real month/year navigation (table_calendar), event
/// markers per departure, and a selected-day departures panel.
class _MonthCalendar extends StatefulWidget {
  final List<DepartureRow> departures;
  final void Function(DepartureRow) onDepartureTap;
  const _MonthCalendar({required this.departures, required this.onDepartureTap});

  @override
  State<_MonthCalendar> createState() => _MonthCalendarState();
}

class _MonthCalendarState extends State<_MonthCalendar> {
  late DateTime _focusedDay;
  DateTime? _selectedDay;

  @override
  void initState() {
    super.initState();
    // Focus the month of the first upcoming departure, else today.
    _focusedDay = widget.departures.isNotEmpty
        ? widget.departures.first.dateTime
        : DateTime.now();
  }

  bool _sameDay(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

  List<DepartureRow> _eventsFor(DateTime day) =>
      widget.departures.where((d) => _sameDay(d.dateTime, day)).toList();

  @override
  Widget build(BuildContext context) {
    final selected = _selectedDay;
    final dayList = selected == null ? const <DepartureRow>[] : _eventsFor(selected);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: FobColors.surfaceCard,
            borderRadius: BorderRadius.circular(FobRadius.card),
            border: Border.all(color: FobColors.hairline),
          ),
          padding: const EdgeInsets.all(FobSpace.card),
          child: TableCalendar<DepartureRow>(
            firstDay: DateTime.utc(2020, 1, 1),
            lastDay: DateTime.utc(2035, 12, 31),
            focusedDay: _focusedDay,
            selectedDayPredicate: (d) => selected != null && _sameDay(d, selected),
            eventLoader: _eventsFor,
            startingDayOfWeek: StartingDayOfWeek.sunday,
            availableCalendarFormats: const {CalendarFormat.month: 'Month'},
            onDaySelected: (sel, foc) => setState(() {
              _selectedDay = sel;
              _focusedDay = foc;
            }),
            onPageChanged: (foc) => _focusedDay = foc,
            headerStyle: HeaderStyle(
              formatButtonVisible: false,
              titleCentered: false,
              titleTextStyle: const TextStyle(
                  fontFamily: FobText.serif, fontSize: 20, fontWeight: FontWeight.w600, color: FobColors.textStrong),
              leftChevronIcon: const Icon(Icons.chevron_left, color: FobColors.textMuted),
              rightChevronIcon: const Icon(Icons.chevron_right, color: FobColors.textMuted),
              headerPadding: const EdgeInsets.only(bottom: 12),
            ),
            daysOfWeekStyle: const DaysOfWeekStyle(
              weekdayStyle: TextStyle(fontFamily: FobText.mono, fontSize: 10, color: FobColors.textLabel),
              weekendStyle: TextStyle(fontFamily: FobText.mono, fontSize: 10, color: FobColors.textLabel),
            ),
            calendarStyle: CalendarStyle(
              outsideDaysVisible: false,
              defaultTextStyle: const TextStyle(fontFamily: FobText.mono, fontSize: 12, color: FobColors.textBody),
              weekendTextStyle: const TextStyle(fontFamily: FobText.mono, fontSize: 12, color: FobColors.textBody),
              todayDecoration: BoxDecoration(
                color: FobColors.surfaceBgLo,
                shape: BoxShape.circle,
              ),
              todayTextStyle: const TextStyle(fontFamily: FobText.mono, fontSize: 12, color: FobColors.textStrong),
              selectedDecoration: const BoxDecoration(color: FobColors.pink, shape: BoxShape.circle),
              selectedTextStyle: const TextStyle(fontFamily: FobText.mono, fontSize: 12, color: Colors.white, fontWeight: FontWeight.w700),
              markerDecoration: const BoxDecoration(color: FobColors.cyan, shape: BoxShape.circle),
              markersMaxCount: 3,
            ),
          ),
        ),
        if (selected != null) ...[
          const SizedBox(height: FobSpace.card),
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: FobColors.surfaceCard,
              borderRadius: BorderRadius.circular(FobRadius.card),
              border: Border.all(color: FobColors.hairline),
            ),
            padding: const EdgeInsets.all(FobSpace.card),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('DEPARTURES · ${selected.day}/${selected.month}/${selected.year}', style: FobText.microLabel),
                const SizedBox(height: 10),
                if (dayList.isEmpty)
                  const Text('No departures on this day.', style: FobText.body)
                else
                  ...dayList.map((d) => InkWell(
                        onTap: () => widget.onDepartureTap(d),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            children: [
                              ReadinessDot(tone: d.readinessDot),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(d.tourName,
                                    style: const TextStyle(
                                        fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 15, color: FobColors.textStrong)),
                              ),
                              Text('${d.bookedCount}/${d.capacity}',
                                  style: const TextStyle(fontFamily: FobText.mono, fontSize: 12, color: FobColors.textMuted)),
                            ],
                          ),
                        ),
                      )),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
