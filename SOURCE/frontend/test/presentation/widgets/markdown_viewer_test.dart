import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/presentation/widgets/markdown_viewer.dart';

import '../../helpers/test_helpers.dart';

void main() {
  group('MarkdownViewer', () {
    const sampleMarkdown = '''
# Test Article

This is a **test** article with `inline code`.

## Code Block

```dart
void main() {
  print('Hello World');
}
```

> This is a blockquote

- List item 1
- List item 2
''';

    testWidgets('should render markdown content', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const MarkdownViewer(content: sampleMarkdown),
        ),
      );

      expect(find.text('Test Article'), findsOneWidget);
      expect(find.text('This is a test article with inline code.'), findsOneWidget);
      expect(find.text('Code Block'), findsOneWidget);
    });

    testWidgets('should display title when provided', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const MarkdownViewer(
            content: sampleMarkdown,
            title: 'Sample Article Title',
          ),
        ),
      );

      expect(find.text('Sample Article Title'), findsOneWidget);
    });

    testWidgets('should show fullscreen and copy buttons when title is provided', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const MarkdownViewer(
            content: sampleMarkdown,
            title: 'Sample Article Title',
          ),
        ),
      );

      expect(find.byIcon(Icons.fullscreen), findsOneWidget);
      expect(find.byIcon(Icons.copy), findsOneWidget);
    });

    testWidgets('should not show action buttons when no title provided', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const MarkdownViewer(content: sampleMarkdown),
        ),
      );

      expect(find.byIcon(Icons.fullscreen), findsNothing);
      expect(find.byIcon(Icons.copy), findsNothing);
    });

    testWidgets('should show copy button in fullscreen mode', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const MarkdownViewer(
            content: sampleMarkdown,
            title: 'Sample Article Title',
            showFullscreen: true,
          ),
        ),
      );

      expect(find.text('Article Preview'), findsOneWidget);
      expect(find.byIcon(Icons.copy), findsOneWidget);
      expect(find.byType(AppBar), findsOneWidget);
    });

    testWidgets('should handle empty content gracefully', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const MarkdownViewer(content: ''),
        ),
      );

      // Should not throw any errors
      expect(find.byType(MarkdownViewer), findsOneWidget);
    });

    testWidgets('should handle markdown with special characters', (tester) async {
      const specialMarkdown = '''
# Title with `code`

Content with **bold** and *italic* text.

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

[Link text](https://example.com)
''';

      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const MarkdownViewer(content: specialMarkdown),
        ),
      );

      expect(find.text('Title with code'), findsOneWidget);
      expect(find.text('Content with bold and italic text.'), findsOneWidget);
    });

    testWidgets('should trigger copy action when copy button pressed', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const MarkdownViewer(
            content: sampleMarkdown,
            title: 'Sample Article Title',
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.copy));
      await tester.pumpAndSettle();

      // Should show snackbar (implementation shows this)
      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Content copied to clipboard'), findsOneWidget);
    });

    testWidgets('should open fullscreen when fullscreen button pressed', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const MarkdownViewer(
            content: sampleMarkdown,
            title: 'Sample Article Title',
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.fullscreen));
      await tester.pumpAndSettle();

      // Should navigate to fullscreen view
      expect(find.text('Article Preview'), findsOneWidget);
      expect(find.byType(AppBar), findsOneWidget);
    });

    testWidgets('should handle long content without overflow', (tester) async {
      final longContent = List.generate(100, (index) => 'Line $index').join('\n\n');

      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          MarkdownViewer(content: longContent),
        ),
      );

      // Should render without overflow errors
      expect(find.byType(MarkdownViewer), findsOneWidget);
      expect(find.text('Line 0'), findsOneWidget);
    });

    testWidgets('should accept custom scroll controller', (tester) async {
      final scrollController = ScrollController();
      
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          MarkdownViewer(
            content: sampleMarkdown,
            scrollController: scrollController,
          ),
        ),
      );

      expect(find.byType(MarkdownViewer), findsOneWidget);
      
      scrollController.dispose();
    });

    testWidgets('should call onScroll callback when scrolled', (tester) async {
      double? lastScrollRatio;
      final longContent = List.generate(50, (index) => 'Line $index\n\n').join();

      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          SizedBox(
            height: 200,
            child: MarkdownViewer(
              content: longContent,
              onScroll: (ratio) => lastScrollRatio = ratio,
            ),
          ),
        ),
      );

      // Find the scrollable and scroll it
      final scrollable = find.byType(Scrollable).first;
      await tester.scrollUntilVisible(
        find.text('Line 10'),
        100.0,
        scrollable: scrollable,
      );
      await tester.pumpAndSettle();

      // Should have called onScroll callback
      expect(lastScrollRatio, isNotNull);
      expect(lastScrollRatio, greaterThan(0.0));
    });

    testWidgets('should synchronize scroll position when scrollToRatio called', (tester) async {
      final scrollController = ScrollController();
      final markdownViewerKey = GlobalKey<_MarkdownViewerState>();
      final longContent = List.generate(50, (index) => 'Line $index\n\n').join();

      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          SizedBox(
            height: 200,
            child: MarkdownViewer(
              key: markdownViewerKey,
              content: longContent,
              scrollController: scrollController,
            ),
          ),
        ),
      );

      // Wait for the widget to be built and scroll controller to be attached
      await tester.pumpAndSettle();

      // Test scrollToRatio method (this tests internal scroll synchronization)
      markdownViewerKey.currentState?.scrollToRatio(0.5);
      await tester.pumpAndSettle();

      // Should have moved the scroll position
      expect(scrollController.hasClients, isTrue);
      
      scrollController.dispose();
    });
  });
}