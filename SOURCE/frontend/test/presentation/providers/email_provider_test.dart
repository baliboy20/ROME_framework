import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/models/email_filter_model.dart';
import 'package:medium_flutter_extractor/presentation/providers/email_provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../helpers/test_helpers.dart';
import '../../mocks/mock_providers.dart';

void main() {
  group('EmailProvider', () {
    late ProviderContainer container;

    setUp(() {
      setupMockApiService();
      container = ProviderContainer(
        overrides: createMockProviders(),
      );
    });

    tearDown(() {
      container.dispose();
    });

    test('should have initial empty state', () {
      final emailState = container.read(emailNotifierProvider);
      
      expect(emailState, isA<AsyncData<List<Map<String, dynamic>>>>());
      expect(emailState.valueOrNull, isEmpty);
    });

    test('should fetch emails successfully', () async {
      final emailNotifier = container.read(emailNotifierProvider.notifier);
      final filter = EmailFilterModel(
        startDate: TestData.sampleStartDate,
        endDate: TestData.sampleEndDate,
        subjects: ['Medium Daily Digest'],
        keywords: ['flutter'],
      );

      await emailNotifier.fetchEmails(filter);

      final emailState = container.read(emailNotifierProvider);

      expect(emailState, isA<AsyncData<List<Map<String, dynamic>>>>());
      expect(emailState.valueOrNull?.length, equals(1));
      expect(emailState.valueOrNull?.first['subject'], equals('Medium Daily Digest'));

      verify(() => mockApiService.fetchEmails(filter.toJson())).called(1);
    });

    test('should handle email fetch failure', () async {
      when(() => mockApiService.fetchEmails(any()))
          .thenThrow(Exception('Network error'));

      final emailNotifier = container.read(emailNotifierProvider.notifier);
      final filter = EmailFilterModel(
        startDate: TestData.sampleStartDate,
        endDate: TestData.sampleEndDate,
      );

      await emailNotifier.fetchEmails(filter);

      final emailState = container.read(emailNotifierProvider);

      expect(emailState, isA<AsyncError>());
      expect(emailState.error, isA<Exception>());
    });

    test('should show loading state during fetch', () async {
      // Create a completer to control when the mock resolves
      final emailNotifier = container.read(emailNotifierProvider.notifier);
      final filter = EmailFilterModel(
        startDate: TestData.sampleStartDate,
        endDate: TestData.sampleEndDate,
      );

      // Start the fetch operation (don't await)
      final fetchFuture = emailNotifier.fetchEmails(filter);

      // Check loading state immediately
      final loadingState = container.read(emailNotifierProvider);
      expect(loadingState, isA<AsyncLoading>());

      // Complete the operation
      await fetchFuture;

      // Should now have data
      final finalState = container.read(emailNotifierProvider);
      expect(finalState, isA<AsyncData>());
    });

    test('should clear emails', () async {
      final emailNotifier = container.read(emailNotifierProvider.notifier);
      
      // First fetch some emails
      final filter = EmailFilterModel(
        startDate: TestData.sampleStartDate,
        endDate: TestData.sampleEndDate,
      );
      await emailNotifier.fetchEmails(filter);

      // Verify emails are present
      var emailState = container.read(emailNotifierProvider);
      expect(emailState.valueOrNull?.length, equals(1));

      // Clear emails
      emailNotifier.clearEmails();

      // Verify emails are cleared
      emailState = container.read(emailNotifierProvider);
      expect(emailState.valueOrNull, isEmpty);
    });

    test('should handle empty email response', () async {
      when(() => mockApiService.fetchEmails(any()))
          .thenAnswer((_) async => <Map<String, dynamic>>[]);

      final emailNotifier = container.read(emailNotifierProvider.notifier);
      final filter = EmailFilterModel(
        startDate: TestData.sampleStartDate,
        endDate: TestData.sampleEndDate,
      );

      await emailNotifier.fetchEmails(filter);

      final emailState = container.read(emailNotifierProvider);

      expect(emailState, isA<AsyncData<List<Map<String, dynamic>>>>());
      expect(emailState.valueOrNull, isEmpty);
    });

    test('should fetch emails with multiple subjects', () async {
      final emailNotifier = container.read(emailNotifierProvider.notifier);
      final filter = EmailFilterModel(
        startDate: TestData.sampleStartDate,
        endDate: TestData.sampleEndDate,
        subjects: ['Medium Daily Digest', 'Flutter Weekly'],
        keywords: ['flutter', 'dart'],
      );

      await emailNotifier.fetchEmails(filter);

      verify(() => mockApiService.fetchEmails(any())).called(1);
    });

    test('should handle network timeout', () async {
      when(() => mockApiService.fetchEmails(any()))
          .thenThrow(Exception('Connection timeout'));

      final emailNotifier = container.read(emailNotifierProvider.notifier);
      final filter = EmailFilterModel(
        startDate: TestData.sampleStartDate,
        endDate: TestData.sampleEndDate,
      );

      await emailNotifier.fetchEmails(filter);

      final emailState = container.read(emailNotifierProvider);

      expect(emailState, isA<AsyncError>());
      expect(emailState.error.toString(), contains('Connection timeout'));
    });

    test('should maintain state across multiple operations', () async {
      final emailNotifier = container.read(emailNotifierProvider.notifier);
      final filter1 = EmailFilterModel(
        startDate: TestData.sampleStartDate,
        endDate: TestData.sampleEndDate,
        keywords: ['flutter'],
      );

      // First fetch
      await emailNotifier.fetchEmails(filter1);
      var emailState = container.read(emailNotifierProvider);
      expect(emailState.valueOrNull?.length, equals(1));

      // Clear
      emailNotifier.clearEmails();
      emailState = container.read(emailNotifierProvider);
      expect(emailState.valueOrNull, isEmpty);

      // Second fetch with different filter
      final filter2 = EmailFilterModel(
        startDate: TestData.sampleStartDate,
        endDate: TestData.sampleEndDate,
        keywords: ['dart'],
      );

      await emailNotifier.fetchEmails(filter2);
      emailState = container.read(emailNotifierProvider);
      expect(emailState.valueOrNull?.length, equals(1));
    });
  });
}