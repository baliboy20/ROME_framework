# Production Monitoring & Observability Best Practices

**Version:** 1.0  
**Created:** 2025-08-06  
**Purpose:** Production-ready monitoring, alerting, and observability strategies

---

## 🎯 **MONITORING STRATEGY**

### **Three Pillars of Observability**

```yaml
Observability Stack:
  1. Metrics:
    - Performance indicators
    - Business KPIs
    - Resource utilization
    
  2. Logs:
    - Application events
    - Error messages
    - Audit trail
    
  3. Traces:
    - Request flow
    - Distributed tracing
    - Dependency mapping
```

### **Environment-Specific Configuration**

```dart
// core/config/monitoring_config.dart

class MonitoringConfig {
  static MonitoringSettings get current {
    return switch (AppEnvironment.current) {
      AppEnvironment.development => DevelopmentSettings(),
      AppEnvironment.staging => StagingSettings(),
      AppEnvironment.production => ProductionSettings(),
    };
  }
}

class DevelopmentSettings extends MonitoringSettings {
  @override
  LogLevel get minLogLevel => LogLevel.debug;
  
  @override
  bool get enableCrashReporting => false;
  
  @override
  bool get enablePerformanceMonitoring => true;
  
  @override
  bool get enableNetworkLogging => true;
  
  @override
  double get tracingSampleRate => 1.0; // 100% sampling
  
  @override
  Duration get metricsReportingInterval => Duration(minutes: 1);
}

class StagingSettings extends MonitoringSettings {
  @override
  LogLevel get minLogLevel => LogLevel.info;
  
  @override
  bool get enableCrashReporting => true;
  
  @override
  bool get enablePerformanceMonitoring => true;
  
  @override
  bool get enableNetworkLogging => true;
  
  @override
  double get tracingSampleRate => 0.5; // 50% sampling
  
  @override
  Duration get metricsReportingInterval => Duration(minutes: 5);
}

class ProductionSettings extends MonitoringSettings {
  @override
  LogLevel get minLogLevel => LogLevel.warning;
  
  @override
  bool get enableCrashReporting => true;
  
  @override
  bool get enablePerformanceMonitoring => true;
  
  @override
  bool get enableNetworkLogging => false; // Privacy concern
  
  @override
  double get tracingSampleRate => 0.1; // 10% sampling
  
  @override
  Duration get metricsReportingInterval => Duration(minutes: 15);
}
```

---

## 📊 **KEY PERFORMANCE INDICATORS (KPIs)**

### **Application Health Metrics**

