import 'package:shared_preferences/shared_preferences.dart';

/// Addresses the Owner has previously sent a test to, kept on this machine.
///
/// Typing a full email address every time you check a template is the sort of
/// friction that stops people testing. These are stored locally rather than on
/// the server deliberately: they are a convenience for whoever is sitting at
/// this Mac, not business data, and they may include personal addresses used
/// for checking how mail renders. Keeping them off the server means they never
/// enter a backup, an export, or a GDPR request.
class RecentTestAddresses {
  static const _key = 'recent_test_addresses';

  /// Enough to cover the handful of inboxes anyone actually tests against —
  /// typically a work address and one or two webmail accounts for checking how
  /// Gmail and Outlook render.
  static const maxEntries = 8;

  const RecentTestAddresses();

  /// Never throws. This is a convenience feature, and it must not be able to
  /// stop the Owner sending a test email — if the store is unavailable the
  /// answer is "no suggestions", not a failure. (Found by test: an exception
  /// here prevented the Send-a-test dialog opening at all.)
  Future<List<String>> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getStringList(_key) ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// Records [address], most-recent first.
  ///
  /// Blank is ignored — an empty box means "send to the owner's own address",
  /// which is not something to remember. Matching is case-insensitive so
  /// `Will@x.com` does not sit beside `will@x.com`, but the address is stored
  /// as typed, since the local part of an email address is technically
  /// case-sensitive and rewriting it could be wrong.
  Future<List<String>> remember(String address) async {
    final trimmed = address.trim();
    if (trimmed.isEmpty) return load();

    try {
      final prefs = await SharedPreferences.getInstance();
      final existing = prefs.getStringList(_key) ?? const [];
      final lower = trimmed.toLowerCase();
      final updated = <String>[
        trimmed,
        ...existing.where((e) => e.toLowerCase() != lower),
      ].take(maxEntries).toList();

      await prefs.setStringList(_key, updated);
      return updated;
    } catch (_) {
      // Failing to REMEMBER an address must never fail the send itself.
      return const [];
    }
  }

  Future<void> forget(String address) async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getStringList(_key) ?? const [];
    final lower = address.trim().toLowerCase();
    await prefs.setStringList(
      _key,
      existing.where((e) => e.toLowerCase() != lower).toList(),
    );
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}

/// Filters [all] for [query], case-insensitively.
///
/// An empty query returns everything, so clicking into the empty box shows the
/// full list to pick from rather than nothing — which is the difference between
/// a useful shortcut and one you have to know is there.
List<String> matchAddresses(List<String> all, String query) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return all;
  return all.where((e) => e.toLowerCase().contains(q)).toList();
}
