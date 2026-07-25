import 'dart:math';

import 'package:sembast/sembast.dart';

/// AUTH03: every `/guide/*` request carries `X-Device-ID` — there is no
/// JWT/KV session for guides (api-contracts.md §Auth model). The guide app
/// has no sign-in surface (UXC-NAV-4); device identity is provisioned once
/// and persisted locally (sembast_web / IndexedDB) so it survives reloads.
class DeviceService {
  DeviceService(this._db);

  final Database _db;
  static final _store = StoreRef<String, String>.main();
  static const _key = 'device_id';

  String? _cached;

  // FINDING-002: AUTH03 is "owner-issued device, no self-registration". In
  // dev, the owner-issued id is supplied via --dart-define=DEVICE_ID (a row
  // must exist in the `devices` table). Empty default falls back to the
  // legacy self-generated id (which the backend will 403 until registered).
  static const _provisionedId = String.fromEnvironment('DEVICE_ID', defaultValue: '');

  Future<String> deviceId() async {
    if (_cached != null) return _cached!;
    if (_provisionedId.isNotEmpty) {
      _cached = _provisionedId;
      await _store.record(_key).put(_db, _provisionedId);
      return _provisionedId;
    }
    final existing = await _store.record(_key).get(_db);
    if (existing != null) {
      _cached = existing;
      return existing;
    }
    final generated = _generate();
    await _store.record(_key).put(_db, generated);
    _cached = generated;
    return generated;
  }

  static String _generate() {
    final rnd = Random.secure();
    final id = List.generate(8, (_) => rnd.nextInt(36))
        .map((n) => n < 10 ? n.toString() : String.fromCharCode(97 + n - 10))
        .join()
        .toUpperCase();
    return 'DEV-GUIDE-$id';
  }
}
