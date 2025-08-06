import 'dart:io';

import 'package:logger/logger.dart';
import 'package:path/path.dart' as path;

/// Enhanced application logger with location-aware error reporting
class AppLogger {
  static AppLogger? _instance;
  late final Logger _logger;

  AppLogger._internal() {
    _logger = Logger(
      printer: _AppLogPrinter(),
      output: _AppLogOutput(),
      level: Level.debug,
    );
  }

  static AppLogger get instance {
    _instance ??= AppLogger._internal();
    return _instance!;
  }

  /// Log debug message with location context
  void debug(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    String? className,
    String? methodName,
    String? fileName,
    int? lineNumber,
  }) {
    final context = _buildContext(className, methodName, fileName, lineNumber);
    _logger.d('$context $message', error: error, stackTrace: stackTrace);
  }

  /// Log info message with location context
  void info(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    String? className,
    String? methodName,
    String? fileName,
    int? lineNumber,
  }) {
    final context = _buildContext(className, methodName, fileName, lineNumber);
    _logger.i('$context $message', error: error, stackTrace: stackTrace);
  }

  /// Log warning message with location context
  void warning(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    String? className,
    String? methodName,
    String? fileName,
    int? lineNumber,
  }) {
    final context = _buildContext(className, methodName, fileName, lineNumber);
    _logger.w('$context $message', error: error, stackTrace: stackTrace);
  }

  /// Log error message with location context
  void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    String? className,
    String? methodName,
    String? fileName,
    int? lineNumber,
  }) {
    final context = _buildContext(className, methodName, fileName, lineNumber);
    _logger.e('$context $message', error: error, stackTrace: stackTrace);
  }

  /// Log fatal error with location context
  void fatal(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    String? className,
    String? methodName,
    String? fileName,
    int? lineNumber,
  }) {
    final context = _buildContext(className, methodName, fileName, lineNumber);
    _logger.f('$context $message', error: error, stackTrace: stackTrace);
  }

  /// Build location context string
  String _buildContext(
    String? className,
    String? methodName,
    String? fileName,
    int? lineNumber,
  ) {
    final parts = <String>[];
    
    if (fileName != null) {
      final shortFileName = path.basename(fileName);
      parts.add('[$shortFileName');
      if (lineNumber != null) {
        parts[0] = '${parts[0]}:$lineNumber';
      }
      parts[0] = '${parts[0]}]';
    }
    
    if (className != null) {
      if (methodName != null) {
        parts.add('$className.$methodName()');
      } else {
        parts.add(className);
      }
    } else if (methodName != null) {
      parts.add('$methodName()');
    }
    
    return parts.isEmpty ? '' : '${parts.join(' ')} -';
  }
}

/// Custom log printer with enhanced formatting
class _AppLogPrinter extends LogPrinter {
  static final Map<Level, String> _levelPrefixes = {
    Level.trace: '🔍 TRACE',
    Level.debug: '🐛 DEBUG',
    Level.info: '💡 INFO',
    Level.warning: '⚠️  WARN',
    Level.error: '❌ ERROR',
    Level.fatal: '💀 FATAL',
  };

  static final Map<Level, String> _levelColors = {
    Level.trace: '\x1B[90m', // Gray
    Level.debug: '\x1B[36m', // Cyan
    Level.info: '\x1B[32m', // Green
    Level.warning: '\x1B[33m', // Yellow
    Level.error: '\x1B[31m', // Red
    Level.fatal: '\x1B[35m', // Magenta
  };

  static const String _resetColor = '\x1B[0m';

