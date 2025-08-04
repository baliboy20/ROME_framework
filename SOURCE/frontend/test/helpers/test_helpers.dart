import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Creates a testable widget with ProviderScope for Riverpod testing
Widget createTestWidget({
  required Widget child,
  List<Override> overrides = const [],
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      home: Scaffold(body: child),
    ),
  );
}

/// Creates a basic MaterialApp wrapper for widget testing
Widget createMaterialTestWidget(Widget child) {
  return MaterialApp(
    home: Scaffold(body: child),
  );
}

/// Pump widget with standard settings and allow settling
Future<void> pumpTestWidget(
  WidgetTester tester,
  Widget widget, {
  Duration? settleDuration,
}) async {
  await tester.pumpWidget(widget);
  await tester.pumpAndSettle(settleDuration ?? const Duration(milliseconds: 100));
}

/// Common test data and fixtures
class TestData {
  static const String sampleEmail = 'test@example.com';
  static const String sampleToken = 'sample_token_123';
  static const String sampleBatchId = 'batch_123';
  static const String sampleUrl = 'https://medium.com/flutter-article';
  static const String sampleTitle = 'Sample Flutter Article';
  static const String sampleContent = '''
# Sample Article

This is a sample article content with **bold** text and `code`.

## Code Example

```dart
void main() {
  print('Hello Flutter!');
}
```
''';

  static DateTime get sampleDate => DateTime(2025, 7, 28);
  static DateTime get sampleStartDate => DateTime(2025, 7, 1);
  static DateTime get sampleEndDate => DateTime(2025, 7, 31);
}