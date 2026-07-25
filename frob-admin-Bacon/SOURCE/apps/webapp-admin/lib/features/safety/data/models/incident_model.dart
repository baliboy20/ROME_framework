import '../../domain/entities/incident.dart';

class IncidentModel extends Incident {
  const IncidentModel({
    required super.id,
    required super.location,
    required super.type,
    required super.severity,
    required super.description,
    required super.status,
    required super.tourId,
    required super.occurredAt,
  });

  factory IncidentModel.fromJson(Map<String, dynamic> j) => IncidentModel(
        id: j['id']?.toString() ?? '',
        location: j['location']?.toString() ?? '',
        type: j['type']?.toString() ?? '',
        severity: j['severity']?.toString() ?? '',
        description: j['preliminary_description']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        tourId: j['tour_id']?.toString() ?? '',
        occurredAt: j['occurred_at']?.toString() ?? '',
      );
}
