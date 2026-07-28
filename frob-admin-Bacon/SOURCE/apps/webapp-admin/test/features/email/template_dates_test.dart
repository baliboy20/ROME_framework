// CHG-003 (REQ-NOTIF10, A5c) — template created/modified dates: row parsing
// tolerance, the card metadata line, and the list-card render.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/core/usecases/usecase.dart';
import 'package:fob_webapp_admin/features/email/data/models/email_models.dart';
import 'package:fob_webapp_admin/features/email/domain/entities/email_entities.dart';
import 'package:fob_webapp_admin/features/email/domain/repositories/email_repository.dart';
import 'package:fob_webapp_admin/features/email/domain/usecases/email_usecases.dart';
import 'package:fob_webapp_admin/features/email/presentation/bloc/templates_bloc.dart';
import 'package:fob_webapp_admin/features/email/presentation/pages/email_templates_page.dart';
import 'package:fob_webapp_admin/injection_container.dart';

Map<String, dynamic> _row({String? created, String? updated}) => {
      'id': 't1',
      'use_case': 'reminder',
      'name': 'Gentle nudge',
      'subject': 'See you soon',
      'body': 'b',
      'status': 'draft',
      if (created != null) 'created_at': created,
      if (updated != null) 'updated_at': updated,
    };

class _FakeRepo implements EmailRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FakeGetTemplates extends GetTemplates {
  final List<EmailTemplate> templates;
  _FakeGetTemplates(this.templates) : super(_FakeRepo());
  @override
  Future<Result<List<EmailTemplate>>> call(NoParams params) async => Success(templates);
}

void main() {
  group('templateFromJson timestamps (CHG-003)', () {
    test('parses created_at/updated_at ISO strings', () {
      final t = templateFromJson(_row(created: '2026-07-12T09:00:00Z', updated: '2026-07-27T10:30:00Z'));
      expect(t.createdAt, '2026-07-12T09:00:00Z');
      expect(t.updatedAt, '2026-07-27T10:30:00Z');
    });

    test('tolerates missing timestamps (older rows)', () {
      final t = templateFromJson(_row());
      expect(t.createdAt, isNull);
      expect(t.updatedAt, isNull);
    });

    test('treats empty strings as absent', () {
      final t = templateFromJson(_row(created: '', updated: ''));
      expect(t.createdAt, isNull);
      expect(t.updatedAt, isNull);
    });
  });

  group('templateDatesLine (A5c card metadata)', () {
    EmailTemplate tpl({String? created, String? updated}) => EmailTemplate(
          id: 't1', useCase: 'reminder', name: 'n', subject: 's', body: 'b',
          variables: const [], status: 'draft', createdAt: created, updatedAt: updated,
        );

    test('shows Created · Updated when they differ', () {
      expect(templateDatesLine(tpl(created: '2026-07-12T09:00:00Z', updated: '2026-07-27T10:30:00Z')),
          'Created ${templateDateLabel('2026-07-12T09:00:00Z')} · Updated ${templateDateLabel('2026-07-27T10:30:00Z')}');
    });

    test('collapses to Created only when updated == created', () {
      final line = templateDatesLine(tpl(created: '2026-07-12T09:00:00Z', updated: '2026-07-12T09:00:00Z'));
      expect(line, startsWith('Created '));
      expect(line, isNot(contains('Updated')));
    });

    test('null when no timestamps and null for malformed values', () {
      expect(templateDatesLine(tpl()), isNull);
      expect(templateDateLabel('not-a-date'), isNull);
      expect(templateDatesLine(tpl(created: 'not-a-date')), isNull);
    });
  });

  group('EmailTemplatesPage card render (CHG-003)', () {
    setUp(() async => sl.reset());
    tearDown(() async => sl.reset());

    testWidgets('list card shows the dates line', (tester) async {
      final t = templateFromJson(_row(created: '2026-07-12T09:00:00Z', updated: '2026-07-27T10:30:00Z'));
      sl.registerFactory(() => TemplatesBloc(_FakeGetTemplates([t])));
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(body: SingleChildScrollView(child: EmailTemplatesPage())),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Gentle nudge'), findsOneWidget);
      expect(find.text(templateDatesLine(t)!), findsOneWidget);
    });

    testWidgets('card omits the dates line when timestamps are absent', (tester) async {
      final t = templateFromJson(_row());
      sl.registerFactory(() => TemplatesBloc(_FakeGetTemplates([t])));
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(body: SingleChildScrollView(child: EmailTemplatesPage())),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Gentle nudge'), findsOneWidget);
      expect(find.textContaining('Created'), findsNothing);
    });
  });
}
