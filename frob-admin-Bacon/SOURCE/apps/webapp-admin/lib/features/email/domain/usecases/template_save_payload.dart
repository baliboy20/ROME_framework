import '../entities/email_blocks.dart';

/// REQ-NOTIF10 (CR-002/CHG-001) — builds the create/PATCH request body for
/// `/admin/email-templates` (A5c editor Save). Contract (api-contracts.md
/// #cr-002): the client submits `body_blocks` only — `body_html` is
/// server-rendered and is NEVER sent by the client. On edit, removing the
/// last block sends `body_blocks: null` so the worker clears both columns
/// (template reverts to text-only).
///
/// FR-001: when [bodySource] is 'raw' the HTML came from an imported document
/// and belongs to the import endpoint, not to save. `body_blocks` is then
/// omitted entirely — sending null would wipe the imported `body_html`.
Map<String, dynamic> buildTemplateSavePayload({
  required bool isEdit,
  String? useCase,
  required String name,
  required String subject,
  required String body,
  String? status,
  required List<EmailBlock> blocks,
  required bool hadBlocks,
  /// 'blocks' | 'raw' — how this template's HTML is authored (FR-001).
  String bodySource = 'blocks',
}) {
  assert(isEdit || useCase != null, 'use_case is required on create');
  final payload = <String, dynamic>{
    if (!isEdit) 'use_case': useCase,
    'name': name,
    'subject': subject,
    'body': body,
    if (isEdit && status != null) 'status': status,
  };
  // A raw template has no blocks to clear, so the key is meaningless there —
  // and sending `body_blocks: null` would make the worker wipe body_html,
  // DESTROYING the imported document. Omit the key entirely in raw mode.
  if (bodySource == 'raw') {
    // nothing: body_html is owned by the import endpoint, not by save.
  } else if (blocks.isNotEmpty) {
    payload['body_blocks'] = blocks.map((b) => b.toJson()).toList();
  } else if (isEdit && hadBlocks) {
    payload['body_blocks'] = null; // clears body_blocks + body_html server-side
  }
  assert(!payload.containsKey('body_html'), 'clients never submit body_html');
  return payload;
}
