import puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';
import { extract } from '@extractus/article-extractor';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';
export class ScrapingService {
    browser = null;
    turndownService;
    defaultOptions = {
        timeout: 30000,
        viewport: { width: 1920, height: 1080 },
        extractImages: true,
        cleanupSelectors: [
            'script',
            'style',
            'nav',
            'header',
            'footer',
            '.ads',
            '.advertisement',
            '.social-share',
            '.comments',
            '#comments',
            '.related-posts',
            '.newsletter-signup'
        ]
    };
    constructor() {
        // Initialize markdown converter
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            fence: '```',
            emDelimiter: '_',
            strongDelimiter: '**',
            linkStyle: 'inlined',
            linkReferenceStyle: 'full'
        });
        // Add custom rules for better markdown conversion
        this.setupTurndownRules();
    }
    setupTurndownRules() {
        // Rule for code blocks
        this.turndownService.addRule('codeBlocks', {
            filter: ['pre'],
            replacement: function (content, node) {
                const code = node.querySelector('code');
                const language = code?.className?.match(/language-(\w+)/)?.[1] || '';
                return '\n```' + language + '\n' + content.trim() + '\n```\n';
            }
        });
        // Rule for images with captions
        this.turndownService.addRule('images', {
            filter: 'img',
            replacement: function (content, node) {
                const alt = node.alt || '';
                const src = node.src || '';
                const title = node.title || '';
                return src ? `![${alt}](${src}${title ? ` "${title}"` : ''})` : '';
            }
        });
    }
    async initialize() {
        if (!this.browser) {
            console.log('🚀 [ScrapingService] Launching Puppeteer browser...');
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            console.log('✅ [ScrapingService] Browser launched successfully');
        }
    }
    async cleanup() {
        if (this.browser) {
            console.log('🧹 [ScrapingService] Closing browser...');
            await this.browser.close();
            this.browser = null;
            console.log('✅ [ScrapingService] Browser closed');
        }
    }
    async scrapeUrl(url, options) {
        const requestId = `SCRAPE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`\n🌐 [ScrapingService::scrapeUrl] [${requestId}] Starting scrape for: ${url}`);
        const mergedOptions = { ...this.defaultOptions, ...options };
        const startTime = Date.now();
        try {
            // Ensure browser is initialized
            await this.initialize();
            // First try article extraction API for better results
            console.log(`📰 [ScrapingService::scrapeUrl] [${requestId}] Trying article extraction...`);
            const articleData = await this.extractArticle(url, requestId);
            if (articleData && articleData.content) {
                console.log(`✅ [ScrapingService::scrapeUrl] [${requestId}] Article extraction successful`);
                return this.processArticleData(articleData, url, requestId);
            }
            // Fallback to Puppeteer scraping
            console.log(`🔄 [ScrapingService::scrapeUrl] [${requestId}] Falling back to Puppeteer scraping...`);
            return await this.puppeteerScrape(url, mergedOptions, requestId);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ [ScrapingService::scrapeUrl] [${requestId}] Scraping failed after ${duration}ms:`, error);
            return {
                url,
                title: 'Failed to scrape',
                content: '',
                markdown: '',
                textContent: '',
                readingTime: 0,
                wordCount: 0,
                images: [],
                tags: [],
                domain: new URL(url).hostname,
                scrapedAt: new Date(),
                success: false,
                error: error.message
            };
        }
    }
    async extractArticle(url, requestId) {
        try {
            console.log(`🔍 [ScrapingService::extractArticle] [${requestId}] Extracting article content...`);
            const article = await extract(url);
            if (article) {
                console.log(`✅ [ScrapingService::extractArticle] [${requestId}] Article extracted:`, {
                    title: article.title,
                    author: article.author,
                    published: article.published,
                    contentLength: article.content?.length || 0
                });
            }
            return article;
        }
        catch (error) {
            console.warn(`⚠️  [ScrapingService::extractArticle] [${requestId}] Article extraction failed:`, error.message);
            return null;
        }
    }
    processArticleData(article, url, requestId) {
        console.log(`⚙️  [ScrapingService::processArticleData] [${requestId}] Processing article data...`);
        const content = article.content || '';
        const textContent = this.extractTextFromHtml(content);
        const wordCount = this.countWords(textContent);
        const readingTime = Math.ceil(wordCount / 250); // Average reading speed
        // Convert to markdown
        const markdown = this.convertToMarkdown(content, article.title, article.author, article.published, url);
        // Extract images
        const images = this.extractImages(content);
        // Extract tags/categories
        const tags = this.extractTags(article);
        const result = {
            url,
            title: article.title || 'Untitled',
            author: article.author,
            publishDate: article.published,
            content: '', // Raw HTML removed to prevent client issues
            markdown,
            textContent,
            readingTime,
            wordCount,
            images,
            tags,
            domain: new URL(url).hostname,
            scrapedAt: new Date(),
            success: true
        };
        console.log(`✅ [ScrapingService::processArticleData] [${requestId}] Article processed:`, {
            title: result.title,
            wordCount: result.wordCount,
            readingTime: result.readingTime,
            imageCount: result.images.length
        });
        return result;
    }
    async puppeteerScrape(url, options, requestId) {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }
        let page = null;
        try {
            console.log(`🌐 [ScrapingService::puppeteerScrape] [${requestId}] Opening new page...`);
            page = await this.browser.newPage();
            // Set viewport and user agent
            await page.setViewport(options.viewport);
            if (options.userAgent) {
                await page.setUserAgent(options.userAgent);
            }
            // Navigate to URL
            console.log(`📍 [ScrapingService::puppeteerScrape] [${requestId}] Navigating to: ${url}`);
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: options.timeout || 30000
            });
            // Wait for content to load
            if (options.waitForSelector) {
                console.log(`⏳ [ScrapingService::puppeteerScrape] [${requestId}] Waiting for selector: ${options.waitForSelector}`);
                await page.waitForSelector(options.waitForSelector, { timeout: options.timeout || 30000 });
            }
            // Extract page data
            console.log(`📄 [ScrapingService::puppeteerScrape] [${requestId}] Extracting page data...`);
            const pageData = await page.evaluate(() => {
                // Helper function to get meta content
                const getMeta = (name) => {
                    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                    return meta?.getAttribute('content') || '';
                };
                // Extract various content selectors
                const contentSelectors = [
                    'article',
                    'main article',
                    '[role="article"]',
                    '.post-content',
                    '.article-content',
                    '.entry-content',
                    '.content',
                    'main'
                ];
                let content = '';
                for (const selector of contentSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        content = element.innerHTML;
                        break;
                    }
                }
                // If no content found, use body
                if (!content) {
                    content = document.body.innerHTML;
                }
                return {
                    title: document.title || getMeta('og:title') || getMeta('twitter:title'),
                    author: getMeta('author') || getMeta('article:author'),
                    publishDate: getMeta('article:published_time') || getMeta('datePublished'),
                    description: getMeta('description') || getMeta('og:description'),
                    content,
                    url: window.location.href
                };
            });
            // Clean up content
            const cleanedContent = this.cleanupHtml(pageData.content, options.cleanupSelectors || []);
            // Process and convert to markdown
            return this.processArticleData({
                ...pageData,
                content: cleanedContent
            }, url, requestId);
        }
        finally {
            if (page) {
                console.log(`🔚 [ScrapingService::puppeteerScrape] [${requestId}] Closing page...`);
                await page.close();
            }
        }
    }
    cleanupHtml(html, selectors) {
        const $ = cheerio.load(html);
        // Remove unwanted elements
        selectors.forEach(selector => {
            $(selector).remove();
        });
        // Remove empty paragraphs and divs
        $('p:empty, div:empty').remove();
        // Remove attributes that might interfere
        $('*').each((_, elem) => {
            const $elem = $(elem);
            $elem.removeAttr('style');
            $elem.removeAttr('class');
            $elem.removeAttr('id');
        });
        return $.html();
    }
    extractTextFromHtml(html) {
        const $ = cheerio.load(html);
        return $.root().text().replace(/\s+/g, ' ').trim();
    }
    countWords(text) {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }
    extractImages(html) {
        const $ = cheerio.load(html);
        const images = [];
        $('img').each((_, img) => {
            const src = $(img).attr('src');
            if (src && !src.includes('data:image')) {
                images.push(src);
            }
        });
        return [...new Set(images)]; // Remove duplicates
    }
    extractTags(article) {
        const tags = [];
        // Extract from article data
        if (article.tags) {
            tags.push(...(Array.isArray(article.tags) ? article.tags : [article.tags]));
        }
        // Extract from categories
        if (article.categories) {
            tags.push(...(Array.isArray(article.categories) ? article.categories : [article.categories]));
        }
        // Extract from keywords
        if (article.keywords) {
            const keywords = Array.isArray(article.keywords) ? article.keywords : article.keywords.split(',');
            tags.push(...keywords.map((k) => k.trim()));
        }
        return [...new Set(tags.filter(tag => tag))]; // Remove duplicates and empty values
    }
    convertToMarkdown(html, title, author, date, url) {
        let markdown = '';
        // Add frontmatter
        markdown += '---\n';
        if (title)
            markdown += `title: "${title}"\n`;
        if (author)
            markdown += `author: "${author}"\n`;
        if (date)
            markdown += `date: "${date}"\n`;
        if (url)
            markdown += `source: "${url}"\n`;
        markdown += `scraped_at: "${new Date().toISOString()}"\n`;
        markdown += '---\n\n';
        // Add title as H1
        if (title) {
            markdown += `# ${title}\n\n`;
        }
        // Add author and date info
        if (author || date) {
            markdown += '_';
            if (author)
                markdown += `By ${author}`;
            if (author && date)
                markdown += ' • ';
            if (date) {
                try {
                    markdown += new Date(date).toLocaleDateString();
                }
                catch {
                    markdown += date;
                }
            }
            markdown += '_\n\n';
        }
        // Convert HTML content to markdown
        const contentMarkdown = this.turndownService.turndown(html);
        markdown += contentMarkdown;
        // Add source link at the bottom
        if (url) {
            try {
                markdown += `\n\n---\n\n_Source: [${new URL(url).hostname}](${url})_`;
            }
            catch {
                markdown += `\n\n---\n\n_Source: ${url}_`;
            }
        }
        return markdown;
    }
    async scrapeMultipleUrls(urls, options) {
        console.log(`\n🔄 [ScrapingService::scrapeMultipleUrls] Starting batch scrape for ${urls.length} URLs`);
        const results = [];
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            if (!url)
                continue;
            console.log(`\n📍 [ScrapingService::scrapeMultipleUrls] Processing ${i + 1}/${urls.length}: ${url}`);
            try {
                const result = await this.scrapeUrl(url, options);
                results.push(result);
                // Add delay between requests to be respectful
                if (i < urls.length - 1) {
                    const delay = 2000 + Math.random() * 1000; // 2-3 seconds
                    console.log(`⏳ [ScrapingService::scrapeMultipleUrls] Waiting ${Math.round(delay)}ms before next request...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            catch (error) {
                console.error(`❌ [ScrapingService::scrapeMultipleUrls] Failed to scrape ${url}:`, error.message);
                let domain = 'unknown';
                try {
                    domain = new URL(url).hostname;
                }
                catch { }
                results.push({
                    url,
                    title: 'Failed to scrape',
                    content: '',
                    markdown: '',
                    textContent: '',
                    readingTime: 0,
                    wordCount: 0,
                    images: [],
                    tags: [],
                    domain,
                    scrapedAt: new Date(),
                    success: false,
                    error: error.message
                });
            }
        }
        console.log(`\n✅ [ScrapingService::scrapeMultipleUrls] Batch scrape completed:`, {
            total: urls.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        });
        return results;
    }
}
// Export singleton instance
export const scrapingService = new ScrapingService();
//# sourceMappingURL=ScrapingService.js.map