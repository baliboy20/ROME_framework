import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/models/article_model.dart';

import '../../helpers/test_helpers.dart';

void main() {
  group('ArticleModel', () {
    final sampleMetadata = ArticleMetadata(
      emailDate: TestData.sampleDate,
      scrapedAt: TestData.sampleDate,
      wordCount: 1500,
      readingTime: '6 min read',
      tags: ['flutter', 'dart', 'mobile'],
      sourceEmail: 'email_123',
      author: 'John Doe',
      publishDate: TestData.sampleDate,
    );

    final sampleArticle = ArticleModel(
      id: 'article_1',
      title: TestData.sampleTitle,
      url: TestData.sampleUrl,
      content: TestData.sampleContent,
      contentHash: 'abc123hash',
      filePath: '/articles/2025-07-28/article_1.md',
      metadata: sampleMetadata,
      rawHtml: '<h1>Sample HTML</h1>',
    );

    final sampleArticleData = {
      'id': 'article_1',
      'title': TestData.sampleTitle,
      'url': TestData.sampleUrl,
      'content': TestData.sampleContent,
      'contentHash': 'abc123hash',
      'filePath': '/articles/2025-07-28/article_1.md',
      'rawHtml': '<h1>Sample HTML</h1>',
      'metadata': {
        'emailDate': TestData.sampleDate.toIso8601String(),
        'scrapedAt': TestData.sampleDate.toIso8601String(),
        'wordCount': 1500,
        'readingTime': '6 min read',
        'tags': ['flutter', 'dart', 'mobile'],
        'sourceEmail': 'email_123',
        'author': 'John Doe',
        'publishDate': TestData.sampleDate.toIso8601String(),
      },
    };

    test('should create ArticleModel from JSON', () {
      final result = ArticleModel.fromJson(sampleArticleData);

      expect(result.id, equals('article_1'));
      expect(result.title, equals(TestData.sampleTitle));
      expect(result.url, equals(TestData.sampleUrl));
      expect(result.content, equals(TestData.sampleContent));
      expect(result.contentHash, equals('abc123hash'));
      expect(result.filePath, equals('/articles/2025-07-28/article_1.md'));
      expect(result.rawHtml, equals('<h1>Sample HTML</h1>'));
      expect(result.metadata.author, equals('John Doe'));
    });

    test('should convert ArticleModel to JSON', () {
      final result = sampleArticle.toJson();

      expect(result['id'], equals('article_1'));
      expect(result['title'], equals(TestData.sampleTitle));
      expect(result['url'], equals(TestData.sampleUrl));
      expect(result['content'], equals(TestData.sampleContent));
      expect(result['contentHash'], equals('abc123hash'));
      expect(result['filePath'], equals('/articles/2025-07-28/article_1.md'));
      expect(result['rawHtml'], equals('<h1>Sample HTML</h1>'));
      expect(result['metadata']['author'], equals('John Doe'));
    });

    test('should support equality comparison', () {
      final article1 = ArticleModel(
        id: 'same_id',
        title: 'Same Title',
        url: 'https://example.com',
        content: 'Same content',
        contentHash: 'same_hash',
        filePath: '/same/path.md',
        metadata: sampleMetadata,
      );

      final article2 = ArticleModel(
        id: 'same_id',
        title: 'Same Title',
        url: 'https://example.com',
        content: 'Same content',
        contentHash: 'same_hash',
        filePath: '/same/path.md',
        metadata: sampleMetadata,
      );

      final article3 = ArticleModel(
        id: 'different_id',
        title: 'Same Title',
        url: 'https://example.com',
        content: 'Same content',
        contentHash: 'same_hash',
        filePath: '/same/path.md',
        metadata: sampleMetadata,
      );

      expect(article1, equals(article2));
      expect(article1, isNot(equals(article3)));
    });

    test('should support copyWith functionality', () {
      final original = sampleArticle;
      final updated = original.copyWith(
        title: 'Updated Title',
        content: 'Updated content',
      );

      expect(updated.title, equals('Updated Title'));
      expect(updated.content, equals('Updated content'));
      expect(updated.id, equals(original.id));
      expect(updated.url, equals(original.url));
      expect(updated.metadata, equals(original.metadata));
    });

    test('should handle null rawHtml', () {
      final articleData = Map<String, dynamic>.from(sampleArticleData);
      articleData.remove('rawHtml');

      final result = ArticleModel.fromJson(articleData);

      expect(result.rawHtml, isNull);
      expect(result.id, equals('article_1'));
    });
  });

  group('ArticleMetadata', () {
    final sampleMetadataData = {
      'emailDate': TestData.sampleDate.toIso8601String(),
      'scrapedAt': TestData.sampleDate.toIso8601String(),
      'wordCount': 1200,
      'readingTime': '5 min read',
      'tags': ['flutter', 'mobile'],
      'sourceEmail': 'email_456',
      'author': 'Jane Smith',
      'publishDate': TestData.sampleDate.toIso8601String(),
    };

    test('should create ArticleMetadata from JSON', () {
      final result = ArticleMetadata.fromJson(sampleMetadataData);

      expect(result.emailDate, equals(TestData.sampleDate));
      expect(result.scrapedAt, equals(TestData.sampleDate));
      expect(result.wordCount, equals(1200));
      expect(result.readingTime, equals('5 min read'));
      expect(result.tags, equals(['flutter', 'mobile']));
      expect(result.sourceEmail, equals('email_456'));
      expect(result.author, equals('Jane Smith'));
      expect(result.publishDate, equals(TestData.sampleDate));
    });

    test('should convert ArticleMetadata to JSON', () {
      final metadata = ArticleMetadata(
        emailDate: TestData.sampleDate,
        scrapedAt: TestData.sampleDate,
        wordCount: 1200,
        readingTime: '5 min read',
        tags: ['flutter', 'mobile'],
        sourceEmail: 'email_456',
        author: 'Jane Smith',
        publishDate: TestData.sampleDate,
      );

      final result = metadata.toJson();

      expect(result['emailDate'], equals(TestData.sampleDate.toIso8601String()));
      expect(result['scrapedAt'], equals(TestData.sampleDate.toIso8601String()));
      expect(result['wordCount'], equals(1200));
      expect(result['readingTime'], equals('5 min read'));
      expect(result['tags'], equals(['flutter', 'mobile']));
      expect(result['sourceEmail'], equals('email_456'));
      expect(result['author'], equals('Jane Smith'));
      expect(result['publishDate'], equals(TestData.sampleDate.toIso8601String()));
    });

    test('should handle optional fields', () {
      final minimalData = {
        'emailDate': TestData.sampleDate.toIso8601String(),
        'scrapedAt': TestData.sampleDate.toIso8601String(),
        'wordCount': 800,
        'readingTime': '3 min read',
        'tags': ['flutter'],
        'sourceEmail': 'email_789',
      };

      final result = ArticleMetadata.fromJson(minimalData);

      expect(result.author, isNull);
      expect(result.publishDate, isNull);
      expect(result.emailDate, equals(TestData.sampleDate));
      expect(result.wordCount, equals(800));
    });

    test('should support equality comparison', () {
      final metadata1 = ArticleMetadata(
        emailDate: TestData.sampleDate,
        scrapedAt: TestData.sampleDate,
        wordCount: 1000,
        readingTime: '4 min read',
        tags: ['flutter'],
        sourceEmail: 'email_1',
      );

      final metadata2 = ArticleMetadata(
        emailDate: TestData.sampleDate,
        scrapedAt: TestData.sampleDate,
        wordCount: 1000,
        readingTime: '4 min read',
        tags: ['flutter'],
        sourceEmail: 'email_1',
      );

      final metadata3 = ArticleMetadata(
        emailDate: TestData.sampleDate,
        scrapedAt: TestData.sampleDate,
        wordCount: 1500, // Different word count
        readingTime: '4 min read',
        tags: ['flutter'],
        sourceEmail: 'email_1',
      );

      expect(metadata1, equals(metadata2));
      expect(metadata1, isNot(equals(metadata3)));
    });

    test('should support copyWith functionality', () {
      final original = ArticleMetadata(
        emailDate: TestData.sampleDate,
        scrapedAt: TestData.sampleDate,
        wordCount: 1000,
        readingTime: '4 min read',
        tags: ['flutter'],
        sourceEmail: 'email_1',
        author: 'Original Author',
      );

      final updated = original.copyWith(
        wordCount: 1500,
        author: 'Updated Author',
      );

      expect(updated.wordCount, equals(1500));
      expect(updated.author, equals('Updated Author'));
      expect(updated.emailDate, equals(original.emailDate));
      expect(updated.tags, equals(original.tags));
    });
  });
}