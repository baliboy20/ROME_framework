// Minimal smoke test: the app boots and shows the payment screen's "Pay"
// button. Deeper bloc/repository testing is intentionally out of scope for
// this POC's Phase 2 (frontend is coded against a Worker API contract that
// isn't guaranteed to be running when this test executes).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:stripe_embedded_checkout_poc/main.dart';

void main() {
  testWidgets('App boots and shows the payment form', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const FobStripePocApp());
    await tester.pumpAndSettle();

    expect(find.text('Pay'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
  });
}
