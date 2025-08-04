import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Error boundary widget that catches and handles errors gracefully
class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(Object error, StackTrace? stackTrace)? fallback;
  final bool showErrorInDebug;

  const ErrorBoundary({
    super.key,
    required this.child,
    this.fallback,
    this.showErrorInDebug = true,
  });

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  Object? _error;
  StackTrace? _stackTrace;

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return widget.fallback?.call(_error!, _stackTrace) ?? 
          _buildDefaultErrorWidget(_error!, _stackTrace);
    }

    return ErrorBoundaryChild(
      onError: (error, stackTrace) {
        setState(() {
          _error = error;
          _stackTrace = stackTrace;
        });
      },
      child: widget.child,
    );
  }

  Widget _buildDefaultErrorWidget(Object error, StackTrace? stackTrace) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              const Text(
                'Something went wrong',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'The application encountered an unexpected error.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
              if (kDebugMode && widget.showErrorInDebug) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      'Error: $error\n\n${stackTrace ?? ''}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _error = null;
                    _stackTrace = null;
                  });
                },
                child: const Text('Try Again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ErrorBoundaryChild extends StatefulWidget {
  final Widget child;
  final void Function(Object error, StackTrace stackTrace) onError;

  const ErrorBoundaryChild({
    super.key,
    required this.child,
    required this.onError,
  });

  @override
  State<ErrorBoundaryChild> createState() => _ErrorBoundaryChildState();
}

class _ErrorBoundaryChildState extends State<ErrorBoundaryChild> {
  @override
  Widget build(BuildContext context) {
    try {
      return widget.child;
    } catch (error, stackTrace) {
      if (kDebugMode) {
        print('ErrorBoundary caught error: $error');
        print('Stack trace: $stackTrace');
      }
      widget.onError(error, stackTrace);
      return const SizedBox.shrink();
    }
  }
}