import 'package:equatable/equatable.dart';

/// A20 departure picker option (for the allocation screen). A lightweight view
/// of a departure — the scheduling feature owns the full Departure entity.
class DepartureOption extends Equatable {
  final String id;
  final String tourId;
  final String date;
  final String time;
  final int confirmedCount;

  const DepartureOption({
    required this.id,
    required this.tourId,
    required this.date,
    required this.time,
    required this.confirmedCount,
  });

  @override
  List<Object?> get props => [id, tourId, date, time, confirmedCount];
}
