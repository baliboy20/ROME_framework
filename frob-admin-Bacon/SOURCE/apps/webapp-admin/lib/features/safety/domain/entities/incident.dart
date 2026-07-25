import 'package:equatable/equatable.dart';

/// A10 / OPS12 — safety incident awaiting insurer dispatch.
class Incident extends Equatable {
  final String id;
  final String location;
  final String type;
  final String severity;
  final String description;
  final String status;
  final String tourId;
  final String occurredAt;

  const Incident({
    required this.id,
    required this.location,
    required this.type,
    required this.severity,
    required this.description,
    required this.status,
    required this.tourId,
    required this.occurredAt,
  });

  /// OPS12 — insurer dispatch is offered only before it has been dispatched.
  bool get canDispatch => status == 'submitted' || status == 'reviewed';

  @override
  List<Object?> get props => [id, location, type, severity, description, status, tourId, occurredAt];
}
