import 'package:equatable/equatable.dart';

/// A21 bikes-register list row (master).
class BikeSummary extends Equatable {
  final String id;
  final String make;
  final String model;
  final String frameSize;
  final String colour;
  final String status;

  const BikeSummary({
    required this.id,
    required this.make,
    required this.model,
    required this.frameSize,
    required this.colour,
    required this.status,
  });

  bool matches(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return true;
    return id.toLowerCase().contains(q) ||
        '$make $model'.toLowerCase().contains(q) ||
        status.toLowerCase().contains(q) ||
        colour.toLowerCase().contains(q);
  }

  @override
  List<Object?> get props => [id, make, model, frameSize, colour, status];
}

/// A21 full bike record (detail) — spec + maintenance + assignment history.
class BikeRecord extends Equatable {
  final String id;
  final String make;
  final String model;
  final String frameSize;
  final String colour;
  final String status;
  final String? serialNumber;
  final String? purchaseDate;
  final bool spare;
  final String? lastInspectedAt;
  final String? notes;
  final List<String> routeEligibility;
  final List<MaintenanceEvent> maintenance;
  final List<Assignment> assignments;

  const BikeRecord({
    required this.id,
    required this.make,
    required this.model,
    required this.frameSize,
    required this.colour,
    required this.status,
    this.serialNumber,
    this.purchaseDate,
    this.spare = false,
    this.lastInspectedAt,
    this.notes,
    this.routeEligibility = const [],
    this.maintenance = const [],
    this.assignments = const [],
  });

  @override
  List<Object?> get props => [
        id, make, model, frameSize, colour, status, serialNumber, purchaseDate,
        spare, lastInspectedAt, notes, routeEligibility, maintenance, assignments,
      ];
}

class MaintenanceEvent extends Equatable {
  final String createdAt;
  final String workPerformed;
  final String? partsReplaced;
  const MaintenanceEvent({required this.createdAt, required this.workPerformed, this.partsReplaced});
  @override
  List<Object?> get props => [createdAt, workPerformed, partsReplaced];
}

class Assignment extends Equatable {
  final String tourId;
  final String date;
  final String time;
  final bool active;
  const Assignment({required this.tourId, required this.date, required this.time, required this.active});
  @override
  List<Object?> get props => [tourId, date, time, active];
}
