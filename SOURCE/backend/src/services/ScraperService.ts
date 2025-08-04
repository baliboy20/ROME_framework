import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import PQueue from 'p-queue';
import crypto from 'crypto';
import type { 
  ScrapedContent, 
  ScrapingOptions, 
  ScrapingResult, 
  BatchScrapingProgress 
} from '@/types/scraper.types.js';
import { appConfig } from '@/config/app.config.js';

export class ScraperService {
  private browser: Browser | null = null;
  private queue: PQueue;
  private turndownService: TurndownService;
  private userAgents: string[];
  private batchProgress: Map<string, BatchScrapingProgress> = new Map();

  constructor() {
    this.queue = new PQueue({
      concurrency: appConfig.maxConcurrentScrapes,
      interval: 1000,
      intervalCap: 10
    });

    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-'
    });

    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];

    this.setupTurndownService();
  }

  async initialize(): Promise<void> {
    if (this.browser) return;

    console.log('[ScraperService] Initializing Puppeteer browser...');
    
    this.browser = await puppeteer.launch({
      headless: 'new' as any,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    console.log('[ScraperService] Browser initialized successfully');
  }

  async shutdown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('[ScraperService] Browser closed');
    }
  }

  async scrapeUrl(url: string, options: ScrapingOptions = {}): Promise<ScrapingResult> {
    const startTime = Date.now();

    try {
      await this.initialize();
      
      const result = await this.queue.add(async () => {
        return await this.performScraping(url, options);
      });

      return {
        success: true,
        content: result || undefined,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error(`[ScraperService] Error scraping ${url}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
        processingTime: Date.now() - startTime
      };
    }
  }

  async scrapeMultiple(urls: string[], options: ScrapingOptions = {}): Promise<string> {
    const batchId = crypto.randomUUID();
    const progress: BatchScrapingProgress = {
      id: batchId,
      total: urls.length,
      completed: 0,
      failed: 0,
      status: 'running',
      startTime: new Date(),
      results: [],
      errors: []
    };

    this.batchProgress.set(batchId, progress);

    // Start scraping in background
    this.processBatch(batchId, urls, options);

    return batchId;
  }

  private async processBatch(batchId: string, urls: string[], options: ScrapingOptions): Promise<void> {
    const progress = this.batchProgress.get(batchId)!;
    
    try {
      await this.initialize();

      const promises = urls.map(url => 
        this.queue.add(async () => {
          const result = await this.scrapeUrl(url, options);
          
          if (result.success) {
            progress.completed++;
          } else {
            progress.failed++;
            progress.errors.push({
              url,
              error: result.error || 'Unknown error',
              timestamp: new Date()
            });
          }

          progress.results.push(result);
          
          // Update progress
          this.batchProgress.set(batchId, { ...progress });
          
          return result;
        })
      );

      await Promise.allSettled(promises);
      
      progress.status = 'completed';
      progress.endTime = new Date();
      this.batchProgress.set(batchId, progress);

      console.log(`[ScraperService] Batch ${batchId} completed: ${progress.completed} success, ${progress.failed} failed`);
    } catch (error) {
      progress.status = 'failed';
      progress.endTime = new Date();
      this.batchProgress.set(batchId, progress);
      
      console.error(`[ScraperService] Batch ${batchId} failed:`, error);
    }
  }

  getBatchProgress(batchId: string): BatchScrapingProgress | null {
    return this.batchProgress.get(batchId) || null;
  }

  cancelBatch(batchId: string): boolean {
    const progress = this.batchProgress.get(batchId);
    if (progress && progress.status === 'running') {
      progress.status = 'cancelled';
      progress.endTime = new Date();
      this.batchProgress.set(batchId, progress);
      return true;
    }
    return false;
  }

  private async performScraping(url: string, options: ScrapingOptions): Promise<ScrapedContent> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Configure page
      await this.configurePage(page, options);

      // Navigate to URL
      console.log(`[ScraperService] Navigating to ${url}`);
      const response = await page.goto(url, {
        waitUntil: options.waitUntil || 'networkidle2',
        timeout: options.timeout || appConfig.scrapeTimeout
      });

      if (!response || !response.ok()) {
        throw new Error(`HTTP ${response?.status()}: Failed to load page`);
      }

      // Wait for content to load
      await page.waitForSelector('article, [data-testid="storyContent"], main', { timeout: 10000 });

      // Extract content
      const extractedData = await page.evaluate(() => {
        // Remove unwanted elements
        const unwantedSelectors = [
          'nav', 'header', 'footer', '.sidebar', '.ad', '[data-ad]',
          '.navigation', '.social-share', '.related-articles',
          'script', 'style', '.comments', '.newsletter-signup'
        ];
        
        unwantedSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Get main article content
        const article = document.querySelector('article') || 
                      document.querySelector('[data-testid="storyContent"]') ||
                      document.querySelector('main') ||
                      document.querySelector('.post-content') ||
                      document.querySelector('.entry-content');

        if (!article) {
          throw new Error('Article content not found');
        }

        // Extract metadata
        const title = document.querySelector('h1')?.textContent ||
                     document.querySelector('title')?.textContent ||
                     '';

        const authorName = document.querySelector('[data-testid="authorName"]')?.textContent ||
                          document.querySelector('.author-name')?.textContent ||
                          document.querySelector('[rel="author"]')?.textContent ||
                          '';

        const authorUrl = document.querySelector('[data-testid="authorName"]')?.getAttribute('href') ||
                         document.querySelector('.author-link')?.getAttribute('href') ||
                         '';

        const authorAvatar = document.querySelector('.author-avatar img')?.getAttribute('src') ||
                           document.querySelector('[data-testid="authorAvatar"] img')?.getAttribute('src') ||
                           '';

        const publishDate = document.querySelector('time')?.getAttribute('datetime') ||
                          document.querySelector('.publish-date')?.textContent ||
                          document.querySelector('[data-testid="storyPublishDate"]')?.textContent ||
                          '';

        // Get clean HTML content
        const cleanHtml = article.innerHTML;
        
        // Calculate word count
        const textContent = article.textContent || '';
        const wordCount = textContent.trim().split(/\s+/).length;

        return {
          title: title.trim(),
          author: {
            name: authorName.trim() || undefined,
            url: authorUrl || undefined,
            avatar: authorAvatar || undefined
          },
          publishDate: publishDate || undefined,
          html: cleanHtml,
          textContent,
          wordCount
        };
      });

      // Convert to Markdown
      const markdown = this.turndownService.turndown(extractedData.html);

      // Extract keywords and categorize
      const keywords = this.extractKeywords(extractedData.textContent);
      const category = this.categorizeContent(url, extractedData.textContent, keywords);

      const scrapedContent: ScrapedContent = {
        url,
        title: extractedData.title,
        content: extractedData.textContent,
        markdown,
        rawHtml: extractedData.html,
        author: extractedData.author?.name ? {
          name: extractedData.author.name || undefined,
          url: extractedData.author.url || undefined,
          avatar: extractedData.author.avatar || undefined
        } : undefined,
        publishDate: extractedData.publishDate,
        wordCount: extractedData.wordCount,
        readingTime: this.calculateReadingTime(extractedData.wordCount),
        scrapedAt: new Date(),
        keywords,
        category
      };

      console.log(`[ScraperService] Successfully scraped: ${extractedData.title} (${extractedData.wordCount} words)`);
      return scrapedContent;

    } finally {
      await page.close();
    }
  }

  private async configurePage(page: Page, options: ScrapingOptions): Promise<void> {
    // Set viewport
    if (options.viewport) {
      await page.setViewport(options.viewport);
    } else {
      await page.setViewport({ width: 1920, height: 1080 });
    }

    // Set user agent
    const userAgent = options.userAgent || this.getRandomUserAgent();
    await page.setUserAgent(userAgent);

    // Disable JavaScript if requested
    if (options.javascript === false) {
      await page.setJavaScriptEnabled(false);
    }

    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      
      if (['image', 'stylesheet', 'font'].includes(resourceType) && !options.extractImages) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  private setupTurndownService(): void {
    // Configure turndown for better Markdown conversion
    this.turndownService.addRule('strikethrough', {
      filter: ['del', 's', 'strike' as any],
      replacement: (content) => `~~${content}~~`
    });

    this.turndownService.addRule('highlight', {
      filter: (node: any) => {
        return node.nodeName === 'MARK' || 
               (node.nodeName === 'SPAN' && node.getAttribute('style')?.includes('background'));
      },
      replacement: (content) => `==${content}==`
    });

    // Remove empty paragraphs
    this.turndownService.addRule('removeEmptyParagraphs', {
      filter: 'p',
      replacement: (content) => content.trim() ? `\n\n${content}\n\n` : ''
    });
  }

  private extractKeywords(content: string): string[] {
    const keywords: string[] = [];
    const lowerContent = content.toLowerCase();

    // Flutter/Dart specific keywords
    const flutterKeywords = [
      'flutter', 'dart', 'widget', 'stateful', 'stateless', 'riverpod', 'bloc',
      'provider', 'getx', 'firebase', 'android', 'ios', 'material', 'cupertino',
      'scaffold', 'appbar', 'container', 'column', 'row', 'stack', 'listview',
      'gridview', 'textfield', 'button', 'navigation', 'routing', 'animation',
      'http', 'json', 'api', 'database', 'sqflite', 'hive', 'shared_preferences'
    ];

    flutterKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return [...new Set(keywords)]; // Remove duplicates
  }

  private categorizeContent(
    url: string, 
    content: string, 
    keywords: string[]
  ): 'flutter' | 'dart' | 'mobile' | 'web' | 'general' {
    const lowerContent = content.toLowerCase();
    const lowerUrl = url.toLowerCase();

    if (keywords.includes('flutter') || lowerUrl.includes('flutter') || lowerContent.includes('flutter')) {
      return 'flutter';
    }

    if (keywords.includes('dart') || lowerUrl.includes('dart') || lowerContent.includes('dart')) {
      return 'dart';
    }

    if (lowerContent.includes('mobile') || lowerContent.includes('android') || lowerContent.includes('ios')) {
      return 'mobile';
    }

    if (lowerContent.includes('web') || lowerContent.includes('webapp') || lowerContent.includes('browser')) {
      return 'web';
    }

    return 'general';
  }

  private calculateReadingTime(wordCount: number): string {
    const wordsPerMinute = 200; // Average reading speed
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)] || 'Mozilla/5.0 (compatible)';
  }

  getQueueStatus(): { pending: number; running: number } {
    return {
      pending: this.queue.pending,
      running: this.queue.pending + this.queue.size
    };
  }

  clearCompletedBatches(): void {
    for (const [batchId, progress] of this.batchProgress.entries()) {
      if (progress.status === 'completed' || progress.status === 'failed') {
        this.batchProgress.delete(batchId);
      }
    }
  }
}