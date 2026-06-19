# Flutter Performance Optimization

**ID**: flutter-performance-optimization
**Category**: Frontend & UI / Performance
**Phase**: P5 (Generation)
**Robot**: Charlie

## Purpose

Apply Flutter performance best practices for production apps handling large datasets and complex UIs

## Inputs

- Generated Flutter code
- use-cases.md (performance requirements)

## Outputs

- Optimized widget builds
- Efficient list rendering
- Memory-optimized code
- Performance-profiled app

## Key Optimizations

### 1. Const Constructors
```dart
const Text('Hello'); // ✅ Reuses widget
Text('Hello');       // ❌ Rebuilds every time
```

### 2. ListView.builder for Long Lists
```dart
ListView.builder(     // ✅ Lazy loading
  itemCount: 1000,
  itemBuilder: (context, index) => Item(index),
)
```

### 3. Large Dataset Management
- Pagination (load 20 items at a time)
- Caching (Hive/Isar for offline)
- Optimistic updates
- Conflict resolution

## Expert References

**Primary Guides** (see Experts/expert_flutter/):
- `02_PATTERNS/widget-design-for-performance.md` (25 sections)
- `01_CORE/managing-crud-for-large-datasets.md` (Production-grade CRUD)
- `05_REFERENCE/monitoring_diagnostics_expert.md` (37KB)

---

**Version**: 1.0
**Based on**: Experts/expert_flutter/02_PATTERNS/
**Last Updated**: 2026-01-29
