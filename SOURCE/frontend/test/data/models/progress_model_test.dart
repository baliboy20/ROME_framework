import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/models/progress_model.dart';

void main() {
  group('ProgressUpdate', () {
    final startTime = DateTime(2025, 7, 28, 18, 0);
    final endTime = DateTime(2025, 7, 28, 18, 5);

    final sampleProgressData = {
      'batchId': 'batch_123',
      'total': 10,
      'completed': 7,
      'failed': 1,
      'status': 'running',
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'results': [],
      'currentUrl': 'https://medium.com/current-article',
      'error': null,
    };

    test('should create ProgressUpdate from JSON', () {
      final result = ProgressUpdate.fromJson(sampleProgressData);

      expect(result.batchId, equals('batch_123'));
      expect(result.total, equals(10));
      expect(result.completed, equals(7));
      expect(result.failed, equals(1));
      expect(result.status, equals(ProgressStatus.running));
      expect(result.startTime, equals(startTime));
      expect(result.endTime, equals(endTime));
      expect(result.currentUrl, equals('https://medium.com/current-article'));
    });

    test('should handle ProgressStatus enum values', () {
      final testCases = [
        {'status': 'pending', 'expected': ProgressStatus.pending},
        {'status': 'running', 'expected': ProgressStatus.running},
        {'status': 'completed', 'expected': ProgressStatus.completed},
        {'status': 'failed', 'expected': ProgressStatus.failed},
        {'status': 'cancelled', 'expected': ProgressStatus.cancelled},
      ];

      for (final testCase in testCases) {
        final data = Map<String, dynamic>.from(sampleProgressData);
        data['status'] = testCase['status'];
        
        final result = ProgressUpdate.fromJson(data);
        expect(result.status, equals(testCase['expected']));
      }
    });

    test('should support equality comparison', () {
      final progress1 = ProgressUpdate(
        batchId: 'batch_1',
        total: 5,
        completed: 2,
        failed: 0,
        status: ProgressStatus.running,
        startTime: startTime,
        results: [],
      );

      final progress2 = ProgressUpdate(
        batchId: 'batch_1',
        total: 5,
        completed: 2,
        failed: 0,
        status: ProgressStatus.running,
        startTime: startTime,
        results: [],
      );

      final progress3 = ProgressUpdate(
        batchId: 'batch_2',
        total: 5,
        completed: 2,
        failed: 0,
        status: ProgressStatus.running,
        startTime: startTime,
        results: [],
      );

      expect(progress1, equals(progress2));
      expect(progress1, isNot(equals(progress3)));
    });
  });

  group('ScrapingResult', () {
    final completedAt = DateTime(2025, 7, 28, 18, 0);
    
    final sampleResultData = {
      'url': 'https://medium.com/article',
      'title': 'Sample Article',
      'status': 'completed',
      'error': null,
      'wordCount': 1200,
      'readingTime': '5 min read',
      'completedAt': completedAt.toIso8601String(),
    };

    test('should create ScrapingResult from JSON', () {
      final result = ScrapingResult.fromJson(sampleResultData);

      expect(result.url, equals('https://medium.com/article'));
      expect(result.title, equals('Sample Article'));
      expect(result.status, equals(ScrapingStatus.completed));
      expect(result.wordCount, equals(1200));
      expect(result.readingTime, equals('5 min read'));
      expect(result.completedAt, equals(completedAt));
    });

    test('should handle ScrapingStatus enum values', () {
      final testCases = [
        {'status': 'pending', 'expected': ScrapingStatus.pending},
        {'status': 'scraping', 'expected': ScrapingStatus.scraping},
        {'status': 'completed', 'expected': ScrapingStatus.completed},
        {'status': 'failed', 'expected': ScrapingStatus.failed},
      ];

      for (final testCase in testCases) {
        final data = Map<String, dynamic>.from(sampleResultData);
        data['status'] = testCase['status'];
        
        final result = ScrapingResult.fromJson(data);
        expect(result.status, equals(testCase['expected']));
      }
    });

    test('should handle failed scraping result', () {
      final failedData = Map<String, dynamic>.from(sampleResultData);
      failedData['status'] = 'failed';
      failedData['error'] = 'Connection timeout';
      failedData['wordCount'] = null;
      failedData['readingTime'] = null;

      final result = ScrapingResult.fromJson(failedData);

      expect(result.status, equals(ScrapingStatus.failed));
      expect(result.error, equals('Connection timeout'));
      expect(result.wordCount, isNull);
      expect(result.readingTime, isNull);
    });
  });
}