/**
 * StorageService Unit Tests
 * Tests MongoDB operations, file system storage, and data management functionality
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StorageService } from '../../services/StorageService';
import type { ScrapedContent } from '../../types/scraper.types';
import type { Article, EmailDigest } from '../../types/database.types';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('mongodb');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  }
}));
jest.mock('../../config/database.config');
jest.mock('../../config/app.config');

describe('StorageService', () => {
  let storageService: StorageService;
  let mockClient: any;
  let mockDb: any;
  let mockArticlesCollection: any;
  let mockEmailDigestsCollection: any;
  let mockFs: any;

  const mockArticleId = new ObjectId();
  const mockEmailDigestId = new ObjectId();

  beforeEach(() => {
    // Mock MongoDB collections
    mockArticlesCollection = {
      findOne: jest.fn(),
      // @ts-ignore
      insertOne: jest.fn(),
      // @ts-ignore
      updateOne: jest.fn(),
      // @ts-ignore
      deleteOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      // @ts-ignore
      toArray: jest.fn(),
      // @ts-ignore
      countDocuments: jest.fn()
    };

    mockEmailDigestsCollection = {
      findOne: jest.fn(),
      // @ts-ignore
      insertOne: jest.fn(),
      // @ts-ignore
      updateOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      // @ts-ignore
      toArray: jest.fn(),
      // @ts-ignore
      countDocuments: jest.fn()
    };

    mockDb = {
      // @ts-ignore
      collection: jest.fn().mockImplementation((name: string) => {
        if (name === 'articles') return mockArticlesCollection;
        if (name === 'email_digests') return mockEmailDigestsCollection;
        return {};
      })
    };

    mockClient = {
      // @ts-ignore
      connect: jest.fn(),
      // @ts-ignore
      close: jest.fn(),
      db: jest.fn().mockReturnValue(mockDb)
    };

    // Mock MongoDB client constructor
    const { MongoClient } = require('mongodb');
    MongoClient.mockImplementation(() => mockClient);

    // Mock file system
    mockFs = {
      // @ts-ignore
      mkdir: jest.fn().mockResolvedValue(undefined),
      // @ts-ignore
      writeFile: jest.fn().mockResolvedValue(undefined),
      // @ts-ignore
      readFile: jest.fn().mockResolvedValue('File content'),
      // @ts-ignore
      unlink: jest.fn().mockResolvedValue(undefined),
      // @ts-ignore
      readdir: jest.fn().mockResolvedValue([]),
      // @ts-ignore
      stat: jest.fn().mockResolvedValue({ size: 1024, mtime: new Date() })
    };

    const fs = require('fs');
    Object.assign(fs.promises, mockFs);

    storageService = new StorageService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should connect to MongoDB and set up collections', async () => {
      await storageService.initialize();

      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.db).toHaveBeenCalledWith('medium_extractor_test');
      expect(mockDb.collection).toHaveBeenCalledWith('articles');
      expect(mockDb.collection).toHaveBeenCalledWith('email_digests');
    });

    it('should not reinitialize if client already exists', async () => {
      await storageService.initialize();
      await storageService.initialize(); // Second call

      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('shutdown', () => {
    it('should close MongoDB connection and reset properties', async () => {
      // Initialize first
      await storageService.initialize();

      await storageService.shutdown();

      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle shutdown when client is null', async () => {
      await expect(storageService.shutdown()).resolves.not.toThrow();
    });
  });

  describe('saveArticle', () => {
    const mockScrapedContent: ScrapedContent = {
      url: 'https://medium.com/test-article',
      title: 'Test Article',
      content: 'Test content',
      markdown: '# Test Article\n\nTest content',
      rawHtml: '<h1>Test Article</h1><p>Test content</p>',
      wordCount: 2,
      readingTime: '1 min read',
      scrapedAt: new Date(),
      keywords: ['test'],
      category: 'general' as const,
      author: { name: 'Test Author' }
    };

    const mockEmailInfo = {
      messageId: 'test-message-id',
      subject: 'Test Subject',
      date: new Date()
    };

    beforeEach(() => {
      // Setup default mocks
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(null);
      // @ts-ignore
      mockArticlesCollection.insertOne.mockResolvedValue({ insertedId: mockArticleId });
      // @ts-ignore
      mockFs.mkdir.mockResolvedValue(undefined);
      // @ts-ignore
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should save new article to database and file system', async () => {
      const result = await storageService.saveArticle(mockScrapedContent, mockEmailInfo);

      expect(result.articleId).toBe(mockArticleId);
      expect(result.filePath).toBeDefined();
      expect(mockArticlesCollection.insertOne).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should return existing article if URL already exists', async () => {
      const existingArticle = {
        _id: mockArticleId,
        filePath: 'existing/path/article.md'
      };
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(existingArticle);

      const result = await storageService.saveArticle(mockScrapedContent, mockEmailInfo);

      expect(result.articleId).toBe(mockArticleId);
      expect(result.filePath).toBe('existing/path/article.md');
      expect(mockArticlesCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should create directory structure for file storage', async () => {
      await storageService.saveArticle(mockScrapedContent, mockEmailInfo);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('data/articles'),
        { recursive: true }
      );
    });

    it('should generate markdown with metadata', async () => {
      await storageService.saveArticle(mockScrapedContent, mockEmailInfo);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('---'),
        'utf-8'
      );
    });
  });

  describe('saveEmailDigest', () => {
    const mockEmailDigest: EmailDigest = {
      _id: mockEmailDigestId,
      messageId: 'test-message-id',
      subject: 'Test Subject',
      date: new Date(),
      sender: { email: 'test@example.com', name: 'Test User' },
      linksFound: 0,
      flutterLinks: [],
      allLinks: [],
      retryCount: 0,
      matchedFilters: [],
      status: 'discovered' as const,
      processedAt: new Date(),
      articles: []
    };

    beforeEach(() => {
      // @ts-ignore
      mockEmailDigestsCollection.findOne.mockResolvedValue(null);
      // @ts-ignore
      mockEmailDigestsCollection.insertOne.mockResolvedValue({ insertedId: mockEmailDigestId });
    });

    it('should save new email digest', async () => {
      const result = await storageService.saveEmailDigest(mockEmailDigest);

      expect(result).toBe(mockEmailDigestId);
      expect(mockEmailDigestsCollection.insertOne).toHaveBeenCalledWith(mockEmailDigest);
    });

    it('should return existing digest ID if already exists', async () => {
      // @ts-ignore
      mockEmailDigestsCollection.findOne.mockResolvedValue({ _id: mockEmailDigestId });

      const result = await storageService.saveEmailDigest(mockEmailDigest);

      expect(result).toBe(mockEmailDigestId);
      expect(mockEmailDigestsCollection.insertOne).not.toHaveBeenCalled();
    });
  });

  describe('updateEmailDigestWithArticles', () => {
    it('should update email digest with article IDs', async () => {
      const messageId = 'test-message-id';
      const articleIds = [new ObjectId(), new ObjectId()];
      
      // @ts-ignore
      mockEmailDigestsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await storageService.updateEmailDigestWithArticles(messageId, articleIds);

      expect(mockEmailDigestsCollection.updateOne).toHaveBeenCalledWith(
        { messageId },
        {
          $set: {
            articles: articleIds,
            status: 'processed',
            processedAt: expect.any(Date)
          }
        }
      );
    });
  });

  describe('getArticles', () => {
    const mockArticles: Article[] = [
      {
        _id: new ObjectId(),
        title: 'Test Article 1',
        url: 'https://medium.com/article1',
        urlHash: 'hash1',
        content: 'Content 1',
        rawHtml: '<p>Content 1</p>',
        emailDate: new Date(),
        scrapedAt: new Date(),
        lastUpdated: new Date(),
        wordCount: 10,
        readingTime: '1 min read',
        keywords: ['test'],
        tags: [],
        category: 'general' as const,
        sourceEmail: {
          id: 'msg1',
          subject: 'Subject 1',
          date: new Date()
        },
        filePath: 'path/to/article1.md',
        status: 'scraped',
        scrapeAttempts: 1
      }
    ];

    beforeEach(() => {
      // @ts-ignore
      mockArticlesCollection.toArray.mockResolvedValue(mockArticles);
    });

    it('should return all articles when no query provided', async () => {
      const result = await storageService.getArticles();

      expect(result).toEqual(mockArticles);
      expect(mockArticlesCollection.find).toHaveBeenCalledWith({});
      expect(mockArticlesCollection.sort).toHaveBeenCalledWith({ emailDate: -1 });
    });

    it('should filter by category', async () => {
      await storageService.getArticles({ category: 'flutter' });

      expect(mockArticlesCollection.find).toHaveBeenCalledWith({ category: 'flutter' });
    });

    it('should filter by keywords', async () => {
      await storageService.getArticles({ keywords: ['flutter', 'dart'] });

      expect(mockArticlesCollection.find).toHaveBeenCalledWith({
        keywords: { $in: ['flutter', 'dart'] }
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await storageService.getArticles({
        dateRange: { start: startDate, end: endDate }
      });

      expect(mockArticlesCollection.find).toHaveBeenCalledWith({
        emailDate: { $gte: startDate, $lte: endDate }
      });
    });

    it('should apply pagination', async () => {
      await storageService.getArticles({ limit: 10, skip: 20 });

      expect(mockArticlesCollection.limit).toHaveBeenCalledWith(10);
      expect(mockArticlesCollection.skip).toHaveBeenCalledWith(20);
    });
  });

  describe('getArticleById', () => {
    const mockArticle: Article = {
      _id: mockArticleId,
      title: 'Test Article',
      url: 'https://medium.com/article',
      urlHash: 'hash',
      content: 'Content',
      rawHtml: '<p>Content</p>',
      emailDate: new Date(),
      scrapedAt: new Date(),
      lastUpdated: new Date(),
      wordCount: 10,
      readingTime: '1 min read',
      keywords: [],
      tags: [],
      category: 'general' as const,
      sourceEmail: {
        id: 'msg1',
        subject: 'Subject',
        date: new Date()
      },
      filePath: 'path/to/article.md',
      status: 'scraped',
      scrapeAttempts: 1
    };

    it('should return article by ObjectId', async () => {
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(mockArticle);

      const result = await storageService.getArticleById(mockArticleId);

      expect(result).toEqual(mockArticle);
      expect(mockArticlesCollection.findOne).toHaveBeenCalledWith({ _id: mockArticleId });
    });

    it('should return article by string ID', async () => {
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(mockArticle);

      const result = await storageService.getArticleById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockArticle);
    });

    it('should return null if article not found', async () => {
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(null);

      const result = await storageService.getArticleById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteArticle', () => {
    const mockArticle: Article = {
      _id: mockArticleId,
      title: 'Test Article',
      filePath: 'path/to/article.md'
    } as Article;

    it('should delete article and file', async () => {
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(mockArticle);
      // @ts-ignore
      mockArticlesCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      // @ts-ignore
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await storageService.deleteArticle(mockArticleId);

      expect(result).toBe(true);
      expect(mockFs.unlink).toHaveBeenCalled();
      expect(mockArticlesCollection.deleteOne).toHaveBeenCalledWith({ _id: mockArticleId });
    });

    it('should return false if article not found', async () => {
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(null);

      const result = await storageService.deleteArticle(mockArticleId);

      expect(result).toBe(false);
    });

    it('should continue deletion even if file deletion fails', async () => {
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(mockArticle);
      // @ts-ignore
      mockArticlesCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      // @ts-ignore
      mockFs.unlink.mockRejectedValue(new Error('File not found'));

      const result = await storageService.deleteArticle(mockArticleId);

      expect(result).toBe(true);
      expect(mockArticlesCollection.deleteOne).toHaveBeenCalled();
    });
  });

  describe('updateArticle', () => {
    it('should update article with new data', async () => {
      const updates = { title: 'Updated Title', category: 'flutter' as const };
      // @ts-ignore
      mockArticlesCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await storageService.updateArticle(mockArticleId, updates);

      expect(result).toBe(true);
      expect(mockArticlesCollection.updateOne).toHaveBeenCalledWith(
        { _id: mockArticleId },
        {
          $set: {
            ...updates,
            lastUpdated: expect.any(Date)
          }
        }
      );
    });

    it('should return false if no document was modified', async () => {
      // @ts-ignore
      mockArticlesCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

      const result = await storageService.updateArticle(mockArticleId, { title: 'New Title' });

      expect(result).toBe(false);
    });
  });

  describe('getArticleContent', () => {
    const mockArticle: Article = {
      _id: mockArticleId,
      filePath: 'path/to/article.md',
      content: 'Database content',
      rawHtml: '<p>Raw HTML</p>'
    } as Article;

    it('should return content from file when file exists', async () => {
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(mockArticle);
      // @ts-ignore
      mockFs.readFile.mockResolvedValue('File content');

      const result = await storageService.getArticleContent(mockArticleId);

      expect(result).toEqual({
        markdown: 'File content',
        html: '<p>Raw HTML</p>'
      });
    });

    it('should fallback to database content when file read fails', async () => {
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(mockArticle);
      // @ts-ignore
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await storageService.getArticleContent(mockArticleId);

      expect(result).toEqual({
        markdown: 'Database content',
        html: '<p>Raw HTML</p>'
      });
    });

    it('should return null if article not found', async () => {
      // @ts-ignore
      mockArticlesCollection.findOne.mockResolvedValue(null);

      const result = await storageService.getArticleContent(mockArticleId);

      expect(result).toBeNull();
    });
  });

  describe('listArticleFiles', () => {
    it('should list all markdown files with stats', async () => {
      const mockFiles = ['article1.md', 'article2.md'];
      const mockStats = {
        size: 1024,
        mtime: new Date()
      };

      // @ts-ignore
      mockFs.readdir.mockResolvedValue([
        { name: 'article1.md', isDirectory: () => false, isFile: () => true },
        { name: 'article2.md', isDirectory: () => false, isFile: () => true }
      ]);
      // @ts-ignore
      mockFs.stat.mockResolvedValue(mockStats);

      const result = await storageService.listArticleFiles();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        path: expect.stringContaining('article'),
        size: 1024,
        modified: expect.any(Date)
      });
    });

    it('should handle directory traversal', async () => {
      // @ts-ignore
      mockFs.readdir.mockResolvedValueOnce([
        { name: 'subdir', isDirectory: () => true, isFile: () => false }
      ]).mockResolvedValueOnce([
        { name: 'nested.md', isDirectory: () => false, isFile: () => true }
      ]);
      // @ts-ignore
      mockFs.stat.mockResolvedValue({ size: 512, mtime: new Date() });

      const result = await storageService.listArticleFiles();

      expect(mockFs.readdir).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      // @ts-ignore
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await storageService.listArticleFiles();

      expect(result).toEqual([]);
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      // @ts-ignore
      mockArticlesCollection.countDocuments.mockResolvedValue(150);
      // @ts-ignore
      mockEmailDigestsCollection.countDocuments.mockResolvedValue(25);
      
      // Mock listArticleFiles
      // @ts-ignore
      jest.spyOn(storageService, 'listArticleFiles').mockResolvedValue([
        { path: 'file1.md', size: 1024, modified: new Date() },
        { path: 'file2.md', size: 2048, modified: new Date() }
      ]);

      const result = await storageService.getStorageStats();

      expect(result).toEqual({
        articles: 150,
        emailDigests: 25,
        totalFileSize: 3072,
        diskUsage: '3 KB'
      });
    });
  });

  describe('getEmailDigests', () => {
    const mockDigests: EmailDigest[] = [
      {
        _id: mockEmailDigestId,
        messageId: 'msg1',
        subject: 'Test Digest',
        date: new Date(),
        sender: { email: 'test@example.com' },
        linksFound: 0,
        flutterLinks: [],
        allLinks: [],
        retryCount: 0,
        matchedFilters: [],
        status: 'processed',
        processedAt: new Date(),
        articles: []
      }
    ];

    beforeEach(() => {
      // @ts-ignore
      mockEmailDigestsCollection.toArray.mockResolvedValue(mockDigests);
    });

    it('should return email digests with query filters', async () => {
      await storageService.getEmailDigests({ status: 'processed' });

      expect(mockEmailDigestsCollection.find).toHaveBeenCalledWith({ status: 'processed' });
      expect(mockEmailDigestsCollection.sort).toHaveBeenCalledWith({ date: -1 });
    });

    it('should apply date range filter', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await storageService.getEmailDigests({
        dateRange: { start: startDate, end: endDate }
      });

      expect(mockEmailDigestsCollection.find).toHaveBeenCalledWith({
        date: { $gte: startDate, $lte: endDate }
      });
    });
  });

  describe('getEmailDigestById', () => {
    it('should return email digest by ID', async () => {
      const mockDigest: EmailDigest = {
        _id: mockEmailDigestId,
        messageId: 'test-msg',
        subject: 'Test'
      } as EmailDigest;

      // @ts-ignore
      mockEmailDigestsCollection.findOne.mockResolvedValue(mockDigest);

      const result = await storageService.getEmailDigestById(mockEmailDigestId);

      expect(result).toEqual(mockDigest);
    });
  });

  describe('Private Methods', () => {
    describe('formatBytes', () => {
      it('should format bytes correctly', () => {
        const formatBytes = (storageService as any).formatBytes;

        expect(formatBytes(0)).toBe('0 Bytes');
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1048576)).toBe('1 MB');
        expect(formatBytes(1073741824)).toBe('1 GB');
        expect(formatBytes(1536)).toBe('1.5 KB');
      });
    });

    describe('createMarkdownWithMetadata', () => {
      it('should create properly formatted markdown with metadata', () => {
        const mockContent: ScrapedContent = {
          title: 'Test Article',
          url: 'https://example.com',
          markdown: '# Content',
          scrapedAt: new Date('2024-01-01T12:00:00Z'),
          category: 'general' as const,
          wordCount: 10,
          readingTime: '1 min read',
          keywords: ['test', 'article'],
          author: { name: 'Test Author' }
        } as ScrapedContent;

        const result = (storageService as any).createMarkdownWithMetadata(mockContent);

        expect(result).toContain('---');
        expect(result).toContain('title: "Test Article"');
        expect(result).toContain('url: "https://example.com"');
        expect(result).toContain('author: "Test Author"');
        expect(result).toContain('category: "general"');
        expect(result).toContain('keywords: ["test", "article"]');
        expect(result).toContain('# Content');
      });

      it('should handle missing optional fields', () => {
        const mockContent = {
          title: 'Test Article',
          url: 'https://example.com',
          content: 'Test content',
          markdown: '# Content',
          rawHtml: '<h1>Content</h1>',
          scrapedAt: new Date(),
          category: 'general' as const,
          wordCount: 10,
          readingTime: '1 min read',
          keywords: []
        } as ScrapedContent;

        const result = (storageService as any).createMarkdownWithMetadata(mockContent);

        expect(result).toContain('title: "Test Article"');
        expect(result).not.toContain('author:');
        expect(result).not.toContain('keywords:');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle MongoDB connection errors', async () => {
      // @ts-ignore
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(storageService.initialize()).rejects.toThrow('Connection failed');
    });

    it('should handle file system errors gracefully', async () => {
      // @ts-ignore
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      // Should not throw, as constructor calls ensureDirectories
      expect(() => new StorageService()).not.toThrow();
    });

    it('should handle MongoDB query errors', async () => {
      await storageService.initialize();
      mockArticlesCollection.find.mockImplementation(() => {
        throw new Error('Query failed');
      });

      await expect(storageService.getArticles()).rejects.toThrow('Query failed');
    });
  });
});