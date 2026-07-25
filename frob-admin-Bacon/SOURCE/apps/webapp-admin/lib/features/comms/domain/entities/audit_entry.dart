import 'package:equatable/equatable.dart';

/// A5 audit-log entry (CNA03).
class AuditEntry extends Equatable {
  final String occurredAt;
  final String actorType;
  final String action;
  final String subjectType;

  const AuditEntry({
    required this.occurredAt,
    required this.actorType,
    required this.action,
    required this.subjectType,
  });

  @override
  List<Object?> get props => [occurredAt, actorType, action, subjectType];
}