```dart
// core/metrics/app_metrics.dart

class AppMetrics {
  static final AppMetrics _instance = AppMetrics._internal();
  factory AppMetrics() => _instance;
  AppMetrics._internal();
  
  // Core metrics to track
  final Map<String, Metric> _metrics = {
    // Performance metrics
    'app.startup.time': GaugeMetric('App startup time', unit: 'ms'),
    'app.frame.rate': GaugeMetric('Frame rate', unit: 'fps'),
    'app.jank.rate': CounterMetric('Jank occurrences'),
    'app.memory.usage': GaugeMetric('Memory usage', unit: 'MB'),
    
    // User experience metrics
    'user.session.duration': TimerMetric('Session duration'),
    'user.interaction.latency': HistogramMetric('Interaction latency', unit: 'ms'),
    'user.error.rate': CounterMetric('User-facing errors'),
    
    // Business metrics
    'business.conversion.rate': GaugeMetric('Conversion rate', unit: '%'),
    'business.transaction.value': HistogramMetric('Transaction value', unit: 'USD'),
    'business.feature.usage': CounterMetric('Feature usage'),
    
    // Network metrics
    'network.request.count': CounterMetric('API requests'),
    'network.request.duration': HistogramMetric('Request duration', unit: 'ms'),
    'network.error.rate': GaugeMetric('Network error rate', unit: '%'),
    'network.bandwidth.usage': CounterMetric('Bandwidth usage', unit: 'KB'),
    
    // Crash metrics
    'crash.count': CounterMetric('Crash count'),
    'crash.free.users': GaugeMetric('Crash-free users', unit: '%'),
    'crash.free.sessions': GaugeMetric('Crash-free sessions', unit: '%'),
  };
  
  void recordStartupTime(Duration duration) {
    _metrics['app.startup.time']?.record(duration.inMilliseconds.toDouble());
    
    // Alert if startup is too slow
    if (duration.inSeconds > 3) {
      AlertManager.trigger(
        AlertLevel.warning,
        'Slow app startup',
        'Startup took ${duration.inSeconds}s',
      );
    }
  }
  
  void recordUserSession(DateTime start, DateTime end) {
    final duration = end.difference(start);
    _metrics['user.session.duration']?.record(duration.inSeconds.toDouble());
    
    // Track session quality
    final quality = _calculateSessionQuality(duration);
    Analytics.track('session_ended', {
      'duration': duration.inSeconds,
      'quality': quality.name,
    });
  }
  
  SessionQuality _calculateSessionQuality(Duration duration) {
    if (duration.inMinutes > 10) return SessionQuality.engaged;
    if (duration.inMinutes > 2) return SessionQuality.normal;
    return SessionQuality.bounce;
  }
  
  void recordCrash({
    required String type,
    required String message,
    bool fatal = false,
  }) {
    _metrics['crash.count']?.increment();
    
    // Update crash-free metrics
    _updateCrashFreeMetrics();
    
    // Alert on critical crashes
    if (fatal) {
      AlertManager.trigger(
        AlertLevel.critical,
        'Fatal crash detected',
        'Type: $type, Message: $message',
      );
    }
  }
  
  void _updateCrashFreeMetrics() {
    // Calculate crash-free percentages
    final totalUsers = Analytics.getTotalUsers();
    final crashedUsers = Analytics.getCrashedUsers();
    final crashFreeUsers = ((totalUsers - crashedUsers) / totalUsers * 100);
    
    _metrics['crash.free.users']?.record(crashFreeUsers);
    
    // Alert if crash rate is too high
    if (crashFreeUsers < 95) {
      AlertManager.trigger(
        AlertLevel.critical,
        'High crash rate',
        'Crash-free users: ${crashFreeUsers.toStringAsFixed(2)}%',
      );
    }
  }
  
  Map<String, dynamic> exportMetrics() {
    final export = <String, dynamic>{};
    
    _metrics.forEach((name, metric) {
      export[name] = metric.export();
    });
    
    return export;
  }
}

enum SessionQuality { bounce, normal, engaged }
```

---

## 🔔 **ALERTING SYSTEM**

### **Alert Manager**

