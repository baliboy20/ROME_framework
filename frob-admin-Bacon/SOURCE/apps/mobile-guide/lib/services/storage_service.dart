import 'package:sembast_web/sembast_web.dart';

/// TDR-16 (as revised by DEV-2): offline persistence via `sembast_web`
/// (IndexedDB), not native `sembast`/FMTC/Hive. One shared database opened
/// once at startup and injected via get_it.
class StorageService {
  StorageService._(this.db);

  final Database db;

  static Future<StorageService> open() async {
    final factory = databaseFactoryWeb;
    final db = await factory.openDatabase('fob_mobile_guide.db');
    return StorageService._(db);
  }
}

/// Generic key-value JSON-map store for session/draft state — UXC-SCR-2:
/// "in-progress input is preserved across interruption" and UXD-G-08's
/// draft-save both depend on this surviving a PWA backgrounding/reload.
class SessionStore {
  SessionStore(this._db) : _record = StoreRef<String, Map<String, Object?>>.main().record('tour_session');

  final Database _db;
  final RecordRef<String, Map<String, Object?>> _record;

  Future<Map<String, Object?>?> read() => _record.get(_db);

  Future<void> write(Map<String, Object?> json) => _record.put(_db, json);

  Future<void> clear() => _record.delete(_db);
}
