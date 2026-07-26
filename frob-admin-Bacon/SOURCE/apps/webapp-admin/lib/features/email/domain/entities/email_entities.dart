import 'package:equatable/equatable.dart';

/// A captured inbound message (REQ-NOTIF05), as shown in the archive.
class ArchivedEmail extends Equatable {
  final String id;
  final String threadId;
  final String categorisation; // linked | unlinked | ambiguous
  final String? bookingId;
  final String? enquiryId;
  final String fromAddress;
  final String? subject;
  final String? body;
  final bool spam;
  final String receivedAt;

  const ArchivedEmail({
    required this.id,
    required this.threadId,
    required this.categorisation,
    this.bookingId,
    this.enquiryId,
    required this.fromAddress,
    this.subject,
    this.body,
    required this.spam,
    required this.receivedAt,
  });

  bool get needsAttention => categorisation != 'linked';

  @override
  List<Object?> get props =>
      [id, threadId, categorisation, bookingId, enquiryId, fromAddress, subject, body, spam, receivedAt];
}

/// A sent message row (from the shared `message` log).
class SentEmail extends Equatable {
  final String id;
  final String recipient;
  final String event;
  final String status;
  final String createdAt;
  const SentEmail({
    required this.id,
    required this.recipient,
    required this.event,
    required this.status,
    required this.createdAt,
  });
  @override
  List<Object?> get props => [id, recipient, event, status, createdAt];
}

/// Archive search result (REQ-NOTIF06).
class ArchiveResults extends Equatable {
  final List<ArchivedEmail> received;
  final List<SentEmail> sent;
  const ArchiveResults({required this.received, required this.sent});
  @override
  List<Object?> get props => [received, sent];
}

/// A full thread (meta + its received messages) for the drill-down.
class EmailThread extends Equatable {
  final String id;
  final String categorisation;
  final String? bookingId;
  final String? enquiryId;
  final List<ArchivedEmail> received;
  const EmailThread({
    required this.id,
    required this.categorisation,
    this.bookingId,
    this.enquiryId,
    required this.received,
  });

  bool get isLinked => categorisation == 'linked';

  @override
  List<Object?> get props => [id, categorisation, bookingId, enquiryId, received];
}

/// An email template (REQ-NOTIF10).
class EmailTemplate extends Equatable {
  final String id;
  final String useCase;
  final String name;
  final String subject;
  final String body;
  final List<String> variables;
  final String status; // draft | active | retired
  const EmailTemplate({
    required this.id,
    required this.useCase,
    required this.name,
    required this.subject,
    required this.body,
    required this.variables,
    required this.status,
  });
  @override
  List<Object?> get props => [id, useCase, name, subject, body, variables, status];
}
