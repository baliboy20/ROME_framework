import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/presentation/providers/email_provider.dart';
import 'package:medium_flutter_extractor/presentation/widgets/email_filter_form.dart';
import 'package:mocktail/mocktail.dart';

import '../../helpers/test_helpers.dart';
import '../../mocks/mock_providers.dart';

void main() {
  group('EmailFilterForm', () {
    setUp(() {
      setupMockApiService();
    });

    testWidgets('should render all form elements', (tester) async {
      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: createMockProviders(),
        ),
      );

      expect(find.text('Email Filter'), findsOneWidget);
      expect(find.text('Start Date'), findsOneWidget);
      expect(find.text('End Date'), findsOneWidget);
      expect(find.text('Email Subjects'), findsOneWidget);
      expect(find.text('Keywords'), findsOneWidget);
      expect(find.text('Fetch Emails'), findsOneWidget);
    });

    testWidgets('should show default values in form fields', (tester) async {
      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: createMockProviders(),
        ),
      );

      // Check for default subject
      expect(find.text('Medium Daily Digest'), findsOneWidget);
      
      // Check for default keyword
      expect(find.text('flutter'), findsOneWidget);
    });

    testWidgets('should open date picker when date card is tapped', (tester) async {
      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: createMockProviders(),
        ),
      );

      // Tap on start date card
      await tester.tap(find.text('Start Date'));
      await tester.pumpAndSettle();

      // Should open date picker dialog
      expect(find.byType(DatePickerDialog), findsOneWidget);
    });

    testWidgets('should update date when date is selected', (tester) async {
      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: createMockProviders(),
        ),
      );

      // Get initial date text
      final initialDateFinder = find.text('Start Date').first;
      expect(initialDateFinder, findsOneWidget);

      // Tap on start date
      await tester.tap(find.text('Start Date'));
      await tester.pumpAndSettle();

      // Find a different date in the picker (assuming current month)
      final dateFinder = find.text('15').first;
      if (dateFinder.evaluate().isNotEmpty) {
        await tester.tap(dateFinder);
        await tester.pumpAndSettle();

        // Tap OK button
        await tester.tap(find.text('OK'));
        await tester.pumpAndSettle();
      }
    });

    testWidgets('should allow text input in subject field', (tester) async {
      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: createMockProviders(),
        ),
      );

      final subjectField = find.byType(TextField).first;
      
      await tester.tap(subjectField);
      await tester.pumpAndSettle();

      await tester.enterText(subjectField, 'Custom Subject');
      await tester.pumpAndSettle();

      expect(find.text('Custom Subject'), findsOneWidget);
    });

    testWidgets('should allow text input in keywords field', (tester) async {
      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: createMockProviders(),
        ),
      );

      final keywordField = find.byType(TextField).last;
      
      await tester.tap(keywordField);
      await tester.pumpAndSettle();

      await tester.enterText(keywordField, 'dart, mobile');
      await tester.pumpAndSettle();

      expect(find.text('dart, mobile'), findsOneWidget);
    });

    testWidgets('should trigger email fetch when button is pressed', (tester) async {
      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: createMockProviders(),
        ),
      );

      await tester.tap(find.text('Fetch Emails'));
      await tester.pumpAndSettle();

      verify(() => mockApiService.fetchEmails(any())).called(1);
    });

    testWidgets('should show loading state when fetching emails', (tester) async {
      // Mock loading state
      final loadingOverrides = [
        ...createMockProviders(),
        emailNotifierProvider.overrideWith((ref) {
          return EmailNotifier(ref)..state = const AsyncValue.loading();
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: loadingOverrides,
        ),
      );

      expect(find.text('Fetching...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should show error state when email fetch fails', (tester) async {
      final error = Exception('Network error');
      final errorOverrides = [
        ...createMockProviders(),
        emailNotifierProvider.overrideWith((ref) {
          return EmailNotifier(ref)..state = AsyncValue.error(error, StackTrace.current);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: errorOverrides,
        ),
      );

      expect(find.textContaining('Error:'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('should show success state when emails are fetched', (tester) async {
      final successOverrides = [
        ...createMockProviders(),
        emailNotifierProvider.overrideWith((ref) {
          return EmailNotifier(ref)..state = AsyncValue.data([
            {'id': 'email1', 'subject': 'Test Email'}
          ]);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: successOverrides,
        ),
      );

      expect(find.text('Found 1 emails'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
    });

    testWidgets('should disable fetch button when loading', (tester) async {
      final loadingOverrides = [
        ...createMockProviders(),
        emailNotifierProvider.overrideWith((ref) {
          return EmailNotifier(ref)..state = const AsyncValue.loading();
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: loadingOverrides,
        ),
      );

      final fetchButton = tester.widget<ElevatedButton>(
        find.byType(ElevatedButton),
      );

      expect(fetchButton.onPressed, isNull);
    });

    testWidgets('should handle empty email results', (tester) async {
      final emptyOverrides = [
        ...createMockProviders(),
        emailNotifierProvider.overrideWith((ref) {
          return EmailNotifier(ref)..state = const AsyncValue.data([]);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const EmailFilterForm(),
          overrides: emptyOverrides,
        ),
      );

      expect(find.text('Found 0 emails'), findsOneWidget);
    });
  });
}
