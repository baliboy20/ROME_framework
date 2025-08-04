import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/models/progress_model.dart';
import 'package:medium_flutter_extractor/data/services/websocket_service.dart';
import 'package:medium_flutter_extractor/presentation/providers/websocket_provider.dart';
import 'package:medium_flutter_extractor/presentation/widgets/progress_indicator_widget.dart';

import '../../helpers/test_helpers.dart';
import '../../mocks/mock_providers.dart';

void main() {
  group('ProgressIndicatorWidget', () {
    setUp(() {
      setupMockWebSocketService();
    });

    testWidgets('should show no active sessions when no progress', (tester) async {
      final overrides = [
        ...createMockProviders(),
        scrapingProgressProvider.overrideWith((ref) {
          return ScrapingProgressNotifier(ref)..state = {};
        }),
        connectionStatusProvider.overrideWith((ref) {
          return Stream.value(ConnectionStatus.connected);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const ProgressIndicatorWidget(),
          overrides: overrides,
        ),
      );

      expect(find.text('No active scraping sessions'), findsOneWidget);
      expect(find.byIcon(Icons.hourglass_empty), findsOneWidget);
    });

    testWidgets('should show connection status indicator', (tester) async {
      final overrides = [
        ...createMockProviders(),
        connectionStatusProvider.overrideWith((ref) {
          return Stream.value(ConnectionStatus.connected);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const ProgressIndicatorWidget(),
          overrides: overrides,
        ),
      );

      expect(find.byIcon(Icons.wifi), findsOneWidget);
    });

    testWidgets('should show disconnected status', (tester) async {
      final overrides = [
        ...createMockProviders(),
        connectionStatusProvider.overrideWith((ref) {
          return Stream.value(ConnectionStatus.disconnected);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const ProgressIndicatorWidget(),
          overrides: overrides,
        ),
      );

      expect(find.byIcon(Icons.wifi_off), findsOneWidget);
    });

    testWidgets('should show error status', (tester) async {
      final overrides = [
        ...createMockProviders(),
        connectionStatusProvider.overrideWith((ref) {
          return Stream.value(ConnectionStatus.error);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const ProgressIndicatorWidget(),
          overrides: overrides,
        ),
      );

      expect(find.byIcon(Icons.error), findsOneWidget);
    });

    testWidgets('should display batch progress correctly', (tester) async {
      final progress = ProgressUpdate(
        batchId: TestData.sampleBatchId,
        total: 10,
        completed: 7,
        failed: 1,
        status: ProgressStatus.running,
        startTime: DateTime.now().subtract(const Duration(minutes: 5)),
        results: [],
        currentUrl: 'https://medium.com/current-article',
      );

      final overrides = [
        ...createMockProviders(),
        scrapingProgressProvider.overrideWith((ref) {
          return ScrapingProgressNotifier(ref)..state = {
            TestData.sampleBatchId: progress,
          };
        }),
        connectionStatusProvider.overrideWith((ref) {
          return Stream.value(ConnectionStatus.connected);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: ProgressIndicatorWidget(batchId: TestData.sampleBatchId),
          overrides: overrides,
        ),
      );

      expect(find.text('8 / 10'), findsOneWidget); // completed + failed / total
      expect(find.text('80%'), findsOneWidget);
      expect(find.text('Completed: 7'), findsOneWidget);
      expect(find.text('Failed: 1'), findsOneWidget);
      expect(find.text('Remaining: 2'), findsOneWidget);
      expect(find.textContaining('Currently scraping:'), findsOneWidget);
    });

    testWidgets('should show completed progress', (tester) async {
      final startTime = DateTime.now().subtract(const Duration(minutes: 10));
      final endTime = DateTime.now().subtract(const Duration(minutes: 5));
      
      final progress = ProgressUpdate(
        batchId: TestData.sampleBatchId,
        total: 5,
        completed: 5,
        failed: 0,
        status: ProgressStatus.completed,
        startTime: startTime,
        endTime: endTime,
        results: [],
      );

      final overrides = [
        ...createMockProviders(),
        scrapingProgressProvider.overrideWith((ref) {
          return ScrapingProgressNotifier(ref)..state = {
            TestData.sampleBatchId: progress,
          };
        }),
        connectionStatusProvider.overrideWith((ref) {
          return Stream.value(ConnectionStatus.connected);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: ProgressIndicatorWidget(batchId: TestData.sampleBatchId),
          overrides: overrides,
        ),
      );

      expect(find.text('5 / 5'), findsOneWidget);
      expect(find.text('100%'), findsOneWidget);
      expect(find.textContaining('Completed in'), findsOneWidget);
    });

    testWidgets('should show cancel button when onCancel provided', (tester) async {
      bool cancelCalled = false;
      
      final progress = ProgressUpdate(
        batchId: TestData.sampleBatchId,
        total: 10,
        completed: 3,
        failed: 0,
        status: ProgressStatus.running,
        startTime: DateTime.now(),
        results: [],
      );

      final overrides = [
        ...createMockProviders(),
        scrapingProgressProvider.overrideWith((ref) {
          return ScrapingProgressNotifier(ref)..state = {
            TestData.sampleBatchId: progress,
          };
        }),
        connectionStatusProvider.overrideWith((ref) {
          return Stream.value(ConnectionStatus.connected);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: ProgressIndicatorWidget(
            batchId: TestData.sampleBatchId,
            onCancel: () => cancelCalled = true,
          ),
          overrides: overrides,
        ),
      );

      expect(find.byIcon(Icons.cancel), findsOneWidget);

      await tester.tap(find.byIcon(Icons.cancel));
      await tester.pumpAndSettle();

      expect(cancelCalled, isTrue);
    });

    testWidgets('should show results preview when available', (tester) async {
      final results = [
        ScrapingResult(
          url: 'https://medium.com/article1',
          title: 'Article 1',
          status: ScrapingStatus.completed,
          wordCount: 1000,
          readingTime: '4 min read',
          completedAt: DateTime.now(),
        ),
        ScrapingResult(
          url: 'https://medium.com/article2',
          title: 'Article 2',
          status: ScrapingStatus.failed,
          error: 'Connection timeout',
        ),
      ];

      final progress = ProgressUpdate(
        batchId: TestData.sampleBatchId,
        total: 5,
        completed: 1,
        failed: 1,
        status: ProgressStatus.running,
        startTime: DateTime.now(),
        results: results,
      );

      final overrides = [
        ...createMockProviders(),
        scrapingProgressProvider.overrideWith((ref) {
          return ScrapingProgressNotifier(ref)..state = {
            TestData.sampleBatchId: progress,
          };
        }),
        connectionStatusProvider.overrideWith((ref) {
          return Stream.value(ConnectionStatus.connected);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: ProgressIndicatorWidget(batchId: TestData.sampleBatchId),
          overrides: overrides,
        ),
      );

      expect(find.text('Recent Results:'), findsOneWidget);
      expect(find.text('Article 1'), findsOneWidget);
      expect(find.text('Article 2'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
      expect(find.byIcon(Icons.error), findsOneWidget);
    });

    testWidgets('should show failed progress with error color', (tester) async {
      final progress = ProgressUpdate(
        batchId: TestData.sampleBatchId,
        total: 3,
        completed: 1,
        failed: 2,
        status: ProgressStatus.failed,
        startTime: DateTime.now().subtract(const Duration(minutes: 2)),
        results: [],
        error: 'Network error occurred',
      );

      final overrides = [
        ...createMockProviders(),
        scrapingProgressProvider.overrideWith((ref) {
          return ScrapingProgressNotifier(ref)..state = {
            TestData.sampleBatchId: progress,
          };
        }),
        connectionStatusProvider.overrideWith((ref) {
          return Stream.value(ConnectionStatus.connected);
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: ProgressIndicatorWidget(batchId: TestData.sampleBatchId),
          overrides: overrides,
        ),
      );

      expect(find.text('3 / 3'), findsOneWidget);
      expect(find.text('100%'), findsOneWidget);
      
      // Progress bar should have error color (red)
      final progressIndicator = tester.widget<LinearProgressIndicator>(
        find.byType(LinearProgressIndicator),
      );
      expect(progressIndicator.valueColor?.value, equals(Colors.red));
    });

    testWidgets('should handle loading connection status', (tester) async {
      final overrides = [
        ...createMockProviders(),
        connectionStatusProvider.overrideWith((ref) {
          return const Stream<ConnectionStatus>.empty();
        }),
      ];

      await pumpTestWidget(
        tester,
        createTestWidget(
          child: const ProgressIndicatorWidget(),
          overrides: overrides,
        ),
      );

      // Should show loading indicator for connection status
      expect(find.byType(CircularProgressIndicator), findsAtLeastNWidgets(1));
    });
  });
}