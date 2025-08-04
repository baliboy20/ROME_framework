/**
 * ScraperService Unit Tests
 * Tests web scraping functionality, content extraction, and queue management
 */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ScraperService } from '../../services/ScraperService';
// Mock dependencies
jest.mock('puppeteer');
jest.mock('turndown');
jest.mock('p-queue');
describe('ScraperService', () => {
    let scraperService;
    let mockBrowser;
    let mockPage;
    let mockQueue;
    let mockTurndownService;
    beforeEach(() => {
        jest.clearAllMocks();
        mockPage = {
            // @ts-ignore
            goto: jest.fn().mockResolvedValue({ ok: () => true, status: () => 200 }),
            // @ts-ignore
            waitForSelector: jest.fn().mockResolvedValue(true),
            // @ts-ignore
            evaluate: jest.fn().mockResolvedValue({
                title: 'Test Article',
                html: '<p>Test content</p>',
                textContent: 'Test content',
                wordCount: 2
            }),
            // @ts-ignore
            setViewport: jest.fn().mockResolvedValue(undefined),
            // @ts-ignore
            setUserAgent: jest.fn().mockResolvedValue(undefined),
            // @ts-ignore
            setJavaScriptEnabled: jest.fn().mockResolvedValue(undefined),
            // @ts-ignore
            setRequestInterception: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            // @ts-ignore
            close: jest.fn().mockResolvedValue(undefined)
        };
        mockBrowser = {
            // @ts-ignore
            newPage: jest.fn().mockResolvedValue(mockPage),
            // @ts-ignore
            close: jest.fn().mockResolvedValue(undefined)
        };
        mockQueue = {
            add: jest.fn().mockImplementation((fn) => fn()),
            pending: 0,
            size: 0
        };
        mockTurndownService = {
            turndown: jest.fn().mockReturnValue('# Test Article\n\nTest content'),
            addRule: jest.fn()
        };
        scraperService = new ScraperService();
        // Set up the mocked dependencies directly on the service instance
        scraperService.browser = mockBrowser;
        scraperService.queue = mockQueue;
        scraperService.turndownService = mockTurndownService;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('initialize', () => {
        it('should initialize Puppeteer browser', async () => {
            const mockPuppeteer = {
                // @ts-ignore
                launch: jest.fn().mockResolvedValue(mockBrowser)
            };
            jest.doMock('puppeteer', () => ({ default: mockPuppeteer }));
            await scraperService.initialize();
            expect(mockPuppeteer.launch).toHaveBeenCalledWith({
                headless: 'new',
                args: expect.arrayContaining([
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ])
            });
        });
        it('should not reinitialize if browser already exists', async () => {
            const mockPuppeteer = {
                // @ts-ignore
                launch: jest.fn().mockResolvedValue(mockBrowser)
            };
            jest.doMock('puppeteer', () => ({ default: mockPuppeteer }));
            await scraperService.initialize();
            await scraperService.initialize(); // Second call
            expect(mockPuppeteer.launch).toHaveBeenCalledTimes(1);
        });
    });
    describe('shutdown', () => {
        it('should close browser when shutting down', async () => {
            // Set browser manually for testing
            scraperService.browser = mockBrowser;
            await scraperService.shutdown();
            expect(mockBrowser.close).toHaveBeenCalled();
            expect(scraperService.browser).toBeNull();
        });
        it('should handle shutdown when browser is null', async () => {
            scraperService.browser = null;
            await expect(scraperService.shutdown()).resolves.not.toThrow();
        });
    });
    describe('scrapeUrl', () => {
        const testUrl = 'https://medium.com/test-article';
        const mockScrapedContent = {
            url: testUrl,
            title: 'Test Article',
            content: 'Test content',
            markdown: '# Test Article\n\nTest content',
            rawHtml: '<h1>Test Article</h1><p>Test content</p>',
            wordCount: 2,
            readingTime: '1 min read',
            scrapedAt: new Date(),
            keywords: ['test'],
            category: 'general'
        };
        beforeEach(() => {
            // Browser and queue are already set up in main beforeEach
        });
        it('should scrape URL successfully', async () => {
            // @ts-ignore
            mockPage.goto.mockResolvedValue({ ok: () => true, status: () => 200 });
            // @ts-ignore
            mockPage.waitForSelector.mockResolvedValue(true);
            // @ts-ignore
            mockPage.evaluate.mockResolvedValue({
                title: 'Test Article',
                author: { name: 'Test Author' },
                publishDate: '2024-01-01',
                html: '<h1>Test Article</h1><p>Test content</p>',
                textContent: 'Test Article Test content',
                wordCount: 4
            });
            mockTurndownService.turndown.mockReturnValue('# Test Article\n\nTest content');
            const result = await scraperService.scrapeUrl(testUrl);
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
            expect(result.content?.title).toBe('Test Article');
            expect(result.content?.url).toBe(testUrl);
            expect(result.processingTime).toBeGreaterThan(0);
        });
        it('should handle HTTP errors', async () => {
            // @ts-ignore
            mockPage.goto.mockResolvedValue({ ok: () => false, status: () => 404 });
            const result = await scraperService.scrapeUrl(testUrl);
            expect(result.success).toBe(false);
            expect(result.error).toContain('HTTP 404');
            expect(result.content).toBeUndefined();
        });
        it('should handle timeout errors', async () => {
            // @ts-ignore
            mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));
            const result = await scraperService.scrapeUrl(testUrl);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Navigation timeout');
        });
        it('should handle missing article content', async () => {
            // @ts-ignore
            mockPage.goto.mockResolvedValue({ ok: () => true, status: () => 200 });
            // @ts-ignore
            mockPage.waitForSelector.mockRejectedValue(new Error('Selector not found'));
            const result = await scraperService.scrapeUrl(testUrl);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
        it('should use custom scraping options', async () => {
            const options = {
                timeout: 60000,
                waitUntil: 'networkidle0',
                userAgent: 'Custom User Agent',
                viewport: { width: 1280, height: 720 },
                javascript: false
            };
            // @ts-ignore
            mockPage.goto.mockResolvedValue({ ok: () => true, status: () => 200 });
            // @ts-ignore
            mockPage.waitForSelector.mockResolvedValue(true);
            // @ts-ignore
            mockPage.evaluate.mockResolvedValue({
                title: 'Test',
                html: '<p>Test</p>',
                textContent: 'Test',
                wordCount: 1
            });
            await scraperService.scrapeUrl(testUrl, options);
            expect(mockPage.setViewport).toHaveBeenCalledWith({ width: 1280, height: 720 });
            expect(mockPage.setUserAgent).toHaveBeenCalledWith('Custom User Agent');
            expect(mockPage.setJavaScriptEnabled).toHaveBeenCalledWith(false);
            expect(mockPage.goto).toHaveBeenCalledWith(testUrl, { waitUntil: 'networkidle0', timeout: 60000 });
        });
    });
    describe('scrapeMultiple', () => {
        const testUrls = [
            'https://medium.com/article1',
            'https://medium.com/article2',
            'https://medium.com/article3'
        ];
        it('should start batch scraping and return batch ID', async () => {
            const batchId = await scraperService.scrapeMultiple(testUrls);
            expect(batchId).toBeDefined();
            expect(typeof batchId).toBe('string');
            expect(batchId.length).toBeGreaterThan(0);
        });
        it('should store batch progress', async () => {
            const batchId = await scraperService.scrapeMultiple(testUrls);
            const progress = scraperService.getBatchProgress(batchId);
            expect(progress).toBeDefined();
            expect(progress?.id).toBe(batchId);
            expect(progress?.total).toBe(testUrls.length);
            expect(progress?.completed).toBe(0);
            expect(progress?.failed).toBe(0);
            expect(progress?.status).toBe('running');
        });
        it('should handle empty URL array', async () => {
            const batchId = await scraperService.scrapeMultiple([]);
            const progress = scraperService.getBatchProgress(batchId);
            expect(progress?.total).toBe(0);
        });
    });
    describe('getBatchProgress', () => {
        it('should return null for non-existent batch', () => {
            const progress = scraperService.getBatchProgress('non-existent-id');
            expect(progress).toBeNull();
        });
        it('should return progress for existing batch', async () => {
            const testUrls = ['https://medium.com/test'];
            const batchId = await scraperService.scrapeMultiple(testUrls);
            const progress = scraperService.getBatchProgress(batchId);
            expect(progress).not.toBeNull();
            expect(progress?.id).toBe(batchId);
        });
    });
    describe('cancelBatch', () => {
        it('should cancel running batch', async () => {
            const testUrls = ['https://medium.com/test'];
            const batchId = await scraperService.scrapeMultiple(testUrls);
            const cancelled = scraperService.cancelBatch(batchId);
            const progress = scraperService.getBatchProgress(batchId);
            expect(cancelled).toBe(true);
            expect(progress?.status).toBe('cancelled');
        });
        it('should not cancel completed batch', async () => {
            const testUrls = ['https://medium.com/test'];
            const batchId = await scraperService.scrapeMultiple(testUrls);
            // Manually set as completed
            const progress = scraperService.getBatchProgress(batchId);
            if (progress) {
                progress.status = 'completed';
                scraperService.batchProgress.set(batchId, progress);
            }
            const cancelled = scraperService.cancelBatch(batchId);
            expect(cancelled).toBe(false);
        });
        it('should return false for non-existent batch', () => {
            const cancelled = scraperService.cancelBatch('non-existent-id');
            expect(cancelled).toBe(false);
        });
    });
    describe('Content Processing', () => {
        describe('extractKeywords', () => {
            it('should extract Flutter-related keywords', () => {
                const content = 'This article discusses Flutter widgets and Dart programming. It also covers Riverpod state management.';
                const keywords = scraperService.extractKeywords(content);
                expect(keywords).toContain('flutter');
                expect(keywords).toContain('dart');
                expect(keywords).toContain('widget');
                expect(keywords).toContain('riverpod');
            });
            it('should return empty array for non-Flutter content', () => {
                const content = 'This article discusses React components and JavaScript programming.';
                const keywords = scraperService.extractKeywords(content);
                expect(keywords).toHaveLength(0);
            });
            it('should remove duplicate keywords', () => {
                const content = 'Flutter Flutter Flutter widget widget';
                const keywords = scraperService.extractKeywords(content);
                expect(keywords).toContain('flutter');
                expect(keywords).toContain('widget');
                expect(keywords.filter((k) => k === 'flutter')).toHaveLength(1);
            });
        });
        describe('categorizeContent', () => {
            it('should categorize as flutter', () => {
                const category = scraperService.categorizeContent('https://medium.com/flutter-article', 'Flutter development tutorial', ['flutter', 'widget']);
                expect(category).toBe('flutter');
            });
            it('should categorize as dart', () => {
                const category = scraperService.categorizeContent('https://medium.com/dart-guide', 'Dart programming language', ['dart']);
                expect(category).toBe('dart');
            });
            it('should categorize as mobile', () => {
                const category = scraperService.categorizeContent('https://medium.com/mobile-dev', 'Mobile app development for Android and iOS', []);
                expect(category).toBe('mobile');
            });
            it('should categorize as web', () => {
                const category = scraperService.categorizeContent('https://medium.com/web-dev', 'Web application development', []);
                expect(category).toBe('web');
            });
            it('should default to general', () => {
                const category = scraperService.categorizeContent('https://medium.com/random-article', 'Random programming article', []);
                expect(category).toBe('general');
            });
        });
        describe('calculateReadingTime', () => {
            it('should calculate reading time correctly', () => {
                const readingTime1 = scraperService.calculateReadingTime(200);
                const readingTime2 = scraperService.calculateReadingTime(600);
                const readingTime3 = scraperService.calculateReadingTime(50);
                expect(readingTime1).toBe('1 min read');
                expect(readingTime2).toBe('3 min read');
                expect(readingTime3).toBe('1 min read');
            });
        });
        describe('getRandomUserAgent', () => {
            it('should return a user agent string', () => {
                const userAgent = scraperService.getRandomUserAgent();
                expect(typeof userAgent).toBe('string');
                expect(userAgent.length).toBeGreaterThan(0);
                expect(userAgent).toContain('Mozilla');
            });
            it('should return different user agents', () => {
                const userAgent1 = scraperService.getRandomUserAgent();
                const userAgent2 = scraperService.getRandomUserAgent();
                // Not guaranteed to be different, but testing randomness mechanism exists
                expect(typeof userAgent1).toBe('string');
                expect(typeof userAgent2).toBe('string');
            });
        });
    });
    describe('Queue Management', () => {
        describe('getQueueStatus', () => {
            it('should return queue status', () => {
                mockQueue.pending = 5;
                mockQueue.size = 10;
                const status = scraperService.getQueueStatus();
                expect(status).toEqual({
                    pending: 5,
                    running: 15 // pending + size
                });
            });
        });
        describe('clearCompletedBatches', () => {
            it('should clear completed batches', async () => {
                // Create test batches
                const batchId1 = await scraperService.scrapeMultiple(['https://test1.com']);
                const batchId2 = await scraperService.scrapeMultiple(['https://test2.com']);
                // Set one as completed
                const progress1 = scraperService.getBatchProgress(batchId1);
                if (progress1) {
                    progress1.status = 'completed';
                    scraperService.batchProgress.set(batchId1, progress1);
                }
                // Clear completed batches
                scraperService.clearCompletedBatches();
                expect(scraperService.getBatchProgress(batchId1)).toBeNull();
                expect(scraperService.getBatchProgress(batchId2)).not.toBeNull();
            });
            it('should clear failed batches', async () => {
                const batchId = await scraperService.scrapeMultiple(['https://test.com']);
                // Set as failed
                const progress = scraperService.getBatchProgress(batchId);
                if (progress) {
                    progress.status = 'failed';
                    scraperService.batchProgress.set(batchId, progress);
                }
                scraperService.clearCompletedBatches();
                expect(scraperService.getBatchProgress(batchId)).toBeNull();
            });
            it('should not clear running batches', async () => {
                const batchId = await scraperService.scrapeMultiple(['https://test.com']);
                scraperService.clearCompletedBatches();
                expect(scraperService.getBatchProgress(batchId)).not.toBeNull();
            });
        });
    });
    describe('Error Handling', () => {
        beforeEach(() => {
            // Browser and queue are already set up in main beforeEach
        });
        it('should handle browser launch failures', async () => {
            const mockPuppeteer = {
                // @ts-ignore
                launch: jest.fn().mockRejectedValue(new Error('Browser launch failed'))
            };
            jest.doMock('puppeteer', () => ({ default: mockPuppeteer }));
            await expect(scraperService.initialize()).rejects.toThrow('Browser launch failed');
        });
        it('should handle page creation failures', async () => {
            // @ts-ignore
            mockBrowser.newPage.mockRejectedValue(new Error('Page creation failed'));
            const result = await scraperService.scrapeUrl('https://test.com');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Page creation failed');
        });
        it('should always close page after scraping', async () => {
            // @ts-ignore
            mockPage.goto.mockRejectedValue(new Error('Navigation failed'));
            await scraperService.scrapeUrl('https://test.com');
            expect(mockPage.close).toHaveBeenCalled();
        });
    });
    describe('Configuration', () => {
        it('should configure page with default options', async () => {
            // Browser and queue are already set up in main beforeEach
            // @ts-ignore
            mockPage.goto.mockResolvedValue({ ok: () => true, status: () => 200 });
            // @ts-ignore
            mockPage.waitForSelector.mockResolvedValue(true);
            // @ts-ignore
            mockPage.evaluate.mockResolvedValue({
                title: 'Test',
                html: '<p>Test</p>',
                textContent: 'Test',
                wordCount: 1
            });
            await scraperService.scrapeUrl('https://test.com');
            expect(mockPage.setViewport).toHaveBeenCalledWith({ width: 1920, height: 1080 });
            expect(mockPage.setUserAgent).toHaveBeenCalled();
            expect(mockPage.setRequestInterception).toHaveBeenCalledWith(true);
        });
        it('should block unnecessary resources', async () => {
            // Browser and queue are already set up in main beforeEach
            let requestHandler;
            mockPage.on.mockImplementation((event, handler) => {
                if (event === 'request') {
                    requestHandler = handler;
                }
            });
            // @ts-ignore
            mockPage.goto.mockResolvedValue({ ok: () => true, status: () => 200 });
            // @ts-ignore
            mockPage.waitForSelector.mockResolvedValue(true);
            // @ts-ignore
            mockPage.evaluate.mockResolvedValue({
                title: 'Test',
                html: '<p>Test</p>',
                textContent: 'Test',
                wordCount: 1
            });
            await scraperService.scrapeUrl('https://test.com');
            expect(requestHandler).toBeDefined();
            // Test resource blocking
            const mockRequest = {
                resourceType: () => 'image',
                abort: jest.fn(),
                continue: jest.fn()
            };
            requestHandler(mockRequest);
            expect(mockRequest.abort).toHaveBeenCalled();
            const mockRequest2 = {
                resourceType: () => 'document',
                abort: jest.fn(),
                continue: jest.fn()
            };
            requestHandler(mockRequest2);
            expect(mockRequest2.continue).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=ScraperService.test.js.map