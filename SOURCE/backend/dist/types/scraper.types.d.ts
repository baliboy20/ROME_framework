export interface ScrapedContent {
    url: string;
    title: string;
    content: string;
    markdown: string;
    rawHtml: string;
    author?: {
        name?: string | undefined;
        url?: string | undefined;
        avatar?: string | undefined;
    } | undefined;
    publishDate?: string | undefined;
    wordCount: number;
    readingTime: string;
    scrapedAt: Date;
    keywords: string[];
    category: 'flutter' | 'dart' | 'mobile' | 'web' | 'general';
}
export interface ScrapingOptions {
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
    userAgent?: string;
    viewport?: {
        width: number;
        height: number;
    };
    javascript?: boolean;
    extractImages?: boolean;
}
export interface ScrapingResult {
    success: boolean;
    content?: ScrapedContent | undefined;
    error?: string | undefined;
    statusCode?: number | undefined;
    processingTime: number;
}
export interface BatchScrapingProgress {
    id: string;
    total: number;
    completed: number;
    failed: number;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date | undefined;
    results: ScrapingResult[];
    errors: Array<{
        url: string;
        error: string;
        timestamp: Date;
    }>;
}
//# sourceMappingURL=scraper.types.d.ts.map