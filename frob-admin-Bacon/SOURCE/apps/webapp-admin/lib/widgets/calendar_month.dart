import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import 'readiness_badge.dart';

/// CalendarMonth — month grid, tone-coded day chips for departures (UXD-08).
class CalendarMonth extends StatelessWidget {
  final DateTime month;
  final List<DepartureRow> departures;
  final void Function(DepartureRow) onChipTap;

  const CalendarMonth({super.key, required this.month, required this.departures, required this.onChipTap});

  @override
  Widget build(BuildContext context) {
    final first = DateTime(month.year, month.month, 1);
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    final leadingBlanks = (first.weekday % 7); // Sunday-first grid

    final byDay = <int, List<DepartureRow>>{};
    for (final d in departures) {
      if (d.dateTime.year == month.year && d.dateTime.month == month.month) {
        byDay.putIfAbsent(d.dateTime.day, () => []).add(d);
      }
    }

    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return Column(
      children: [
        Row(
          children: weekdayLabels
              .map((w) => Expanded(child: Center(child: Text(w, style: FobText.microLabel))))
              .toList(),
        ),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            childAspectRatio: 1.1,
          ),
          itemCount: leadingBlanks + daysInMonth,
          itemBuilder: (ctx, i) {
            if (i < leadingBlanks) return const SizedBox.shrink();
            final day = i - leadingBlanks + 1;
            final events = byDay[day] ?? [];
            return Container(
              margin: const EdgeInsets.all(2),
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                border: Border.all(color: FobColors.hairline),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$day', style: const TextStyle(fontSize: 11, color: FobColors.textMuted)),
                  ...events.take(2).map((e) => InkWell(
                        // InkWell (not GestureDetector) so web gets a click
                        // cursor + hover highlight on day chips.
                        onTap: () => onChipTap(e),
                        borderRadius: BorderRadius.circular(FobRadius.pill),
                        child: Container(
                          margin: const EdgeInsets.only(top: 2),
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              ReadinessDot(tone: e.readinessDot),
                              const SizedBox(width: 3),
                              Flexible(
                                child: Text(e.tourName,
                                    style: const TextStyle(fontSize: 9.5), overflow: TextOverflow.ellipsis),
                              ),
                            ],
                          ),
                        ),
                      )),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
