import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/presentation/providers/email_provider.dart';
import 'package:medium_flutter_extractor/presentation/widgets/email_list_widget.dart';
import 'package:mocktail/mocktail.dart';

import '../../helpers/test_helpers.dart';

class MockEmailNotifier extends StateNotifier<AsyncValue<List<Map<String, dynamic>>>>
    with Mock {
  MockEmailNotifier() : super(const AsyncValue.data([]));
}

void main() {
  group('EmailListWidget', () {
    testWidgets('should display empty state when no emails', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          const ProviderScope(
            child: EmailListWidget(),
          ),
        ),
      );

      expect(find.text('No emails fetched'), findsOneWidget);
      expect(find.text('Use the filter on the left to fetch emails'), findsOneWidget);
      expect(find.byIcon(Icons.inbox_outlined), findsOneWidget);
    });

    testWidgets('should display loading state', (tester) async {
      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          ProviderScope(
            overrides: [
              emailNotifierProvider.overrideWith(() {
                return MockEmailNotifier()
                  ..state = const AsyncValue.loading();
              }),
            ],
            child: const EmailListWidget(),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should display email list when emails are fetched', (tester) async {
      final testEmails = [
        {
          'id': '1',
          'subject': 'Medium Daily Digest',
          'sender': 'noreply@medium.com',
          'date': '2025-07-29T10:00:00Z',
          'bodyPreview': 'Your daily reading recommendations...',
          'linksFound': 15,
          'flutterLinks': ['https://medium.com/flutter-article-1'],
        },
        {
          'id': '2',
          'subject': 'Medium Daily Digest',
          'sender': 'noreply@medium.com',
          'date': '2025-07-28T10:00:00Z',
          'bodyPreview': 'Top stories for you...',
          'linksFound': 20,
          'flutterLinks': [
            'https://medium.com/flutter-article-2',
            'https://medium.com/flutter-article-3',
          ],
        },
      ];

      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          ProviderScope(
            overrides: [
              emailNotifierProvider.overrideWith(() {
                return MockEmailNotifier()
                  ..state = AsyncValue.data(testEmails);
              }),
            ],
            child: const EmailListWidget(),
          ),
        ),
      );

      // Check email cards are displayed
      expect(find.byType(Card), findsNWidgets(2));
      expect(find.text('Medium Daily Digest'), findsNWidgets(2));
      expect(find.text('From: noreply@medium.com'), findsNWidgets(2));
      
      // Check link counts
      expect(find.text('15 total links'), findsOneWidget);
      expect(find.text('20 total links'), findsOneWidget);
      expect(find.text('1 Flutter links'), findsOneWidget);
      expect(find.text('2 Flutter links'), findsOneWidget);
    });

    testWidgets('should expand email to show details', (tester) async {
      final testEmails = [
        {
          'id': '1',
          'subject': 'Test Email',
          'sender': 'test@example.com',
          'date': '2025-07-29T10:00:00Z',
          'bodyPreview': 'Email preview text...',
          'linksFound': 5,
          'flutterLinks': ['https://example.com/flutter'],
        },
      ];

      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          ProviderScope(
            overrides: [
              emailNotifierProvider.overrideWith(() {
                return MockEmailNotifier()
                  ..state = AsyncValue.data(testEmails);
              }),
            ],
            child: const EmailListWidget(),
          ),
        ),
      );

      // Expand the email
      await tester.tap(find.byType(ExpansionTile).first);
      await tester.pumpAndSettle();

      // Check expanded content
      expect(find.text('Preview:'), findsOneWidget);
      expect(find.text('Email preview text...'), findsOneWidget);
      expect(find.text('Flutter Links Found:'), findsOneWidget);
      expect(find.text('View Full Email'), findsOneWidget);
      expect(find.text('Process Links'), findsOneWidget);
    });

    testWidgets('should open email detail dialog', (tester) async {
      final testEmails = [
        {
          'id': '1',
          'subject': 'Test Email Subject',
          'sender': 'test@example.com',
          'date': '2025-07-29T10:00:00Z',
          'bodyPreview': 'Preview content',
          'htmlContent': 'Full email content here',
          'linksFound': 2,
          'flutterLinks': [],
          'allLinks': [
            'https://example.com/link1',
            'https://example.com/link2',
          ],
        },
      ];

      await pumpTestWidget(
        tester,
        createMaterialTestWidget(
          ProviderScope(
            overrides: [
              emailNotifierProvider.overrideWith(() {
                return MockEmailNotifier()
                  ..state = AsyncValue.data(testEmails);
              }),
            ],
            child: const EmailListWidget(),
          ),
        ),
      );

      // Expand email
      await tester.tap(find.byType(ExpansionTile).first);
      await tester.pumpAndSettle();

      // Click view full email
      await tester.tap(find.text('View Full Email'));
      await tester.pumpAndSettle();

      // Check dialog content
      expect(find.byType(Dialog), findsOneWidget);
      expect(find.text('Test Email Subject'), findsNWidgets(2)); // One in list, one in dialog
      expect(find.text('Full email content here'), findsOneWidget);
      expect(find.text('All Links (2)'), findsOneWidget);
    });
  });
}