# Flutter Performance Optimization

**ID**: flutter-performance-optimization
**Category**: Performance

## Purpose

Apply Flutter performance best practices for production apps handling large datasets and complex UIs.

## Inputs

- Flutter source code
- Performance requirements

## Outputs

- Optimized widget builds
- Efficient list rendering
- Memory-optimized code
- Performance-profiled app

## Key Optimizations

### 1. Const Constructors
```dart
const Text('Hello'); // Reuses widget
Text('Hello');       // Rebuilds every time
```

### 2. ListView.builder for Long Lists
```dart
ListView.builder(     // Lazy loading
  itemCount: 1000,
  itemBuilder: (context, index) => Item(index),
)
```

### 3. Large Dataset Management
- Pagination (load 20 items at a time)
- Caching (Hive/Isar for offline)
- Optimistic updates
- Conflict resolution

### 4. Avoid Unnecessary Rebuilds
```dart
// Use const where possible
const SizedBox(height: 16),
const Divider(),

// Use RepaintBoundary for expensive widgets
RepaintBoundary(
  child: ComplexChart(data: chartData),
)

// Use ValueListenableBuilder for granular rebuilds
ValueListenableBuilder<int>(
  valueListenable: counter,
  builder: (context, value, child) => Text('$value'),
)
```

### 5. Image Optimization
```dart
// Use CachedNetworkImage for network images
CachedNetworkImage(
  imageUrl: url,
  placeholder: (context, url) => CircularProgressIndicator(),
  errorWidget: (context, url, error) => Icon(Icons.error),
)

// Resize images to needed dimensions
Image.network(
  url,
  cacheWidth: 200, // Decode at target size
  cacheHeight: 200,
)
```

### 6. Profile and Measure
```bash
# Run in profile mode
flutter run --profile

# Use DevTools
flutter pub global activate devtools
flutter pub global run devtools
```
