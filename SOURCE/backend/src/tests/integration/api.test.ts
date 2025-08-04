/**
 * API Integration Tests
 * Tests the complete API endpoints with controllers and services integration
 */

import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import app from '../../app';
import { AuthService } from '../../services/AuthService';
import { GmailService } from '../../services/GmailService';
import { ScraperService } from '../../services/ScraperService';
import { StorageService } from '../../services/StorageService';

// Mock all services
jest.mock('../../services/AuthService');
jest.mock('../../services/GmailService');
jest.mock('../../services/ScraperService');
jest.mock('../../services/StorageService');

describe('API Integration Tests', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockGmailService: jest.Mocked<GmailService>;
  let mockScraperService: jest.Mocked<ScraperService>;
  let mockStorageService: jest.Mocked<StorageService>;

  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock service instances
    mockAuthService = {
      generateAuthUrl: jest.fn(),
      handleCallback: jest.fn(),
      validateToken: jest.fn(),
      getAuthorizedClient: jest.fn(),
      refreshAccessToken: jest.fn(),
      revokeAccess: jest.fn()
    } as any;

    mockGmailService = {
      fetchDigests: jest.fn(),
      fetchSingleEmail: jest.fn(),
      getQuotaUsage: jest.fn(),
      clearCache: jest.fn()
    } as any;

    mockScraperService = {
      scrapeUrl: jest.fn(),
      scrapeMultiple: jest.fn(),
      getBatchProgress: jest.fn(),
      cancelBatch: jest.fn(),
      getQueueStatus: jest.fn(),
      clearCompletedBatches: jest.fn()
    } as any;

    mockStorageService = {
      getArticles: jest.fn(),
      getArticleById: jest.fn(),
      getArticleContent: jest.fn(),
      deleteArticle: jest.fn(),
      updateArticle: jest.fn(),
      getEmailDigests: jest.fn(),
      getEmailDigestById: jest.fn(),
      getStorageStats: jest.fn(),
      listArticleFiles: jest.fn()
    } as any;

    // Mock service constructors
    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);
    (GmailService as jest.MockedClass<typeof GmailService>).mockImplementation(() => mockGmailService);
    (ScraperService as jest.MockedClass<typeof ScraperService>).mockImplementation(() => mockScraperService);
    (StorageService as jest.MockedClass<typeof StorageService>).mockImplementation(() => mockStorageService);
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        environment: 'test'
      });
    });
  });

  describe('Authentication Routes', () => {
    describe('GET /api/auth/google/init', () => {
      it('should initialize Google OAuth flow', async () => {
        mockAuthService.generateAuthUrl.mockReturnValue({
          url: 'https://accounts.google.com/oauth/authorize?...',
          state: 'test-state-123'
        });

        const response = await request(app)
          .get('/api/auth/google/init')
          .expect(200);

        expect(response.body).toEqual({
          authUrl: 'https://accounts.google.com/oauth/authorize?...',
          state: 'test-state-123'
        });
        expect(mockAuthService.generateAuthUrl).toHaveBeenCalled();
      });
    });

    describe('GET /api/auth/google/callback', () => {
      it('should handle OAuth callback successfully', async () => {
        const mockCallbackResult = {
          client: {} as any,
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiryDate: Date.now() + 3600000
          },
          email: 'test@example.com',
          userId: 'user-123'
        };

        mockAuthService.handleCallback.mockResolvedValue(mockCallbackResult);

        const response = await request(app)
          .get('/api/auth/google/callback')
          .query({
            code: 'auth-code',
            state: 'valid-state'
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Authentication successful',
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        });
        expect(mockAuthService.handleCallback).toHaveBeenCalledWith('auth-code', 'valid-state');
      });

      it('should handle OAuth callback errors', async () => {
        mockAuthService.handleCallback.mockRejectedValue(new Error('Invalid state'));

        const response = await request(app)
          .get('/api/auth/google/callback')
          .query({
            code: 'auth-code',
            state: 'invalid-state'
          })
          .expect(400);

        expect(response.body).toEqual({
          error: 'Authentication failed',
          message: 'Invalid state'
        });
      });

      it('should require code and state parameters', async () => {
        const response = await request(app)
          .get('/api/auth/google/callback')
          .expect(400);

        expect(response.body).toEqual({
          error: 'Missing required parameters',
          message: 'Code and state are required'
        });
      });
    });

    describe('POST /api/auth/validate', () => {
      it('should validate token successfully', async () => {
        mockAuthService.validateToken.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/auth/validate')
          .send({ userId: 'user-123' })
          .expect(200);

        expect(response.body).toEqual({
          valid: true,
          message: 'Token is valid'
        });
      });

      it('should handle invalid token', async () => {
        mockAuthService.validateToken.mockResolvedValue(false);

        const response = await request(app)
          .post('/api/auth/validate')
          .send({ userId: 'user-123' })
          .expect(401);

        expect(response.body).toEqual({
          valid: false,
          message: 'Token is invalid or expired'
        });
      });
    });

    describe('POST /api/auth/revoke', () => {
      it('should revoke access successfully', async () => {
        mockAuthService.revokeAccess.mockResolvedValue();

        const response = await request(app)
          .post('/api/auth/revoke')
          .send({ userId: 'user-123' })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Access revoked successfully'
        });
      });
    });
  });

  describe('Email Routes', () => {
    describe('GET /api/emails/digests', () => {
      it('should fetch email digests', async () => {
        const mockDigests = [
          {
            messageId: 'msg-1',
            subject: 'Medium Daily Digest',
            date: new Date(),
            sender: { email: 'noreply@medium.com', name: 'Medium' },
            bodyPreview: 'Daily digest preview text',
            htmlContent: '<html>...</html>',
            links: {
              allLinks: ['https://medium.com/article1'],
              flutterLinks: [],
              linksByDomain: new Map(),
              linksFound: 1
            },
            processingTime: 100
          }
        ];

        mockGmailService.fetchDigests.mockResolvedValue(mockDigests);

        const response = await request(app)
          .get('/api/emails/digests')
          .query({ userId: 'user-123' })
          .expect(200);

        expect(response.body).toEqual({
          digests: mockDigests,
          total: 1
        });
      });

      it('should require userId parameter', async () => {
        const response = await request(app)
          .get('/api/emails/digests')
          .expect(400);

        expect(response.body).toEqual({
          error: 'Missing required parameter: userId'
        });
      });
    });

    describe('GET /api/emails/:messageId', () => {
      it('should fetch single email', async () => {
        const mockEmail = {
          messageId: 'msg-1',
          subject: 'Test Email',
          date: new Date(),
          sender: { email: 'test@example.com', name: 'Test Sender' },
          links: {
            allLinks: [],
            flutterLinks: [],
            linksByDomain: new Map(),
            linksFound: 0
          },
          processingTime: 100
        };

        mockGmailService.fetchSingleEmail.mockResolvedValue(mockEmail);

        const response = await request(app)
          .get('/api/emails/msg-1')
          .query({ userId: 'user-123' })
          .expect(200);

        expect(response.body).toEqual({ email: mockEmail });
      });

      it('should handle email not found', async () => {
        mockGmailService.fetchSingleEmail.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/emails/nonexistent')
          .query({ userId: 'user-123' })
          .expect(404);

        expect(response.body).toEqual({
          error: 'Email not found'
        });
      });
    });

    describe('GET /api/emails/quota', () => {
      it('should return quota usage', async () => {
        const mockQuota = {
          totalMessages: 5000,
          threadsTotal: 3000,
          historyId: '12345',
          emailAddress: 'test@example.com'
        };

        mockGmailService.getQuotaUsage.mockResolvedValue(mockQuota);

        const response = await request(app)
          .get('/api/emails/quota')
          .query({ userId: 'user-123' })
          .expect(200);

        expect(response.body).toEqual({ quota: mockQuota });
      });
    });
  });

  describe('Scraping Routes', () => {
    describe('POST /api/scraping/scrape', () => {
      it('should scrape single URL successfully', async () => {
        const mockResult = {
          success: true,
          content: {
            url: 'https://medium.com/article',
            title: 'Test Article',
            content: 'Article content',
            markdown: '# Test Article',
            rawHtml: '<h1>Test Article</h1>',
            author: {
              name: 'Test Author',
              url: 'https://medium.com/@testauthor',
              avatar: 'https://medium.com/avatar.png'
            },
            publishDate: '2024-01-01',
            wordCount: 10,
            readingTime: '1 min read',
            scrapedAt: new Date(),
            keywords: ['flutter', 'dart'],
            category: 'flutter' as const
          },
          error: undefined,
          statusCode: 200,
          processingTime: 1500
        };

        mockScraperService.scrapeUrl.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/scraping/scrape')
          .send({ url: 'https://medium.com/article' })
          .expect(200);

        expect(response.body).toEqual({ result: mockResult });
      });

      it('should handle scraping failure', async () => {
        const mockResult = {
          success: false,
          content: undefined,
          error: 'Page not found',
          statusCode: 404,
          processingTime: 500
        };

        mockScraperService.scrapeUrl.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/scraping/scrape')
          .send({ url: 'https://invalid-url.com' })
          .expect(200);

        expect(response.body).toEqual({ result: mockResult });
      });

      it('should require URL parameter', async () => {
        const response = await request(app)
          .post('/api/scraping/scrape')
          .send({})
          .expect(400);

        expect(response.body).toEqual({
          error: 'Missing required parameter: url'
        });
      });
    });

    describe('POST /api/scraping/batch', () => {
      it('should start batch scraping', async () => {
        mockScraperService.scrapeMultiple.mockResolvedValue('batch-123');

        const response = await request(app)
          .post('/api/scraping/batch')
          .send({
            urls: [
              'https://medium.com/article1',
              'https://medium.com/article2'
            ]
          })
          .expect(200);

        expect(response.body).toEqual({
          batchId: 'batch-123',
          message: 'Batch scraping started',
          totalUrls: 2
        });
      });
    });

    describe('GET /api/scraping/batch/:batchId', () => {
      it('should return batch progress', async () => {
        const mockProgress = {
          id: 'batch-123',
          total: 10,
          completed: 7,
          failed: 1,
          status: 'running' as const,
          startTime: new Date(),
          endTime: undefined as Date | undefined,
          results: [],
          errors: []
        };

        mockScraperService.getBatchProgress.mockReturnValue(mockProgress);

        const response = await request(app)
          .get('/api/scraping/batch/batch-123')
          .expect(200);

        expect(response.body).toEqual({ progress: mockProgress });
      });

      it('should handle batch not found', async () => {
        mockScraperService.getBatchProgress.mockReturnValue(null);

        const response = await request(app)
          .get('/api/scraping/batch/nonexistent')
          .expect(404);

        expect(response.body).toEqual({
          error: 'Batch not found'
        });
      });
    });

    describe('DELETE /api/scraping/batch/:batchId', () => {
      it('should cancel batch successfully', async () => {
        mockScraperService.cancelBatch.mockReturnValue(true);

        const response = await request(app)
          .delete('/api/scraping/batch/batch-123')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Batch cancelled successfully'
        });
      });

      it('should handle batch cancellation failure', async () => {
        mockScraperService.cancelBatch.mockReturnValue(false);

        const response = await request(app)
          .delete('/api/scraping/batch/batch-123')
          .expect(400);

        expect(response.body).toEqual({
          error: 'Failed to cancel batch. Batch may not exist or already completed.'
        });
      });
    });

    describe('GET /api/scraping/queue', () => {
      it('should return queue status', async () => {
        const mockStatus = {
          pending: 5,
          running: 3
        };

        mockScraperService.getQueueStatus.mockReturnValue(mockStatus);

        const response = await request(app)
          .get('/api/scraping/queue')
          .expect(200);

        expect(response.body).toEqual({ queue: mockStatus });
      });
    });
  });

  describe('Articles Routes', () => {
    describe('GET /api/articles', () => {
      it('should return articles with query filters', async () => {
        const mockArticles = [
          {
            _id: new ObjectId(),
            title: 'Flutter Tutorial',
            url: 'https://medium.com/flutter-tutorial',
            urlHash: 'hash123',
            content: 'Article content',
            rawHtml: '<p>Article html</p>',
            emailDate: new Date(),
            scrapedAt: new Date(),
            lastUpdated: new Date(),
            wordCount: 500,
            readingTime: '3 min read',
            author: {
              name: 'Test Author',
              url: 'https://medium.com/@author',
              avatar: 'https://avatar.png'
            },
            keywords: ['flutter', 'dart'],
            tags: ['tutorial', 'mobile'],
            category: 'flutter' as const,
            sourceEmail: {
              id: 'email-1',
              subject: 'Daily Digest',
              date: new Date()
            },
            filePath: '/articles/article-1.md',
            status: 'scraped' as const,
            scrapeAttempts: 1,
            lastError: undefined
          }
        ];

        mockStorageService.getArticles.mockResolvedValue(mockArticles);

        const response = await request(app)
          .get('/api/articles')
          .query({
            category: 'flutter',
            limit: 10,
            skip: 0
          })
          .expect(200);

        expect(response.body).toEqual({
          articles: mockArticles,
          total: 1,
          pagination: {
            limit: 10,
            skip: 0,
            hasMore: false
          }
        });
      });
    });

    describe('GET /api/articles/:id', () => {
      it('should return article by ID', async () => {
        const mockArticle = {
          _id: new ObjectId(),
          title: 'Test Article',
          url: 'https://medium.com/test',
          urlHash: 'hash123',
          content: 'Article content',
          rawHtml: '<p>Article html</p>',
          emailDate: new Date(),
          scrapedAt: new Date(),
          lastUpdated: new Date(),
          wordCount: 500,
          readingTime: '3 min read',
          author: {
            name: 'Test Author',
            url: 'https://medium.com/@author',
            avatar: 'https://avatar.png'
          },
          keywords: ['flutter'],
          tags: ['tutorial'],
          category: 'flutter' as const,
          sourceEmail: {
            id: 'email-1',
            subject: 'Daily Digest',
            date: new Date()
          },
          filePath: '/articles/article-1.md',
          status: 'scraped' as const,
          scrapeAttempts: 1,
          lastError: undefined
        };

        mockStorageService.getArticleById.mockResolvedValue(mockArticle);

        const response = await request(app)
          .get('/api/articles/article-1')
          .expect(200);

        expect(response.body).toEqual({ article: mockArticle });
      });

      it('should handle article not found', async () => {
        mockStorageService.getArticleById.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/articles/nonexistent')
          .expect(404);

        expect(response.body).toEqual({
          error: 'Article not found'
        });
      });
    });

    describe('GET /api/articles/:id/content', () => {
      it('should return article content', async () => {
        const mockContent = {
          markdown: '# Test Article\n\nContent here',
          html: '<h1>Test Article</h1><p>Content here</p>'
        };

        mockStorageService.getArticleContent.mockResolvedValue(mockContent);

        const response = await request(app)
          .get('/api/articles/article-1/content')
          .expect(200);

        expect(response.body).toEqual({ content: mockContent });
      });
    });

    describe('PUT /api/articles/:id', () => {
      it('should update article', async () => {
        mockStorageService.updateArticle.mockResolvedValue(true);

        const response = await request(app)
          .put('/api/articles/article-1')
          .send({
            title: 'Updated Title',
            category: 'flutter'
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Article updated successfully'
        });
      });

      it('should handle update failure', async () => {
        mockStorageService.updateArticle.mockResolvedValue(false);

        const response = await request(app)
          .put('/api/articles/article-1')
          .send({ title: 'New Title' })
          .expect(404);

        expect(response.body).toEqual({
          error: 'Article not found or no changes made'
        });
      });
    });

    describe('DELETE /api/articles/:id', () => {
      it('should delete article', async () => {
        mockStorageService.deleteArticle.mockResolvedValue(true);

        const response = await request(app)
          .delete('/api/articles/article-1')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Article deleted successfully'
        });
      });

      it('should handle delete failure', async () => {
        mockStorageService.deleteArticle.mockResolvedValue(false);

        const response = await request(app)
          .delete('/api/articles/article-1')
          .expect(404);

        expect(response.body).toEqual({
          error: 'Article not found'
        });
      });
    });

    describe('GET /api/articles/stats', () => {
      it('should return storage statistics', async () => {
        const mockStats = {
          articles: 150,
          emailDigests: 25,
          totalFileSize: 1024000,
          diskUsage: '1000 KB'
        };

        mockStorageService.getStorageStats.mockResolvedValue(mockStats);

        const response = await request(app)
          .get('/api/articles/stats')
          .expect(200);

        expect(response.body).toEqual({ stats: mockStats });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Route not found'
      });
    });

    it('should handle service errors gracefully', async () => {
      mockGmailService.fetchDigests.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/emails/digests')
        .query({ userId: 'user-123' })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error',
        message: 'Service error'
      });
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/scraping/scrape')
        .send({ invalidField: 'value' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS and Middleware', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/articles')
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to scraping endpoints', async () => {
      // Mock multiple rapid requests
      const promises = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/scraping/scrape')
          .send({ url: 'https://medium.com/test' })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});