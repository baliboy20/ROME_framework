// CHG-007 (REQ-NOTIF10, A5c): the template EDITOR's "Send test" must prompt
// for a "Send to" address (same dialog as the list-row action; blank → owner
// default) instead of sending immediately.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fob_webapp_admin/features/email/domain/entities/email_entities.dart';
import 'package:fob_webapp_admin/features/email/presentation/pages/email_templates_page.dart';

const _tpl = EmailTemplate(
  id: 'tpl-1',
  useCase: 'booking_confirmation',
  name: 'Confirmation',
  subject: 'Your booking',
  body: 'Hello {{name}}',
  variables: ['name'],
  status: 'draft',
);

void main() {
  testWidgets('editor Send test prompts for an address before sending (CHG-007)', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: TemplateEditor(template: _tpl))));
    await tester.pumpAndSettle();

    // Editor renders with an enabled Send test (no unsaved block edits).
    final sendTestBtn = find.widgetWithText(OutlinedButton, 'Send test');
    expect(sendTestBtn, findsOneWidget);
    expect(tester.widget<OutlinedButton>(sendTestBtn).onPressed, isNotNull);

    await tester.tap(sendTestBtn);
    await tester.pumpAndSettle();

    // The shared prompt appears — nothing was sent yet (the TestSendTemplate
    // use-case is not registered in this test; an immediate send would throw).
    expect(find.text('Send a test'), findsOneWidget);
    expect(find.widgetWithText(TextField, 'Send to'), findsOneWidget);
    expect(find.text('Leave blank to send to the owner'), findsOneWidget);

    // Cancelling closes the prompt without sending.
    await tester.tap(find.widgetWithText(TextButton, 'Cancel').last);
    await tester.pumpAndSettle();
    expect(find.text('Send a test'), findsNothing);
  });

  testWidgets('prompt returns the entered address; blank means owner default', (tester) async {
    String? result = 'sentinel';
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) => TextButton(
            onPressed: () async => result = await promptTestSendAddress(context, _tpl),
            child: const Text('open'),
          ),
        ),
      ),
    ));

    // Entered address is returned trimmed.
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Send to'), '  qa@example.com ');
    await tester.tap(find.widgetWithText(FilledButton, 'Send test'));
    await tester.pumpAndSettle();
    expect(result, 'qa@example.com');

    // Blank field confirms as '' (owner default) — not null.
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Send test'));
    await tester.pumpAndSettle();
    expect(result, '');

    // Cancel yields null (no send).
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, 'Cancel'));
    await tester.pumpAndSettle();
    expect(result, isNull);
  });
}
