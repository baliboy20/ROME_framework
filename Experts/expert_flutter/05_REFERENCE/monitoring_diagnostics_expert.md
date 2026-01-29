# Flutter Diagnostics, Logging & Performance Monitoring Guide

**Version:** 1.0  
**Created:** 2025-08-06  
**Purpose:** Comprehensive error handling, logging, and performance diagnostics for production Flutter applications

---

## 🚨 **ERROR HANDLING ARCHITECTURE**

### **Global Error Handling Setup**

```dart
// main.dart - Production-ready error handling

import 'dart:async';
import 'dart:isolate';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

void main() async {
  await runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      
      // Initialize crash reporting
      await CrashReporting.initialize();
      
      // Initialize performance monitoring
      await PerformanceMonitor.initialize();
      
      // Flutter error handling
      FlutterError.onError = (FlutterErrorDetails details) {
        FlutterError.presentError(details);
        CrashReporting.recordFlutterError(details);
      };
      
      // Platform error handling
      PlatformDispatcher.instance.onError = (error, stack) {
        CrashReporting.recordError(error, stack);
        return true;
      };
      
      // Isolate error handling
      Isolate.current.addErrorListener(RawReceivePort((pair) async {
        final List<dynamic> errorAndStacktrace = pair as List<dynamic>;
        await CrashReporting.recordError(
          errorAndStacktrace[0],
          errorAndStacktrace[1] as StackTrace?,
        );
      }).sendPort);
      
      runApp(
        ErrorBoundary(
          child: ProviderScope(
            observers: [AppObserver()],
            child: MyApp(),
          ),
        ),
      );
    },
    (error, stack) {
      // Zone error handling
      CrashReporting.recordError(error, stack);
    },
  );
}
```

### **Error Boundary Widget**

