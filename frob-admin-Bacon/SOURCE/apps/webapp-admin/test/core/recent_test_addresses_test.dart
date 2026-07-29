import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fob_webapp_admin/core/prefs/recent_test_addresses.dart';

void main() {
  const store = RecentTestAddresses();

  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('remembering', () {
    test('starts empty', () async {
      expect(await store.load(), isEmpty);
    });

    test('keeps the most recently used first', () async {
      await store.remember('a@x.com');
      await store.remember('b@x.com');
      expect(await store.load(), ['b@x.com', 'a@x.com']);
    });

    test('re-using an address moves it back to the top rather than duplicating', () async {
      await store.remember('a@x.com');
      await store.remember('b@x.com');
      await store.remember('a@x.com');
      expect(await store.load(), ['a@x.com', 'b@x.com']);
    });

    // Same inbox, different capitalisation, should not appear twice.
    test('treats addresses as the same regardless of case', () async {
      await store.remember('Will@X.com');
      await store.remember('will@x.com');
      final all = await store.load();
      expect(all, hasLength(1));
      // Stored as most recently typed — the local part of an address is
      // technically case-sensitive, so rewriting it could be wrong.
      expect(all.single, 'will@x.com');
    });

    // A blank box means "send to the owner's own address", which is not an
    // address worth remembering.
    test('ignores a blank entry', () async {
      await store.remember('   ');
      expect(await store.load(), isEmpty);
    });

    test('trims surrounding spaces', () async {
      await store.remember('  a@x.com  ');
      expect(await store.load(), ['a@x.com']);
    });

    test('keeps only the most recent few', () async {
      for (var i = 0; i < RecentTestAddresses.maxEntries + 4; i++) {
        await store.remember('user$i@x.com');
      }
      final all = await store.load();
      expect(all, hasLength(RecentTestAddresses.maxEntries));
      expect(all.first, 'user${RecentTestAddresses.maxEntries + 3}@x.com');
      expect(all, isNot(contains('user0@x.com'))); // oldest dropped
    });
  });

  group('removing', () {
    test('forget drops one address, case-insensitively', () async {
      await store.remember('a@x.com');
      await store.remember('b@x.com');
      await store.forget('A@X.COM');
      expect(await store.load(), ['b@x.com']);
    });

    test('clear empties the list', () async {
      await store.remember('a@x.com');
      await store.clear();
      expect(await store.load(), isEmpty);
    });
  });

  group('matching', () {
    const all = ['will@gmail.com', 'will@yahoo.co.uk', 'owner@friendsonbikes.uk'];

    // Clicking into an empty box should reveal the list, not hide it behind a
    // guess at the first character.
    test('an empty query offers everything', () {
      expect(matchAddresses(all, ''), all);
      expect(matchAddresses(all, '   '), all);
    });

    test('matches anywhere in the address, not just the start', () {
      expect(matchAddresses(all, 'yahoo'), ['will@yahoo.co.uk']);
      expect(matchAddresses(all, 'bikes'), ['owner@friendsonbikes.uk']);
    });

    test('is case-insensitive', () {
      expect(matchAddresses(all, 'GMAIL'), ['will@gmail.com']);
    });

    test('returns nothing when there is no match', () {
      expect(matchAddresses(all, 'zzz'), isEmpty);
    });

    test('a shared fragment returns several', () {
      expect(matchAddresses(all, 'will'), hasLength(2));
    });
  });
}
