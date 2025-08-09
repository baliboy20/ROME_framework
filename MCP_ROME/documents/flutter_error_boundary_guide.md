# Flutter Error Boundary Widget - Complete Guide

**Version:** 1.0  
**Purpose:** Understanding and implementing Error Boundaries in Flutter applications

---

## 🎯 **What is an Error Boundary Widget?**

An Error Boundary is a widget that:
- **Catches errors** that occur anywhere in its child widget tree
- **Prevents app crashes** by containing the error locally
- **Shows fallback UI** instead of the default red error screen
- **Reports errors** to crash reporting services
- **Allows recovery** through retry mechanisms

### **Why Are Error Boundaries Important?**

```dart
// WITHOUT Error Boundary - App crashes or shows red screen
class BadWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    throw Exception('Something went wrong!'); // 💥 Entire app shows error
  }
}

// WITH Error Boundary - Error is contained and handled gracefully
class GoodApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ErrorBoundary(
      child: BadWidget(), // ✅ Error caught and handled
      onError: (error, stack) => Text('Oops! Something went wrong'),
    );
  }
}
```

---

## 🏗️ **Basic Error Boundary Implementation**

### **Simple Error Boundary**

```dart
// core/widgets/error_boundary.dart

import 'package:flutter/material.dart';

class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(FlutterErrorDetails)? errorBuilder;
  final void Function(FlutterErrorDetails)? onError;

  const ErrorBoundary({
    Key? key,
    required this.child,
    this.errorBuilder,
    this.onError,
  }) : super(key: key);

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  FlutterErrorDetails? _errorDetails;

  @override
  void initState() {
    super.initState();
    // Catch Flutter framework errors
    FlutterError.onError = (FlutterErrorDetails details) {
      setState(() {
        _errorDetails = details;
      });
      // Call the optional error callback
      widget.onError?.call(details);
    };
  }

  void _resetError() {
    setState(() {
      _errorDetails = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_errorDetails != null) {
      // Show error UI
      if (widget.errorBuilder != null) {
        return widget.errorBuilder!(_errorDetails!);
      }
      
      // Default error UI
      return _DefaultErrorWidget(
        errorDetails: _errorDetails!,
        onRetry: _resetError,
      );
    }

    // Normal child widget
    return widget.child;
  }
}

class _DefaultErrorWidget extends StatelessWidget {
  final FlutterErrorDetails errorDetails;
  final VoidCallback onRetry;

  const _DefaultErrorWidget({
    required this.errorDetails,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                color: Colors.red,
                size: 64,
              ),
              SizedBox(height: 16),
              Text(
                'Oops! Something went wrong',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8),
              Text(
                kDebugMode 
                  ? errorDetails.exception.toString()
                  : 'We encountered an unexpected error. Please try again.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: Icon(Icons.refresh),
                label: Text('Try Again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## 🚀 **Advanced Error Boundary with Features**

### **Production-Ready Error Boundary**

```dart
// core/widgets/advanced_error_boundary.dart

class AdvancedErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(ErrorInfo)? errorBuilder;
  final Future<void> Function(ErrorInfo)? onError;
  final bool showDebugInfo;
  final int maxRetries;
  final Duration retryDelay;

  const AdvancedErrorBoundary({
    Key? key,
    required this.child,
    this.errorBuilder,
    this.onError,
    this.showDebugInfo = kDebugMode,
    this.maxRetries = 3,
    this.retryDelay = const Duration(seconds: 2),
  }) : super(key: key);

  @override
  State<AdvancedErrorBoundary> createState() => _AdvancedErrorBoundaryState();
}

class _AdvancedErrorBoundaryState extends State<AdvancedErrorBoundary> {
  ErrorInfo? _errorInfo;
  int _retryCount = 0;
  bool _isRetrying = false;

  @override
  void initState() {
    super.initState();
    _setupErrorHandling();
  }

  void _setupErrorHandling() {
    // Override the error widget builder
    ErrorWidget.builder = (FlutterErrorDetails details) {
      // Capture the error
      _captureError(details);
      
      // Return a widget to display
      return Container(); // Temporary widget while state updates
    };
  }

