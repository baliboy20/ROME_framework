# Widget Design for Performance - Flutter Expert Guide

**Version**: 1.0
**Last Updated**: 2025-12-30
**Category**: Performance Patterns
**Priority**: HIGH
**Target Audience**: AI Agents, Flutter Developers

---

## Table of Contents

1. [Build & Render Pipeline](#build-render-pipeline)
2. [State Management](#state-management)
3. [Lists, Grids & Large Data Sets](#lists-grids)
4. [Layout & Widgets](#layout-widgets)
5. [Animations](#animations)
6. [Async, Isolates & Workloads](#async-isolates)
7. [Images & Assets](#images-assets)
8. [Flutter Web Specifics](#flutter-web)
9. [Debugging & Profiling](#debugging-profiling)
10. [Build & Deployment](#build-deployment)
11. [Object Allocation & GC Pressure](#object-allocation)
12. [Equality, ==, and hashCode](#equality-hashcode)
13. [setState Discipline](#setstate-discipline)
14. [Streams & Listeners](#streams-listeners)
15. [JSON, Parsing & Serialization](#json-parsing)
16. [Logging & Debug Code](#logging-debug)
17. [Layout Thrashing](#layout-thrashing)
18. [Fonts & Text](#fonts-text)
19. [Navigation & Routing](#navigation-routing)
20. [Memory Leaks](#memory-leaks)
21. [Platform Channels](#platform-channels)
22. [Compilation & Tree Shape](#compilation-tree-shape)
23. [Performance Budgeting](#performance-budgeting)
24. [The Uncomfortable Truth](#uncomfortable-truth)
25. [Related Documentation](#related-docs)

---

## Overview

This guide provides **less-obvious but high-impact Flutter performance practices** that tend to be missed, especially in non-trivial apps. These are engineering-focused patterns organized by layer, applicable to mobile and web unless explicitly noted.

**High-Level Rule of Thumb:**
> **If it rebuilds often, make it cheap. If it's expensive, make it rare.**

**When to use this guide:**
- Building production Flutter applications
- Optimizing app performance
- Debugging jank and frame drops
- Improving Flutter Web performance

---

<a name="build-render-pipeline"></a>
## 1. Build & Render Pipeline

### Minimise Rebuilds

* **Prefer const constructors** wherever possible
* **Split large widgets** into smaller, focused widgets
* **Use const + final aggressively** - immutability helps the framework short-circuit rebuilds
* **Avoid putting heavy logic inside build()**

```dart
// ❌ WRONG: Heavy computation in build
class ProductCard extends StatelessWidget {
  final Product product;

  @override
  Widget build(BuildContext context) {
    // Recomputes on every rebuild!
    final discountedPrice = product.price * (1 - product.discount);
    final formattedPrice = NumberFormat.currency(symbol: '\$').format(discountedPrice);

    return Card(
      child: Text(formattedPrice),
    );
  }
}

// ✅ RIGHT: Computation outside build
class Product {
  final double price;
  final double discount;

  late final double discountedPrice = price * (1 - discount);
  late final String formattedPrice = NumberFormat.currency(symbol: '\$').format(discountedPrice);
}

class ProductCard extends StatelessWidget {
  const ProductCard({required this.product, super.key});

  final Product product;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Text(product.formattedPrice),
    );
  }
}
```

### Control Rebuild Scope

* Use **Builder**, **ValueListenableBuilder**, **AnimatedBuilder**, or **Consumer** to localise rebuilds
* Avoid rebuilding entire screens when only a small subtree changes

```dart
// ❌ WRONG: Entire screen rebuilds for counter
class CounterScreen extends StatefulWidget {
  @override
  State<CounterScreen> createState() => _CounterScreenState();
}

class _CounterScreenState extends State<CounterScreen> {
  int counter = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Counter')),
      body: Column(
        children: [
          ExpensiveHeader(), // Rebuilds unnecessarily!
          Text('Count: $counter'),
          ExpensiveFooter(), // Rebuilds unnecessarily!
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => counter++),
      ),
    );
  }
}

// ✅ RIGHT: Only counter rebuilds
class CounterScreen extends StatefulWidget {
  @override
  State<CounterScreen> createState() => _CounterScreenState();
}

class _CounterScreenState extends State<CounterScreen> {
  final ValueNotifier<int> counter = ValueNotifier(0);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Counter')),
      body: Column(
        children: [
          const ExpensiveHeader(), // const = never rebuilds
          ValueListenableBuilder<int>(
            valueListenable: counter,
            builder: (context, value, child) => Text('Count: $value'),
          ),
          const ExpensiveFooter(), // const = never rebuilds
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => counter.value++,
      ),
    );
  }

  @override
  void dispose() {
    counter.dispose();
    super.dispose();
  }
}
```

### Keys

* **Use keys only when required** (lists, reordering). Unnecessary keys add overhead
* **Prefer ValueKey over UniqueKey** unless identity truly must change

```dart
// ❌ WRONG: Unnecessary keys everywhere
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return ListTile(
      key: UniqueKey(), // ❌ Forces rebuild
      title: Text(items[index]),
    );
  },
);

// ✅ RIGHT: Keys only when needed (reorderable list)
ReorderableListView(
  children: items.map((item) {
    return ListTile(
      key: ValueKey(item.id), // ✅ Stable identity
      title: Text(item.name),
    );
  }).toList(),
  onReorder: (oldIndex, newIndex) { /* ... */ },
);
```

---

<a name="state-management"></a>
## 2. State Management

### Avoid Over-Notification

* Ensure your state solution only notifies listeners when data actually changes
* For ChangeNotifier, avoid calling `notifyListeners()` redundantly

```dart
// ❌ WRONG: Notifies even when value doesn't change
class CounterNotifier extends ChangeNotifier {
  int _count = 0;

  void increment() {
    _count++;
    notifyListeners(); // Always notifies
  }

  void setCount(int value) {
    _count = value;
    notifyListeners(); // ❌ Notifies even if value is same
  }
}

// ✅ RIGHT: Only notifies on actual change
class CounterNotifier extends ChangeNotifier {
  int _count = 0;

  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();
  }

  void setCount(int value) {
    if (_count != value) { // ✅ Guard check
      _count = value;
      notifyListeners();
    }
  }
}
```

### Granular State

* **Split state by concern** (UI state vs domain state)
* **Avoid global "god" providers** that cause wide rebuilds

```dart
// ❌ WRONG: Monolithic state
class AppState extends ChangeNotifier {
  int cartCount = 0;
  String userName = '';
  bool isDarkMode = false;

  // Changing any field notifies ALL listeners
}

// ✅ RIGHT: Granular state
class CartState extends ChangeNotifier {
  int _count = 0;
  int get count => _count;
}

class UserState extends ChangeNotifier {
  String _name = '';
  String get name => _name;
}

class ThemeState extends ChangeNotifier {
  bool _isDark = false;
  bool get isDark => _isDark;
}
```

### Async State

* **Cache results of async calls** where possible
* **Avoid triggering network calls from build()**; use lifecycle hooks (initState, controllers)

```dart
// ❌ WRONG: Network call in build
class ProductList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: fetchProducts(), // ❌ Called every rebuild!
      builder: (context, snapshot) { /* ... */ },
    );
  }
}

// ✅ RIGHT: Call in initState or controller
class ProductList extends StatefulWidget {
  @override
  State<ProductList> createState() => _ProductListState();
}

class _ProductListState extends State<ProductList> {
  late final Future<List<Product>> _productsFuture;

  @override
  void initState() {
    super.initState();
    _productsFuture = fetchProducts(); // ✅ Called once
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: _productsFuture,
      builder: (context, snapshot) { /* ... */ },
    );
  }
}
```

---

<a name="lists-grids"></a>
## 3. Lists, Grids & Large Data Sets

### Lazy Rendering

* **Always use ListView.builder, GridView.builder, or SliverList** for large collections
* **Avoid pre-building children**

```dart
// ❌ WRONG: Builds all 10,000 items upfront
ListView(
  children: products.map((p) => ProductCard(p)).toList(),
);

// ✅ RIGHT: Lazy rendering
ListView.builder(
  itemCount: products.length,
  itemBuilder: (context, index) => ProductCard(products[index]),
);
```

### Item Widgets

* **Keep list item widgets shallow**
* **Avoid expensive layout widgets** (IntrinsicHeight, IntrinsicWidth) inside lists

```dart
// ❌ WRONG: IntrinsicHeight in list
ListView.builder(
  itemBuilder: (context, index) {
    return IntrinsicHeight( // ❌ Expensive!
      child: Row(
        children: [
          Expanded(child: Column(...)),
          Expanded(child: Column(...)),
        ],
      ),
    );
  },
);

// ✅ RIGHT: Fixed height or CrossAxisAlignment
ListView.builder(
  itemBuilder: (context, index) {
    return SizedBox(
      height: 100, // ✅ Fixed height
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(child: Column(...)),
          Expanded(child: Column(...)),
        ],
      ),
    );
  },
);
```

### Pagination & Windowing

* **Paginate remote data**
* **Do not load or render thousands of items "just in case"**

---

<a name="layout-widgets"></a>
## 4. Layout & Widgets

### Avoid Expensive Widgets

* Minimise use of:
  * **Opacity** (forces offscreen rendering)
  * **ShaderMask**
  * **BackdropFilter**
  * **ClipPath**
* If clipping is required, **prefer ClipRect over complex paths**

```dart
// ❌ WRONG: Opacity widget
Opacity(
  opacity: 0.5,
  child: ExpensiveWidget(),
);

// ✅ RIGHT: Use color alpha or AnimatedOpacity
Container(
  color: Colors.black.withOpacity(0.5), // ✅ Cheaper
  child: ExpensiveWidget(),
);

// Or for animations:
AnimatedOpacity(
  opacity: _visible ? 1.0 : 0.0,
  duration: Duration(milliseconds: 300),
  child: ExpensiveWidget(),
);
```

### Repaint Control

* **Use RepaintBoundary around expensive or frequently animating widgets**
* **Do not overuse it**—each boundary has memory cost

```dart
RepaintBoundary(
  child: AnimatedWidget(...), // ✅ Isolates repaints
);
```

### Constraints

* **Avoid deeply nested Row/Column structures**
* **Prefer Flex + Expanded/Flexible** over manual size calculations

---

<a name="animations"></a>
## 5. Animations

### Keep Animations Cheap

* **Prefer implicit animations** (AnimatedContainer, etc.) for simple cases
* **Avoid animating layout** when a transform (Transform.translate/scale) will suffice

```dart
// ❌ WRONG: Animating layout (expensive)
AnimatedContainer(
  duration: Duration(milliseconds: 300),
  margin: EdgeInsets.only(left: _isOpen ? 200 : 0),
  child: ExpensiveWidget(),
);

// ✅ RIGHT: Animating transform (cheap)
AnimatedBuilder(
  animation: _controller,
  builder: (context, child) {
    return Transform.translate(
      offset: Offset(_controller.value * 200, 0),
      child: child,
    );
  },
  child: ExpensiveWidget(),
);
```

### Tick Discipline

* **Dispose AnimationControllers promptly**
* **Avoid offscreen or background animations**

---

<a name="async-isolates"></a>
## 6. Async, Isolates & Workloads

### Main Isolate Discipline

* **Never do CPU-heavy work** (JSON parsing, encryption, large loops) on the UI isolate
* Use:
  * **compute()** for short background work
  * **Custom isolates** for sustained processing

```dart
// ❌ WRONG: Heavy JSON parsing on UI thread
final products = jsonDecode(largeJsonString)
    .map((e) => Product.fromJson(e))
    .toList();

// ✅ RIGHT: Offload to isolate
final products = await compute(_parseProducts, largeJsonString);

List<Product> _parseProducts(String json) {
  return (jsonDecode(json) as List)
      .map((e) => Product.fromJson(e))
      .toList();
}
```

### Batching

* **Batch state updates** instead of emitting many small changes
* **Debounce user input and network calls**

---

<a name="images-assets"></a>
## 7. Images & Assets

### Images

* **Use appropriately sized images** (avoid decoding 4K assets for 100px views)
* **Use cacheWidth / cacheHeight** where applicable
* **Prefer Image.memory only for small images**

```dart
// ❌ WRONG: Full resolution image for thumbnail
Image.network('https://example.com/huge-image.jpg');

// ✅ RIGHT: Resize for thumbnail
Image.network(
  'https://example.com/huge-image.jpg',
  cacheWidth: 100,
  cacheHeight: 100,
);
```

### Web-Specific

* **Avoid excessive PNG transparency; prefer WebP**
* **Use flutter build web --release always for profiling**

---

<a name="flutter-web"></a>
## 8. Flutter Web Specifics (Important)

### Avoid UI Thread Blocking

* Long async operations can still stall rendering on web
* Break work into smaller chunks or defer using Future.microtask / scheduleTask

### Scrolling & Layout

* **Avoid nested scroll views**
* **Be cautious with LayoutBuilder in large trees**

### Canvas vs HTML Renderer

* **CanvasKit**: heavier but smoother for graphics-heavy apps
* **HTML renderer**: lighter, better for text-heavy UIs

---

<a name="debugging-profiling"></a>
## 9. Debugging & Profiling

### Always Profile in Release Mode

```bash
flutter run --release
flutter run --profile
```

### Tools

* **Flutter DevTools**:
  * Frame rendering (jank)
  * Rebuild counts
  * Memory leaks
* `debugProfileBuildsEnabled = true`
* `debugPrintRebuildDirtyWidgets = true` (short-term only)

---

<a name="build-deployment"></a>
## 10. Build & Deployment

### Release Builds

* Disable asserts, logs, and debug flags
* Tree-shake icons (`--tree-shake-icons`)

### Dependencies

* Audit packages regularly
* Avoid heavy abstractions for trivial functionality

---

<a name="object-allocation"></a>
## 11. Object Allocation & GC Pressure

### Avoid Churn

* **Reuse objects in hot paths** (e.g. formatters, painters, controllers)
* **Avoid creating new lists/maps in build()** if contents are stable
* **Prefer late final over repeatedly recomputed values**

```dart
// ❌ WRONG: Creates new formatter every build
class PriceWidget extends StatelessWidget {
  final double price;

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(symbol: '\$'); // ❌
    return Text(formatter.format(price));
  }
}

// ✅ RIGHT: Reuse formatter
class PriceWidget extends StatelessWidget {
  static final _formatter = NumberFormat.currency(symbol: '\$');

  final double price;

  @override
  Widget build(BuildContext context) {
    return Text(_formatter.format(price));
  }
}
```

### Closures

* **Avoid inline closures in frequently rebuilt widgets** (lists, animated builders)
* **Hoist callbacks to fields when possible**

**Why it matters:** Flutter apps usually stutter due to GC pauses, not raw CPU.

---

<a name="equality-hashcode"></a>
## 12. Equality, ==, and hashCode

### Cheap Equality

* **Ensure models have fast == and hashCode**
* **Avoid deep equality checks on large object graphs**
* **Consider identity comparison for UI-only state**

**Bad equality = state management accidentally O(n²).**

```dart
// ❌ WRONG: Deep equality check
class Product {
  final String id;
  final List<Review> reviews; // Large list

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Product &&
          id == other.id &&
          reviews.toString() == other.reviews.toString(); // ❌ Expensive!
}

// ✅ RIGHT: Identity-based equality
class Product {
  final String id;
  final List<Review> reviews;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Product && id == other.id; // ✅ Fast

  @override
  int get hashCode => id.hashCode;
}
```

---

<a name="setstate-discipline"></a>
## 13. setState Discipline

### Batch Updates

```dart
// ❌ WRONG: Multiple setState calls
void updateData() {
  setState(() => a = ...);
  setState(() => b = ...);
  setState(() => c = ...);
}

// ✅ RIGHT: Single setState
void updateData() {
  setState(() {
    a = ...;
    b = ...;
    c = ...;
  });
}
```

### Guard Updates

```dart
if (mounted && newValue != oldValue) {
  setState(() => value = newValue);
}
```

---

<a name="streams-listeners"></a>
## 14. Streams & Listeners

### Lifecycle Hygiene

* **Always cancel subscriptions in dispose()**
* **Watch for accidental multiple subscriptions on rebuild**

```dart
class DataWidget extends StatefulWidget {
  @override
  State<DataWidget> createState() => _DataWidgetState();
}

class _DataWidgetState extends State<DataWidget> {
  StreamSubscription? _subscription;

  @override
  void initState() {
    super.initState();
    _subscription = dataStream.listen(_handleData);
  }

  @override
  void dispose() {
    _subscription?.cancel(); // ✅ Always cancel
    super.dispose();
  }

  void _handleData(Data data) {
    if (mounted) {
      setState(() { /* ... */ });
    }
  }
}
```

### Prefer Pull Over Push

* **Use ValueNotifier / polling for UI state where possible**
* **Streams are powerful—but expensive if overused**

---

<a name="json-parsing"></a>
## 15. JSON, Parsing & Serialization

### Do Not Parse on the UI Isolate

* **Large JSON → isolate via compute()**
* **Cache parsed models aggressively**

### Avoid Repeated Parsing

* **Parse once, reuse many times**
* **Avoid converting model ↔ map repeatedly for convenience**

---

<a name="logging-debug"></a>
## 16. Logging & Debug Code

### Remove in Release

* **Logging is surprisingly expensive on mobile and catastrophic on web**
* Wrap debug-only logs:

```dart
if (kDebugMode) {
  debugPrint(...);
}
```

### Never Log in Hot Paths

* build(), scroll listeners, animation callbacks

---

<a name="layout-thrashing"></a>
## 17. Layout Thrashing

### Avoid

* **Repeated MediaQuery.of(context) calls in deep trees**
* **Repeated LayoutBuilder inside scrolling widgets**

### Optimise

* **Capture layout values once and pass down**
* **Use inherited widgets sparingly**

```dart
// ❌ WRONG: MediaQuery in every widget
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size; // ❌ Repeated lookup
    return Column(
      children: [
        ChildA(), // Calls MediaQuery again
        ChildB(), // Calls MediaQuery again
      ],
    );
  }
}

// ✅ RIGHT: Pass down values
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Column(
      children: [
        ChildA(screenSize: size), // ✅ Passed down
        ChildB(screenSize: size), // ✅ Passed down
      ],
    );
  }
}
```

---

<a name="fonts-text"></a>
## 18. Fonts & Text

### Text is Not Cheap

* **Avoid rebuilding large text blocks**
* **Cache TextStyles**
* **Avoid frequent font fallback** (missing glyphs cause runtime font resolution)

### Web

* **Custom fonts increase first paint time significantly**
* **Subset fonts where possible**

---

<a name="navigation-routing"></a>
## 19. Navigation & Routing

### Avoid Rebuilding Root

* **Navigator changes can cascade rebuilds**
* **Prefer nested navigators for complex apps**

### Route Arguments

* **Pass lightweight IDs, not full models**
* **Fetch/cache at destination**

```dart
// ❌ WRONG: Passing full model
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ProductDetail(product: largeProduct),
  ),
);

// ✅ RIGHT: Pass ID, fetch at destination
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ProductDetail(productId: product.id),
  ),
);
```

---

<a name="memory-leaks"></a>
## 20. Memory Leaks (Silent Killers)

### Watch For:

* **Undisposed TextEditingController**
* **Undisposed AnimationController**
* **Global singletons holding BuildContext**
* **Static caches that never evict**

**Flutter will not save you here.**

```dart
class FormWidget extends StatefulWidget {
  @override
  State<FormWidget> createState() => _FormWidgetState();
}

class _FormWidgetState extends State<FormWidget> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }

  @override
  void dispose() {
    _controller.dispose(); // ✅ Must dispose
    super.dispose();
  }
}
```

---

<a name="platform-channels"></a>
## 21. Platform Channels

### Batch Platform Calls

* **Minimise chatter across Dart ↔ native boundary**
* **Avoid per-frame platform calls**

---

<a name="compilation-tree-shape"></a>
## 22. Compilation & Tree Shape

### Widget Depth Matters

* **Deep trees cost layout time**
* **Flatten where possible**

### Avoid Over-Abstraction

* **Excessive "design system" wrappers add invisible cost**
* **Measure before abstracting**

---

<a name="performance-budgeting"></a>
## 23. Performance Budgeting (Advanced)

### Define Budgets:

* Max rebuilds per frame
* Max frame build time (≤ 16ms / 8ms)
* Max list item complexity

### Enforce Them During PR Review

---

<a name="uncomfortable-truth"></a>
## 24. The Uncomfortable Truth

**Most Flutter performance issues are self-inflicted:**

* Over-engineered state
* Over-abstracted UI
* Over-eager reactivity

**Simple, boring Flutter is fast Flutter.**

---

<a name="related-docs"></a>
## 25. Related Documentation

### Essential Reading
- **[Frontend DDD Architecture](../01_CORE/frontend_ddd_architecture_expert.md)** - Overall architecture context
- **[Managing CRUD for Large Datasets](../01_CORE/managing-crud-for-large-datasets.md)** - Data performance patterns
- **[Anti-Patterns & Approved Libraries](../01_CORE/antipatterns_and_approved_libraries_expert.md)** - What to avoid

### Integration Patterns
- **[Timeout Strategy Guide](timeout_strategy_guide.md)** - Network performance
- **[BLoC Event Naming Convention](../01_CORE/bloc_event_naming_convention_guide.md)** - State management

### Platform-Specific
- **[Web UI Patterns](../06_PLATFORM_SPECIFIC/web_ui_patterns.md)** - Web performance specifics
- **[Mobile UI Patterns](../06_PLATFORM_SPECIFIC/mobile_ui_patterns.md)** - Mobile optimizations

---

## Next Steps

If you want, I can:

* Diagnose freezes during async/network calls
* Review a widget tree or state architecture
* Provide a Flutter Web–specific hardening checklist
* Help you define a performance budget for a real app

---

**Version History:**
- v1.0 (2025-12-30): Initial guide created

**Maintained By:** Architecture Team
**Review Cycle:** Quarterly
