import { StorageService } from '@/services/StorageService.js';
export class ArticlesController {
    storageService;
    constructor(storageService) {
        this.storageService = storageService || new StorageService();
    }
    /**
     * GET /api/articles
     * List articles with filtering and pagination
     */
    listArticles = async (req, res) => {
        try {
            const query = {};
            console.log('[ArticlesController] Received query params:', req.query);
            // Filtering
            if (req.query.category) {
                query.category = req.query.category;
            }
            if (req.query.keywords) {
                const keywords = Array.isArray(req.query.keywords)
                    ? req.query.keywords
                    : req.query.keywords.split(',');
                query.keywords = keywords;
            }
            if (req.query.status) {
                query.status = req.query.status;
            }
            if (req.query.startDate || req.query.endDate) {
                query.dateRange = {
                    start: req.query.startDate ? new Date(req.query.startDate) : new Date(0),
                    end: req.query.endDate ? new Date(req.query.endDate) : new Date()
                };
            }
            // Pagination
            query.limit = req.query.limit ? parseInt(req.query.limit) : 50;
            query.skip = req.query.skip ? parseInt(req.query.skip) : 0;
            console.log('[ArticlesController] Query object:', query);
            const articles = await this.storageService.getArticles(query);
            console.log(`[ArticlesController] Found ${articles.length} articles`);
            // Transform _id to id for frontend compatibility
            const transformedArticles = articles.map(article => {
                const transformed = {
                    ...article,
                    id: article._id?.toString(),
                    _id: undefined,
                    // Ensure dates are serialized properly
                    emailDate: article.emailDate?.toISOString(),
                    scrapedAt: article.scrapedAt?.toISOString(),
                    lastUpdated: article.lastUpdated?.toISOString(),
                    sourceEmail: {
                        ...article.sourceEmail,
                        date: article.sourceEmail?.date?.toISOString()
                    },
                    // Ensure all required fields are present with defaults
                    wordCount: article.wordCount || 0,
                    readingTime: article.readingTime || '0 min read',
                    category: article.category || 'general',
                    keywords: article.keywords || [],
                    tags: article.tags || [],
                    status: article.status || 'scraped',
                    filePath: article.filePath || '',
                    content: article.content || '',
                    url: article.url || '',
                    title: article.title || 'Untitled'
                };
                // Remove undefined fields
                Object.keys(transformed).forEach(key => {
                    if (transformed[key] === undefined) {
                        delete transformed[key];
                    }
                });
                return transformed;
            });
            res.json({
                success: true,
                articles: transformedArticles,
                total: transformedArticles.length,
                pagination: {
                    limit: query.limit,
                    skip: query.skip,
                    hasMore: articles.length === query.limit
                },
                filters: {
                    category: query.category,
                    keywords: query.keywords,
                    status: query.status,
                    dateRange: query.dateRange
                }
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * GET /api/articles/:id
     * Get specific article
     */
    getArticle = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'Missing article ID',
                    code: 'MISSING_ID',
                    message: 'Article ID is required'
                });
                return;
            }
            const article = await this.storageService.getArticleById(id);
            if (!article) {
                res.status(404).json({
                    error: 'Article not found',
                    code: 'ARTICLE_NOT_FOUND',
                    message: `Article with ID ${id} not found`
                });
                return;
            }
            res.json({
                success: true,
                article
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * GET /api/articles/:id/content
     * Get article content (markdown and HTML)
     */
    getArticleContent = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'Missing article ID',
                    code: 'MISSING_ID',
                    message: 'Article ID is required'
                });
                return;
            }
            const content = await this.storageService.getArticleContent(id);
            if (!content) {
                res.status(404).json({
                    error: 'Article content not found',
                    code: 'CONTENT_NOT_FOUND',
                    message: `Content for article ${id} not found`
                });
                return;
            }
            // Set content type based on query parameter
            const format = req.query.format;
            if (format === 'html' && content.html) {
                res.set('Content-Type', 'text/html');
                res.send(content.html);
                return;
            }
            if (format === 'markdown' || !format) {
                res.set('Content-Type', 'text/markdown');
                res.send(content.markdown);
                return;
            }
            // Return both formats as JSON
            res.json({
                success: true,
                content
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * PUT /api/articles/:id
     * Update article
     */
    updateArticle = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'Missing article ID',
                    code: 'MISSING_ID',
                    message: 'Article ID is required'
                });
                return;
            }
            const updates = req.body;
            // Remove fields that shouldn't be updated directly
            delete updates._id;
            delete updates.urlHash;
            delete updates.scrapedAt;
            delete updates.sourceEmail;
            const success = await this.storageService.updateArticle(id, updates);
            if (!success) {
                res.status(404).json({
                    error: 'Article not found',
                    code: 'ARTICLE_NOT_FOUND',
                    message: `Article with ID ${id} not found`
                });
                return;
            }
            res.json({
                success: true,
                message: 'Article updated successfully'
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * DELETE /api/articles/:id
     * Delete article
     */
    deleteArticle = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'Missing article ID',
                    code: 'MISSING_ID',
                    message: 'Article ID is required'
                });
                return;
            }
            const success = await this.storageService.deleteArticle(id);
            if (!success) {
                res.status(404).json({
                    error: 'Article not found',
                    code: 'ARTICLE_NOT_FOUND',
                    message: `Article with ID ${id} not found`
                });
                return;
            }
            res.json({
                success: true,
                message: 'Article deleted successfully'
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * GET /api/articles/stats
     * Get articles statistics
     */
    getArticleStats = async (req, res) => {
        try {
            const stats = await this.storageService.getStorageStats();
            // Get category breakdown
            const categoryStats = await this.getCategoryBreakdown();
            res.json({
                success: true,
                stats: {
                    totalArticles: stats.articles,
                    totalEmails: stats.emailDigests,
                    storageUsed: stats.diskUsage,
                    totalFileSize: stats.totalFileSize,
                    categories: categoryStats
                }
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * GET /api/articles/files
     * List article files
     */
    listArticleFiles = async (req, res) => {
        try {
            const files = await this.storageService.listArticleFiles();
            res.json({
                success: true,
                files,
                total: files.length
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * POST /api/articles/search
     * Search articles by content
     */
    searchArticles = async (req, res) => {
        try {
            const { query: searchQuery, categories, keywords, limit = 50, skip = 0 } = req.body;
            if (!searchQuery || typeof searchQuery !== 'string') {
                res.status(400).json({
                    error: 'Invalid search query',
                    code: 'INVALID_QUERY',
                    message: 'Search query is required and must be a string'
                });
                return;
            }
            // Build search filters
            const filters = { limit, skip };
            if (categories && Array.isArray(categories)) {
                // For now, we'll search by category. In production, you'd use text search
                filters.category = categories[0]; // Simple implementation
            }
            if (keywords && Array.isArray(keywords)) {
                filters.keywords = keywords;
            }
            const articles = await this.storageService.getArticles(filters);
            // Simple text search in title and content (in production, use MongoDB text search)
            const searchResults = articles.filter(article => article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.content.toLowerCase().includes(searchQuery.toLowerCase()));
            res.json({
                success: true,
                articles: searchResults,
                total: searchResults.length,
                query: searchQuery,
                message: `Found ${searchResults.length} articles matching "${searchQuery}"`
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    async getCategoryBreakdown() {
        try {
            // This is a simplified implementation
            // In production, you'd use MongoDB aggregation
            const allArticles = await this.storageService.getArticles({ limit: 10000 });
            const categoryCount = {};
            allArticles.forEach(article => {
                categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
            });
            return categoryCount;
        }
        catch (error) {
            console.error('[ArticlesController] Error getting category breakdown:', error);
            return {};
        }
    }
    handleError(error, res) {
        console.error('[ArticlesController] Error:', error);
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        res.status(status).json({
            error: 'Article operation failed',
            message,
            code: error.code || 'ARTICLE_ERROR'
        });
    }
}
export const articlesController = new ArticlesController();
//# sourceMappingURL=articles.controller.js.map