```dart
// core/alerting/alert_manager.dart

enum AlertLevel {
  info(0),
  warning(1),
  error(2),
  critical(3);
  
  final int severity;
  const AlertLevel(this.severity);
}

class AlertManager {
  static final List<AlertChannel> _channels = [];
  static final Map<String, DateTime> _suppressedAlerts = {};
  static final Map<String, int> _alertCounts = {};
  
  static void initialize() {
    // Add alert channels based on environment
    if (AppEnvironment.isProduction) {
      _channels.add(SlackAlertChannel());
      _channels.add(PagerDutyChannel());
      _channels.add(EmailAlertChannel());
    }
    
    if (kDebugMode) {
      _channels.add(ConsoleAlertChannel());
    }
    
    // Always add logging channel
    _channels.add(LoggingAlertChannel());
  }
  
  static void trigger(
    AlertLevel level,
    String title,
    String message, {
    Map<String, dynamic>? metadata,
    Duration? suppressDuration,
  }) {
    // Check if alert is suppressed
    final suppressKey = '$level:$title';
    if (_isAlertSuppressed(suppressKey)) {
      return;
    }
    
    // Rate limiting
    if (_shouldRateLimit(suppressKey)) {
      return;
    }
    
    // Create alert
    final alert = Alert(
      level: level,
      title: title,
      message: message,
      metadata: metadata ?? {},
      timestamp: DateTime.now(),
    );
    
    // Send to appropriate channels based on severity
    for (final channel in _channels) {
      if (_shouldSendToChannel(level, channel)) {
        channel.send(alert);
      }
    }
    
    // Update suppression if specified
    if (suppressDuration != null) {
      _suppressedAlerts[suppressKey] = DateTime.now().add(suppressDuration);
    }
    
    // Update alert count for rate limiting
    _alertCounts[suppressKey] = (_alertCounts[suppressKey] ?? 0) + 1;
  }
  
  static bool _isAlertSuppressed(String key) {
    final suppressedUntil = _suppressedAlerts[key];
    if (suppressedUntil == null) return false;
    
    if (DateTime.now().isAfter(suppressedUntil)) {
      _suppressedAlerts.remove(key);
      return false;
    }
    
    return true;
  }
  
  static bool _shouldRateLimit(String key) {
    final count = _alertCounts[key] ?? 0;
    
    // Rate limit after 5 alerts in 5 minutes
    if (count > 5) {
      // Reset counter after 5 minutes
      Timer(Duration(minutes: 5), () {
        _alertCounts[key] = 0;
      });
      return true;
    }
    
    return false;
  }
  
  static bool _shouldSendToChannel(AlertLevel level, AlertChannel channel) {
    // Critical alerts go to all channels
    if (level == AlertLevel.critical) return true;
    
    // Route based on channel type and alert level
    return switch (channel) {
      PagerDutyChannel() => level.severity >= AlertLevel.error.severity,
      SlackAlertChannel() => level.severity >= AlertLevel.warning.severity,
      EmailAlertChannel() => level.severity >= AlertLevel.error.severity,
      _ => true,
    };
  }
}

// Alert channels
abstract class AlertChannel {
  void send(Alert alert);
}

class SlackAlertChannel implements AlertChannel {
  @override
  void send(Alert alert) {
    final color = switch (alert.level) {
      AlertLevel.info => '#36a64f',
      AlertLevel.warning => '#ff9900',
      AlertLevel.error => '#ff0000',
      AlertLevel.critical => '#990000',
    };
    
    // Send to Slack webhook
    final payload = {
      'attachments': [
        {
          'color': color,
          'title': alert.title,
          'text': alert.message,
          'fields': alert.metadata.entries.map((e) => {
            'title': e.key,
            'value': e.value.toString(),
            'short': true,
          }).toList(),
          'footer': 'App Monitoring',
          'ts': alert.timestamp.millisecondsSinceEpoch ~/ 1000,
        },
      ],
    };
    
    // POST to Slack webhook URL
    http.post(
      Uri.parse(AppConfig.slackWebhookUrl),
      body: jsonEncode(payload),
    );
  }
}
```

---

## 🔍 **DISTRIBUTED TRACING**

### **Request Tracing**

