import { Router } from 'express';
import { scrapingController } from '@/controllers/scraping.controller.js';
const router = Router();
/**
 * @route   POST /api/scraping/batch
 * @desc    Start batch scraping of multiple URLs
 * @access  Public
 */
router.post('/batch', scrapingController.startBatchScraping);
/**
 * @route   GET /api/scraping/batch/:id
 * @desc    Get batch scraping progress
 * @access  Public
 */
router.get('/batch/:id', scrapingController.getBatchProgress);
/**
 * @route   DELETE /api/scraping/batch/:id
 * @desc    Cancel batch scraping
 * @access  Public
 */
router.delete('/batch/:id', scrapingController.cancelBatch);
/**
 * @route   POST /api/scraping/batch/:batchId/save
 * @desc    Save batch scraping results to database
 * @access  Public
 */
router.post('/batch/:batchId/save', scrapingController.saveBatchResults);
/**
 * @route   POST /api/scraping/single
 * @desc    Scrape a single URL
 * @access  Public
 */
router.post('/single', scrapingController.scrapeSingle);
/**
 * @route   GET /api/scraping/queue-status
 * @desc    Get scraping queue status
 * @access  Public
 */
router.get('/queue-status', scrapingController.getQueueStatus);
/**
 * @route   POST /api/scraping/cleanup
 * @desc    Clean up completed batches
 * @access  Public
 */
router.post('/cleanup', scrapingController.cleanupBatches);
export default router;
//# sourceMappingURL=scraping.routes.js.map