  void _captureError(FlutterErrorDetails details) {
    final errorInfo = ErrorInfo(
      error: details.exception,
      stackTrace: details.stack,
      library: details.library,
      context: details.context?.toString(),
      timestamp: DateTime.now(),
      retryCount: _retryCount,
    );

    // Update state to show error UI
    if (mounted) {
      setState(() {
        _errorInfo = errorInfo;
      });
    }

    // Report error
    _reportError(errorInfo);
  }

  Future<void> _reportError(ErrorInfo errorInfo) async {
    try {
      // Log error locally
      logger.e(
        'Error Boundary caught error',
        error: errorInfo.error,
        stackTrace: errorInfo.stackTrace,
      );

      // Report to crash analytics
      await CrashReporting.recordError(
        errorInfo.error,
        errorInfo.stackTrace,
        extra: {
          'library': errorInfo.library,
          'context': errorInfo.context,
          'retryCount': errorInfo.retryCount,
        },
      );

      // Call custom error handler
      await widget.onError?.call(errorInfo);
    } catch (e) {
      // Prevent error reporting from causing issues
      debugPrint('Failed to report error: $e');
    }
  }

  Future<void> _retry() async {
    if (_retryCount >= widget.maxRetries) {
      _showMaxRetriesReached();
      return;
    }

    setState(() {
      _isRetrying = true;
      _retryCount++;
    });

    // Wait before retry
    await Future.delayed(widget.retryDelay);

    setState(() {
      _errorInfo = null;
      _isRetrying = false;
    });
  }

  void _showMaxRetriesReached() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Maximum retry attempts reached. Please restart the app.'),
        action: SnackBarAction(
          label: 'RESTART',
          onPressed: () {
            // Restart app logic
            Phoenix.rebirth(context);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_errorInfo != null) {
      // Use custom error builder if provided
      if (widget.errorBuilder != null) {
        return widget.errorBuilder!(_errorInfo!);
      }

      // Default error UI
      return _AdvancedErrorWidget(
        errorInfo: _errorInfo!,
        onRetry: _retry,
        isRetrying: _isRetrying,
        showDebugInfo: widget.showDebugInfo,
        retryCount: _retryCount,
        maxRetries: widget.maxRetries,
      );
    }

    // Wrap child in error detector
    return _ErrorDetector(
      onError: _captureError,
      child: widget.child,
    );
  }
}

// Widget that actively detects errors in build
class _ErrorDetector extends StatelessWidget {
  final Widget child;
  final void Function(FlutterErrorDetails) onError;

  const _ErrorDetector({
    required this.child,
    required this.onError,
  });

  @override
  Widget build(BuildContext context) {
    FlutterError.onError = onError;
    
    // Also catch errors in build method
    try {
      return child;
    } catch (error, stackTrace) {
      onError(FlutterErrorDetails(
        exception: error,
        stack: stackTrace,
        library: 'Error Boundary',
        context: ErrorDescription('Error in widget build'),
      ));
      return Container(); // Return empty container while error is being handled
    }
  }
}

// Enhanced error information
class ErrorInfo {
  final dynamic error;
  final StackTrace? stackTrace;
  final String? library;
  final String? context;
  final DateTime timestamp;
  final int retryCount;

  ErrorInfo({
    required this.error,
    this.stackTrace,
    this.library,
    this.context,
    required this.timestamp,
    required this.retryCount,
  });

  String get errorType => error.runtimeType.toString();
  
  String get message {
    if (error is Exception) {
      return error.toString();
    } else if (error is Error) {
      return error.toString();
    }
    return 'An unexpected error occurred';
  }

  bool get isNetworkError {
    return error is SocketException || 
           error is HttpException ||
           error.toString().contains('network');
  }

  bool get isPermissionError {
    return error.toString().contains('permission') ||
           error.toString().contains('denied');
  }
}
```

---

## 🎨 **Error UI Components**

### **Customizable Error Widget**

```dart
// core/widgets/error_ui.dart

class _AdvancedErrorWidget extends StatelessWidget {
  final ErrorInfo errorInfo;
  final VoidCallback onRetry;
  final bool isRetrying;
  final bool showDebugInfo;
  final int retryCount;
  final int maxRetries;

