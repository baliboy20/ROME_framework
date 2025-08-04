import { GmailService } from '@/services/GmailService.js';
import { StorageService } from '@/services/StorageService.js';
import { scrapingService } from '@/services/ScrapingService.js';
import { fileSystemService } from '@/services/FileSystemService.js';
export class EmailController {
    gmailService;
    storageService;
    constructor(gmailService, storageService) {
        this.gmailService = gmailService || new GmailService();
        this.storageService = storageService || new StorageService();
    }
    /**
     * POST /api/emails/fetch
     * Fetch emails from Gmail with filtering options
     */
    fetchEmails = async (req, res) => {
        const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`\n🚀 [EmailController::fetchEmails] [${requestId}] Starting email fetch operation`);
        console.log(`📝 [EmailController::fetchEmails] [${requestId}] Raw request body:`, JSON.stringify(req.body, null, 2));
        try {
            // Step 1: Initialize request parameters
            console.log(`⚙️  [EmailController::fetchEmails] [${requestId}] Step 1: Initializing request parameters`);
            const userId = req.userId || 'default-user';
            console.log(`👤 [EmailController::fetchEmails] [${requestId}] Using userId: ${userId}`);
            // Process date range
            let dateRange;
            if (req.body.startDate && req.body.endDate) {
                dateRange = {
                    start: new Date(req.body.startDate),
                    end: new Date(req.body.endDate)
                };
                console.log(`📅 [EmailController::fetchEmails] [${requestId}] Using provided date range: ${dateRange.start.toISOString()} to ${dateRange.end.toISOString()}`);
            }
            else {
                dateRange = {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                    end: new Date()
                };
                console.log(`📅 [EmailController::fetchEmails] [${requestId}] Using default date range (last 30 days): ${dateRange.start.toISOString()} to ${dateRange.end.toISOString()}`);
            }
            // Process filter options
            const filterOptions = {
                subject: req.body.subjects?.[0] || req.body.subject || 'Medium Daily Digest',
                dateRange,
                keywords: Array.isArray(req.body.keywords) ? req.body.keywords : (req.body.keywords ? [req.body.keywords] : []),
                maxResults: req.body.maxResults || 50
            };
            console.log(`🔍 [EmailController::fetchEmails] [${requestId}] Final filter options:`, JSON.stringify(filterOptions, null, 2));
            // Step 2: Initialize services
            console.log(`⚙️  [EmailController::fetchEmails] [${requestId}] Step 2: Initializing services`);
            console.log(`📧 [EmailController::fetchEmails] [${requestId}] Gmail service initialized: ${!!this.gmailService}`);
            console.log(`💾 [EmailController::fetchEmails] [${requestId}] Storage service initialized: ${!!this.storageService}`);
            // Step 3: Fetch emails from Gmail
            console.log(`⚙️  [EmailController::fetchEmails] [${requestId}] Step 3: Fetching emails from Gmail API`);
            const fetchStartTime = Date.now();
            let processedEmails;
            try {
                processedEmails = await this.gmailService.fetchDigests(userId, filterOptions);
                const fetchDuration = Date.now() - fetchStartTime;
                console.log(`✅ [EmailController::fetchEmails] [${requestId}] Gmail fetch completed in ${fetchDuration}ms`);
                console.log(`📊 [EmailController::fetchEmails] [${requestId}] Retrieved ${processedEmails.length} emails from Gmail`);
            }
            catch (gmailError) {
                const fetchDuration = Date.now() - fetchStartTime;
                console.error(`❌ [EmailController::fetchEmails] [${requestId}] Gmail fetch failed after ${fetchDuration}ms`);
                console.error(`❌ [EmailController::fetchEmails] [${requestId}] Gmail error details:`, {
                    message: gmailError.message,
                    stack: gmailError.stack,
                    code: gmailError.code,
                    status: gmailError.status,
                    name: gmailError.name
                });
                throw gmailError;
            }
            // Step 4: Process and save emails
            console.log(`⚙️  [EmailController::fetchEmails] [${requestId}] Step 4: Processing and saving emails to database`);
            const savedEmails = [];
            const saveErrors = [];
            for (let i = 0; i < processedEmails.length; i++) {
                const email = processedEmails[i];
                if (!email)
                    continue; // Skip if email is undefined
                console.log(`📝 [EmailController::fetchEmails] [${requestId}] Processing email ${i + 1}/${processedEmails.length}: ${email.messageId}`);
                console.log(`📧 [EmailController::fetchEmails] [${requestId}] Email details - Subject: "${email.subject}", Date: ${email.date}, Links: ${email.links?.linksFound || 0}`);
                try {
                    const saveStartTime = Date.now();
                    const digestData = {
                        messageId: email.messageId,
                        subject: email.subject,
                        date: email.date,
                        processedAt: new Date(),
                        sender: email.sender,
                        bodyPreview: email.bodyPreview || '',
                        htmlContent: email.htmlContent || '',
                        markdownContent: email.markdownContent || '',
                        linksFound: email.links?.linksFound || 0,
                        flutterLinks: email.links?.flutterLinks || [],
                        allLinks: email.links?.allLinks || [],
                        linksByDomain: email.links?.linksByDomain || {},
                        status: 'processed',
                        articles: [],
                        retryCount: 0,
                        matchedFilters: ['flutter-digest']
                    };
                    console.log(`💾 [EmailController::fetchEmails] [${requestId}] Saving email digest for: ${email.messageId}`);
                    const digestId = await this.storageService.saveEmailDigest(digestData);
                    const saveDuration = Date.now() - saveStartTime;
                    console.log(`✅ [EmailController::fetchEmails] [${requestId}] Email digest saved successfully in ${saveDuration}ms with ID: ${digestId}`);
                    savedEmails.push({
                        _id: digestId,
                        ...email
                    });
                }
                catch (saveError) {
                    console.error(`❌ [EmailController::fetchEmails] [${requestId}] Error saving email digest ${email.messageId}`);
                    console.error(`❌ [EmailController::fetchEmails] [${requestId}] Save error details:`, {
                        message: saveError.message,
                        stack: saveError.stack,
                        code: saveError.code,
                        name: saveError.name,
                        emailId: email.messageId
                    });
                    saveErrors.push({
                        emailId: email.messageId,
                        error: saveError.message
                    });
                }
            }
            // Step 5: Compile results
            console.log(`⚙️  [EmailController::fetchEmails] [${requestId}] Step 5: Compiling results`);
            console.log(`📊 [EmailController::fetchEmails] [${requestId}] Final results:`);
            console.log(`   - Total emails fetched: ${processedEmails.length}`);
            console.log(`   - Successfully saved: ${savedEmails.length}`);
            console.log(`   - Save errors: ${saveErrors.length}`);
            if (saveErrors.length > 0) {
                console.warn(`⚠️  [EmailController::fetchEmails] [${requestId}] Some emails failed to save:`, saveErrors);
            }
            const response = {
                success: true,
                emails: savedEmails,
                total: savedEmails.length,
                message: `Fetched ${savedEmails.length} emails successfully`,
                ...(saveErrors.length > 0 && {
                    warnings: `${saveErrors.length} emails failed to save`,
                    saveErrors
                })
            };
            console.log(`🎉 [EmailController::fetchEmails] [${requestId}] Operation completed successfully`);
            console.log(`📤 [EmailController::fetchEmails] [${requestId}] Sending response:`, JSON.stringify(response, null, 2));
            res.json(response);
        }
        catch (error) {
            console.error(`💥 [EmailController::fetchEmails] [${requestId}] Fatal error in fetchEmails operation`);
            console.error(`💥 [EmailController::fetchEmails] [${requestId}] Error details:`, {
                message: error.message,
                stack: error.stack,
                code: error.code,
                status: error.status,
                name: error.name,
                cause: error.cause
            });
            this.handleError(error, res, requestId);
        }
    };
    /**
     * GET /api/emails
     * List saved email digests
     */
    listEmails = async (req, res) => {
        try {
            const query = {};
            if (req.query.status) {
                query.status = req.query.status;
            }
            if (req.query.startDate || req.query.endDate) {
                query.dateRange = {
                    start: req.query.startDate ? new Date(req.query.startDate) : new Date(0),
                    end: req.query.endDate ? new Date(req.query.endDate) : new Date()
                };
            }
            query.limit = req.query.limit ? parseInt(req.query.limit) : 50;
            query.skip = req.query.skip ? parseInt(req.query.skip) : 0;
            const emails = await this.storageService.getEmailDigests(query);
            res.json({
                success: true,
                emails,
                total: emails.length,
                pagination: {
                    limit: query.limit,
                    skip: query.skip
                }
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * GET /api/emails/:id
     * Get specific email digest
     */
    getEmail = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'Missing email ID',
                    code: 'MISSING_ID',
                    message: 'Email ID is required'
                });
                return;
            }
            const email = await this.storageService.getEmailDigestById(id);
            if (!email) {
                res.status(404).json({
                    error: 'Email not found',
                    code: 'EMAIL_NOT_FOUND',
                    message: `Email digest with ID ${id} not found`
                });
                return;
            }
            res.json({
                success: true,
                email
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * GET /api/emails/:id/links
     * Get enriched links with metadata from specific email digest
     */
    getEmailLinks = async (req, res) => {
        const requestId = `LINKS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`\n🔗 [EmailController::getEmailLinks] [${requestId}] Starting link enrichment operation`);
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'Missing email ID',
                    code: 'MISSING_ID',
                    message: 'Email ID is required'
                });
                return;
            }
            console.log(`📧 [EmailController::getEmailLinks] [${requestId}] Fetching email with ID: ${id}`);
            const email = await this.storageService.getEmailDigestById(id);
            if (!email) {
                console.warn(`⚠️  [EmailController::getEmailLinks] [${requestId}] Email not found: ${id}`);
                res.status(404).json({
                    error: 'Email not found',
                    code: 'EMAIL_NOT_FOUND',
                    message: `Email digest with ID ${id} not found`
                });
                return;
            }
            console.log(`✅ [EmailController::getEmailLinks] [${requestId}] Email found, enriching ${email.allLinks?.length || 0} links`);
            // Enrich links with metadata
            const enrichedLinks = this.enrichLinksWithMetadata(email.allLinks || [], email.flutterLinks || [], requestId);
            const linksByDomain = this.groupLinksByDomain(enrichedLinks, requestId);
            const response = {
                success: true,
                emailId: id,
                emailSubject: email.subject,
                links: {
                    total: enrichedLinks.length,
                    enrichedLinks,
                    flutterLinksCount: email.flutterLinks?.length || 0,
                    linksByDomain,
                    summary: {
                        totalDomains: Object.keys(linksByDomain).length,
                        flutterDomains: Object.keys(linksByDomain).filter(domain => linksByDomain[domain]?.some((link) => link.isFlutterRelated)).length
                    }
                }
            };
            console.log(`🎉 [EmailController::getEmailLinks] [${requestId}] Link enrichment completed successfully`);
            console.log(`📊 [EmailController::getEmailLinks] [${requestId}] Response summary:`, {
                totalLinks: enrichedLinks.length,
                flutterLinks: email.flutterLinks?.length || 0,
                domains: Object.keys(linksByDomain).length
            });
            res.json(response);
        }
        catch (error) {
            console.error(`💥 [EmailController::getEmailLinks] [${requestId}] Fatal error:`, error);
            this.handleError(error, res, requestId);
        }
    };
    /**
     * POST /api/emails/:id/links/select
     * Process selected links for scraping
     */
    processSelectedLinks = async (req, res) => {
        const requestId = `PROCESS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`\n🚀 [EmailController::processSelectedLinks] [${requestId}] Starting selected links processing`);
        try {
            const { id } = req.params;
            const { selectedLinks, options } = req.body;
            if (!id) {
                res.status(400).json({
                    error: 'Missing email ID',
                    code: 'MISSING_ID',
                    message: 'Email ID is required'
                });
                return;
            }
            if (!selectedLinks || !Array.isArray(selectedLinks) || selectedLinks.length === 0) {
                res.status(400).json({
                    error: 'Invalid selected links',
                    code: 'INVALID_LINKS',
                    message: 'selectedLinks must be a non-empty array of URLs'
                });
                return;
            }
            console.log(`📝 [EmailController::processSelectedLinks] [${requestId}] Processing ${selectedLinks.length} selected links`);
            console.log(`⚙️  [EmailController::processSelectedLinks] [${requestId}] Processing options:`, options);
            // Validate that the email exists
            const email = await this.storageService.getEmailDigestById(id);
            if (!email) {
                res.status(404).json({
                    error: 'Email not found',
                    code: 'EMAIL_NOT_FOUND',
                    message: `Email digest with ID ${id} not found`
                });
                return;
            }
            // Validate that all selected links exist in the email
            const emailLinks = email.allLinks || [];
            const invalidLinks = selectedLinks.filter(link => !emailLinks.includes(link));
            if (invalidLinks.length > 0) {
                console.warn(`⚠️  [EmailController::processSelectedLinks] [${requestId}] Invalid links detected:`, invalidLinks);
                res.status(400).json({
                    error: 'Invalid links selected',
                    code: 'INVALID_LINK_SELECTION',
                    message: `Some selected links are not from this email`,
                    invalidLinks
                });
                return;
            }
            // Initialize services
            await fileSystemService.initialize();
            // Process selected links for scraping
            console.log(`🚀 [EmailController::processSelectedLinks] [${requestId}] Starting scraping process...`);
            const scrapingResults = [];
            const savedFiles = [];
            const errors = [];
            // Scrape each selected link
            for (let i = 0; i < selectedLinks.length; i++) {
                const url = selectedLinks[i];
                console.log(`\n🔄 [EmailController::processSelectedLinks] [${requestId}] Processing link ${i + 1}/${selectedLinks.length}: ${url}`);
                try {
                    // Scrape the URL
                    const scrapedContent = await scrapingService.scrapeUrl(url, {
                        timeout: 45000,
                        extractImages: true
                    });
                    if (scrapedContent.success) {
                        console.log(`✅ [EmailController::processSelectedLinks] [${requestId}] Successfully scraped: ${scrapedContent.title}`);
                        // Save to file system
                        const savedFile = await fileSystemService.saveMarkdownFile(scrapedContent.markdown, {
                            url: scrapedContent.url,
                            title: scrapedContent.title,
                            domain: scrapedContent.domain,
                            emailId: id,
                            date: new Date()
                        });
                        scrapingResults.push({
                            url,
                            success: true,
                            title: scrapedContent.title,
                            wordCount: scrapedContent.wordCount,
                            readingTime: scrapedContent.readingTime,
                            filepath: savedFile.filepath
                        });
                        savedFiles.push(savedFile);
                    }
                    else {
                        console.error(`❌ [EmailController::processSelectedLinks] [${requestId}] Failed to scrape: ${url}`);
                        errors.push({
                            url,
                            error: scrapedContent.error || 'Unknown error'
                        });
                    }
                    // Add delay between scrapes to be respectful
                    if (i < selectedLinks.length - 1) {
                        const delay = 2000;
                        console.log(`⏳ [EmailController::processSelectedLinks] [${requestId}] Waiting ${delay}ms before next scrape...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                catch (error) {
                    console.error(`❌ [EmailController::processSelectedLinks] [${requestId}] Error processing ${url}:`, error);
                    errors.push({
                        url,
                        error: error.message
                    });
                }
            }
            // Clean up scraping service
            await scrapingService.cleanup();
            // Prepare response
            const response = {
                success: true,
                message: `Processed ${selectedLinks.length} links`,
                batchId: `batch-${requestId}`,
                emailId: id,
                results: {
                    total: selectedLinks.length,
                    successful: scrapingResults.filter(r => r.success).length,
                    failed: errors.length,
                    scrapingResults,
                    savedFiles: savedFiles.map(file => ({
                        filename: file.filename,
                        filepath: file.filepath,
                        size: file.size,
                        url: file.url,
                        title: file.title
                    })),
                    errors
                },
                options: options || {},
                status: 'completed'
            };
            console.log(`\n✅ [EmailController::processSelectedLinks] [${requestId}] Scraping completed:`, {
                total: selectedLinks.length,
                successful: scrapingResults.filter(r => r.success).length,
                failed: errors.length,
                savedFiles: savedFiles.length
            });
            res.json(response);
        }
        catch (error) {
            console.error(`💥 [EmailController::processSelectedLinks] [${requestId}] Fatal error:`, error);
            this.handleError(error, res, requestId);
        }
    };
    enrichLinksWithMetadata(allLinks, flutterLinks, requestId) {
        console.log(`🔍 [EmailController::enrichLinksWithMetadata] [${requestId}] Enriching ${allLinks.length} links`);
        return allLinks.map((link, index) => {
            try {
                const url = new URL(link);
                const isFlutterRelated = flutterLinks.includes(link);
                const enrichedLink = {
                    id: `link-${index}`,
                    url: link,
                    domain: url.hostname.toLowerCase(),
                    protocol: url.protocol,
                    pathname: url.pathname,
                    isFlutterRelated,
                    category: this.categorizeLink(url, isFlutterRelated),
                    displayTitle: this.generateDisplayTitle(url),
                    estimatedReadTime: this.estimateReadTime(link),
                    priority: isFlutterRelated ? 'high' : 'normal'
                };
                return enrichedLink;
            }
            catch (error) {
                console.warn(`⚠️  [EmailController::enrichLinksWithMetadata] [${requestId}] Invalid URL: ${link}`);
                return {
                    id: `link-${index}`,
                    url: link,
                    domain: 'invalid-url',
                    protocol: 'unknown',
                    pathname: '',
                    isFlutterRelated: false,
                    category: 'unknown',
                    displayTitle: 'Invalid URL',
                    estimatedReadTime: '0 min',
                    priority: 'low',
                    isInvalid: true
                };
            }
        });
    }
    groupLinksByDomain(enrichedLinks, requestId) {
        console.log(`🌐 [EmailController::groupLinksByDomain] [${requestId}] Grouping links by domain`);
        const grouped = {};
        enrichedLinks.forEach(link => {
            if (!grouped[link.domain]) {
                grouped[link.domain] = [];
            }
            grouped[link.domain]?.push(link);
        });
        // Sort domains by Flutter relevance and link count
        const sortedDomains = Object.keys(grouped).sort((a, b) => {
            const aFlutterCount = grouped[a]?.filter((link) => link.isFlutterRelated).length || 0;
            const bFlutterCount = grouped[b]?.filter((link) => link.isFlutterRelated).length || 0;
            if (aFlutterCount !== bFlutterCount) {
                return bFlutterCount - aFlutterCount; // More Flutter links first
            }
            return (grouped[b]?.length || 0) - (grouped[a]?.length || 0); // More links first
        });
        const result = {};
        sortedDomains.forEach(domain => {
            result[domain] = grouped[domain] || [];
        });
        console.log(`✅ [EmailController::groupLinksByDomain] [${requestId}] Grouped into ${Object.keys(result).length} domains`);
        return result;
    }
    categorizeLink(url, isFlutterRelated) {
        const domain = url.hostname.toLowerCase();
        const path = url.pathname.toLowerCase();
        if (isFlutterRelated) {
            if (domain.includes('medium.com'))
                return 'flutter-article';
            if (domain.includes('flutter.dev'))
                return 'flutter-docs';
            if (domain.includes('dart.dev'))
                return 'dart-docs';
            if (domain.includes('pub.dev'))
                return 'flutter-package';
            return 'flutter-related';
        }
        if (domain.includes('medium.com'))
            return 'article';
        if (domain.includes('github.com'))
            return 'repository';
        if (domain.includes('stackoverflow.com'))
            return 'qa';
        if (domain.includes('youtube.com') || domain.includes('youtu.be'))
            return 'video';
        return 'general';
    }
    generateDisplayTitle(url) {
        try {
            const domain = url.hostname.toLowerCase();
            const path = url.pathname;
            // Extract title from Medium URLs
            if (domain.includes('medium.com') && path.includes('-')) {
                const segments = path.split('-');
                const titlePart = segments.slice(0, -1).join('-').replace(/^\//, '').replace(/@[\w-]+\//, '');
                if (titlePart) {
                    return titlePart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                }
            }
            // Extract from path for other URLs
            if (path && path !== '/') {
                const pathSegments = path.split('/').filter(segment => segment);
                if (pathSegments.length > 0) {
                    const lastSegment = pathSegments[pathSegments.length - 1];
                    return lastSegment ? lastSegment.replace(/[-_]/g, ' ').replace(/\.\w+$/, '') : domain;
                }
            }
            return domain;
        }
        catch (error) {
            return 'Unknown Title';
        }
    }
    estimateReadTime(url) {
        try {
            const domain = new URL(url).hostname.toLowerCase();
            if (domain.includes('medium.com'))
                return '5-8 min';
            if (domain.includes('dev.to'))
                return '3-6 min';
            if (domain.includes('flutter.dev'))
                return '10-15 min';
            if (domain.includes('dart.dev'))
                return '8-12 min';
            if (domain.includes('github.com'))
                return '2-5 min';
            return '3-5 min';
        }
        catch (error) {
            return '3-5 min'; // Default for invalid URLs
        }
    }
    /**
     * GET /api/emails/saved-articles
     * List all saved markdown articles
     */
    listSavedArticles = async (req, res) => {
        const requestId = `LIST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`\n📋 [EmailController::listSavedArticles] [${requestId}] Listing saved articles`);
        try {
            const savedFiles = await fileSystemService.listSavedFiles();
            const response = {
                success: true,
                total: savedFiles.length,
                articles: savedFiles.map(file => ({
                    filename: file.filename,
                    filepath: file.filepath,
                    size: file.size,
                    sizeFormatted: `${(file.size / 1024).toFixed(2)} KB`,
                    savedAt: file.savedAt,
                    url: file.url,
                    title: file.title
                }))
            };
            console.log(`✅ [EmailController::listSavedArticles] [${requestId}] Found ${savedFiles.length} saved articles`);
            res.json(response);
        }
        catch (error) {
            console.error(`💥 [EmailController::listSavedArticles] [${requestId}] Fatal error:`, error);
            this.handleError(error, res, requestId);
        }
    };
    /**
     * GET /api/emails/saved-articles/:filename
     * Get content of a specific saved article
     */
    getSavedArticle = async (req, res) => {
        const requestId = `GET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        try {
            const { filename } = req.params;
            if (!filename) {
                res.status(400).json({
                    error: 'Missing filename',
                    code: 'MISSING_FILENAME',
                    message: 'Filename is required'
                });
                return;
            }
            console.log(`📄 [EmailController::getSavedArticle] [${requestId}] Getting article: ${filename}`);
            // Find the file
            const savedFiles = await fileSystemService.listSavedFiles();
            const file = savedFiles.find(f => f.filename === filename);
            if (!file) {
                res.status(404).json({
                    error: 'Article not found',
                    code: 'ARTICLE_NOT_FOUND',
                    message: `Article with filename ${filename} not found`
                });
                return;
            }
            // Get content
            const content = await fileSystemService.getFileContent(file.filepath);
            if (!content) {
                res.status(500).json({
                    error: 'Failed to read article',
                    code: 'READ_ERROR',
                    message: 'Failed to read article content'
                });
                return;
            }
            res.json({
                success: true,
                article: {
                    filename: file.filename,
                    filepath: file.filepath,
                    size: file.size,
                    savedAt: file.savedAt,
                    url: file.url,
                    title: file.title,
                    content
                }
            });
        }
        catch (error) {
            console.error(`💥 [EmailController::getSavedArticle] [${requestId}] Fatal error:`, error);
            this.handleError(error, res, requestId);
        }
    };
    /**
     * DELETE /api/emails/saved-articles/:filename
     * Delete a specific saved article
     */
    deleteSavedArticle = async (req, res) => {
        const requestId = `DELETE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        try {
            const { filename } = req.params;
            if (!filename) {
                res.status(400).json({
                    error: 'Missing filename',
                    code: 'MISSING_FILENAME',
                    message: 'Filename is required'
                });
                return;
            }
            console.log(`🗑️  [EmailController::deleteSavedArticle] [${requestId}] Deleting article: ${filename}`);
            // Find the file first to get its path
            const savedFiles = await fileSystemService.listSavedFiles();
            const file = savedFiles.find(f => f.filename === filename);
            if (!file) {
                res.status(404).json({
                    error: 'Article not found',
                    code: 'ARTICLE_NOT_FOUND',
                    message: `Article with filename '${filename}' not found`
                });
                return;
            }
            // Delete the file
            const deleted = await fileSystemService.deleteFile(file.filepath);
            if (!deleted) {
                res.status(500).json({
                    error: 'Failed to delete article',
                    code: 'DELETE_FAILED',
                    message: 'The article could not be deleted'
                });
                return;
            }
            console.log(`✅ [EmailController::deleteSavedArticle] [${requestId}] Article deleted successfully: ${filename}`);
            res.json({
                success: true,
                message: 'Article deleted successfully',
                filename,
                deletedFile: {
                    filename: file.filename,
                    title: file.title,
                    url: file.url
                }
            });
        }
        catch (error) {
            console.error(`💥 [EmailController::deleteSavedArticle] [${requestId}] Fatal error:`, error);
            this.handleError(error, res, requestId);
        }
    };
    /**
     * GET /api/emails/stats
     * Get email processing statistics
     */
    getEmailStats = async (req, res) => {
        try {
            const stats = await this.storageService.getStorageStats();
            res.json({
                success: true,
                stats: {
                    totalEmails: stats.emailDigests,
                    totalArticles: stats.articles,
                    storageUsed: stats.diskUsage
                }
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    handleError(error, res, requestId) {
        const logPrefix = requestId ? `[EmailController] [${requestId}]` : '[EmailController]';
        console.error(`${logPrefix} Error:`, error);
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        res.status(status).json({
            error: 'Email operation failed',
            message,
            code: error.code || 'EMAIL_ERROR',
            ...(requestId && { requestId })
        });
    }
}
export const emailController = new EmailController();
//# sourceMappingURL=email.controller.js.map