import 'dart:convert';

import '../../domain/entities/email_entities.dart';

ArchivedEmail archivedFromJson(Map<String, dynamic> j, {String? categorisationOverride}) => ArchivedEmail(
      id: j['id']?.toString() ?? '',
      threadId: j['thread_id']?.toString() ?? '',
      categorisation: categorisationOverride ?? j['categorisation']?.toString() ?? 'unlinked',
      bookingId: j['booking_id']?.toString(),
      enquiryId: j['enquiry_id']?.toString(),
      fromAddress: j['from_address']?.toString() ?? '',
      subject: j['subject']?.toString(),
      body: j['body']?.toString(),
      spam: j['spam_flag'] == 1 || j['spam_flag'] == true,
      receivedAt: j['received_at']?.toString() ?? '',
    );

SentEmail sentFromJson(Map<String, dynamic> j) => SentEmail(
      id: j['id']?.toString() ?? '',
      recipient: j['recipient']?.toString() ?? '',
      event: j['event']?.toString() ?? '',
      status: j['status']?.toString() ?? '',
      createdAt: j['created_at']?.toString() ?? '',
    );

EmailTemplate templateFromJson(Map<String, dynamic> j) {
  final rawVars = j['variables'];
  List<String> vars = const [];
  if (rawVars is List) {
    vars = rawVars.map((e) => '$e').toList();
  } else if (rawVars is String && rawVars.isNotEmpty) {
    // stored as a JSON string
    final trimmed = rawVars.replaceAll(RegExp(r'[\[\]"]'), '');
    vars = trimmed.isEmpty ? const [] : trimmed.split(',').map((e) => e.trim()).toList();
  }
  // CR-002 (REQ-NOTIF10): body_blocks arrives as a JSON string (D1 row) or a
  // decoded list; body_html is the server-rendered projection (display-only).
  final rawBlocks = j['body_blocks'];
  List<EmailBlock> blocks = const [];
  dynamic decoded = rawBlocks;
  if (rawBlocks is String && rawBlocks.isNotEmpty) {
    try {
      decoded = jsonDecode(rawBlocks);
    } on FormatException {
      decoded = null;
    }
  }
  if (decoded is List) {
    try {
      blocks = decoded.map((b) => EmailBlock.fromJson((b as Map).cast<String, dynamic>())).toList();
    } on FormatException {
      blocks = const [];
    }
  }
  final rawHtml = j['body_html'];
  return EmailTemplate(
    id: j['id']?.toString() ?? '',
    useCase: j['use_case']?.toString() ?? '',
    name: j['name']?.toString() ?? '',
    subject: j['subject']?.toString() ?? '',
    body: j['body']?.toString() ?? '',
    variables: vars,
    status: j['status']?.toString() ?? 'draft',
    bodyBlocks: blocks,
    bodyHtml: rawHtml is String && rawHtml.isNotEmpty ? rawHtml : null,
    // CHG-003 (REQ-NOTIF10): row timestamps — tolerant of missing values.
    createdAt: j['created_at'] is String && (j['created_at'] as String).isNotEmpty ? j['created_at'] as String : null,
    updatedAt: j['updated_at'] is String && (j['updated_at'] as String).isNotEmpty ? j['updated_at'] as String : null,
  );
}
