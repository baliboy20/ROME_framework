import type { Request, Response } from 'express';
import { GmailService } from '@/services/GmailService.js';
import { StorageService } from '@/services/StorageService.js';
export declare class EmailController {
    private gmailService;
    private storageService;
    constructor(gmailService?: GmailService, storageService?: StorageService);
    /**
     * POST /api/emails/fetch
     * Fetch emails from Gmail with filtering options
     */
    fetchEmails: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/emails
     * List saved email digests
     */
    listEmails: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/emails/:id
     * Get specific email digest
     */
    getEmail: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/emails/:id/links
     * Get enriched links with metadata from specific email digest
     */
    getEmailLinks: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/emails/:id/links/select
     * Process selected links for scraping
     */
    processSelectedLinks: (req: Request, res: Response) => Promise<void>;
    private enrichLinksWithMetadata;
    private groupLinksByDomain;
    private categorizeLink;
    private generateDisplayTitle;
    private estimateReadTime;
    /**
     * GET /api/emails/saved-articles
     * List all saved markdown articles
     */
    listSavedArticles: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/emails/saved-articles/:filename
     * Get content of a specific saved article
     */
    getSavedArticle: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/emails/saved-articles/:filename
     * Delete a specific saved article
     */
    deleteSavedArticle: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/emails/stats
     * Get email processing statistics
     */
    getEmailStats: (req: Request, res: Response) => Promise<void>;
    private handleError;
}
export declare const emailController: EmailController;
//# sourceMappingURL=email.controller.d.ts.map