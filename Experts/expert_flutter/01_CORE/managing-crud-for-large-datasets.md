# Managing CRUD for Large Datasets - Flutter Expert Guide

**Version**: 1.0
**Last Updated**: 2025-12-30
**Category**: Core Patterns
**Priority**: HIGH
**Target Audience**: AI Agents, Flutter Developers

---

## Table of Contents

1. [First Principle: You Do *Not* CRUD the Whole Dataset](#first-principle)
2. [Data Architecture Overview](#data-architecture)
3. [Data Shape: Normalize Early](#normalize-early)
4. [Fetch Strategy (Read)](#fetch-strategy)
5. [Local Cache Strategy](#local-cache)
6. [Write Strategy (Create / Update / Delete)](#write-strategy)
7. [Optimistic vs Pessimistic Updates](#optimistic-vs-pessimistic)
8. [Conflict Resolution & Data Fidelity](#conflict-resolution)
9. [Partial Updates (PATCH, not PUT)](#partial-updates)
10. [Background Sync Loop](#background-sync)
11. [Cache Invalidation Rules](#cache-invalidation)
12. [Data Fidelity Guarantees](#data-fidelity)
13. [Performance Techniques](#performance-techniques)
14. [Web-Specific Notes](#web-specific)
15. [What *Not* To Do](#what-not-to-do)
16. [Minimal Mental Model](#minimal-mental-model)
17. [Related Documentation](#related-docs)

---

## Overview

This guide provides a **production-grade approach** to handling **CRUD over large JSON datasets fetched via HTTP**, with an emphasis on **caching, consistency, and performance**. This is framework-agnostic in principle, with Flutter-specific guidance where relevant.

**When to use this guide:**
- Building features that consume large API responses (100+ items)
- Implementing offline-first capabilities
- Managing complex data synchronization
- Optimizing app performance with remote data

**Related patterns:**
- [Frontend DDD Architecture](frontend_ddd_architecture_expert.md) - Overall architecture context
- [Error Handling Patterns](error_handling_patterns_expert.md) - Error handling for sync failures
- [Parse Server Integration](../03_INTEGRATIONS/parse_flutter_integration_patterns.md) - Backend integration patterns

---

<a name="first-principle"></a>
## 1. First Principle: You Do *Not* CRUD the Whole Dataset

For large datasets:

* **Never** treat the JSON response as a single mutable blob
* **Never** re-fetch or re-serialize the entire dataset for small changes
* **Never** assume client and server are in sync

Instead, treat the server as **authoritative** and the client as a **replicated cache with intent**.

### Why This Matters

```dart
// ❌ WRONG: Treating API response as app state
class ProductListPage extends StatefulWidget {
  @override
  State<ProductListPage> createState() => _ProductListPageState();
}

class _ProductListPageState extends State<ProductListPage> {
  List<Product> products = [];

  void loadProducts() async {
    final response = await http.get('/api/products');
    setState(() {
      products = (json.decode(response.body) as List)
          .map((e) => Product.fromJson(e))
          .toList();
    });
  }

  void updateProduct(Product updated) async {
    // Re-fetching entire list for single update!
    await http.put('/api/products/${updated.id}', body: updated.toJson());
    loadProducts(); // ❌ Wasteful
  }
}

// ✅ RIGHT: Using local cache + delta updates
class ProductRepository {
  final Map<String, Product> _cache = {};

  Future<void> updateProduct(Product updated) async {
    // Optimistic update
    _cache[updated.id] = updated;

    // Sync to server
    await http.put('/api/products/${updated.id}', body: updated.toJson());
  }

  Stream<List<Product>> watchProducts() {
    return _cacheController.stream;
  }
}
```

---

<a name="data-architecture"></a>
## 2. Data Architecture Overview

**Recommended layers**

```
HTTP API
  ↓
Remote Data Source (stateless)
  ↓
Local Store (authoritative for UI)
  ↓
Domain Models
  ↓
UI
```

CRUD flows through the **local store**, not directly from HTTP → UI.

### Layer Responsibilities

```dart
// Remote Data Source (stateless)
class ProductRemoteDataSource {
  Future<List<ProductDto>> fetchProducts({
    int? page,
    DateTime? updatedSince,
  }) async {
    final response = await http.get('/api/products', queryParameters: {
      'page': page,
      'updatedSince': updatedSince?.toIso8601String(),
    });
    return (json.decode(response.body) as List)
        .map((e) => ProductDto.fromJson(e))
        .toList();
  }
}

// Local Store (authoritative)
class ProductLocalStore {
  final Map<String, Product> _cache = {};
  final StreamController<List<Product>> _controller = StreamController.broadcast();

  void upsert(Product product) {
    _cache[product.id] = product;
    _controller.add(_cache.values.toList());
  }

  Stream<List<Product>> watchAll() => _controller.stream;

  Product? findById(String id) => _cache[id];
}

// Repository (orchestrates sync)
class ProductRepository {
  final ProductRemoteDataSource _remote;
  final ProductLocalStore _local;

  Stream<List<Product>> watchProducts() {
    _syncInBackground();
    return _local.watchAll();
  }

  Future<void> updateProduct(Product product) async {
    // Optimistic update
    _local.upsert(product);

    // Sync to server
    try {
      await _remote.updateProduct(product.toDto());
    } catch (e) {
      // Rollback on failure
      _local.remove(product.id);
      rethrow;
    }
  }

  Future<void> _syncInBackground() async {
    final products = await _remote.fetchProducts();
    for (final dto in products) {
      _local.upsert(Product.fromDto(dto));
    }
  }
}
```

---

<a name="normalize-early"></a>
## 3. Data Shape: Normalize Early

Large JSON responses should be **normalized** immediately.

### Example (bad)

```json
[
  { "id": 1, "name": "A", "owner": { "id": 10, "name": "Alice" } },
  { "id": 2, "name": "B", "owner": { "id": 10, "name": "Alice" } }
]
```

**Problems:**
- Owner duplicated
- O(n) lookup by ID
- Updating Alice requires scanning all products

### Example (good)

```dart
class ProductStore {
  final Map<String, Product> products = {};
  final Map<String, User> users = {};

  void ingest(List<ProductDto> dtos) {
    for (final dto in dtos) {
      // Normalize owner
      users[dto.owner.id] = User.fromDto(dto.owner);

      // Store product with owner reference
      products[dto.id] = Product(
        id: dto.id,
        name: dto.name,
        ownerId: dto.owner.id, // Reference, not embedded
      );
    }
  }

  Product? getProduct(String id) {
    final product = products[id];
    if (product == null) return null;

    final owner = users[product.ownerId];
    return product.copyWith(owner: owner);
  }
}
```

**Benefits:**

* O(1) lookup
* Cheap updates (update Alice once, all products reflect it)
* Partial invalidation
* Minimal rebuilds

---

<a name="fetch-strategy"></a>
## 4. Fetch Strategy (Read)

### Pagination + Delta Fetching

* Use server-side pagination
* Support `updatedSince`, `cursor`, or `version` parameters
* Avoid offset pagination for mutable datasets

```dart
class ProductRemoteDataSource {
  Future<PagedResponse<ProductDto>> fetchProducts({
    String? cursor,
    DateTime? updatedSince,
    int limit = 50,
  }) async {
    final response = await http.get('/api/products', queryParameters: {
      'cursor': cursor,
      'updatedSince': updatedSince?.toIso8601String(),
      'limit': limit,
    });

    return PagedResponse.fromJson(json.decode(response.body));
  }
}
```

**HTTP caching headers**

* `ETag` + `If-None-Match`
* `Last-Modified` + `If-Modified-Since`

This prevents re-downloading identical payloads.

```dart
class CachedHttpClient {
  final Map<String, String> _etags = {};

  Future<Response> get(String url) async {
    final headers = <String, String>{};

    if (_etags.containsKey(url)) {
      headers['If-None-Match'] = _etags[url]!;
    }

    final response = await http.get(url, headers: headers);

    if (response.statusCode == 304) {
      // Not modified, use cached data
      return _cachedResponse[url]!;
    }

    // Update cache
    _etags[url] = response.headers['etag'] ?? '';
    _cachedResponse[url] = response;

    return response;
  }
}
```

---

<a name="local-cache"></a>
## 5. Local Cache Strategy

### Storage Choice (Flutter)

| Data Size       | Recommended                | Examples                      |
| --------------- | -------------------------- | ----------------------------- |
| Small (<5MB)    | In-memory + disk snapshot  | Settings, recent searches     |
| Medium (5–50MB) | SQLite / Drift / Isar      | Product catalog, order history|
| Large (50MB+)   | Database + streaming fetch | Media library, analytics data |

**Avoid JSON files on disk for large mutable datasets.**

### Implementation Example (Drift)

```dart
// Define table
class Products extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get ownerId => text()();
  IntColumn get version => integer()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// Repository with database cache
class ProductRepository {
  final AppDatabase _db;
  final ProductRemoteDataSource _remote;

  Stream<List<Product>> watchProducts() {
    return _db.select(_db.products).watch().map((rows) {
      return rows.map((row) => Product.fromDbRow(row)).toList();
    });
  }

  Future<void> sync() async {
    final lastSync = await _db.getLastSyncTime();
    final updates = await _remote.fetchProducts(updatedSince: lastSync);

    await _db.batch((batch) {
      for (final dto in updates) {
        batch.insert(
          _db.products,
          ProductsCompanion.insert(
            id: dto.id,
            name: dto.name,
            ownerId: dto.ownerId,
            version: dto.version,
            updatedAt: dto.updatedAt,
          ),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
  }
}
```

---

<a name="write-strategy"></a>
## 6. Write Strategy (Create / Update / Delete)

### Never Mutate Remote Data Directly in UI

Instead:

1. Apply **optimistic update** to local store
2. Mark entity as `dirty`
3. Queue HTTP mutation
4. Reconcile response

```dart
enum SyncStatus { synced, pending, failed }

class Product {
  final String id;
  final String name;
  final int version;
  final SyncStatus syncStatus;

  Product({
    required this.id,
    required this.name,
    required this.version,
    this.syncStatus = SyncStatus.synced,
  });
}

class ProductRepository {
  final ProductLocalStore _local;
  final ProductRemoteDataSource _remote;
  final SyncQueue _syncQueue;

  Future<void> updateProduct(Product product) async {
    // 1. Optimistic update
    final pending = product.copyWith(syncStatus: SyncStatus.pending);
    _local.upsert(pending);

    // 2. Queue for sync
    _syncQueue.enqueue(SyncOperation.update(product));

    // 3. Background sync handles the rest
  }
}

class SyncQueue {
  final List<SyncOperation> _queue = [];

  void enqueue(SyncOperation op) {
    _queue.add(op);
    _processQueue();
  }

  Future<void> _processQueue() async {
    while (_queue.isNotEmpty) {
      final op = _queue.removeAt(0);

      try {
        final result = await op.execute();
        _local.upsert(result.copyWith(syncStatus: SyncStatus.synced));
      } catch (e) {
        _local.upsert(op.entity.copyWith(syncStatus: SyncStatus.failed));
        // Retry with backoff
      }
    }
  }
}
```

---

<a name="optimistic-vs-pessimistic"></a>
## 7. Optimistic vs Pessimistic Updates

### Optimistic (preferred for UX)

* Immediate UI update
* Roll back on failure
* Requires conflict handling

```dart
Future<void> updateProductOptimistic(Product product) async {
  // Immediate UI update
  _local.upsert(product);

  try {
    final result = await _remote.updateProduct(product);
    _local.upsert(result); // Reconcile with server response
  } catch (e) {
    // Rollback
    final original = await _local.findById(product.id);
    _local.upsert(original!);
    rethrow;
  }
}
```

### Pessimistic

* Wait for server response
* Simpler but slower UX

```dart
Future<void> updateProductPessimistic(Product product) async {
  // Show loading indicator
  _isLoading.value = true;

  try {
    final result = await _remote.updateProduct(product);
    _local.upsert(result);
  } finally {
    _isLoading.value = false;
  }
}
```

**Use pessimistic for:**

* Financial data
* Irreversible operations
* High-conflict scenarios

---

<a name="conflict-resolution"></a>
## 8. Conflict Resolution & Data Fidelity

### Versioning is mandatory

Each entity should include:

```json
{
  "id": "123",
  "version": 7,
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

On update:

* Client sends `version`
* Server rejects stale writes (409 Conflict)
* Client refreshes entity

```dart
class ProductRemoteDataSource {
  Future<Product> updateProduct(Product product) async {
    final response = await http.put(
      '/api/products/${product.id}',
      body: json.encode({
        'name': product.name,
        'version': product.version, // ← Required
      }),
    );

    if (response.statusCode == 409) {
      throw ConflictException('Stale version, refresh and retry');
    }

    return Product.fromJson(json.decode(response.body));
  }
}

class ProductRepository {
  Future<void> updateProduct(Product product) async {
    try {
      final updated = await _remote.updateProduct(product);
      _local.upsert(updated);
    } on ConflictException {
      // Refresh from server
      final latest = await _remote.fetchProduct(product.id);
      _local.upsert(latest);

      // Notify user to retry
      throw UserFacingException('Product was updated by another user. Please refresh and try again.');
    }
  }
}
```

This guarantees **no silent data loss**.

---

<a name="partial-updates"></a>
## 9. Partial Updates (PATCH, not PUT)

* Use `PATCH` for updates
* Send only changed fields
* Reduces payload size
* Reduces conflict surface

```dart
class ProductRemoteDataSource {
  Future<Product> patchProduct(String id, Map<String, dynamic> changes) async {
    final response = await http.patch(
      '/api/products/$id',
      body: json.encode(changes),
    );

    return Product.fromJson(json.decode(response.body));
  }
}

// Usage
await _remote.patchProduct(product.id, {
  'name': newName,
  'version': product.version,
});
```

---

<a name="background-sync"></a>
## 10. Background Sync Loop

Implement a **sync coordinator**:

```
Timer / Connectivity change / App resume
  → Flush write queue
  → Pull deltas
  → Resolve conflicts
```

This is where eventual consistency lives.

```dart
class SyncCoordinator {
  final ProductRepository _repo;
  Timer? _syncTimer;

  void start() {
    // Periodic sync
    _syncTimer = Timer.periodic(Duration(minutes: 5), (_) => sync());

    // Sync on connectivity change
    Connectivity().onConnectivityChanged.listen((_) => sync());

    // Sync on app resume
    WidgetsBinding.instance.addObserver(LifecycleEventHandler(
      resumeCallBack: () => sync(),
    ));
  }

  Future<void> sync() async {
    // 1. Flush write queue
    await _syncQueue.flush();

    // 2. Pull deltas
    final lastSync = await _local.getLastSyncTime();
    final updates = await _remote.fetchProducts(updatedSince: lastSync);

    // 3. Resolve conflicts
    for (final update in updates) {
      final local = _local.findById(update.id);

      if (local != null && local.syncStatus == SyncStatus.pending) {
        // Conflict: local pending write + remote update
        await _resolveConflict(local, update);
      } else {
        _local.upsert(update);
      }
    }

    await _local.setLastSyncTime(DateTime.now());
  }

  Future<void> _resolveConflict(Product local, Product remote) async {
    if (local.version >= remote.version) {
      // Local is newer, keep pending write
      return;
    }

    // Remote is newer, discard local changes
    _local.upsert(remote);
    _syncQueue.remove(local.id);
  }
}
```

---

<a name="cache-invalidation"></a>
## 11. Cache Invalidation Rules

**Never**

* Clear entire cache on small changes
* Re-fetch full lists after single mutations

**Instead**

* Invalidate by entity ID
* Invalidate by collection page
* Time-bound stale data (TTL per collection)

```dart
class CacheManager {
  final Map<String, DateTime> _lastFetch = {};
  final Duration _ttl = Duration(minutes: 30);

  bool isStale(String key) {
    final lastFetch = _lastFetch[key];
    if (lastFetch == null) return true;

    return DateTime.now().difference(lastFetch) > _ttl;
  }

  void invalidate(String key) {
    _lastFetch.remove(key);
  }

  void touch(String key) {
    _lastFetch[key] = DateTime.now();
  }
}

class ProductRepository {
  final CacheManager _cache;

  Future<Product> getProduct(String id) async {
    if (_cache.isStale('product:$id')) {
      final product = await _remote.fetchProduct(id);
      _local.upsert(product);
      _cache.touch('product:$id');
      return product;
    }

    return _local.findById(id)!;
  }
}
```

---

<a name="data-fidelity"></a>
## 12. Data Fidelity Guarantees

To maintain correctness:

* Server remains source of truth
* Client changes are intent, not authority
* Every mutation is:
  * Versioned
  * Acknowledged
  * Reconciled

If the client crashes mid-write:

* Pending mutations replay on restart

```dart
class PersistedSyncQueue {
  final AppDatabase _db;

  Future<void> enqueue(SyncOperation op) async {
    await _db.into(_db.syncQueue).insert(
      SyncQueueCompanion.insert(
        operation: op.type,
        entityId: op.entityId,
        payload: json.encode(op.payload),
        createdAt: DateTime.now(),
      ),
    );

    _processQueue();
  }

  Future<void> replayOnStartup() async {
    final pending = await _db.select(_db.syncQueue).get();

    for (final op in pending) {
      await _execute(op);
      await _db.delete(_db.syncQueue).delete(op);
    }
  }
}
```

---

<a name="performance-techniques"></a>
## 13. Performance Techniques

### Parsing

* Parse JSON in an isolate
* Stream decode large payloads

```dart
Future<List<Product>> parseProductsInIsolate(String json) async {
  return compute(_parseProducts, json);
}

List<Product> _parseProducts(String json) {
  final list = jsonDecode(json) as List;
  return list.map((e) => Product.fromJson(e)).toList();
}
```

### Memory

* Keep only visible window in memory for UI
* Evict inactive entities

```dart
class WindowedCache {
  final Map<String, Product> _cache = {};
  final int _maxSize = 100;

  void add(Product product) {
    if (_cache.length >= _maxSize) {
      // Evict least recently accessed
      final lru = _findLRU();
      _cache.remove(lru);
    }

    _cache[product.id] = product;
  }
}
```

### UI

* UI binds to IDs, not full objects
* Resolve entities lazily

```dart
class ProductListItem extends StatelessWidget {
  final String productId;

  @override
  Widget build(BuildContext context) {
    return BlocSelector<ProductBloc, ProductState, Product?>(
      selector: (state) => state.products[productId],
      builder: (context, product) {
        if (product == null) {
          // Trigger fetch
          context.read<ProductBloc>().add(FetchProductEvent(productId));
          return LoadingIndicator();
        }

        return ListTile(title: Text(product.name));
      },
    );
  }
}
```

---

<a name="web-specific"></a>
## 14. Web-Specific Notes

* Use IndexedDB (via `drift` / `isar`) for persistence
* Avoid blocking parse on main thread
* Use HTTP caching aggressively

```dart
// Web-specific: Use IndexedDB via drift_web
@DriftDatabase(tables: [Products])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  static QueryExecutor _openConnection() {
    return WebDatabase('app_db', logStatements: true);
  }
}
```

---

<a name="what-not-to-do"></a>
## 15. What *Not* To Do

* ❌ Treat API responses as app state
* ❌ Rebuild entire lists on each CRUD op
* ❌ Use `setState` for data-layer changes
* ❌ Store giant JSON blobs
* ❌ Trust timestamps alone without versions

```dart
// ❌ WRONG: API response as app state
class _ProductListPageState extends State<ProductListPage> {
  List<Product> products = [];

  @override
  void initState() {
    super.initState();
    http.get('/api/products').then((res) {
      setState(() {
        products = parseProducts(res.body);
      });
    });
  }
}

// ✅ RIGHT: BLoC + Repository
class ProductListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => ProductBloc(
        repository: context.read<ProductRepository>(),
      )..add(LoadProductsEvent()),
      child: BlocBuilder<ProductBloc, ProductState>(
        builder: (context, state) {
          return ListView.builder(
            itemCount: state.products.length,
            itemBuilder: (context, index) {
              return ProductListItem(productId: state.products[index].id);
            },
          );
        },
      ),
    );
  }
}
```

---

<a name="minimal-mental-model"></a>
## 16. Minimal Mental Model

> **Your app is a distributed system, even if it's "just Flutter".**

Once you design for that reality:

* Performance improves
* Bugs disappear
* Sync logic becomes predictable

### Core Principles

1. **Server is authoritative** - Client is cache
2. **Version everything** - No silent data loss
3. **Optimistic UI** - Immediate feedback
4. **Eventual consistency** - Background sync handles it
5. **Normalize early** - O(1) lookups, cheap updates

---

<a name="related-docs"></a>
## 17. Related Documentation

### Essential Reading
- **[Frontend DDD Architecture](frontend_ddd_architecture_expert.md)** - Overall architecture context
- **[Error Handling Patterns](error_handling_patterns_expert.md)** - Handling sync failures
- **[BLoC Event Naming Convention](bloc_event_naming_convention_guide.md)** - State management

### Integration Patterns
- **[Parse Server Integration](../03_INTEGRATIONS/parse_flutter_integration_patterns.md)** - Backend integration
- **[Timeout Strategy Guide](../02_PATTERNS/timeout_strategy_guide.md)** - Network timeouts

### Platform-Specific
- **[Web UI Patterns](../06_PLATFORM_SPECIFIC/web_ui_patterns.md)** - Web-specific considerations

---

## Next Steps

If you want next steps, I can:

* Sketch a concrete Flutter repository pattern
* Show an optimistic update + rollback example
* Design a sync queue + conflict handler
* Tailor this for **Flutter Web vs Mobile**
* Map this onto your unstructured / semi-structured data use case

---

**Version History:**
- v1.0 (2025-12-30): Initial guide created

**Maintained By:** Architecture Team
**Review Cycle:** Quarterly
