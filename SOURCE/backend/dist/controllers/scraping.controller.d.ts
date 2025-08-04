import type { Request, Response } from 'express';
import { ScraperService } from '@/services/ScraperService.js';
import { StorageService } from '@/services/StorageService.js';
export declare class ScrapingController {
    private scraperService;
    private storageService;
    constructor(scraperService?: ScraperService, storageService?: StorageService);
    /**
     * POST /api/scraping/batch
     * Start batch scraping of multiple URLs
     */
    startBatchScraping: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/scraping/batch/:id
     * Get batch scraping progress
     */
    getBatchProgress: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/scraping/batch/:id
     * Cancel batch scraping
     */
    cancelBatch: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/scraping/single
     * Scrape a single URL
     */
    scrapeSingle: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/scraping/save-results/:batchId
     * Save batch scraping results to database
     */
    saveBatchResults: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/scraping/queue-status
     * Get scraping queue status
     */
    getQueueStatus: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/scraping/cleanup
     * Clean up completed batches
     */
    cleanupBatches: (req: Request, res: Response) => Promise<void>;
    /**
     * Set up automatic saving of batch results when scraping completes
     */
    private setupAutoSave;
    private handleError;
}
export declare const scrapingController: ScrapingController;
//# sourceMappingURL=scraping.controller.d.ts.map