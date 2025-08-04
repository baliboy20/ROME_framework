import { ScraperService } from '@/services/ScraperService.js';
import { StorageService } from '@/services/StorageService.js';
export class ScrapingController {
    scraperService;
    storageService;
    constructor(scraperService, storageService) {
        this.scraperService = scraperService || new ScraperService();
        this.storageService = storageService || new StorageService();
    }
    /**
     * POST /api/scraping/batch
     * Start batch scraping of multiple URLs
     */
    startBatchScraping = async (req, res) => {
        try {
            const { urls, options = {}, saveToDatabase = true } = req.body;
            if (!Array.isArray(urls) || urls.length === 0) {
                res.status(400).json({
                    error: 'Invalid request',
                    code: 'INVALID_URLS',
                    message: 'URLs array is required and must not be empty'
                });
                return;
            }
            if (urls.length > 100) {
                res.status(400).json({
                    error: 'Too many URLs',
                    code: 'URL_LIMIT_EXCEEDED',
                    message: 'Maximum 100 URLs allowed per batch'
                });
                return;
            }
            const scrapingOptions = {
                timeout: options.timeout || 30000,
                waitUntil: options.waitUntil || 'networkidle2',
                javascript: options.javascript !== false,
                extractImages: options.extractImages || false,
                ...options
            };
            console.log(`[ScrapingController] Starting batch scraping of ${urls.length} URLs`);
            const batchId = await this.scraperService.scrapeMultiple(urls, scrapingOptions);
            // If saveToDatabase is true, set up auto-save when batch completes
            if (saveToDatabase) {
                this.setupAutoSave(batchId, {
                    messageId: `batch-${batchId}`,
                    subject: 'Scraped Articles from Links',
                    date: new Date()
                });
            }
            res.json({
                success: true,
                batchId,
                totalUrls: urls.length,
                message: 'Batch scraping started successfully'
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * GET /api/scraping/batch/:id
     * Get batch scraping progress
     */
    getBatchProgress = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'Missing batch ID',
                    code: 'MISSING_ID',
                    message: 'Batch ID is required'
                });
                return;
            }
            const progress = this.scraperService.getBatchProgress(id);
            if (!progress) {
                res.status(404).json({
                    error: 'Batch not found',
                    code: 'BATCH_NOT_FOUND',
                    message: `Scraping batch with ID ${id} not found`
                });
                return;
            }
            // Calculate progress percentage
            const progressPercentage = Math.round(((progress.completed + progress.failed) / progress.total) * 100);
            res.json({
                success: true,
                batch: {
                    ...progress,
                    progressPercentage,
                    isComplete: progress.status === 'completed' || progress.status === 'failed'
                }
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * DELETE /api/scraping/batch/:id
     * Cancel batch scraping
     */
    cancelBatch = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'Missing batch ID',
                    code: 'MISSING_ID',
                    message: 'Batch ID is required'
                });
                return;
            }
            const cancelled = this.scraperService.cancelBatch(id);
            if (!cancelled) {
                res.status(404).json({
                    error: 'Cannot cancel batch',
                    code: 'BATCH_NOT_CANCELLABLE',
                    message: 'Batch not found or already completed'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Batch scraping cancelled successfully'
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * POST /api/scraping/single
     * Scrape a single URL
     */
    scrapeSingle = async (req, res) => {
        try {
            const { url, options = {}, saveToDatabase = true } = req.body;
            if (!url || typeof url !== 'string') {
                res.status(400).json({
                    error: 'Invalid request',
                    code: 'INVALID_URL',
                    message: 'URL is required and must be a string'
                });
                return;
            }
            const scrapingOptions = {
                timeout: options.timeout || 30000,
                waitUntil: options.waitUntil || 'networkidle2',
                javascript: options.javascript !== false,
                extractImages: options.extractImages || false,
                ...options
            };
            console.log(`[ScrapingController] Scraping single URL: ${url}`);
            const result = await this.scraperService.scrapeUrl(url, scrapingOptions);
            if (!result.success) {
                res.status(400).json({
                    error: 'Scraping failed',
                    code: 'SCRAPING_ERROR',
                    message: result.error || 'Failed to scrape URL',
                    processingTime: result.processingTime
                });
                return;
            }
            let articleId;
            if (saveToDatabase && result.content) {
                try {
                    // Save to database with minimal email info
                    const { articleId: id } = await this.storageService.saveArticle(result.content, {
                        messageId: 'manual-scrape',
                        subject: 'Manual Scrape',
                        date: new Date()
                    });
                    articleId = id;
                }
                catch (error) {
                    console.error('[ScrapingController] Error saving article:', error);
                }
            }
            res.json({
                success: true,
                content: result.content,
                articleId,
                processingTime: result.processingTime,
                message: 'URL scraped successfully'
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * POST /api/scraping/save-results/:batchId
     * Save batch scraping results to database
     */
    saveBatchResults = async (req, res) => {
        try {
            const { batchId } = req.params;
            if (!batchId) {
                res.status(400).json({
                    error: 'Missing batch ID',
                    code: 'MISSING_ID',
                    message: 'Batch ID is required'
                });
                return;
            }
            const { emailInfo } = req.body;
            const progress = this.scraperService.getBatchProgress(batchId);
            if (!progress) {
                res.status(404).json({
                    error: 'Batch not found',
                    code: 'BATCH_NOT_FOUND',
                    message: `Scraping batch with ID ${batchId} not found`
                });
                return;
            }
            if (progress.status !== 'completed') {
                res.status(400).json({
                    error: 'Batch not completed',
                    code: 'BATCH_NOT_COMPLETED',
                    message: 'Cannot save results of incomplete batch'
                });
                return;
            }
            const savedArticles = [];
            const successfulResults = progress.results.filter(r => r.success && r.content);
            for (const result of successfulResults) {
                try {
                    const { articleId } = await this.storageService.saveArticle(result.content, emailInfo || {
                        messageId: `batch-${batchId}`,
                        subject: 'Batch Scraping',
                        date: new Date()
                    });
                    savedArticles.push(articleId);
                }
                catch (error) {
                    console.error('[ScrapingController] Error saving article:', error);
                }
            }
            res.json({
                success: true,
                savedArticles: savedArticles.length,
                totalResults: successfulResults.length,
                articleIds: savedArticles,
                message: `Saved ${savedArticles.length} articles to database`
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * GET /api/scraping/queue-status
     * Get scraping queue status
     */
    getQueueStatus = async (req, res) => {
        try {
            const queueStatus = this.scraperService.getQueueStatus();
            res.json({
                success: true,
                queue: queueStatus
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * POST /api/scraping/cleanup
     * Clean up completed batches
     */
    cleanupBatches = async (req, res) => {
        try {
            this.scraperService.clearCompletedBatches();
            res.json({
                success: true,
                message: 'Completed batches cleaned up successfully'
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Set up automatic saving of batch results when scraping completes
     */
    setupAutoSave(batchId, emailInfo) {
        // Poll for batch completion and auto-save results
        const checkInterval = setInterval(async () => {
            try {
                const progress = this.scraperService.getBatchProgress(batchId);
                if (!progress || progress.status === 'cancelled') {
                    clearInterval(checkInterval);
                    return;
                }
                if (progress.status === 'completed' || progress.status === 'failed') {
                    clearInterval(checkInterval);
                    if (progress.status === 'completed') {
                        console.log(`[ScrapingController] Auto-saving results for batch ${batchId}`);
                        const savedArticles = [];
                        const successfulResults = progress.results.filter(r => r.success && r.content);
                        for (const result of successfulResults) {
                            try {
                                const { articleId } = await this.storageService.saveArticle(result.content, emailInfo);
                                savedArticles.push(articleId);
                            }
                            catch (error) {
                                console.error('[ScrapingController] Error auto-saving article:', error);
                            }
                        }
                        console.log(`[ScrapingController] Auto-saved ${savedArticles.length} articles from batch ${batchId}`);
                    }
                }
            }
            catch (error) {
                console.error(`[ScrapingController] Error in auto-save for batch ${batchId}:`, error);
                clearInterval(checkInterval);
            }
        }, 5000); // Check every 5 seconds
        // Clean up after 30 minutes to prevent memory leaks
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 30 * 60 * 1000);
    }
    handleError(error, res) {
        console.error('[ScrapingController] Error:', error);
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        res.status(status).json({
            error: 'Scraping operation failed',
            message,
            code: error.code || 'SCRAPING_ERROR'
        });
    }
}
export const scrapingController = new ScrapingController();
//# sourceMappingURL=scraping.controller.js.map