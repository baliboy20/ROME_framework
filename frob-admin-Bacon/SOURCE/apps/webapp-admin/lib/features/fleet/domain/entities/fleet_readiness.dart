import 'package:equatable/equatable.dart';

/// A14 / FLEET03 — fleet & equipment readiness dashboard snapshot.
class FleetReadiness extends Equatable {
  final Map<String, int> counts;
  final List<String> alerts;
  const FleetReadiness({required this.counts, required this.alerts});

  @override
  List<Object?> get props => [counts, alerts];
}
