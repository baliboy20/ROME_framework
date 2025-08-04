import type { Request, Response } from 'express';
import { StorageService } from '@/services/StorageService.js';
export declare class ArticlesController {
    private storageService;
    constructor(storageService?: StorageService);
    /**
     * GET /api/articles
     * List articles with filtering and pagination
     */
    listArticles: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/articles/:id
     * Get specific article
     */
    getArticle: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/articles/:id/content
     * Get article content (markdown and HTML)
     */
    getArticleContent: (req: Request, res: Response) => Promise<void>;
    /**
     * PUT /api/articles/:id
     * Update article
     */
    updateArticle: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/articles/:id
     * Delete article
     */
    deleteArticle: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/articles/stats
     * Get articles statistics
     */
    getArticleStats: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/articles/files
     * List article files
     */
    listArticleFiles: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/articles/search
     * Search articles by content
     */
    searchArticles: (req: Request, res: Response) => Promise<void>;
    private getCategoryBreakdown;
    private handleError;
}
export declare const articlesController: ArticlesController;
//# sourceMappingURL=articles.controller.d.ts.map