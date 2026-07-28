import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../../../injection_container.dart';
import '../../../../widgets/status_types.dart' show ReadinessSub;
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_modal.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/filter_chip_row.dart';
import '../../../../widgets/readiness_badge.dart';
import '../../../../widgets/status_pill.dart';
import '../../../bookings/domain/entities/booking_detail.dart';
import '../../../bookings/domain/usecases/get_booking_detail.dart';
import '../../domain/entities/departure.dart';
import '../../domain/entities/departure_detail.dart';
import '../../domain/usecases/scheduling_usecases.dart';
import '../bloc/calendar_bloc.dart';

/// Map the domain readiness enum to the shared ReadinessBadge UI enum.
ReadinessSub _sub(Readiness r) => switch (r) {
      Readiness.yes => ReadinessSub.yes,
      Readiness.partial => ReadinessSub.partial,
      Readiness.no => ReadinessSub.no,
    };

/// A17 — Departure calendar. Dual view + drill-down (UXD-08), readiness (UXD-07).
class CalendarPage extends StatelessWidget {
  const CalendarPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<CalendarBloc>(
      create: (_) => sl<CalendarBloc>()..add(const LoadCalendarEvent()),
      child: const _CalendarView(),
    );
  }
}

class _CalendarView extends StatelessWidget {
  const _CalendarView();

  void _openDeparture(BuildContext context, Departure d) {
    showFobModal(context: context, blocking: false, builder: (ctx) => _DepartureOverlay(departure: d));
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CalendarBloc, CalendarState>(
      builder: (context, state) {
        final bloc = context.read<CalendarBloc>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Departure calendar', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Row(
              children: [
                FobFilterChip(label: 'List', active: state.view == CalendarView.list, onTap: () => bloc.add(const SetCalendarViewEvent(CalendarView.list))),
                const SizedBox(width: 8),
                FobFilterChip(label: 'Calendar', active: state.view == CalendarView.calendar, onTap: () => bloc.add(const SetCalendarViewEvent(CalendarView.calendar))),
              ],
            ),
            const SizedBox(height: FobSpace.card),
            if (state.view == CalendarView.list)
              Card(
                child: FobDataTable<Departure>(
                  loading: state.loading,
                  emptyText: 'No departures scheduled in this range.',
                  rows: state.departures,
                  onRowTap: (d) => _openDeparture(context, d),
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
                          ReadinessBadge(label: 'Bikes', state: _sub(d.bikesReadiness)),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else
              _MonthCalendar(departures: state.departures, onDepartureTap: (d) => _openDeparture(context, d)),
          ],
        );
      },
    );
  }
}

class _DepartureOverlay extends StatefulWidget {
  final Departure departure;
  const _DepartureOverlay({required this.departure});

  @override
  State<_DepartureOverlay> createState() => _DepartureOverlayState();
}

