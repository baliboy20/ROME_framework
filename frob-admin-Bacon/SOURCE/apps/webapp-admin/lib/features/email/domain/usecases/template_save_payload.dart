import '../entities/email_blocks.dart';

/// REQ-NOTIF10 (CR-002/CHG-001) — builds the create/PATCH request body for
/// `/admin/email-templates` (A5c editor Save). Contract (api-contracts.md
/// #cr-002): the client submits `body_blocks` only — `body_html` is
/// server-rendered and is NEVER sent by the client. On edit, removing the
/// last block sends `body_blocks: null` so the worker clears both columns
/// (template reverts to text-only).
Map<String, dynamic> buildTemplateSavePayload({
  required bool isEdit,
  String? useCase,
  required String name,
  required String subject,
  required String body,
  String? status,
  required List<EmailBlock> blocks,
  required bool hadBlocks,
}) {
  assert(isEdit || useCase != null, 'use_case is required on create');
  final payload = <String, dynamic>{
    if (!isEdit) 'use_case': useCase,
    'name': name,
    'subject': subject,
    'body': body,
    if (isEdit && status != null) 'status': status,
  };
  if (blocks.isNotEmpty) {
    payload['body_blocks'] = blocks.map((b) => b.toJson()).toList();
  } else if (isEdit && hadBlocks) {
    payload['body_blocks'] = null; // clears body_blocks + body_html server-side
  }
  assert(!payload.containsKey('body_html'), 'clients never submit body_html');
  return payload;
}
