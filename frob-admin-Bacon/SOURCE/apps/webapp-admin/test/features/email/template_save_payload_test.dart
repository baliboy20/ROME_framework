// REQ-NOTIF10 (CR-002/CHG-001) — API payload shape for the A5c editor Save:
// the client sends body_blocks on create/PATCH and NEVER body_html
// (api-contracts.md #cr-002 — server-rendered only).

import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/features/email/domain/entities/email_blocks.dart';
import 'package:fob_webapp_admin/features/email/domain/usecases/template_save_payload.dart';

const _blocks = [
  EmailBlock.header(tagline: 'Hi'),
  EmailBlock.text('Hello {{ name }}'),
];

void main() {
  test('create with blocks sends body_blocks, never body_html', () {
    final p = buildTemplateSavePayload(
      isEdit: false,
      useCase: 'booking_confirmed_paid',
      name: 'n',
      subject: 's',
      body: 'b',
      blocks: _blocks,
      hadBlocks: false,
    );
    expect(p['use_case'], 'booking_confirmed_paid');
    expect(p['body_blocks'], [
      {'type': 'header', 'tagline': 'Hi'},
      {'type': 'text', 'text': 'Hello {{ name }}'},
    ]);
    expect(p.containsKey('body_html'), isFalse);
    expect(p.containsKey('status'), isFalse);
  });

  test('text-only create omits body_blocks entirely', () {
    final p = buildTemplateSavePayload(
      isEdit: false,
      useCase: 'reminder',
      name: 'n',
      subject: 's',
      body: 'b',
      blocks: const [],
      hadBlocks: false,
    );
    expect(p.containsKey('body_blocks'), isFalse);
    expect(p.containsKey('body_html'), isFalse);
  });

  test('edit with blocks sends body_blocks + status, never body_html', () {
    final p = buildTemplateSavePayload(
      isEdit: true,
      name: 'n',
      subject: 's',
      body: 'b',
      status: 'draft',
      blocks: _blocks,
      hadBlocks: true,
    );
    expect(p['status'], 'draft');
    expect(p.containsKey('use_case'), isFalse);
    expect((p['body_blocks'] as List).length, 2);
    expect(p.containsKey('body_html'), isFalse);
  });

  test('removing the last block on edit sends body_blocks: null (reverts to text-only)', () {
    final p = buildTemplateSavePayload(
      isEdit: true,
      name: 'n',
      subject: 's',
      body: 'b',
      status: 'draft',
      blocks: const [],
      hadBlocks: true,
    );
    expect(p.containsKey('body_blocks'), isTrue);
    expect(p['body_blocks'], isNull);
    expect(p.containsKey('body_html'), isFalse);
  });

  test('edit of a template that never had blocks omits body_blocks', () {
    final p = buildTemplateSavePayload(
      isEdit: true,
      name: 'n',
      subject: 's',
      body: 'b',
      status: 'active',
      blocks: const [],
      hadBlocks: false,
    );
    expect(p.containsKey('body_blocks'), isFalse);
    expect(p.containsKey('body_html'), isFalse);
  });
}