class _DepartureOverlayState extends State<_DepartureOverlay> {
  DepartureDetail? _detail;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await sl<GetDeparture>()(widget.departure.id);
    if (mounted) setState(() { _detail = r.valueOrNull; _loading = false; });
  }

  static String monthName(int m) => const ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(m - 1).clamp(0, 11)];

  String _ageBand(String b) => switch (b) {
        '18+' => 'Adult',
        '60+' => 'Adult 60+',
        '12-17' => '12–17',
        'under-12' => 'Under 12',
        _ => b.isEmpty ? '' : b,
      };

  void _openParticipant(String bookingId, DepartureParticipant p) {
    showFobModal(context: context, blocking: false, builder: (ctx) => _ParticipantOverlay(bookingId: bookingId, participant: p, ageBand: _ageBand(p.ageBand)));
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.departure;
    final detail = _detail;
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 460, maxHeight: 560),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('DEPARTURE', style: FobText.microLabel),
          const SizedBox(height: 4),
          Text(d.tourName, style: const TextStyle(fontFamily: FobText.sans, fontSize: 22, fontWeight: FontWeight.w600, letterSpacing: -0.2, color: FobColors.textStrong)),
          const SizedBox(height: 3),
          Text('${d.dateTime.day} ${monthName(d.dateTime.month)} ${d.dateTime.year}'
              '${detail?.time != null ? ' · ${detail!.time}' : ''}',
              style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text('${d.bookedCount}/${d.capacity} booked', style: FobText.body),
              const SizedBox(width: 12),
              Text(detail?.guideName != null ? 'Guide: ${detail!.guideName}' : 'No guide assigned',
                  style: TextStyle(fontSize: 12.5, color: detail?.guideName != null ? FobColors.textMuted : FobColors.orangeText)),
            ],
          ),
          const Padding(padding: EdgeInsets.symmetric(vertical: 14), child: Divider(height: 1, color: FobColors.hairlineWarm)),
          Text('BOOKINGS', style: FobText.microLabel),
          const SizedBox(height: 8),
          if (_loading)
            const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator()))
          else if (detail == null || detail.bookings.isEmpty)
            const Text('No bookings on this departure yet.', style: FobText.body)
          else
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: detail.bookings.map((b) {
                    final ppl = detail.participantsFor(b.id);
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
                              Expanded(child: Text(b.leadName, style: const TextStyle(fontFamily: FobText.sans, fontWeight: FontWeight.w600, fontSize: 15, color: FobColors.textStrong))),
                              PillLabel.forStatus(b.status),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ...ppl.map((p) => InkWell(
                                borderRadius: BorderRadius.circular(FobRadius.field),
                                onTap: () => _openParticipant(b.id, p),
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
                                      Expanded(child: Text(p.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: FobColors.textStrong))),
                                      Text(_ageBand(p.ageBand), style: const TextStyle(fontSize: 12, color: FobColors.textMuted)),
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

/// UXD-08 second overlay — read-only participant detail. Emergency contact +
/// consent are per-booking, fetched via the bookings GetBookingDetail use case.
class _ParticipantOverlay extends StatefulWidget {
  final String bookingId;
  final DepartureParticipant participant;
  final String ageBand;
  const _ParticipantOverlay({required this.bookingId, required this.participant, required this.ageBand});

  @override
  State<_ParticipantOverlay> createState() => _ParticipantOverlayState();
}

class _ParticipantOverlayState extends State<_ParticipantOverlay> {
  BookingDetail? _booking;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await sl<GetBookingDetail>()(widget.bookingId);
    if (mounted) setState(() { _booking = r.valueOrNull; _loading = false; });
  }

  String _ts(DateTime? dt) {
    if (dt == null) return 'Not recorded';
    return '${dt.day} ${_DepartureOverlayState.monthName(dt.month)} ${dt.year}';
  }

  Widget _kv(String label, String value) => FobKeyValue(label, value, bottomGap: 12);

  @override
  Widget build(BuildContext context) {
    final p = widget.participant;
    final ec = _booking?.emergencyContact;
    final consent = _booking?.consent;
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 420, maxHeight: 520),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('PARTICIPANT', style: FobText.microLabel),
          const SizedBox(height: 4),
          Text(p.name, style: const TextStyle(fontFamily: FobText.sans, fontSize: 20, fontWeight: FontWeight.w600, letterSpacing: -0.2, color: FobColors.textStrong)),
          const SizedBox(height: 3),
          Text(p.role == 'leader' ? 'Leader (main contact)' : p.role == 'co-leader' ? 'Co-leader' : 'Attendee',
              style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
          const Padding(padding: EdgeInsets.symmetric(vertical: 14), child: Divider(height: 1, color: FobColors.hairlineWarm)),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _kv('AGE BAND', widget.ageBand.isEmpty ? '—' : widget.ageBand)),
              Expanded(child: _kv('REQUIREMENTS', (p.notes == null || p.notes!.isEmpty) ? 'None noted' : p.notes!)),
            ],
          ),
          if (_loading)
            const Padding(padding: EdgeInsets.all(12), child: Center(child: CircularProgressIndicator()))
          else ...[
            _kv('EMERGENCY CONTACT (booking)',
                ec == null ? 'Not recorded' : '${ec.name} · ${ec.phone}${ec.relationship != null ? ' (${ec.relationship})' : ''}'),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _kv('WAIVER', _ts(consent?.waiverAcceptedAt))),
                Expanded(child: _kv('TERMS', _ts(consent?.termsAcceptedAt))),
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

/// Month calendar with real month/year navigation, event markers per departure,
/// and a selected-day departures panel.
class _MonthCalendar extends StatefulWidget {
  final List<Departure> departures;
  final void Function(Departure) onDepartureTap;
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
    _focusedDay = widget.departures.isNotEmpty ? widget.departures.first.dateTime : DateTime.now();
  }

  bool _sameDay(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

  List<Departure> _eventsFor(DateTime day) => widget.departures.where((d) => _sameDay(d.dateTime, day)).toList();

  @override
  Widget build(BuildContext context) {
    final selected = _selectedDay;
    final dayList = selected == null ? const <Departure>[] : _eventsFor(selected);
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
          child: TableCalendar<Departure>(
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
              titleTextStyle: const TextStyle(fontFamily: FobText.sans, fontSize: 20, fontWeight: FontWeight.w600, letterSpacing: -0.2, color: FobColors.textStrong),
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
              todayDecoration: const BoxDecoration(color: FobColors.surfaceBgLo, shape: BoxShape.circle),
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
                              Expanded(child: Text(d.tourName, style: const TextStyle(fontFamily: FobText.sans, fontWeight: FontWeight.w600, fontSize: 15, color: FobColors.textStrong))),
                              Text('${d.bookedCount}/${d.capacity}', style: const TextStyle(fontFamily: FobText.mono, fontSize: 12, color: FobColors.textMuted)),
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
