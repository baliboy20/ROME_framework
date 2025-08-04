import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/data/models/article_model.dart';
import 'package:medium_flutter_extractor/data/models/auth_model.dart';
import 'package:medium_flutter_extractor/data/services/api_service.dart';
import 'package:medium_flutter_extractor/data/services/websocket_service.dart';
import 'package:medium_flutter_extractor/presentation/providers/api_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/dio_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/websocket_provider.dart';
import 'package:mocktail/mocktail.dart';

import '../helpers/test_helpers.dart';

// Mock classes using mocktail
class MockApiService extends Mock implements ApiService {}
class MockWebSocketService extends Mock implements WebSocketService {}
class MockDio extends Mock implements Dio {}

// Create mock instances
final mockApiService = MockApiService();
final mockWebSocketService = MockWebSocketService();
final mockDio = MockDio();

// Provider overrides for testing
List<Override> createMockProviders() {
  return [
    dioProvider.overrideWithValue(mockDio),
    apiServiceProvider.overrideWithValue(mockApiService),
    webSocketServiceProvider.overrideWithValue(mockWebSocketService),
  ];
}

// Setup common mock behaviors
void setupMockApiService() {
  // Auth mocks
  when(() => mockApiService.initiateGoogleAuth()).thenAnswer(
    (_) async => {'authUrl': 'https://accounts.google.com/oauth/authorize'},
  );

  when(() => mockApiService.refreshToken(any())).thenAnswer(
    (_) async => {
      'accessToken': TestData.sampleToken,
      'refreshToken': 'refresh_token',
      'expiresAt': DateTime.now().add(const Duration(hours: 1)).toIso8601String(),
      'userEmail': TestData.sampleEmail,
    },
  );

  // Email mocks
  when(() => mockApiService.fetchEmails(any())).thenAnswer(
    (_) async => [
      {
        'id': 'email_1',
        'subject': 'Medium Daily Digest',
        'date': TestData.sampleDate.toIso8601String(),
        'links': [TestData.sampleUrl],
      }
    ],
  );

  // Article mocks
  when(() => mockApiService.getArticles(
    page: any(named: 'page'),
    limit: any(named: 'limit'),
    search: any(named: 'search'),
    status: any(named: 'status'),
  )).thenAnswer(
    (_) async => [
      {
        'id': 'article_1',
        'title': TestData.sampleTitle,
        'url': TestData.sampleUrl,
        'content': TestData.sampleContent,
        'contentHash': 'hash_123',
        'filePath': '/path/to/article.md',
        'metadata': {
          'emailDate': TestData.sampleDate.toIso8601String(),
          'scrapedAt': TestData.sampleDate.toIso8601String(),
          'wordCount': 100,
          'readingTime': '2 min read',
          'tags': ['flutter', 'dart'],
          'sourceEmail': 'email_1',
        },
      },
    ],
  );

  // Scraping mocks
  when(() => mockApiService.startBatchScraping(any())).thenAnswer(
    (_) async => {'batchId': TestData.sampleBatchId},
  );

  when(() => mockApiService.cancelScraping(any())).thenAnswer(
    (_) async => {},
  );
}

void setupMockWebSocketService() {
  when(() => mockWebSocketService.isConnected).thenReturn(true);
  when(() => mockWebSocketService.connect()).thenAnswer((_) async {});
  when(() => mockWebSocketService.disconnect()).thenReturn(null);
  when(() => mockWebSocketService.dispose()).thenReturn(null);
  
  // Mock streams
  when(() => mockWebSocketService.progressStream).thenAnswer(
    (_) => Stream.empty(),
  );
  
  when(() => mockWebSocketService.connectionStream).thenAnswer(
    (_) => Stream.value(ConnectionStatus.connected),
  );
}