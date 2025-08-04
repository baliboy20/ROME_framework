import { Router } from 'express';
import type { Request, Response } from 'express';
import { articlesController } from '@/controllers/articles.controller.js';

const router = Router();

/**
 * @route   GET /api/articles
 * @desc    List articles with filtering and pagination
 * @access  Public
 */
router.get('/', articlesController.listArticles);

/**
 * @route   POST /api/articles/search
 * @desc    Search articles by content
 * @access  Public
 */
router.post('/search', articlesController.searchArticles);

/**
 * @route   GET /api/articles/stats
 * @desc    Get articles statistics
 * @access  Public
 */
router.get('/stats', articlesController.getArticleStats);

/**
 * @route   GET /api/articles/files
 * @desc    List article files
 * @access  Public
 */
router.get('/files', articlesController.listArticleFiles);

/**
 * @route   GET /api/articles/:id
 * @desc    Get specific article
 * @access  Public
 */
router.get('/:id', articlesController.getArticle);

/**
 * @route   GET /api/articles/:id/content
 * @desc    Get article content (markdown/HTML)
 * @access  Public
 */
router.get('/:id/content', articlesController.getArticleContent);

/**
 * @route   PUT /api/articles/:id
 * @desc    Update article
 * @access  Public
 */
router.put('/:id', articlesController.updateArticle);

/**
 * @route   DELETE /api/articles/:id
 * @desc    Delete article
 * @access  Public
 */
router.delete('/:id', articlesController.deleteArticle);

export default router;