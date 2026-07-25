import 'package:equatable/equatable.dart';

/// A11 / OPS14 — road hazard awaiting review approval.
class Hazard extends Equatable {
  final String id;
  final String street;
  final String hazardType;
  final String description;
  final String severity;
  final String status;
  final String observedAt;

  const Hazard({
    required this.id,
    required this.street,
    required this.hazardType,
    required this.description,
    required this.severity,
    required this.status,
    required this.observedAt,
  });

  bool get isHigh => severity == 'high';
  bool get canApprove => status == 'pending_review';

  @override
  List<Object?> get props => [id, street, hazardType, description, severity, status, observedAt];
}
