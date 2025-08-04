import { Router } from 'express';
import { emailController } from '@/controllers/email.controller.js';
const router = Router();
/**
 * @route   POST /api/emails/fetch
 * @desc    Fetch emails from Gmail with filtering
 * @access  Public
 */
router.post('/fetch', emailController.fetchEmails);
/**
 * @route   GET /api/emails
 * @desc    List saved email digests
 * @access  Public
 */
router.get('/', emailController.listEmails);
/**
 * @route   GET /api/emails/stats
 * @desc    Get email processing statistics
 * @access  Public
 */
router.get('/stats', emailController.getEmailStats);
/**
 * @route   GET /api/emails/saved-articles
 * @desc    List all saved markdown articles
 * @access  Public
 */
router.get('/saved-articles', emailController.listSavedArticles);
/**
 * @route   GET /api/emails/saved-articles/:filename
 * @desc    Get content of a specific saved article
 * @access  Public
 */
router.get('/saved-articles/:filename', emailController.getSavedArticle);
/**
 * @route   DELETE /api/emails/saved-articles/:filename
 * @desc    Delete a specific saved article
 * @access  Public
 */
router.delete('/saved-articles/:filename', emailController.deleteSavedArticle);
/**
 * @route   GET /api/emails/:id
 * @desc    Get specific email digest
 * @access  Public
 */
router.get('/:id', emailController.getEmail);
/**
 * @route   GET /api/emails/:id/links
 * @desc    Get enriched links with metadata from specific email digest
 * @access  Public
 */
router.get('/:id/links', emailController.getEmailLinks);
/**
 * @route   POST /api/emails/:id/links/select
 * @desc    Process selected links for scraping
 * @access  Public
 */
router.post('/:id/links/select', emailController.processSelectedLinks);
export default router;
//# sourceMappingURL=email.routes.js.map