```dart
// core/tracing/request_tracer.dart

class RequestTracer {
  static final RequestTracer _instance = RequestTracer._internal();
  factory RequestTracer() => _instance;
  RequestTracer._internal();
  
  Span startSpan({
    required String operation,
    String? parentSpanId,
    Map<String, dynamic>? tags,
  }) {
    final span = Span(
      traceId: parentSpanId == null ? _generateTraceId() : null,
      spanId: _generateSpanId(),
      parentSpanId: parentSpanId,
      operation: operation,
      startTime: DateTime.now(),
      tags: tags ?? {},
    );
    
    // Sample based on configuration
    if (_shouldSample()) {
      span.sampled = true;
    }
    
    return span;
  }
  
  bool _shouldSample() {
    final random = Random().nextDouble();
    return random < MonitoringConfig.current.tracingSampleRate;
  }
  
  String _generateTraceId() {
    return Uuid().v4();
  }
  
  String _generateSpanId() {
    return Uuid().v4().substring(0, 16);
  }
}

class Span {
  final String? traceId;
  final String spanId;
  final String? parentSpanId;
  final String operation;
  final DateTime startTime;
  final Map<String, dynamic> tags;
  DateTime? endTime;
  Duration? duration;
  bool sampled = false;
  final List<LogEntry> logs = [];
  
  Span({
    this.traceId,
    required this.spanId,
    this.parentSpanId,
    required this.operation,
    required this.startTime,
    required this.tags,
  });
  
  void log(String message, {LogLevel level = LogLevel.info}) {
    logs.add(LogEntry(
      timestamp: DateTime.now(),
      level: level,
      message: message,
    ));
  }
  
  void setTag(String key, dynamic value) {
    tags[key] = value;
  }
  
  void finish() {
    endTime = DateTime.now();
    duration = endTime!.difference(startTime);
    
    // Send to tracing backend if sampled
    if (sampled) {
      TracingBackend.send(this);
    }
    
    // Log slow operations
    if (duration!.inSeconds > 1) {
      logger.w('Slow operation: $operation took ${duration!.inMilliseconds}ms');
    }
  }
  
  Map<String, dynamic> toJson() {
    return {
      'traceId': traceId,
      'spanId': spanId,
      'parentSpanId': parentSpanId,
      'operation': operation,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'duration': duration?.inMicroseconds,
      'tags': tags,
      'logs': logs.map((l) => l.toJson()).toList(),
    };
  }
}

// Trace context for passing between operations
class TraceContext {
  final String traceId;
  final String spanId;
  final bool sampled;
  
  TraceContext({
    required this.traceId,
    required this.spanId,
    required this.sampled,
  });
  
  // For HTTP headers
  Map<String, String> toHeaders() {
    return {
      'X-Trace-Id': traceId,
      'X-Parent-Span-Id': spanId,
      'X-Sampled': sampled ? '1' : '0',
    };
  }
  
  // From HTTP headers
  factory TraceContext.fromHeaders(Map<String, dynamic> headers) {
    return TraceContext(
      traceId: headers['X-Trace-Id'] ?? Uuid().v4(),
      spanId: headers['X-Parent-Span-Id'] ?? '',
      sampled: headers['X-Sampled'] == '1',
    );
  }
}
```

---

## 📈 **PRODUCTION DASHBOARDS**

### **Dashboard Metrics Configuration**

```dart
// core/dashboards/dashboard_config.dart

class DashboardConfig {
  static List<DashboardPanel> get productionPanels => [
    // Real-time health
    DashboardPanel(
      title: 'System Health',
      type: PanelType.gauge,
      metrics: [
        'app.crash.free.users',
        'app.crash.free.sessions',
        'network.error.rate',
      ],
      refreshInterval: Duration(seconds: 30),
      alertThresholds: {
        'app.crash.free.users': ThresholdAlert(
          warning: 97,
          critical: 95,
          operator: ThresholdOperator.lessThan,
        ),
      },
    ),
    
    // Performance metrics
    DashboardPanel(
      title: 'Performance',
      type: PanelType.timeSeries,
      metrics: [
        'app.frame.rate',
        'app.jank.rate',
        'app.memory.usage',
      ],
      timeRange: Duration(hours: 1),
      refreshInterval: Duration(minutes: 1),
    ),
    
    // User activity
    DashboardPanel(
      title: 'User Activity',
      type: PanelType.timeSeries,
      metrics: [
        'user.session.duration',
        'user.interaction.latency',
        'business.feature.usage',
      ],
      timeRange: Duration(hours: 24),
      refreshInterval: Duration(minutes: 5),
    ),
    
    // Business metrics
    DashboardPanel(
      title: 'Business KPIs',
      type: PanelType.stat,
      metrics: [
        'business.conversion.rate',
        'business.transaction.value',
      ],
      aggregation: AggregationType.average,
      timeRange: Duration(days: 7),
    ),
    
    // Error distribution
    DashboardPanel(
      title: 'Error Distribution',
      type: PanelType.heatmap,
      metrics: ['user.error.rate'],
      dimensions: ['error_type', 'platform'],
      timeRange: Duration(hours: 24),
    ),
    
    // API performance
    DashboardPanel(
      title: 'API Performance',
      type: PanelType.table,
      metrics: [
        'network.request.count',
        'network.request.duration',
      ],
      groupBy: 'endpoint',
      sortBy: 'network.request.duration',
      sortOrder: SortOrder.descending,
    ),
  ];
  
  static Map<String, dynamic> exportForGrafana() {
    // Export dashboard configuration for Grafana
    return {
      'dashboard': {
        'title': 'Flutter App Production Metrics',
        'panels': productionPanels.map((p) => p.toGrafanaPanel()).toList(),
        'refresh': '30s',
        'time': {
          'from': 'now-6h',
          'to': 'now',
        },
      },
    };
  }
}
```

