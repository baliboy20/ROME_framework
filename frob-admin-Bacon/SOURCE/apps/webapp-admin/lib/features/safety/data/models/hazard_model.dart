import '../../domain/entities/hazard.dart';

class HazardModel extends Hazard {
  const HazardModel({
    required super.id,
    required super.street,
    required super.hazardType,
    required super.description,
    required super.severity,
    required super.status,
    required super.observedAt,
  });

  factory HazardModel.fromJson(Map<String, dynamic> j) => HazardModel(
        id: j['id']?.toString() ?? '',
        street: j['street_name']?.toString() ?? '',
        hazardType: j['hazard_type']?.toString() ?? '',
        description: j['description']?.toString() ?? '',
        severity: j['severity']?.toString() ?? '—',
        status: j['status']?.toString() ?? '',
        observedAt: j['observed_at']?.toString() ?? '',
      );
}
