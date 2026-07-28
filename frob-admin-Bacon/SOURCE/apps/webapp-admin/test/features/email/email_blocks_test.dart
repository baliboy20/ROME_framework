// REQ-NOTIF10 (CR-002/CHG-001) — block model logic for the A5c editor
// (UXD-20): wire shape, validation, and template row parsing.

import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/features/email/data/models/email_models.dart';
import 'package:fob_webapp_admin/features/email/domain/entities/email_blocks.dart';
import 'package:fob_webapp_admin/features/email/domain/entities/email_merge_fields.dart';

void main() {
  group('EmailBlock JSON wire shape (worker blockSchema mirror)', () {
    test('round-trips all five types', () {
      final blocks = [
        const EmailBlock.header(tagline: 'Hi 🚲'),
        const EmailBlock.text('Hello {{ name }}'),
        const EmailBlock.button(label: 'Go', href: 'https://x.example'),
        const EmailBlock.divider(),
        const EmailBlock.footer(text: 'Reply anytime'),
      ];
      for (final b in blocks) {
        expect(EmailBlock.fromJson(b.toJson()), b);
      }
    });

    test('optional fields are omitted when empty (header.tagline, footer.text)', () {
      expect(const EmailBlock.header().toJson(), {'type': 'header'});
      expect(const EmailBlock.footer().toJson(), {'type': 'footer'});
      expect(const EmailBlock.divider().toJson(), {'type': 'divider'});
    });

    test('unknown block type is rejected', () {
      expect(() => EmailBlock.fromJson(const {'type': 'gif'}), throwsFormatException);
    });
  });

  group('EmailBlock validation (UXC-FRM-1)', () {
    test('text requires non-empty text', () {
      expect(const EmailBlock.text('  ').validate(), isNotNull);
      expect(const EmailBlock.text('hi').validate(), isNull);
    });

    test('button requires label and URL', () {
      expect(const EmailBlock.button(label: '', href: '').validate(), isNotNull);
      expect(const EmailBlock.button(label: 'Go', href: '').validate(), isNotNull);
      expect(const EmailBlock.button(label: '', href: 'https://x').validate(), isNotNull);
      expect(const EmailBlock.button(label: 'Go', href: 'https://x').validate(), isNull);
    });

    test('header, divider, footer are always valid', () {
      expect(const EmailBlock.header().validate(), isNull);
      expect(const EmailBlock.divider().validate(), isNull);
      expect(const EmailBlock.footer().validate(), isNull);
    });
  });

  group('merge-field catalogue (worker OUTCOME_FIELDS mirror)', () {
    test('booking flavours declare fields with sample values for each', () {
      for (final useCase in kMergeFieldCatalogue.keys) {
        final fields = mergeFieldsForUseCase(useCase);
        final sample = sampleDataForUseCase(useCase);
        expect(fields, isNotEmpty);
        for (final f in fields) {
          expect(sample[f], isNotNull, reason: '$useCase sample missing $f');
        }
      }
    });

    test('non-flavour use_cases declare no fields', () {
      expect(mergeFieldsForUseCase('review_request'), isEmpty);
      expect(sampleDataForUseCase('review_request'), isEmpty);
    });
  });

  group('templateFromJson (CR-002 columns)', () {
    test('parses body_blocks JSON string + body_html', () {
      final t = templateFromJson({
        'id': 't1',
        'use_case': 'booking_confirmed_paid',
        'name': 'n',
        'subject': 's',
        'body': 'b',
        'status': 'draft',
        'body_blocks': '[{"type":"text","text":"Hi {{ name }}"},{"type":"divider"}]',
        'body_html': '<table>…</table>',
      });
      expect(t.bodyBlocks, const [EmailBlock.text('Hi {{ name }}'), EmailBlock.divider()]);
      expect(t.bodyHtml, '<table>…</table>');
      expect(t.hasHtmlVersion, isTrue);
    });

    test('text-only rows stay text-only', () {
      final t = templateFromJson({
        'id': 't2',
        'use_case': 'reminder',
        'name': 'n',
        'subject': 's',
        'body': 'b',
        'status': 'active',
        'body_blocks': null,
        'body_html': null,
      });
      expect(t.bodyBlocks, isEmpty);
      expect(t.bodyHtml, isNull);
      expect(t.hasHtmlVersion, isFalse);
    });
  });
}
