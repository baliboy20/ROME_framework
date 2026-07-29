import 'dart:convert';

import '../../domain/entities/bike.dart';
import '../../domain/entities/bike_record.dart';
import '../../domain/entities/compliance_item.dart';
import '../../domain/entities/departure_option.dart';
import '../../domain/entities/equipment.dart';
import '../../domain/entities/fleet_readiness.dart';

class BikeModel extends Bike {
  const BikeModel({required super.id, required super.label, super.outOfService, super.busyOverlap});

  factory BikeModel.fromJson(Map<String, dynamic> j) => BikeModel(
        id: j['id']?.toString() ?? '',
        label: j['label']?.toString() ?? j['id']?.toString() ?? '',
        outOfService: j['out_of_service'] as bool? ?? false,
        busyOverlap: j['busy_overlap'] as bool? ?? false,
      );
}

class BikeSummaryModel extends BikeSummary {
  const BikeSummaryModel({
    required super.id,
    required super.make,
    required super.model,
    required super.frameSize,
    required super.colour,
    required super.status,
  });

  factory BikeSummaryModel.fromJson(Map<String, dynamic> j) => BikeSummaryModel(
        id: j['id']?.toString() ?? '',
        make: j['make']?.toString() ?? '',
        model: j['model']?.toString() ?? '',
        frameSize: j['frame_size']?.toString() ?? '',
        colour: j['colour']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
      );
}

class BikeRecordModel extends BikeRecord {
  const BikeRecordModel({
    required super.id,
    required super.make,
    required super.model,
    required super.frameSize,
    required super.colour,
    required super.status,
    super.serialNumber,
    super.purchaseDate,
    super.spare,
    super.lastInspectedAt,
    super.notes,
    super.routeEligibility,
    super.maintenance,
    super.assignments,
  });

  /// Parses the `{bike, maintenance, assignments}` envelope from GET /admin/bikes/:id.
  factory BikeRecordModel.fromJson(Map<String, dynamic> j) {
    final b = (j['bike'] as Map?)?.cast<String, dynamic>() ?? const {};
    final maintenance = (j['maintenance'] as List?) ?? const [];
    final assignments = (j['assignments'] as List?) ?? const [];
    return BikeRecordModel(
      id: b['id']?.toString() ?? '',
      make: b['make']?.toString() ?? '',
      model: b['model']?.toString() ?? '',
      frameSize: b['frame_size']?.toString() ?? '',
      colour: b['colour']?.toString() ?? '',
      status: b['status']?.toString() ?? '',
      serialNumber: b['serial_number']?.toString(),
      purchaseDate: b['purchase_date']?.toString(),
      spare: b['spare'] == 1 || b['spare'] == true,
      lastInspectedAt: b['last_inspected_at']?.toString(),
      notes: b['notes']?.toString(),
      routeEligibility: _routes(b['route_eligibility']),
      maintenance: maintenance.map((m) {
        final e = (m as Map).cast<String, dynamic>();
        return MaintenanceEvent(
          createdAt: e['created_at']?.toString() ?? '',
          workPerformed: e['work_performed']?.toString() ?? '',
          partsReplaced: e['parts_replaced']?.toString(),
        );
      }).toList(),
      assignments: assignments.map((a) {
        final e = (a as Map).cast<String, dynamic>();
        return Assignment(
          tourId: e['tour_id']?.toString() ?? '—',
          date: e['date']?.toString() ?? '',
          time: e['time']?.toString() ?? '',
          active: e['removed_at'] == null,
        );
      }).toList(),
    );
  }

  static List<String> _routes(dynamic raw) {
    if (raw == null) return const [];
    try {
      final v = raw is String ? jsonDecode(raw) : raw;
      if (v is List) return v.map((e) => '$e').toList();
    } catch (_) {}
    return const [];
  }
}

class EquipmentModel extends Equipment {
  const EquipmentModel({
    required super.id,
    required super.type,
    required super.description,
    required super.status,
    super.reviewDueAt,
  });

  factory EquipmentModel.fromJson(Map<String, dynamic> j) => EquipmentModel(
        id: j['id']?.toString() ?? '',
        type: j['type']?.toString() ?? '',
        description: j['description']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        reviewDueAt: j['review_due_at']?.toString(),
      );
}

class ComplianceItemModel extends ComplianceItem {
  const ComplianceItemModel({
    required super.id,
    required super.type,
    required super.expiry,
    required super.status,
    super.equipmentDescription,
  });

  factory ComplianceItemModel.fromJson(Map<String, dynamic> j) => ComplianceItemModel(
        id: j['id']?.toString() ?? '',
        type: j['type']?.toString() ?? '',
        expiry: j['expiry_or_due_at']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        equipmentDescription: j['equipment_description']?.toString(),
      );
}

class FleetReadinessModel extends FleetReadiness {
  const FleetReadinessModel({required super.counts, required super.alerts});

  factory FleetReadinessModel.fromJson(Map<String, dynamic> j) {
    final b = (j['bikes'] as Map?)?.cast<String, dynamic>() ?? const {};
    return FleetReadinessModel(
      counts: b.map((k, v) => MapEntry(k, (v as num?)?.toInt() ?? 0)),
      alerts: ((j['alerts'] as List?) ?? const []).map((e) => e.toString()).toList(),
    );
  }
}

class DepartureOptionModel extends DepartureOption {
  const DepartureOptionModel({
    required super.id,
    required super.tourId,
    required super.date,
    required super.time,
    required super.confirmedCount,
  });

  factory DepartureOptionModel.fromJson(Map<String, dynamic> j) => DepartureOptionModel(
        id: j['id']?.toString() ?? '',
        tourId: j['tour_id']?.toString() ?? '',
        date: j['date']?.toString() ?? '',
        time: j['time']?.toString() ?? '',
        confirmedCount: (j['confirmed_count'] as num?)?.toInt() ?? 0,
      );
}
