import 'package:equatable/equatable.dart';

/// A16 compliance review & renewal item (FLEET07/08).
class ComplianceItem extends Equatable {
  final String id;
  final String type;
  final String expiry;
  final String status;
  final String? equipmentDescription;

  const ComplianceItem({
    required this.id,
    required this.type,
    required this.expiry,
    required this.status,
    this.equipmentDescription,
  });

  bool get isCritical => status == 'critical';

  @override
  List<Object?> get props => [id, type, expiry, status, equipmentDescription];
}
