import 'dart:async';

import 'package:dio/dio.dart';
import 'package:medium_flutter_extractor/data/models/article_model.dart';
import 'package:medium_flutter_extractor/data/models/auth_model.dart';
import 'package:medium_flutter_extractor/data/models/email_filter_model.dart';
import 'package:medium_flutter_extractor/data/models/progress_model.dart';
import 'package:medium_flutter_extractor/data/services/api_service.dart';
import 'package:medium_flutter_extractor/data/services/websocket_service.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

import '../helpers/test_helpers.dart';

// Generate mocks for these classes
@GenerateMocks([
  ApiService,
  WebSocketService,
  Dio,
])
class MockServices {}

// Extension methods for easier mock setup
extension MockApiServiceExtension on MockApiService {
  void setupSuccessfulAuth() {
    when(initiateGoogleAuth()).thenAnswer(
      (_) async => {'authUrl': 'https://accounts.google.com/oauth/authorize'},
    );
    
    when(refreshToken(any)).thenAnswer(
      (_) async => AuthModel(
        accessToken: TestData.sampleToken,
        refreshToken: 'refresh_token',
        expiresAt: DateTime.now().add(const Duration(hours: 1)),
        userEmail: TestData.sampleEmail,
      ),
    );
  }

  void setupSuccessfulEmailFetch() {
    when(fetchEmails(any)).thenAnswer(
      (_) async => [
        {
          'id': 'email_1',
          'subject': 'Medium Daily Digest',
          'date': TestData.sampleDate.toIso8601String(),
          'links': [TestData.sampleUrl],
        }
      ],
    );
  }

  void setupSuccessfulArticles() {
    when(getArticles(
      page: anyNamed('page'),
      limit: anyNamed('limit'),
      search: anyNamed('search'),
      status: anyNamed('status'),
    )).thenAnswer(
      (_) async => [
        ArticleModel(
          id: 'article_1',
          title: TestData.sampleTitle,
          url: TestData.sampleUrl,
          content: TestData.sampleContent,
          contentHash: 'hash_123',
          filePath: '/path/to/article.md',
          metadata: ArticleMetadata(
            emailDate: TestData.sampleDate,
            scrapedAt: TestData.sampleDate,
            wordCount: 100,
            readingTime: '2 min read',
            tags: ['flutter', 'dart'],
            sourceEmail: 'email_1',
          ),
        ),
      ],
    );
  }

  void setupSuccessfulScraping() {
    when(startBatchScraping(any)).thenAnswer(
      (_) async => {'batchId': TestData.sampleBatchId},
    );
  }
}

extension MockWebSocketServiceExtension on MockWebSocketService {
  void setupSuccessfulConnection() {
    when(isConnected).thenReturn(true);
    when(connect()).thenAnswer((_) async {});
    when(disconnect()).thenReturn(null);
  }

  void setupProgressStream() {
    final controller = StreamController<ProgressUpdate>();
    when(progressStream).thenAnswer((_) => controller.stream);
    
    // Add sample progress update
    controller.add(ProgressUpdate(
      batchId: TestData.sampleBatchId,
      total: 5,
      completed: 2,
      failed: 0,
      status: ProgressStatus.running,
      startTime: DateTime.now().subtract(const Duration(minutes: 2)),
      results: [],
    ));
  }
}

// Create commonly used mock instances
final mockApiService = MockApiService();
final mockWebSocketService = MockWebSocketService();
final mockDio = MockDio();