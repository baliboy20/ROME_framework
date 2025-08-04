import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/models/article_model.dart';
import 'package:medium_flutter_extractor/presentation/providers/article_provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../helpers/test_helpers.dart';
import '../../mocks/mock_providers.dart';

void main() {
  group('ArticleProvider', () {
    late ProviderContainer container;

    setUp(() {
      setupMockApiService();
      setupMockWebSocketService();
      container = ProviderContainer(
        overrides: createMockProviders(),
      );
    });

    tearDown(() {
      container.dispose();
    });

    test('should load articles successfully', () async {
      final articlesNotifier = container.read(articlesProvider.notifier);
      
      await articlesNotifier.loadArticles();

      final articlesState = container.read(articlesProvider);

      expect(articlesState, isA<AsyncData<List<ArticleModel>>>());
      expect(articlesState.valueOrNull?.length, equals(1));
      expect(articlesState.valueOrNull?.first.title, equals(TestData.sampleTitle));

      verify(() => mockApiService.getArticles(
        page: 1,
        limit: 50,
        search: null,
        status: null,
      )).called(1);
    });

    test('should handle article loading failure', () async {
      when(() => mockApiService.getArticles(
        page: any(named: 'page'),
        limit: any(named: 'limit'),
        search: any(named: 'search'),
        status: any(named: 'status'),
      )).thenThrow(Exception('Failed to load articles'));

      final articlesNotifier = container.read(articlesProvider.notifier);
      
      await articlesNotifier.loadArticles();

      final articlesState = container.read(articlesProvider);

      expect(articlesState, isA<AsyncError>());
    });

    test('should load articles with filters', () async {
      final articlesNotifier = container.read(articlesProvider.notifier);
      
      await articlesNotifier.loadArticles(
        page: 2,
        limit: 25,
        search: 'flutter',
        status: 'completed',
      );

      verify(() => mockApiService.getArticles(
        page: 2,
        limit: 25,
        search: 'flutter',
        status: 'completed',
      )).called(1);
    });

    test('should start batch scraping successfully', () async {
      final articlesNotifier = container.read(articlesProvider.notifier);
      final urls = ['https://medium.com/article1', 'https://medium.com/article2'];

      final batchId = await articlesNotifier.startBatchScraping(urls);

      expect(batchId, equals(TestData.sampleBatchId));
      verify(() => mockApiService.startBatchScraping({
        'urls': urls,
        'concurrency': 5,
      })).called(1);
    });

    test('should handle batch scraping failure', () async {
      when(() => mockApiService.startBatchScraping(any()))
          .thenThrow(Exception('Scraping failed'));

      final articlesNotifier = container.read(articlesProvider.notifier);
      final urls = ['https://medium.com/article1'];

      final batchId = await articlesNotifier.startBatchScraping(urls);

      expect(batchId, isNull);
    });

    test('should cancel scraping successfully', () async {
      final articlesNotifier = container.read(articlesProvider.notifier);
      const batchId = 'test_batch_id';

      await articlesNotifier.cancelScraping(batchId);

      verify(() => mockApiService.cancelScraping(batchId)).called(1);
    });

    test('should create article successfully', () async {
      final articlesNotifier = container.read(articlesProvider.notifier);
      
      // First load initial articles
      await articlesNotifier.loadArticles();
      
      final newArticle = ArticleModel(
        id: 'new_article',
        title: 'New Article',
        url: 'https://medium.com/new-article',
        content: 'New content',
        contentHash: 'new_hash',
        filePath: '/path/to/new_article.md',
        metadata: ArticleMetadata(
          emailDate: TestData.sampleDate,
          scrapedAt: TestData.sampleDate,
          wordCount: 200,
          readingTime: '3 min read',
          tags: ['flutter'],
          sourceEmail: 'email_2',
        ),
      );

      when(() => mockApiService.createArticle(any()))
          .thenAnswer((_) async => newArticle);

      await articlesNotifier.createArticle({'title': 'New Article'});

      final articlesState = container.read(articlesProvider);
      expect(articlesState.valueOrNull?.length, equals(2));
      expect(articlesState.valueOrNull?.first.id, equals('new_article'));
    });

    test('should update article successfully', () async {
      final articlesNotifier = container.read(articlesProvider.notifier);
      
      // First load initial articles
      await articlesNotifier.loadArticles();

      final updatedArticle = ArticleModel(
        id: 'article_1',
        title: 'Updated Title',
        url: TestData.sampleUrl,
        content: TestData.sampleContent,
        contentHash: 'hash_123',
        filePath: '/path/to/article.md',
        metadata: ArticleMetadata(
          emailDate: TestData.sampleDate,
          scrapedAt: TestData.sampleDate,
          wordCount: 150,
          readingTime: '3 min read',
          tags: ['flutter', 'dart'],
          sourceEmail: 'email_1',
        ),
      );

      when(() => mockApiService.updateArticle('article_1', any()))
          .thenAnswer((_) async => updatedArticle);

      await articlesNotifier.updateArticle('article_1', {'title': 'Updated Title'});

      final articlesState = container.read(articlesProvider);
      expect(articlesState.valueOrNull?.first.title, equals('Updated Title'));
    });

    test('should delete article successfully', () async {
      final articlesNotifier = container.read(articlesProvider.notifier);
      
      // First load initial articles
      await articlesNotifier.loadArticles();

      when(() => mockApiService.deleteArticle('article_1'))
          .thenAnswer((_) async {});

      await articlesNotifier.deleteArticle('article_1');

      final articlesState = container.read(articlesProvider);
      expect(articlesState.valueOrNull?.length, equals(0));
    });

    test('should clear articles', () async {
      final articlesNotifier = container.read(articlesProvider.notifier);
      
      // First load initial articles
      await articlesNotifier.loadArticles();
      expect(container.read(articlesProvider).valueOrNull?.length, equals(1));

      articlesNotifier.clearArticles();

      final articlesState = container.read(articlesProvider);
      expect(articlesState.valueOrNull?.length, equals(0));
    });
  });
}