  const _AdvancedErrorWidget({
    required this.errorInfo,
    required this.onRetry,
    required this.isRetrying,
    required this.showDebugInfo,
    required this.retryCount,
    required this.maxRetries,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            children: [
              Spacer(),
              _buildIcon(),
              SizedBox(height: 24),
              _buildTitle(),
              SizedBox(height: 12),
              _buildMessage(context),
              if (showDebugInfo) ...[
                SizedBox(height: 24),
                _buildDebugInfo(context),
              ],
              SizedBox(height: 32),
              _buildActions(context),
              Spacer(),
              _buildFooter(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIcon() {
    IconData icon;
    Color color;

    if (errorInfo.isNetworkError) {
      icon = Icons.wifi_off;
      color = Colors.orange;
    } else if (errorInfo.isPermissionError) {
      icon = Icons.lock_outline;
      color = Colors.blue;
    } else {
      icon = Icons.error_outline;
      color = Colors.red;
    }

    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(
        icon,
        size: 64,
        color: color,
      ),
    );
  }

  Widget _buildTitle() {
    String title;

    if (errorInfo.isNetworkError) {
      title = 'Connection Problem';
    } else if (errorInfo.isPermissionError) {
      title = 'Permission Required';
    } else {
      title = 'Something Went Wrong';
    }

    return Text(
      title,
      style: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
      ),
      textAlign: TextAlign.center,
    );
  }

  Widget _buildMessage(BuildContext context) {
    String message;

    if (errorInfo.isNetworkError) {
      message = 'Please check your internet connection and try again.';
    } else if (errorInfo.isPermissionError) {
      message = 'This app needs certain permissions to work properly. Please grant the required permissions.';
    } else if (showDebugInfo) {
      message = errorInfo.message;
    } else {
      message = 'We encountered an unexpected error. Our team has been notified.';
    }

    return Text(
      message,
      style: TextStyle(
        fontSize: 16,
        color: Colors.grey[600],
      ),
      textAlign: TextAlign.center,
    );
  }

  Widget _buildDebugInfo(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Debug Information',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Error: ${errorInfo.errorType}',
            style: TextStyle(
              fontFamily: 'monospace',
              fontSize: 11,
            ),
          ),
          if (errorInfo.library != null)
            Text(
              'Library: ${errorInfo.library}',
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 11,
              ),
            ),
          Text(
            'Time: ${errorInfo.timestamp.toLocal()}',
            style: TextStyle(
              fontFamily: 'monospace',
              fontSize: 11,
            ),
          ),
          if (retryCount > 0)
            Text(
              'Retry: $retryCount/$maxRetries',
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 11,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: isRetrying ? null : onRetry,
            icon: isRetrying 
              ? SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation(Colors.white),
                  ),
                )
              : Icon(Icons.refresh),
            label: Text(
              isRetrying ? 'Retrying...' : 'Try Again',
              style: TextStyle(fontSize: 16),
            ),
            style: ElevatedButton.styleFrom(
              padding: EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        SizedBox(height: 12),
        TextButton(
          onPressed: () {
            Navigator.of(context).pushNamedAndRemoveUntil(
              '/',
              (route) => false,
            );
          },
          child: Text('Go to Home'),
        ),
      ],
    );
  }

  Widget _buildFooter() {
    return Column(
      children: [
        if (showDebugInfo)
          TextButton(
            onPressed: () {
              _shareErrorReport(errorInfo);
            },
            child: Text(
              'Share Error Report',
              style: TextStyle(fontSize: 12),
            ),
          ),
        Text(
          'Error ID: ${errorInfo.timestamp.millisecondsSinceEpoch}',
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[400],
          ),
        ),
      ],
    );
  }

  void _shareErrorReport(ErrorInfo errorInfo) {
    final report = '''
Error Report
============
Time: ${errorInfo.timestamp}
Type: ${errorInfo.errorType}
Message: ${errorInfo.message}
${errorInfo.stackTrace != null ? '\nStack Trace:\n${errorInfo.stackTrace}' : ''}
''';

    Share.share(report, subject: 'Error Report');
  }
}
```

---

## 🔧 **Usage Patterns**

### **1. App-Level Error Boundary**

```dart
// main.dart
void main() {
  runApp(
    AdvancedErrorBoundary(
      child: MyApp(),
      onError: (errorInfo) async {
        // Send to crash reporting
        await FirebaseCrashlytics.instance.recordError(
          errorInfo.error,
          errorInfo.stackTrace,
        );
      },
    ),
  );
}
```

### **2. Feature-Level Error Boundaries**

```dart
class FeatureScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Feature')),
      body: ErrorBoundary(
        child: FeatureContent(), // Risky feature code
        errorBuilder: (error) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.warning, size: 48, color: Colors.orange),
              SizedBox(height: 16),
              Text('This feature is temporarily unavailable'),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('Go Back'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### **3. Network Request Error Boundary**

```dart
class DataFetcher extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ErrorBoundary(
      child: FutureBuilder(
        future: fetchData(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            throw snapshot.error!; // Will be caught by ErrorBoundary
          }
          return DataDisplay(snapshot.data);
        },
      ),
      errorBuilder: (error) {
        if (error.error is SocketException) {
          return NetworkErrorWidget();
        }
        return GenericErrorWidget();
      },
    );
  }
}
```

### **4. Async Error Handling**

```dart
class AsyncErrorBoundary extends StatelessWidget {
  final Future<Widget> Function() builder;
  
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Widget>(
      future: _buildWithErrorHandling(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return ErrorBoundary(
            child: Container(),
            errorBuilder: (_) => ErrorWidget(snapshot.error!),
          );
        }
        return snapshot.data ?? CircularProgressIndicator();
      },
    );
  }
  
  Future<Widget> _buildWithErrorHandling() async {
    try {
      return await builder();
    } catch (e, stack) {
      // Report error
      await CrashReporting.recordError(e, stack);
      rethrow;
    }
  }
}
```

---

## 🎯 **Best Practices**

### **1. Granular Error Boundaries**
```dart
// ✅ GOOD: Multiple specific boundaries
Column(
  children: [
    ErrorBoundary(child: HeaderWidget()),
    ErrorBoundary(child: ContentWidget()),
    ErrorBoundary(child: FooterWidget()),
  ],
)

// ❌ BAD: Single boundary for everything
ErrorBoundary(
  child: Column(
    children: [HeaderWidget(), ContentWidget(), FooterWidget()],
  ),
)
```

### **2. Meaningful Error Messages**
```dart
// ✅ GOOD: Context-specific messages
errorBuilder: (error) {
  if (error.isNetworkError) {
    return Text('Check your connection');
  } else if (error.isPermissionError) {
    return Text('Please grant camera permission');
  }
  return Text('Something went wrong');
}

// ❌ BAD: Generic message for all errors
errorBuilder: (_) => Text('Error occurred')
```

### **3. Recovery Actions**
```dart
// ✅ GOOD: Provide recovery options
ErrorBoundary(
  child: RiskyWidget(),
  errorBuilder: (error) => Column(
    children: [
      Text('Failed to load'),
      ElevatedButton(
        onPressed: () => setState(() {}), // Retry
        child: Text('Retry'),
      ),
      TextButton(
        onPressed: () => Navigator.pop(context), // Go back
        child: Text('Go Back'),
      ),
    ],
  ),
)
```

---

## ⚠️ **Limitations & Considerations**

### **What Error Boundaries CAN Catch:**
- Widget build errors
- Lifecycle method errors
- Synchronous errors in child widgets
- Errors thrown during state updates

### **What Error Boundaries CANNOT Catch:**
- Errors in async callbacks (use try-catch)
- Errors in event handlers (use try-catch)
- Errors during app initialization
- Native platform errors

### **Handling Uncaught Errors:**
```dart
// For async errors
runZonedGuarded(() {
  runApp(MyApp());
}, (error, stack) {
  // Handle uncaught async errors
});

// For platform errors
PlatformDispatcher.instance.onError = (error, stack) {
  // Handle platform errors
  return true;
};
```

---

**Summary:** Error Boundaries are essential for building resilient Flutter apps that gracefully handle failures without crashing, providing users with helpful recovery options while capturing diagnostic information for developers.