import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fob_webapp_admin/injection_container.dart';
import 'package:fob_webapp_admin/main.dart';

void main() {
  setUp(() async {
    await sl.reset();
    configureDependencies();
  });

  testWidgets('App boots to the sign-in gate (A1)', (WidgetTester tester) async {
    await tester.pumpWidget(const FobAdminApp());
    await tester.pump();

    expect(find.text('FOB Booking Admin'), findsOneWidget);
    expect(find.byKey(const Key('signin-email')), findsOneWidget);
    expect(find.byKey(const Key('signin-password')), findsOneWidget);
    expect(find.byKey(const Key('signin-submit')), findsOneWidget);
  });

  testWidgets('Sign-in with empty credentials shows an inline error, no crash', (WidgetTester tester) async {
    await tester.pumpWidget(const FobAdminApp());
    await tester.pump();

    // The sign-in form dev-prefills credentials; clear them so this exercises
    // the genuinely-empty case the validator guards.
    await tester.enterText(find.byKey(const Key('signin-email')), '');
    await tester.enterText(find.byKey(const Key('signin-password')), '');

    await tester.tap(find.byKey(const Key('signin-submit')));
    await tester.pump();

    expect(find.textContaining('required'), findsOneWidget);
  });
}