For error boundary implementation and usage, see the [Error Handling Patterns Guide](../01_CORE/error_handling_patterns_expert.md#7-error-boundary-widget).

The ErrorBoundary widget catches Flutter framework errors that escape normal error handling and prevents entire app crashes. It should be placed at strategic points in your widget tree based on your error isolation strategy.

**Quick Reference**:
- **Implementation**: See Section 7.1 in Error Handling Patterns
- **Placement Strategy**: See [Error Boundary Placement Strategy](../02_PATTERNS/error_boundary_placement_strategy.md)
- **Location**: `/lib/core/presentation/widgets/error_boundary.dart`

---

## 📝 **STRUCTURED LOGGING SYSTEM**

### **Logger Implementation**

```dart
// core/logging/app_logger.dart

enum LogLevel {
  verbose(0),
  debug(1),
  info(2),
  warning(3),
  error(4),
  fatal(5);
  
  final int value;
  const LogLevel(this.value);
}

class AppLogger {
  static final AppLogger _instance = AppLogger._internal();
  factory AppLogger() => _instance;
  AppLogger._internal();
  
  final List<LogOutput> _outputs = [];
  LogLevel _minLevel = kDebugMode ? LogLevel.debug : LogLevel.info;
  
  // Configuration
  void configure({
    LogLevel? minLevel,
    List<LogOutput>? outputs,
  }) {
    if (minLevel != null) _minLevel = minLevel;
    if (outputs != null) {
      _outputs.clear();
      _outputs.addAll(outputs);
    }
  }
  
  // Initialize with default outputs
  static Future<void> initialize() async {
    final logger = AppLogger();
    
    // Console output (development)
    if (kDebugMode) {
      logger._outputs.add(ConsoleLogOutput());
    }
    
    // File output (all environments)
    final fileOutput = await FileLogOutput.create();
    logger._outputs.add(fileOutput);
    
    // Remote logging (production)
    if (!kDebugMode) {
      logger._outputs.add(RemoteLogOutput());
    }
    
    // Platform-specific outputs
    if (PlatformDetector.isWeb) {
      logger._outputs.add(BrowserConsoleOutput());
    }
  }
  
  // Logging methods
  void v(String message, {dynamic error, StackTrace? stackTrace, Map<String, dynamic>? extra}) {
    _log(LogLevel.verbose, message, error: error, stackTrace: stackTrace, extra: extra);
  }
  
  void d(String message, {dynamic error, StackTrace? stackTrace, Map<String, dynamic>? extra}) {
    _log(LogLevel.debug, message, error: error, stackTrace: stackTrace, extra: extra);
  }
  
  void i(String message, {dynamic error, StackTrace? stackTrace, Map<String, dynamic>? extra}) {
    _log(LogLevel.info, message, error: error, stackTrace: stackTrace, extra: extra);
  }
  
  void w(String message, {dynamic error, StackTrace? stackTrace, Map<String, dynamic>? extra}) {
    _log(LogLevel.warning, message, error: error, stackTrace: stackTrace, extra: extra);
  }
  
  void e(String message, {dynamic error, StackTrace? stackTrace, Map<String, dynamic>? extra}) {
    _log(LogLevel.error, message, error: error, stackTrace: stackTrace, extra: extra);
  }
  
  void f(String message, {dynamic error, StackTrace? stackTrace, Map<String, dynamic>? extra}) {
    _log(LogLevel.fatal, message, error: error, stackTrace: stackTrace, extra: extra);
  }
  
  // Core logging logic
  void _log(
    LogLevel level,
    String message, {
    dynamic error,
    StackTrace? stackTrace,
    Map<String, dynamic>? extra,
  }) {
    if (level.value < _minLevel.value) return;
    
    final logEntry = LogEntry(
      timestamp: DateTime.now(),
      level: level,
      message: message,
      error: error,
      stackTrace: stackTrace,
      extra: {
        ...?extra,
        'platform': PlatformDetector.current.name,
        'version': AppConfig.version,
        'buildNumber': AppConfig.buildNumber,
      },
    );
    
    for (final output in _outputs) {
      try {
        output.write(logEntry);
      } catch (e) {
        // Prevent logging errors from crashing the app
        if (kDebugMode) {
          print('Logging error: $e');
        }
      }
    }
  }
  
  // Structured logging for specific scenarios
  void logEvent(String eventName, Map<String, dynamic> parameters) {
    i('Event: $eventName', extra: parameters);
  }
  
  void logApiCall({
    required String method,
    required String endpoint,
    int? statusCode,
    Duration? duration,
    dynamic error,
  }) {
    final level = error != null || (statusCode != null && statusCode >= 400)
      ? LogLevel.error
      : LogLevel.info;
    
    _log(
      level,
      'API Call: $method $endpoint',
      error: error,
      extra: {
        'method': method,
        'endpoint': endpoint,
        'statusCode': statusCode,
        'duration': duration?.inMilliseconds,
      },
    );
  }
  
  void logPerformance({
    required String operation,
    required Duration duration,
    Map<String, dynamic>? metrics,
  }) {
    final level = duration.inSeconds > 5 ? LogLevel.warning : LogLevel.info;
    
    _log(
      level,
      'Performance: $operation completed in ${duration.inMilliseconds}ms',
      extra: {
        'operation': operation,
        'durationMs': duration.inMilliseconds,
        ...?metrics,
      },
    );
  }
}

// Global logger instance
final logger = AppLogger();
```

### **Log Outputs**

```dart
// core/logging/outputs/console_output.dart

class ConsoleLogOutput implements LogOutput {
  static const Map<LogLevel, String> _prefixes = {
    LogLevel.verbose: '💬',
    LogLevel.debug: '🐛',
    LogLevel.info: 'ℹ️',
    LogLevel.warning: '⚠️',
    LogLevel.error: '❌',
    LogLevel.fatal: '💀',
  };
  
  static const Map<LogLevel, String> _colors = {
    LogLevel.verbose: '\x1B[37m',  // White
    LogLevel.debug: '\x1B[36m',    // Cyan
    LogLevel.info: '\x1B[34m',     // Blue
    LogLevel.warning: '\x1B[33m',  // Yellow
    LogLevel.error: '\x1B[31m',    // Red
    LogLevel.fatal: '\x1B[35m',    // Magenta
  };
  
  static const String _reset = '\x1B[0m';
  
  @override
  void write(LogEntry entry) {
    final prefix = _prefixes[entry.level] ?? '';
    final color = _colors[entry.level] ?? '';
    final timestamp = entry.timestamp.toIso8601String();
    
    final buffer = StringBuffer();
    buffer.write('$color[$timestamp] $prefix ${entry.level.name.toUpperCase()}: ');
    buffer.write(entry.message);
    
    if (entry.extra?.isNotEmpty ?? false) {
      buffer.write(' | ');
      buffer.write(jsonEncode(entry.extra));
    }
    
    if (entry.error != null) {
      buffer.write('\n  Error: ${entry.error}');
    }
    
    if (entry.stackTrace != null) {
      buffer.write('\n  Stack trace:\n${entry.stackTrace}');
    }
    
    buffer.write(_reset);
    
    print(buffer.toString());
  }
}

// core/logging/outputs/file_output.dart

class FileLogOutput implements LogOutput {
  final File _logFile;
  final int _maxFileSize;
  final int _maxFiles;
  IOSink? _sink;
  
  FileLogOutput._({
    required File logFile,
    int maxFileSize = 10 * 1024 * 1024, // 10MB
    int maxFiles = 5,
  }) : _logFile = logFile,
       _maxFileSize = maxFileSize,
       _maxFiles = maxFiles;
  
  static Future<FileLogOutput> create() async {
    final directory = await getApplicationDocumentsDirectory();
    final logDir = Directory('${directory.path}/logs');
    
    if (!await logDir.exists()) {
      await logDir.create(recursive: true);
    }
    
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final logFile = File('${logDir.path}/app_$timestamp.log');
    
    final output = FileLogOutput._(logFile: logFile);
    await output._initialize();
    
    return output;
  }
  
  Future<void> _initialize() async {
    _sink = _logFile.openWrite(mode: FileMode.append);
    
    // Rotate logs if needed
    await _rotateLogs();
  }
  
  Future<void> _rotateLogs() async {
    final stat = await _logFile.stat();
    
    if (stat.size > _maxFileSize) {
      await _sink?.close();
      
      // Create new log file
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final newFile = File('${_logFile.parent.path}/app_$timestamp.log');
      _sink = newFile.openWrite(mode: FileMode.append);
      
      // Clean old files
      await _cleanOldLogs();
    }
  }
  
  Future<void> _cleanOldLogs() async {
    final logDir = _logFile.parent;
    final files = await logDir
      .list()
      .where((entity) => entity is File && entity.path.endsWith('.log'))
      .cast<File>()
      .toList();
    
    if (files.length > _maxFiles) {
      files.sort((a, b) => a.statSync().modified.compareTo(b.statSync().modified));
      
      for (int i = 0; i < files.length - _maxFiles; i++) {
        await files[i].delete();
      }
    }
  }
  
  @override
  void write(LogEntry entry) {
    final json = entry.toJson();
    _sink?.writeln(jsonEncode(json));
  }
  
  Future<void> close() async {
    await _sink?.flush();
    await _sink?.close();
  }
}
```

---

## 📊 **PERFORMANCE MONITORING**

### **Performance Monitor**

```dart
// core/performance/performance_monitor.dart

class PerformanceMonitor {
  static final PerformanceMonitor _instance = PerformanceMonitor._internal();
  factory PerformanceMonitor() => _instance;
  PerformanceMonitor._internal();
  
  final Map<String, Stopwatch> _operations = {};
  final List<PerformanceMetric> _metrics = [];
  Timer? _reportingTimer;
  
  static Future<void> initialize() async {
    final monitor = PerformanceMonitor();
    
    // Start frame monitoring
    monitor._startFrameMonitoring();
    
    // Start memory monitoring
    monitor._startMemoryMonitoring();
    
    // Start periodic reporting
    monitor._startPeriodicReporting();
    
    // Register Flutter callbacks
    WidgetsBinding.instance.addObserver(PerformanceObserver());
  }
  
  // Operation timing
  void startOperation(String name) {
    _operations[name] = Stopwatch()..start();
  }
  
  Duration? endOperation(String name) {
    final stopwatch = _operations.remove(name);
    if (stopwatch != null) {
      stopwatch.stop();
      final duration = stopwatch.elapsed;
      
      _recordMetric(PerformanceMetric(
        name: name,
        type: MetricType.operation,
        value: duration.inMilliseconds.toDouble(),
        unit: 'ms',
        timestamp: DateTime.now(),
      ));
      
      logger.logPerformance(
        operation: name,
        duration: duration,
      );
      
      return duration;
    }
    return null;
  }
  
  // Async operation timing
  Future<T> measureAsync<T>(String name, Future<T> Function() operation) async {
    startOperation(name);
    try {
      final result = await operation();
      return result;
    } finally {
      endOperation(name);
    }
  }
  
  // Sync operation timing
  T measureSync<T>(String name, T Function() operation) {
    startOperation(name);
    try {
      final result = operation();
      return result;
    } finally {
      endOperation(name);
    }
  }
  
  // Frame monitoring
  void _startFrameMonitoring() {
    SchedulerBinding.instance.addTimingsCallback((List<FrameTiming> timings) {
      for (final timing in timings) {
        final buildDuration = timing.buildDuration.inMicroseconds / 1000;
        final rasterDuration = timing.rasterDuration.inMicroseconds / 1000;
        final totalDuration = timing.totalSpan.inMicroseconds / 1000;
        
        _recordMetric(PerformanceMetric(
          name: 'frame_build',
          type: MetricType.frame,
          value: buildDuration,
          unit: 'ms',
          timestamp: DateTime.now(),
        ));
        
        _recordMetric(PerformanceMetric(
          name: 'frame_raster',
          type: MetricType.frame,
          value: rasterDuration,
          unit: 'ms',
          timestamp: DateTime.now(),
        ));
        
        // Check for jank (frame took > 16ms)
        if (totalDuration > 16) {
          logger.w('Jank detected: Frame took ${totalDuration.toStringAsFixed(2)}ms', extra: {
            'buildDuration': buildDuration,
            'rasterDuration': rasterDuration,
            'totalDuration': totalDuration,
          });
        }
      }
    });
  }
  
  // Memory monitoring
  void _startMemoryMonitoring() {
    Timer.periodic(Duration(seconds: 30), (_) {
      final memoryUsage = _getMemoryUsage();
      
      _recordMetric(PerformanceMetric(
        name: 'memory_usage',
        type: MetricType.memory,
        value: memoryUsage,
        unit: 'MB',
        timestamp: DateTime.now(),
      ));
      
      // Check for memory issues
      if (memoryUsage > 500) {
        logger.w('High memory usage: ${memoryUsage.toStringAsFixed(2)}MB');
      }
    });
  }
  
  double _getMemoryUsage() {
    // Platform-specific memory reporting
    if (PlatformDetector.isWeb) {
      // Web memory API
      return _getWebMemoryUsage();
    } else {
      // Native memory info
      return _getNativeMemoryUsage();
    }
  }
  
  double _getWebMemoryUsage() {
    // Use performance.memory API if available
    try {
      final memory = html.window.performance.memory;
      if (memory != null) {
        return (memory.usedJSHeapSize ?? 0) / (1024 * 1024);
      }
    } catch (e) {
      // Not available in all browsers
    }
    return 0;
  }
  
  double _getNativeMemoryUsage() {
    // Get memory info from debug service
    try {
      final info = ProcessInfo.currentRss;
      return info / (1024 * 1024);
    } catch (e) {
      return 0;
    }
  }
  
  void _recordMetric(PerformanceMetric metric) {
    _metrics.add(metric);
    
    // Keep only last 1000 metrics in memory
    if (_metrics.length > 1000) {
      _metrics.removeRange(0, _metrics.length - 1000);
    }
  }
  
  void _startPeriodicReporting() {
    _reportingTimer = Timer.periodic(Duration(minutes: 5), (_) {
      _reportMetrics();
    });
  }
  
  void _reportMetrics() {
    if (_metrics.isEmpty) return;
    
    // Calculate aggregates
    final aggregates = _calculateAggregates();
    
    logger.i('Performance Report', extra: aggregates);
    
    // Send to analytics
    Analytics.recordPerformanceMetrics(aggregates);
    
    // Clear old metrics
    _metrics.clear();
  }
  
  Map<String, dynamic> _calculateAggregates() {
    final frameMetrics = _metrics.where((m) => m.type == MetricType.frame).toList();
    final memoryMetrics = _metrics.where((m) => m.type == MetricType.memory).toList();
    final operationMetrics = _metrics.where((m) => m.type == MetricType.operation).toList();
    
    return {
      'frame': {
        'count': frameMetrics.length,
        'avgBuildTime': _average(frameMetrics.where((m) => m.name == 'frame_build')),
        'avgRasterTime': _average(frameMetrics.where((m) => m.name == 'frame_raster')),
        'jankCount': frameMetrics.where((m) => m.value > 16).length,
      },
      'memory': {
        'avg': _average(memoryMetrics),
        'max': _max(memoryMetrics),
        'min': _min(memoryMetrics),
      },
      'operations': _groupOperations(operationMetrics),
    };
  }
  
  double _average(Iterable<PerformanceMetric> metrics) {
    if (metrics.isEmpty) return 0;
    final sum = metrics.fold<double>(0, (sum, m) => sum + m.value);
    return sum / metrics.length;
  }
  
  double _max(Iterable<PerformanceMetric> metrics) {
    if (metrics.isEmpty) return 0;
    return metrics.map((m) => m.value).reduce(math.max);
  }
  
  double _min(Iterable<PerformanceMetric> metrics) {
    if (metrics.isEmpty) return 0;
    return metrics.map((m) => m.value).reduce(math.min);
  }
  
  Map<String, dynamic> _groupOperations(List<PerformanceMetric> metrics) {
    final grouped = <String, List<double>>{};
    
    for (final metric in metrics) {
      grouped.putIfAbsent(metric.name, () => []).add(metric.value);
    }
    
    return grouped.map((name, values) => MapEntry(name, {
      'count': values.length,
      'avg': values.reduce((a, b) => a + b) / values.length,
      'max': values.reduce(math.max),
      'min': values.reduce(math.min),
    }));
  }
}

// Performance observer for widget lifecycle
class PerformanceObserver extends WidgetsBindingObserver {
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    logger.i('App lifecycle changed: $state');
  }
  
  @override
  void didHaveMemoryPressure() {
    logger.w('Memory pressure detected');
    // Trigger cleanup
    imageCache.clear();
    imageCache.clearLiveImages();
  }
}
```

---

## 🔍 **MEMORY LEAK DETECTION**

### **Memory Leak Detector**

```dart
// core/diagnostics/memory_leak_detector.dart

class MemoryLeakDetector {
  static final MemoryLeakDetector _instance = MemoryLeakDetector._internal();
  factory MemoryLeakDetector() => _instance;
  MemoryLeakDetector._internal();
  
  final Map<String, WeakReference<Object>> _trackedObjects = {};
  final List<LeakReport> _leaks = [];
  Timer? _checkTimer;
  
  void startTracking() {
    if (!kDebugMode) return; // Only in debug mode
    
    _checkTimer = Timer.periodic(Duration(seconds: 30), (_) {
      _checkForLeaks();
    });
  }
  
  void trackObject(Object object, String identifier) {
    if (!kDebugMode) return;
    
    _trackedObjects[identifier] = WeakReference(object);
    logger.d('Tracking object: $identifier');
  }
  
  void untrackObject(String identifier) {
    if (!kDebugMode) return;
    
    _trackedObjects.remove(identifier);
    logger.d('Untracking object: $identifier');
  }
  
  void _checkForLeaks() {
    final now = DateTime.now();
    final leaks = <String>[];
    
    _trackedObjects.forEach((identifier, weakRef) {
      if (weakRef.target == null) {
        // Object was garbage collected - good!
        _trackedObjects.remove(identifier);
      }
    });
    
    // Check for objects that should have been disposed
    for (final entry in _trackedObjects.entries) {
      // If object is still alive after expected lifetime
      if (_shouldBeDisposed(entry.key)) {
        leaks.add(entry.key);
      }
    }
    
    if (leaks.isNotEmpty) {
      final report = LeakReport(
        timestamp: now,
        leakedObjects: leaks,
      );
      
      _leaks.add(report);
      logger.w('Potential memory leaks detected', extra: {
        'count': leaks.length,
        'objects': leaks,
      });
    }
  }
  
  bool _shouldBeDisposed(String identifier) {
    // Custom logic to determine if object should be disposed
    // For example, check if associated widget is no longer in tree
    return false; // Implement based on your needs
  }
  
  List<LeakReport> getLeakReports() => List.unmodifiable(_leaks);
  
  void dispose() {
    _checkTimer?.cancel();
    _trackedObjects.clear();
    _leaks.clear();
  }
}

// Widget that tracks its lifecycle for leak detection
abstract class TrackableStatefulWidget extends StatefulWidget {
  const TrackableStatefulWidget({Key? key}) : super(key: key);
}

abstract class TrackableState<T extends TrackableStatefulWidget> extends State<T> {
  late final String _identifier;
  
  @override
  void initState() {
    super.initState();
    _identifier = '${widget.runtimeType}_${hashCode}';
    MemoryLeakDetector().trackObject(this, _identifier);
  }
  
  @override
  void dispose() {
    MemoryLeakDetector().untrackObject(_identifier);
    super.dispose();
  }
}
```

---

## 🎯 **CRASH REPORTING**

### **Crash Reporting Service**

```dart
// core/crash/crash_reporting.dart

class CrashReporting {
  static bool _initialized = false;
  static final List<CrashReporter> _reporters = [];
  
  static Future<void> initialize() async {
    if (_initialized) return;
    
    // Initialize Firebase Crashlytics (if using)
    if (!kIsWeb) {
      _reporters.add(FirebaseCrashReporter());
    }
    
    // Initialize Sentry (cross-platform)
    _reporters.add(SentryCrashReporter());
    
    // Initialize custom crash reporter
    _reporters.add(CustomCrashReporter());
    
    for (final reporter in _reporters) {
      await reporter.initialize();
    }
    
    _initialized = true;
    logger.i('Crash reporting initialized');
  }
  
  static Future<void> recordError(
    dynamic error,
    StackTrace? stackTrace, {
    Map<String, dynamic>? extra,
    bool fatal = false,
  }) async {
    // Log locally first
    logger.e(
      'Crash reported',
      error: error,
      stackTrace: stackTrace,
      extra: extra,
    );
    
    // Report to all crash reporters
    for (final reporter in _reporters) {
      try {
        await reporter.recordError(
          error,
          stackTrace,
          extra: extra,
          fatal: fatal,
        );
      } catch (e) {
        logger.w('Failed to report crash to ${reporter.runtimeType}: $e');
      }
    }
  }
  
  static Future<void> recordFlutterError(FlutterErrorDetails details) async {
    // Extract useful information
    final error = details.exception;
    final stackTrace = details.stack;
    final extra = {
      'library': details.library,
      'context': details.context?.toString(),
      'silent': details.silent,
    };
    
    await recordError(error, stackTrace, extra: extra);
  }
  
  static void setUserIdentifier(String identifier) {
    for (final reporter in _reporters) {
      reporter.setUserIdentifier(identifier);
    }
  }
  
  static void setCustomKey(String key, dynamic value) {
    for (final reporter in _reporters) {
      reporter.setCustomKey(key, value);
    }
  }
  
  static void log(String message) {
    for (final reporter in _reporters) {
      reporter.log(message);
    }
  }
}

// Abstract crash reporter interface
abstract class CrashReporter {
  Future<void> initialize();
  
  Future<void> recordError(
    dynamic error,
    StackTrace? stackTrace, {
    Map<String, dynamic>? extra,
    bool fatal = false,
  });
  
  void setUserIdentifier(String identifier);
  void setCustomKey(String key, dynamic value);
  void log(String message);
}

// Sentry implementation
class SentryCrashReporter implements CrashReporter {
  @override
  Future<void> initialize() async {
    await SentryFlutter.init(
      (options) {
        options.dsn = AppConfig.sentryDsn;
        options.environment = kDebugMode ? 'debug' : 'production';
        options.tracesSampleRate = 0.3;
        options.attachScreenshot = true;
        options.attachViewHierarchy = true;
        
        // Performance monitoring
        options.enableAutoPerformanceTracing = true;
        
        // Before send callback for filtering
        options.beforeSend = (event, hint) async {
          // Filter out certain errors
          if (_shouldFilterError(event)) {
            return null;
          }
          return event;
        };
      },
    );
  }
  
  bool _shouldFilterError(SentryEvent event) {
    // Filter network errors in debug
    if (kDebugMode && event.throwable is SocketException) {
      return true;
    }
    
    // Filter specific error messages
    final message = event.message?.formatted ?? '';
    if (message.contains('Connection closed')) {
      return true;
    }
    
    return false;
  }
  
  @override
  Future<void> recordError(
    dynamic error,
    StackTrace? stackTrace, {
    Map<String, dynamic>? extra,
    bool fatal = false,
  }) async {
    await Sentry.captureException(
      error,
      stackTrace: stackTrace,
      withScope: (scope) {
        scope.level = fatal ? SentryLevel.fatal : SentryLevel.error;
        
        extra?.forEach((key, value) {
          scope.setExtra(key, value);
        });
      },
    );
  }
  
  @override
  void setUserIdentifier(String identifier) {
    Sentry.configureScope((scope) {
      scope.setUser(SentryUser(id: identifier));
    });
  }
  
  @override
  void setCustomKey(String key, dynamic value) {
    Sentry.configureScope((scope) {
      scope.setTag(key, value.toString());
    });
  }
  
  @override
  void log(String message) {
    Sentry.addBreadcrumb(
      Breadcrumb(message: message),
    );
  }
}
```

---

## 📈 **NETWORK MONITORING**

### **Network Monitor & Interceptor**

```dart
// core/network/network_monitor.dart

class NetworkMonitor extends Interceptor {
  static final NetworkMonitor _instance = NetworkMonitor._internal();
  factory NetworkMonitor() => _instance;
  NetworkMonitor._internal();
  
  final List<NetworkRequest> _requests = [];
  final StreamController<NetworkRequest> _requestController = StreamController.broadcast();
  
  Stream<NetworkRequest> get requestStream => _requestController.stream;
  List<NetworkRequest> get requests => List.unmodifiable(_requests);
  
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final request = NetworkRequest(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      method: options.method,
      url: options.uri.toString(),
      headers: options.headers.cast<String, String>(),
      data: options.data,
      timestamp: DateTime.now(),
    );
    
    _requests.add(request);
    _requestController.add(request);
    
    // Start timing
    options.extra['startTime'] = DateTime.now();
    
    logger.d('→ ${options.method} ${options.uri}', extra: {
      'headers': options.headers,
      'data': options.data,
    });
    
    handler.next(options);
  }
  
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final startTime = response.requestOptions.extra['startTime'] as DateTime?;
    final duration = startTime != null 
      ? DateTime.now().difference(startTime)
      : Duration.zero;
    
    final request = _findRequest(response.requestOptions);
    if (request != null) {
      request.response = NetworkResponse(
        statusCode: response.statusCode ?? 0,
        data: response.data,
        headers: response.headers.map.cast<String, List<String>>(),
        duration: duration,
      );
    }
    
    logger.d('← ${response.statusCode} ${response.requestOptions.uri}', extra: {
      'duration': duration.inMilliseconds,
      'data': response.data,
    });
    
    // Track slow requests
    if (duration.inSeconds > 3) {
      logger.w('Slow API request: ${response.requestOptions.uri} took ${duration.inSeconds}s');
    }
    
    // Log API metrics
    logger.logApiCall(
      method: response.requestOptions.method,
      endpoint: response.requestOptions.uri.toString(),
      statusCode: response.statusCode,
      duration: duration,
    );
    
    handler.next(response);
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final startTime = err.requestOptions.extra['startTime'] as DateTime?;
    final duration = startTime != null 
      ? DateTime.now().difference(startTime)
      : Duration.zero;
    
    final request = _findRequest(err.requestOptions);
    if (request != null) {
      request.error = err.toString();
      request.response = NetworkResponse(
        statusCode: err.response?.statusCode ?? 0,
        data: err.response?.data,
        headers: err.response?.headers.map.cast<String, List<String>>() ?? {},
        duration: duration,
      );
    }
    
    logger.e('✗ ${err.requestOptions.method} ${err.requestOptions.uri}', 
      error: err,
      extra: {
        'statusCode': err.response?.statusCode,
        'duration': duration.inMilliseconds,
        'type': err.type.name,
      },
    );
    
    // Report network errors
    CrashReporting.recordError(err, err.stackTrace, extra: {
      'url': err.requestOptions.uri.toString(),
      'method': err.requestOptions.method,
      'statusCode': err.response?.statusCode,
    });
    
    handler.next(err);
  }
  
  NetworkRequest? _findRequest(RequestOptions options) {
    try {
      return _requests.lastWhere(
        (r) => r.url == options.uri.toString() && r.method == options.method,
      );
    } catch (e) {
      return null;
    }
  }
  
  void clearRequests() {
    _requests.clear();
  }
  
  Map<String, dynamic> getStatistics() {
    final total = _requests.length;
    final successful = _requests.where((r) => 
      r.response != null && r.response!.statusCode >= 200 && r.response!.statusCode < 300
    ).length;
    final failed = _requests.where((r) => r.error != null).length;
    
    final totalDuration = _requests
      .where((r) => r.response?.duration != null)
      .fold<Duration>(Duration.zero, (sum, r) => sum + r.response!.duration);
    
    final avgDuration = total > 0 
      ? totalDuration.inMilliseconds / total 
      : 0;
    
    return {
      'total': total,
      'successful': successful,
      'failed': failed,
      'successRate': total > 0 ? (successful / total * 100).toStringAsFixed(2) : '0',
      'avgDuration': avgDuration.toStringAsFixed(2),
    };
  }
}
```

---

## 🛠️ **DEBUGGING TOOLS**

### **Debug Overlay Widget**

```dart
// core/debug/debug_overlay.dart

class DebugOverlay extends StatefulWidget {
  final Widget child;
  
  const DebugOverlay({
    Key? key,
    required this.child,
  }) : super(key: key);
  
  @override
  State<DebugOverlay> createState() => _DebugOverlayState();
}

class _DebugOverlayState extends State<DebugOverlay> {
  bool _showOverlay = false;
  bool _showPerformance = false;
  bool _showNetwork = false;
  bool _showLogs = false;
  
  @override
  Widget build(BuildContext context) {
    if (!kDebugMode) {
      return widget.child;
    }
    
    return Stack(
      children: [
        widget.child,
        
        // Debug button
        Positioned(
          right: 16,
          bottom: 100,
          child: FloatingActionButton(
            mini: true,
            backgroundColor: Colors.purple,
            onPressed: () {
              setState(() {
                _showOverlay = !_showOverlay;
              });
            },
            child: Icon(Icons.bug_report),
          ),
        ),
        
        // Debug panel
        if (_showOverlay)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 400,
            child: _DebugPanel(
              showPerformance: _showPerformance,
              showNetwork: _showNetwork,
              showLogs: _showLogs,
              onTogglePerformance: () {
                setState(() {
                  _showPerformance = !_showPerformance;
                });
              },
              onToggleNetwork: () {
                setState(() {
                  _showNetwork = !_showNetwork;
                });
              },
              onToggleLogs: () {
                setState(() {
                  _showLogs = !_showLogs;
                });
              },
            ),
          ),
      ],
    );
  }
}

class _DebugPanel extends StatelessWidget {
  final bool showPerformance;
  final bool showNetwork;
  final bool showLogs;
  final VoidCallback onTogglePerformance;
  final VoidCallback onToggleNetwork;
  final VoidCallback onToggleLogs;
  
  const _DebugPanel({
    required this.showPerformance,
    required this.showNetwork,
    required this.showLogs,
    required this.onTogglePerformance,
    required this.onToggleNetwork,
    required this.onToggleLogs,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Column(
        children: [
          // Tab bar
          Container(
            height: 50,
            child: Row(
              children: [
                _TabButton(
                  label: 'Performance',
                  isActive: showPerformance,
                  onTap: onTogglePerformance,
                ),
                _TabButton(
                  label: 'Network',
                  isActive: showNetwork,
                  onTap: onToggleNetwork,
                ),
                _TabButton(
                  label: 'Logs',
                  isActive: showLogs,
                  onTap: onToggleLogs,
                ),
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: _getContent(),
          ),
        ],
      ),
    );
  }
  
  Widget _getContent() {
    if (showPerformance) {
      return _PerformanceView();
    } else if (showNetwork) {
      return _NetworkView();
    } else if (showLogs) {
      return _LogsView();
    }
    return Center(
      child: Text(
        'Select a tab',
        style: TextStyle(color: Colors.white),
      ),
    );
  }
}
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Error Handling Setup**
- [ ] Global error handling in main.dart
- [ ] Error boundary widget implemented
- [ ] Zone error handling configured
- [ ] Platform error handling setup
- [ ] Custom error UI created

### **Logging System**
- [ ] Logger initialized
- [ ] Console output configured
- [ ] File logging setup
- [ ] Remote logging configured
- [ ] Log levels defined
- [ ] Structured logging implemented

### **Performance Monitoring**
- [ ] Frame monitoring enabled
- [ ] Memory monitoring active
- [ ] Operation timing implemented
- [ ] Jank detection configured
- [ ] Performance metrics aggregation
- [ ] Periodic reporting setup

### **Memory Management**
- [ ] Memory leak detector implemented
- [ ] Weak references used appropriately
- [ ] Lifecycle tracking setup
- [ ] Memory pressure handling
- [ ] Image cache management

### **Crash Reporting**
- [ ] Crash reporting services initialized
- [ ] Error filtering configured
- [ ] User identification setup
- [ ] Custom keys defined
- [ ] Breadcrumb logging active

### **Network Monitoring**
- [ ] Network interceptor installed
- [ ] Request/response logging
- [ ] Error tracking
- [ ] Performance metrics
- [ ] Slow request detection

### **Debug Tools**
- [ ] Debug overlay implemented
- [ ] Performance visualization
- [ ] Network inspector
- [ ] Log viewer
- [ ] Memory profiler integration

---

**Document Status:** ✅ COMPLETE  
**Coverage:** Comprehensive error handling, logging, and diagnostics  
**Environment:** Development and Production configurations