---

## 🔐 **SECURITY & PRIVACY**

### **Data Sanitization**

```dart
// core/security/data_sanitizer.dart

class DataSanitizer {
  // Patterns for sensitive data
  static final RegExp _emailPattern = RegExp(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b');
  static final RegExp _phonePattern = RegExp(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b');
  static final RegExp _creditCardPattern = RegExp(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b');
  static final RegExp _ssnPattern = RegExp(r'\b\d{3}-\d{2}-\d{4}\b');
  static final RegExp _ipPattern = RegExp(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b');
  
  static final List<String> _sensitiveKeys = [
    'password',
    'token',
    'api_key',
    'secret',
    'authorization',
    'credit_card',
    'ssn',
    'date_of_birth',
  ];
  
  static dynamic sanitize(dynamic data) {
    if (data == null) return null;
    
    if (data is String) {
      return _sanitizeString(data);
    } else if (data is Map) {
      return _sanitizeMap(data);
    } else if (data is List) {
      return data.map((item) => sanitize(item)).toList();
    }
    
    return data;
  }
  
  static String _sanitizeString(String input) {
    String sanitized = input;
    
    // Replace sensitive patterns
    sanitized = sanitized.replaceAll(_emailPattern, '[EMAIL]');
    sanitized = sanitized.replaceAll(_phonePattern, '[PHONE]');
    sanitized = sanitized.replaceAll(_creditCardPattern, '[CREDIT_CARD]');
    sanitized = sanitized.replaceAll(_ssnPattern, '[SSN]');
    
    // Optionally sanitize IPs in production
    if (AppEnvironment.isProduction) {
      sanitized = sanitized.replaceAll(_ipPattern, '[IP]');
    }
    
    return sanitized;
  }
  
  static Map<String, dynamic> _sanitizeMap(Map data) {
    final sanitized = <String, dynamic>{};
    
    data.forEach((key, value) {
      final keyLower = key.toString().toLowerCase();
      
      // Check if key contains sensitive words
      if (_sensitiveKeys.any((sensitive) => keyLower.contains(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(value);
      }
    });
    
    return sanitized;
  }
}

// Use in logging
class SecureLogger {
  static void log(String message, {Map<String, dynamic>? data}) {
    final sanitizedData = DataSanitizer.sanitize(data);
    logger.i(message, extra: sanitizedData as Map<String, dynamic>?);
  }
}
```

---

## 🚀 **DEPLOYMENT MONITORING**

### **Release Health Tracking**

