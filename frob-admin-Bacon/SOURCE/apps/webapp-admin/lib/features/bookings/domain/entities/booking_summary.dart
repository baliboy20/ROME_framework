import 'package:equatable/equatable.dart';

/// A19 booking-browser list row (BO05).
class BookingSummary extends Equatable {
  final String id;
  final String customerName;
  final String tourName;
  final String date;
  final String status;
  final int partySize;
  final int paidPence;

  const BookingSummary({
    required this.id,
    required this.customerName,
    required this.tourName,
    required this.date,
    required this.status,
    required this.partySize,
    required this.paidPence,
  });

  bool matches(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return true;
    return customerName.toLowerCase().contains(q) ||
        tourName.toLowerCase().contains(q) ||
        status.toLowerCase().contains(q) ||
        date.toLowerCase().contains(q) ||
        id.toLowerCase().contains(q);
  }

  @override
  List<Object?> get props => [id, customerName, tourName, date, status, partySize, paidPence];
}

/// Lightweight departure option for the new-booking / edit pickers.
class DepartureSlot extends Equatable {
  final String id;
  final String tourId;
  final String date;
  final String time;
  const DepartureSlot({required this.id, required this.tourId, required this.date, required this.time});

  String get label => '$tourId — $date $time'.trim();

  @override
  List<Object?> get props => [id, tourId, date, time];
}
