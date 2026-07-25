import 'package:equatable/equatable.dart';

/// Sub-readiness for a single dimension (guide / bikes) — UXD-07.
enum Readiness { yes, partial, no }

/// A17 departure calendar row (UXD-08), readiness composite (UXD-07).
class Departure extends Equatable {
  final String id;
  final String tourName;
  final DateTime dateTime;
  final int bookedCount;
  final int capacity;
  final bool hasGuide;
  final Readiness bikesReadiness;

  const Departure({
    required this.id,
    required this.tourName,
    required this.dateTime,
    required this.bookedCount,
    required this.capacity,
    required this.hasGuide,
    required this.bikesReadiness,
  });

  /// UXD-07 composite dot: lime = all-clear, orange = hard-miss, cyan = partial.
  String get readinessDot {
    final bikesOk = bikesReadiness == Readiness.yes;
    if (hasGuide && bikesOk) return 'lime';
    if (!hasGuide && bikesReadiness == Readiness.no) return 'orange';
    return 'cyan';
  }

  @override
  List<Object?> get props => [id, tourName, dateTime, bookedCount, capacity, hasGuide, bikesReadiness];
}
