import 'package:equatable/equatable.dart';

/// A18 scheduler guide picker option.
class GuideOption extends Equatable {
  final String id;
  final String name;
  const GuideOption({required this.id, required this.name});
  @override
  List<Object?> get props => [id, name];
}

/// A18 scheduler "edit existing departure" option (editable fields).
class DepartureEditOption extends Equatable {
  final String id;
  final String tourId;
  final String date;
  final String time;
  final int capacity;
  final int confirmedCount;
  final String? guideId;

  const DepartureEditOption({
    required this.id,
    required this.tourId,
    required this.date,
    required this.time,
    required this.capacity,
    required this.confirmedCount,
    this.guideId,
  });

  @override
  List<Object?> get props => [id, tourId, date, time, capacity, confirmedCount, guideId];
}
