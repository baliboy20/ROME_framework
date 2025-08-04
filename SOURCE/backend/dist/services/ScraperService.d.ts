import type { ScrapingOptions, ScrapingResult, BatchScrapingProgress } from '@/types/scraper.types.js';
export declare class ScraperService {
    private browser;
    private queue;
    private turndownService;
    private userAgents;
    private batchProgress;
    constructor();
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    scrapeUrl(url: string, options?: ScrapingOptions): Promise<ScrapingResult>;
    scrapeMultiple(urls: string[], options?: ScrapingOptions): Promise<string>;
    private processBatch;
    getBatchProgress(batchId: string): BatchScrapingProgress | null;
    cancelBatch(batchId: string): boolean;
    private performScraping;
    private configurePage;
    private setupTurndownService;
    private extractKeywords;
    private categorizeContent;
    private calculateReadingTime;
    private getRandomUserAgent;
    getQueueStatus(): {
        pending: number;
        running: number;
    };
    clearCompletedBatches(): void;
}
//# sourceMappingURL=ScraperService.d.ts.map