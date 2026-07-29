import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/screens/admin_shell.dart';
import 'package:fob_webapp_admin/widgets/command_palette.dart';

void main() {
  group('destination list', () {
    // The palette derives from kNavGroups rather than keeping its own list.
    // This test is what makes that hold: add a screen to the sidebar and it
    // becomes searchable automatically, with no second place to remember.
    test('is derived from the sidebar, so the two cannot drift', () {
      final navRoutes = {
        for (final g in kNavGroups)
          for (final l in g.leaves) l.route,
      };
      final paletteRoutes = kPaletteEntries.map((e) => e.route).toSet();
      expect(paletteRoutes, navRoutes);
    });

    test('covers every sidebar destination', () {
      expect(kPaletteEntries.length, greaterThanOrEqualTo(20));
    });
  });

  group('search', () {
    test("the sponsor's own example works: 'pay' finds Payments first", () {
      final r = searchDestinations('pay');
      expect(r.first.label, 'Payments');
    });

    // The obvious follow-up. Without synonyms this returns nothing, which
    // would feel broken to anyone who just watched "pay" work.
    test("'refund' finds Payments even though the word is not in the label", () {
      final r = searchDestinations('refund');
      expect(r.map((e) => e.label), contains('Payments'));
    });

    test('a word inside the label matches', () {
      final r = searchDestinations('bike');
      expect(r.map((e) => e.label), contains('Bikes'));
    });

    test('matching is case-insensitive', () {
      expect(searchDestinations('PAYMENTS').first.label, 'Payments');
    });

    test('a label prefix outranks a mid-word match', () {
      final r = searchDestinations('book');
      // "Bookings" and "New booking" both match; the one starting with the
      // query comes first.
      expect(r.first.label, 'Bookings');
    });

    test('a surface id finds its screen', () {
      final r = searchDestinations('A17');
      expect(r.first.label, 'Departure calendar');
    });

    test('empty query lists everything', () {
      expect(searchDestinations('').length, kPaletteEntries.length);
    });

    test('nonsense matches nothing', () {
      expect(searchDestinations('zzzzqq'), isEmpty);
    });

    test('whitespace is ignored', () {
      expect(searchDestinations('  pay  ').first.label, 'Payments');
    });

    test('settings is reachable by what it holds, not just its name', () {
      expect(searchDestinations('version').map((e) => e.label), contains('Settings'));
    });
  });

  group('palette UI', () {
    Widget host() => MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () => showCommandPalette(context),
                  child: const Text('open'),
                ),
              ),
            ),
          ),
        );

    testWidgets('opens, filters as you type, and closes', (tester) async {
      await tester.pumpWidget(host());
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      expect(find.text('Go to…'), findsOneWidget);
      // With no query the full list shows, sorted alphabetically, so only the
      // first screenful is built. Assert on something that IS on screen rather
      // than assuming a particular destination is visible.
      expect(find.text('Add bike'), findsOneWidget);
      expect(find.text('Hazard log'), findsNothing); // below the fold

      await tester.enterText(find.byType(TextField), 'pay');
      await tester.pumpAndSettle();
      expect(find.text('Payments'), findsOneWidget);
      // A non-matching destination is gone.
      expect(find.text('Hazard log'), findsNothing);

      await tester.tap(find.byKey(const Key('palette-close')));
      await tester.pumpAndSettle();
      expect(find.text('Go to…'), findsNothing);
    });

    testWidgets('tells you when nothing matches instead of showing a blank box',
        (tester) async {
      await tester.pumpWidget(host());
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'zzzzqq');
      await tester.pumpAndSettle();
      expect(find.text('Nothing matches that.'), findsOneWidget);
    });
  });
}
