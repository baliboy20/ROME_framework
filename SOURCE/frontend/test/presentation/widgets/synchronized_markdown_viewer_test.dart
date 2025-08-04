import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/presentation/widgets/synchronized_markdown_viewer.dart';

import '../../helpers/test_helpers.dart';

void main() {
  group('SynchronizedMarkdownViewer', () {
    const primaryContent = '''
# Primary Article

This is the **primary** content with `inline code`.

## Code Section

```dart
void primary() {
  print('Primary');
}
```
''';

    const secondaryContent = '''
# Secondary Article

This is the **secondary** content with `inline code`.

## Code Section

```dart
void secondary() {
  print('Secondary');
}
```
''';

    testWidgets('should render both markdown viewers side by side', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const SynchronizedMarkdownViewer(
            primaryContent: primaryContent,
            secondaryContent: secondaryContent,
          ),
        ),
      );

      expect(find.text('Primary Article'), findsOneWidget);
      expect(find.text('Secondary Article'), findsOneWidget);
      expect(find.text('This is the primary content with inline code.'), findsOneWidget);
      expect(find.text('This is the secondary content with inline code.'), findsOneWidget);
    });

    testWidgets('should display titles when provided', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const SynchronizedMarkdownViewer(
            primaryContent: primaryContent,
            secondaryContent: secondaryContent,
            primaryTitle: 'Primary Title',
            secondaryTitle: 'Secondary Title',
          ),
        ),
      );

      expect(find.text('Primary Title'), findsOneWidget);
      expect(find.text('Secondary Title'), findsOneWidget);
    });

    testWidgets('should handle empty content gracefully', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const SynchronizedMarkdownViewer(
            primaryContent: '',
            secondaryContent: '',
          ),
        ),
      );

      // Should not throw any errors
      expect(find.byType(SynchronizedMarkdownViewer), findsOneWidget);
    });

    testWidgets('should render with different content lengths', (tester) async {
      const shortContent = '# Short\n\nBrief content.';
      final longContent = List.generate(20, (index) => 'Line $index').join('\n\n');

      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          SynchronizedMarkdownViewer(
            primaryContent: shortContent,
            secondaryContent: longContent,
          ),
        ),
      );

      expect(find.text('Short'), findsOneWidget);
      expect(find.text('Line 0'), findsOneWidget);
      expect(find.byType(SynchronizedMarkdownViewer), findsOneWidget);
    });

    testWidgets('should show vertical divider between viewers', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const SynchronizedMarkdownViewer(
            primaryContent: primaryContent,
            secondaryContent: secondaryContent,
          ),
        ),
      );

      expect(find.byType(VerticalDivider), findsOneWidget);
    });

    testWidgets('should handle markdown with complex content', (tester) async {
      const complexMarkdown = '''
# Complex Content

## Lists
- Item 1
- Item 2
  - Nested item

## Table
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

## Blockquote
> This is a quote

## Link
[Example](https://example.com)
''';

      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const SynchronizedMarkdownViewer(
            primaryContent: complexMarkdown,
            secondaryContent: complexMarkdown,
          ),
        ),
      );

      expect(find.text('Complex Content'), findsAtLeastNWidgets(2)); // Both viewers
      expect(find.text('Item 1'), findsAtLeastNWidgets(2));
      expect(find.byType(SynchronizedMarkdownViewer), findsOneWidget);
    });
  });
}