```dart
// core/deployment/release_health.dart

class ReleaseHealth {
  static final ReleaseHealth _instance = ReleaseHealth._internal();
  factory ReleaseHealth() => _instance;
  ReleaseHealth._internal();
  
  String? _currentVersion;
  DateTime? _releaseTime;
  final Map<String, int> _versionCrashCounts = {};
  final Map<String, int> _versionUserCounts = {};
  
  void trackRelease(String version) {
    _currentVersion = version;
    _releaseTime = DateTime.now();
    
    logger.i('New release deployed', extra: {
      'version': version,
      'timestamp': _releaseTime!.toIso8601String(),
    });
    
    // Start monitoring release health
    _startReleaseHealthMonitoring();
  }
  
  void _startReleaseHealthMonitoring() {
    // Check health every 5 minutes for first hour
    Timer.periodic(Duration(minutes: 5), (timer) {
      if (DateTime.now().difference(_releaseTime!) > Duration(hours: 1)) {
        timer.cancel();
        _finalizeReleaseHealth();
        return;
      }
      
      _checkReleaseHealth();
    });
  }
  
  void _checkReleaseHealth() {
    final metrics = {
      'version': _currentVersion,
      'uptimeMinutes': DateTime.now().difference(_releaseTime!).inMinutes,
      'crashCount': _versionCrashCounts[_currentVersion!] ?? 0,
      'activeUsers': _versionUserCounts[_currentVersion!] ?? 0,
      'crashRate': _calculateCrashRate(),
      'adoptionRate': _calculateAdoptionRate(),
    };
    
    logger.i('Release health check', extra: metrics);
    
    // Check for release issues
    if (metrics['crashRate'] as double > 2.0) {
      AlertManager.trigger(
        AlertLevel.critical,
        'High crash rate in new release',
        'Version $_currentVersion has ${metrics['crashRate']}% crash rate',
        metadata: metrics,
      );
      
      // Consider automatic rollback
      _considerRollback(metrics);
    }
  }
  
  double _calculateCrashRate() {
    final crashes = _versionCrashCounts[_currentVersion!] ?? 0;
    final users = _versionUserCounts[_currentVersion!] ?? 1;
    return (crashes / users * 100);
  }
  
  double _calculateAdoptionRate() {
    final newVersionUsers = _versionUserCounts[_currentVersion!] ?? 0;
    final totalUsers = _versionUserCounts.values.fold(0, (sum, count) => sum + count);
    return totalUsers > 0 ? (newVersionUsers / totalUsers * 100) : 0;
  }
  
  void _considerRollback(Map<String, dynamic> metrics) {
    // Automatic rollback logic
    if (AppConfig.enableAutoRollback) {
      final crashRate = metrics['crashRate'] as double;
      
      if (crashRate > AppConfig.rollbackThreshold) {
        logger.e('Initiating automatic rollback due to high crash rate');
        _initiateRollback();
      }
    }
  }
  
  void _initiateRollback() {
    // Rollback implementation
    // This would typically involve:
    // 1. Notifying deployment system
    // 2. Switching feature flags
    // 3. Redirecting traffic
  }
  
  void _finalizeReleaseHealth() {
    final report = {
      'version': _currentVersion,
      'deploymentTime': _releaseTime!.toIso8601String(),
      'firstHourMetrics': {
        'crashes': _versionCrashCounts[_currentVersion!] ?? 0,
        'users': _versionUserCounts[_currentVersion!] ?? 0,
        'crashRate': _calculateCrashRate(),
        'adoptionRate': _calculateAdoptionRate(),
      },
    };
    
    logger.i('Release health report finalized', extra: report);
    
    // Send to analytics
    Analytics.track('release_health_report', report);
  }
}
```

---

## ✅ **PRODUCTION CHECKLIST**

### **Pre-Deployment**
- [ ] Monitoring configuration reviewed
- [ ] Alert channels configured
- [ ] Dashboard panels set up
- [ ] Tracing sample rate configured
- [ ] Log levels adjusted for production
- [ ] Data sanitization enabled
- [ ] Crash reporting configured
- [ ] Performance baselines established

### **Deployment**
- [ ] Release version tracked
- [ ] Health monitoring started
- [ ] Rollback plan ready
- [ ] Alert thresholds verified
- [ ] Team notified of deployment

### **Post-Deployment (First Hour)**
- [ ] Crash rate monitored
- [ ] Performance metrics checked
- [ ] User adoption tracked
- [ ] Error logs reviewed
- [ ] Alert channels tested

### **Ongoing Monitoring**
- [ ] Daily metrics review
- [ ] Weekly performance report
- [ ] Monthly trend analysis
- [ ] Quarterly optimization review
- [ ] Annual capacity planning

---

**Document Status:** ✅ COMPLETE  
**Scope:** Production monitoring and observability  
**Critical:** Must be configured before production deployment