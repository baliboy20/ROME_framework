import '../../domain/entities/audit_entry.dart';
import '../../domain/entities/content_snapshot.dart';
import '../../domain/entities/message.dart';

class MessageModel extends Message {
  const MessageModel({
    required super.id,
    required super.recipient,
    required super.event,
    required super.status,
    required super.provider,
    required super.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> j) => MessageModel(
        id: j['id']?.toString() ?? '',
        recipient: j['recipient']?.toString() ?? '',
        event: j['event']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        provider: j['provider']?.toString() ?? '',
        createdAt: j['created_at']?.toString() ?? '',
      );
}

class AuditEntryModel extends AuditEntry {
  const AuditEntryModel({
    required super.occurredAt,
    required super.actorType,
    required super.action,
    required super.subjectType,
  });

  factory AuditEntryModel.fromJson(Map<String, dynamic> j) => AuditEntryModel(
        occurredAt: j['occurred_at']?.toString() ?? '',
        actorType: j['actor_type']?.toString() ?? '',
        action: j['action']?.toString() ?? '',
        subjectType: j['subject_type']?.toString() ?? '',
      );
}

class ContentSnapshotModel extends ContentSnapshot {
  const ContentSnapshotModel({required super.pages, required super.quality});

  factory ContentSnapshotModel.fromJson(Map<String, dynamic> j) => ContentSnapshotModel(
        pages: ((j['pages'] as List?) ?? const [])
            .map((p) => ContentPage(
                  tourId: (p as Map)['tour_id']?.toString() ?? '',
                  path: p['path']?.toString() ?? '',
                  title: p['title']?.toString() ?? '',
                  published: p['published'] as bool? ?? false,
                ))
            .toList(),
        quality: ((j['quality'] as List?) ?? const [])
            .map((q) => QualityItem(
                  title: (q as Map)['title']?.toString() ?? '',
                  detail: q['detail']?.toString() ?? '',
                ))
            .toList(),
      );
}
