export interface ScrapedContent {
    url: string;
    title: string;
    author?: string;
    publishDate?: string;
    content: string;
    markdown: string;
    textContent: string;
    readingTime: number;
    wordCount: number;
    images: string[];
    tags: string[];
    domain: string;
    scrapedAt: Date;
    success: boolean;
    error?: string;
}
export interface ScrapingOptions {
    waitForSelector?: string;
    timeout?: number;
    viewport?: {
        width: number;
        height: number;
    };
    userAgent?: string;
    extractImages?: boolean;
    cleanupSelectors?: string[];
}
export declare class ScrapingService {
    private browser;
    private turndownService;
    private readonly defaultOptions;
    constructor();
    private setupTurndownRules;
    initialize(): Promise<void>;
    cleanup(): Promise<void>;
    scrapeUrl(url: string, options?: ScrapingOptions): Promise<ScrapedContent>;
    private extractArticle;
    private processArticleData;
    private puppeteerScrape;
    private cleanupHtml;
    private extractTextFromHtml;
    private countWords;
    private extractImages;
    private extractTags;
    private convertToMarkdown;
    scrapeMultipleUrls(urls: string[], options?: ScrapingOptions): Promise<ScrapedContent[]>;
}
export declare const scrapingService: ScrapingService;
//# sourceMappingURL=ScrapingService.d.ts.map