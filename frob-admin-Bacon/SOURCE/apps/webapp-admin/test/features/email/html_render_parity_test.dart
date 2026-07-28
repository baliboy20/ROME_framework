// REQ-NOTIF10 (CR-002/CHG-001) — renderer parity guard (UXD-20, A5c).
//
// The Dart preview renderer (email_html_render.dart) MUST reproduce the
// worker's golden fixtures byte-for-byte: same block JSON → identical HTML.
// Fixtures are the shared source of truth at
// SOURCE/worker/test/fixtures/html-email/ and are read from the repo here so
// the two suites can never drift apart silently.

import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/features/email/domain/entities/email_blocks.dart';
import 'package:fob_webapp_admin/features/email/domain/entities/email_html_render.dart';

const _fixtureDir = '../../worker/test/fixtures/html-email';
const _fixtures = ['minimal-text', 'full-shell', 'escaping'];

void main() {
  group('block→HTML renderer parity with worker golden fixtures', () {
    for (final name in _fixtures) {
      test('$name.blocks.json renders byte-identical to $name.html', () {
        final blocksFile = File('$_fixtureDir/$name.blocks.json');
        final htmlFile = File('$_fixtureDir/$name.html');
        expect(blocksFile.existsSync(), isTrue, reason: 'missing fixture ${blocksFile.path}');
        expect(htmlFile.existsSync(), isTrue, reason: 'missing fixture ${htmlFile.path}');

        final raw = jsonDecode(blocksFile.readAsStringSync()) as List;
        final blocks =
            raw.map((b) => EmailBlock.fromJson((b as Map).cast<String, dynamic>())).toList();
        // Fixture files carry a trailing newline; the rendered string does not.
        final expected = htmlFile.readAsStringSync().trimRight();

        expect(renderBlocksToHtml(blocks), expected);
      });
    }
  });

  group('preview merge substitution (mirror of worker substituteMergeFieldsHtml)', () {
    test('substitutes known tokens with HTML-escaped values', () {
      expect(
        substituteMergeFieldsHtml('Hi {{ name }} & {{name}}', {'name': 'A<lex> & "co"'}),
        'Hi A&lt;lex&gt; &amp; &quot;co&quot; & A&lt;lex&gt; &amp; &quot;co&quot;',
      );
    });

    test('unknown tokens render blank (existing REQ-NOTIF10 rule)', () {
      expect(substituteMergeFieldsHtml('x {{ nope }} y', {}), 'x  y');
    });
  });
}