  @override
  List<String> log(LogEvent event) {
    final color = _levelColors[event.level] ?? '';
    final prefix = _levelPrefixes[event.level] ?? event.level.name.toUpperCase();
    final reset = _resetColor;
    final timestamp = DateTime.now().toIso8601String();
    
    final lines = <String>[];
    
    // Main log line
    lines.add('$color[$timestamp] $prefix$reset ${event.message}');
    
    // Error details if present
    if (event.error != null) {
      lines.add('$color┌─ Error Details:$reset');
      lines.add('$color│ Type: ${event.error.runtimeType}$reset');
      lines.add('$color│ Message: ${event.error}$reset');
      lines.add('$color└──────────────$reset');
    }
    
    // Stack trace if present
    if (event.stackTrace != null) {
      lines.add('$color┌─ Stack Trace:$reset');
      final stackLines = event.stackTrace.toString().split('\n');
      for (int i = 0; i < stackLines.length && i < 10; i++) {
        final line = stackLines[i].trim();
        if (line.isNotEmpty) {
          lines.add('$color│ $line$reset');
        }
      }
      if (stackLines.length > 10) {
        lines.add('$color│ ... ${stackLines.length - 10} more lines$reset');
      }
      lines.add('$color└──────────────$reset');
    }
    
    return lines;
  }
}

/// Custom log output that can write to console and file
class _AppLogOutput extends LogOutput {
  @override
  void output(OutputEvent event) {
    for (final line in event.lines) {
      // Print to console
      print(line);
    }
    
    // TODO: Add file logging capability here if needed
    // _writeToFile(event.lines);
  }
}

/// Extension to provide easy logging methods to any class
extension LoggerExtension on Object {
  AppLogger get logger => AppLogger.instance;

  /// Log debug with automatic context detection
  void logDebug(
    String message, {
    Object? error,
    StackTrace? stackTrace,
  }) {
    final context = _getCallerContext();
    logger.debug(
      message,
      error: error,
      stackTrace: stackTrace,
      className: context['className'],
      methodName: context['methodName'],
      fileName: context['fileName'],
      lineNumber: context['lineNumber'],
    );
  }

  /// Log info with automatic context detection
  void logInfo(
    String message, {
    Object? error,
    StackTrace? stackTrace,
  }) {
    final context = _getCallerContext();
    logger.info(
      message,
      error: error,
      stackTrace: stackTrace,
      className: context['className'],
      methodName: context['methodName'],
      fileName: context['fileName'],
      lineNumber: context['lineNumber'],
    );
  }

  /// Log warning with automatic context detection
  void logWarning(
    String message, {
    Object? error,
    StackTrace? stackTrace,
  }) {
    final context = _getCallerContext();
    logger.warning(
      message,
      error: error,
      stackTrace: stackTrace,
      className: context['className'],
      methodName: context['methodName'],
      fileName: context['fileName'],
      lineNumber: context['lineNumber'],
    );
  }

  /// Log error with automatic context detection
  void logError(
    String message, {
    Object? error,
    StackTrace? stackTrace,
  }) {
    final context = _getCallerContext();
    logger.error(
      message,
      error: error,
      stackTrace: stackTrace,
      className: context['className'],
      methodName: context['methodName'],
      fileName: context['fileName'],
      lineNumber: context['lineNumber'],
    );
  }

  /// Get caller context from stack trace
  Map<String, dynamic> _getCallerContext() {
    final stackTrace = StackTrace.current;
    final lines = stackTrace.toString().split('\n');
    
    // Skip first 2 lines (current method and extension method)
    if (lines.length > 2) {
      final callerLine = lines[2];
      final match = RegExp(r'#\d+\s+(.+)\s+\((.+):(\d+):\d+\)').firstMatch(callerLine);
      
      if (match != null) {
        final fullMethod = match.group(1) ?? '';
        final fileName = match.group(2) ?? '';
        final lineNumber = int.tryParse(match.group(3) ?? '');
        
        // Extract class and method name
        String? className;
        String? methodName;
        
        if (fullMethod.contains('.')) {
          final parts = fullMethod.split('.');
          if (parts.length >= 2) {
            className = parts[parts.length - 2];
            methodName = parts.last;
          }
        } else {
          methodName = fullMethod;
        }
        
        return {
          'className': className,
          'methodName': methodName,
          'fileName': fileName,
          'lineNumber': lineNumber,
        };
      }
    }
    
    return {
      'className': runtimeType.toString(),
      'methodName': null,
      'fileName': null,
      'lineNumber': null,
    };
  }
}